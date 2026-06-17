export type ServiceStatus = "active" | "decommissioned";

export interface ServiceDeepDive {
  id: string;
  name: string;
  displayName: string;
  status: ServiceStatus;
  statusNote?: string;
  accentColor: string;

  business: {
    purpose: string;
    domainContext: string;
    flows: { flowNum: string; title: string; role: string }[];
    stakeholders: string[];
    consumers: string[];
    businessRules: { rule: string; description: string; severity: "critical" | "important" | "standard" }[];
    sla: { availability: string; latencyP99: string; notes: string };
  };

  technical: {
    techStack: { category: string; name: string; color: string }[];
    endpoints: { method: string; path: string; description: string; request?: string; response?: string }[];
    dataModel: { entity: string; description: string; fields: { name: string; type: string; note?: string }[] }[];
    databaseSchema?: string;
    dependencies: { service: string; direction: "upstream" | "downstream"; protocol: string; description: string }[];
    kafkaEvents: { topic: string; event: string; direction: "publishes" | "consumes"; description: string }[];
    errorPatterns: { scenario: string; handling: string; retry?: string }[];
    infrastructure: { aspect: string; description: string }[];
    codePatterns: { title: string; description: string; code: string; language?: string }[];
  };

  migration?: {
    reason: string;
    replacedBy: string[];
    timeline: string;
    keyChanges: { before: string; after: string; rationale: string }[];
  };
}

// ─── reseller-service ────────────────────────────────────────────────────────

const resellerService: ServiceDeepDive = {
  id: "reseller",
  name: "reseller-service",
  displayName: "Reseller Service",
  status: "active",
  accentColor: "amber",

  business: {
    purpose:
      "Primary CRUD orchestrator for the subscription management platform. Handles all write operations — creating, modifying, cancelling, and reversing subscriptions. Coordinates between catalog validation, merchant provisioning, event publishing, and audit logging.",
    domainContext:
      "Sits at the center of the subscription lifecycle. Every mutation that changes subscription state flows through reseller-service. It is the single source of truth for subscription write operations, while reads are handled by subscriptions-aggregator-api.",
    flows: [
      { flowNum: "4", title: "Check Eligibility", role: "Calls catalog-api to fetch eligible plans via subscriptionQualification" },
      { flowNum: "5", title: "Place Order", role: "Writes order to PostgreSQL, provisions via merchant-api-*, publishes OrderCreated to Kafka" },
      { flowNum: "6", title: "Activate Subscription", role: "Transitions status PENDING → ACTIVE, provisions merchant, returns activationUrl" },
      { flowNum: "7", title: "Cancel Subscription", role: "Sets status to CANCELLED, deprovisions via merchant-api-*, op code DELETE" },
      { flowNum: "8", title: "Agent-Assisted", role: "Identical to customer flow but session is cloned; audit log includes agent ID" },
      { flowNum: "9", title: "Plan Change", role: "Updates PostgreSQL, re-provisions merchant, publishes OrderUpdated, op code APPLY_TO_ORDER" },
      { flowNum: "13", title: "Undo / Reversal", role: "Rolls back PostgreSQL state, deprovisions merchant, op codes REVERSE_ADD / REVERSE_DELETE" },
      { flowNum: "14", title: "Grace Period", role: "Sets status to GRACE_PERIOD, suspends merchant provisioning without full cancellation" },
      { flowNum: "15", title: "Account Recovery", role: "Reconciles PostgreSQL state with merchant systems via core-processor-api" },
      { flowNum: "18", title: "Promo Codes", role: "Integrates with promocodes-rtv-api for real-time promo validation during qualification" },
    ],
    stakeholders: [
      "Subscription Management UI (via AppSync)",
      "Agent Portal (via cloneSession + same mutations)",
      "Downstream Kafka consumers (subscription-consumer, audit-api, notification-consumer)",
      "Merchant providers (Netflix, Disney+, Bell Media, Radio Canada, Bango)",
    ],
    consumers: [
      "Next.js BFF → AppSync → reseller-service (all mutations)",
      "fallout-process Lambda (remediation callbacks)",
      "subscription-renewal-process Lambda (renewal re-validation)",
    ],
    businessRules: [
      {
        rule: "Eligibility gating",
        description: "Every order must pass subscriptionQualification before submission. Re-qualification fires on each plan selection to prevent stale eligibility data.",
        severity: "critical",
      },
      {
        rule: "Merchant routing",
        description: "reseller-service selects the correct merchant-api-* based on the product's providerId. Routing is transparent to the UI — only reseller-service knows which merchant to call.",
        severity: "critical",
      },
      {
        rule: "Audit trail requirement",
        description: "Every state change (order, activation, cancellation, reversal) must be logged to audit-api. Agent flows include agentId and originalOrderNumber.",
        severity: "critical",
      },
      {
        rule: "Idempotent order submission",
        description: "Duplicate submitSubscription calls with the same sessionId are rejected to prevent double-ordering. The session is invalidated after successful submission.",
        severity: "important",
      },
      {
        rule: "Op code validation",
        description: "Only valid operation types are accepted: APPLY_TO_ORDER, DELETE, REVERSE_ADD, REVERSE_DELETE, REVERSE_DOWNGRADE, REVERSE_BUNDLE_CHANGE.",
        severity: "important",
      },
      {
        rule: "Grace period window",
        description: "Configurable per merchant. During grace period, merchant provisioning is suspended (not cancelled). Auto-resumes on payment resolution via Kafka event.",
        severity: "standard",
      },
    ],
    sla: {
      availability: "99.95%",
      latencyP99: "< 800ms (qualification), < 2s (submission with merchant call)",
      notes: "Qualification must be fast because it fires on every plan selection. Submission latency includes synchronous merchant provisioning.",
    },
  },

  technical: {
    techStack: [
      { category: "Framework", name: "Gin", color: "teal" },
      { category: "API", name: "OpenAPI codegen", color: "blue" },
      { category: "Database", name: "PostgreSQL", color: "blue" },
      { category: "Messaging", name: "Kafka (publisher)", color: "purple" },
      { category: "Gateway", name: "AppSync (GraphQL)", color: "blue" },
      { category: "Caching", name: "Redis (via catalog-api)", color: "coral" },
      { category: "Language", name: "Go", color: "teal" },
    ],
    endpoints: [
      {
        method: "POST",
        path: "/subscriptions/qualify",
        description: "Eligibility check — calls catalog-api, returns eligible plans",
        request: `{
  "sessionId": "string",
  "operationType": "APPLY_TO_ORDER | DELETE | REVERSE_*",
  "accountNumber": "string",
  "subscriptionId": "string (optional)"
}`,
        response: `{
  "eligible": true,
  "plans": [
    {
      "productId": "string",
      "name": "string",
      "price": 9.99,
      "billingCycle": "MONTHLY",
      "promotions": []
    }
  ],
  "sessionId": "string"
}`,
      },
      {
        method: "POST",
        path: "/subscriptions/submit",
        description: "Creates order — writes PostgreSQL, calls merchant-api-*, publishes Kafka, logs audit",
        request: `{
  "sessionId": "string",
  "selectedPlan": {
    "productId": "string",
    "billingCycle": "MONTHLY"
  }
}`,
        response: `{
  "orderId": "string",
  "subscriptionId": "string",
  "status": "PENDING",
  "createdAt": "ISO-8601"
}`,
      },
      {
        method: "POST",
        path: "/subscriptions/:id/activate",
        description: "Activates subscription — PENDING → ACTIVE, provisions merchant, returns activationUrl",
        request: `{
  "subscriptionId": "string"
}`,
        response: `{
  "subscriptionId": "string",
  "status": "ACTIVE",
  "activationUrl": "string",
  "activatedAt": "ISO-8601"
}`,
      },
      {
        method: "DELETE",
        path: "/subscriptions/:id",
        description: "Cancels subscription — sets CANCELLED, deprovisions merchant",
        response: `{
  "subscriptionId": "string",
  "status": "CANCELLED",
  "cancelledAt": "ISO-8601"
}`,
      },
      {
        method: "PUT",
        path: "/subscriptions/:id/reverse",
        description: "Reverses a previous action — rolls back PostgreSQL + merchant state",
        request: `{
  "subscriptionId": "string",
  "reverseType": "REVERSE_ADD | REVERSE_DELETE | REVERSE_DOWNGRADE"
}`,
        response: `{
  "subscriptionId": "string",
  "previousStatus": "string",
  "restoredStatus": "string"
}`,
      },
    ],
    dataModel: [
      {
        entity: "subscriptions",
        description: "Core subscription record — one row per customer-product pairing",
        fields: [
          { name: "id", type: "UUID", note: "Primary key" },
          { name: "billing_account_number", type: "VARCHAR(64)", note: "Bell BAN" },
          { name: "tv_account_number", type: "VARCHAR(64)" },
          { name: "product_id", type: "VARCHAR(128)", note: "FK to catalog product" },
          { name: "provider_id", type: "VARCHAR(64)", note: "Merchant identifier (netflix, disney, etc.)" },
          { name: "status", type: "VARCHAR(32)", note: "PENDING | ACTIVE | CANCELLED | GRACE_PERIOD" },
          { name: "price", type: "DECIMAL(10,2)" },
          { name: "billing_cycle", type: "VARCHAR(16)", note: "MONTHLY | ANNUAL" },
          { name: "start_date", type: "TIMESTAMP" },
          { name: "end_date", type: "TIMESTAMP", note: "NULL if active" },
          { name: "activation_url", type: "TEXT", note: "Merchant redirect URL" },
          { name: "created_at", type: "TIMESTAMP" },
          { name: "updated_at", type: "TIMESTAMP" },
        ],
      },
      {
        entity: "orders",
        description: "Order records linked to subscriptions — tracks submission and fulfillment",
        fields: [
          { name: "id", type: "UUID", note: "Primary key" },
          { name: "subscription_id", type: "UUID", note: "FK to subscriptions" },
          { name: "session_id", type: "VARCHAR(128)", note: "DynamoDB session reference" },
          { name: "operation_type", type: "VARCHAR(32)", note: "APPLY_TO_ORDER | DELETE | REVERSE_*" },
          { name: "status", type: "VARCHAR(32)", note: "PENDING | COMPLETED | FAILED | REVERSED" },
          { name: "merchant_response", type: "JSONB", note: "Raw merchant API response" },
          { name: "created_at", type: "TIMESTAMP" },
          { name: "completed_at", type: "TIMESTAMP" },
        ],
      },
      {
        entity: "provisions",
        description: "Merchant provisioning records — tracks each provisioning attempt per order",
        fields: [
          { name: "id", type: "UUID", note: "Primary key" },
          { name: "order_id", type: "UUID", note: "FK to orders" },
          { name: "provider_id", type: "VARCHAR(64)" },
          { name: "merchant_status", type: "VARCHAR(32)", note: "PROVISIONED | DEPROVISIONED | SUSPENDED" },
          { name: "external_reference", type: "VARCHAR(256)", note: "Merchant's order/subscription ID" },
          { name: "attempt_count", type: "INT", note: "Retry counter" },
          { name: "last_error", type: "TEXT", note: "NULL on success" },
          { name: "created_at", type: "TIMESTAMP" },
          { name: "updated_at", type: "TIMESTAMP" },
        ],
      },
    ],
    databaseSchema: `erDiagram
    subscriptions {
        UUID id PK
        VARCHAR billing_account_number
        VARCHAR tv_account_number
        VARCHAR product_id
        VARCHAR provider_id
        VARCHAR status
        DECIMAL price
        VARCHAR billing_cycle
        TIMESTAMP start_date
        TIMESTAMP end_date
        TEXT activation_url
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    orders {
        UUID id PK
        UUID subscription_id FK
        VARCHAR session_id
        VARCHAR operation_type
        VARCHAR status
        JSONB merchant_response
        TIMESTAMP created_at
        TIMESTAMP completed_at
    }
    provisions {
        UUID id PK
        UUID order_id FK
        VARCHAR provider_id
        VARCHAR merchant_status
        VARCHAR external_reference
        INT attempt_count
        TEXT last_error
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    subscriptions ||--o{ orders : "has"
    orders ||--o{ provisions : "has"`,
    dependencies: [
      { service: "AppSync", direction: "upstream", protocol: "GraphQL", description: "All mutations routed through AppSync resolvers" },
      { service: "catalog-api", direction: "downstream", protocol: "GraphQL", description: "Fetches eligible plans and product details during qualification" },
      { service: "merchant-api-bango-v1", direction: "downstream", protocol: "REST", description: "Bango aggregation platform provisioning" },
      { service: "merchant-api-netflix", direction: "downstream", protocol: "REST", description: "Netflix subscription provisioning" },
      { service: "merchant-api-disney", direction: "downstream", protocol: "REST", description: "Disney+ subscription provisioning" },
      { service: "merchant-api-bellmedia", direction: "downstream", protocol: "REST", description: "Bell Media content provisioning" },
      { service: "merchant-api-radiocanada", direction: "downstream", protocol: "REST", description: "Radio Canada content provisioning" },
      { service: "audit-api", direction: "downstream", protocol: "REST", description: "Logs all state changes for compliance" },
      { service: "PostgreSQL", direction: "downstream", protocol: "SQL", description: "Primary data store for subscriptions, orders, provisions" },
      { service: "Kafka", direction: "downstream", protocol: "Async", description: "Publishes domain events (OrderCreated, StatusChanged, etc.)" },
    ],
    kafkaEvents: [
      { topic: "subscription.order.created", event: "OrderCreated", direction: "publishes", description: "Emitted when a new order is successfully written to PostgreSQL" },
      { topic: "subscription.order.updated", event: "OrderUpdated", direction: "publishes", description: "Emitted on plan change, order modification, or merchant response update" },
      { topic: "subscription.status.changed", event: "StatusChanged", direction: "publishes", description: "Emitted on any status transition (PENDING → ACTIVE, ACTIVE → CANCELLED, etc.)" },
      { topic: "subscription.activation.completed", event: "ActivationCompleted", direction: "publishes", description: "Emitted when merchant provisioning completes and activationUrl is returned" },
      { topic: "subscription.order.reversed", event: "OrderReversed", direction: "publishes", description: "Emitted when an undo/reversal operation completes" },
    ],
    errorPatterns: [
      { scenario: "Merchant API timeout", handling: "Returns 503 to caller, marks provision as FAILED", retry: "Exponential backoff via fulfillment-process Lambda, max 3 retries" },
      { scenario: "Catalog-api unavailable", handling: "Returns 503 — qualification cannot proceed without eligible plans", retry: "Client retries (BFF level)" },
      { scenario: "Duplicate order submission", handling: "Returns 409 Conflict — session already consumed", retry: "None — idempotency guard" },
      { scenario: "Invalid operation type", handling: "Returns 400 Bad Request with validation error", retry: "None — client error" },
      { scenario: "PostgreSQL write failure", handling: "Transaction rollback, returns 500", retry: "Client retries; no partial writes due to transaction" },
      { scenario: "Kafka publish failure", handling: "Order is written to PostgreSQL first; Kafka failure is logged, event replayed from WAL", retry: "Outbox pattern — event eventually delivered" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 3 replicas minimum in production" },
      { aspect: "Database", description: "Amazon RDS PostgreSQL — Multi-AZ, daily automated backups" },
      { aspect: "Networking", description: "Internal cluster DNS — not exposed externally. Only reachable via AppSync resolvers" },
      { aspect: "Observability", description: "Structured JSON logging, Datadog APM traces, custom metrics for order latency and merchant response times" },
      { aspect: "CI/CD", description: "GitLab CI → Docker build → ECR push → ArgoCD deployment to EKS" },
      { aspect: "Config", description: "Environment variables via Kubernetes ConfigMaps and Secrets. Feature flags via Go Feature Flags (GOFF)" },
    ],
    codePatterns: [
      {
        title: "Handler middleware chain",
        description: "Gin middleware stack for request validation, auth extraction, and error mapping",
        code: `func SetupRouter(svc *service.SubscriptionService) *gin.Engine {
    r := gin.New()
    r.Use(
        middleware.RequestID(),
        middleware.Logger(),
        middleware.Recovery(),
        middleware.Auth(),
        middleware.AccountIsolation(),
    )

    v1 := r.Group("/v1")
    {
        v1.POST("/subscriptions/qualify", handlers.Qualify(svc))
        v1.POST("/subscriptions/submit", handlers.Submit(svc))
        v1.POST("/subscriptions/:id/activate", handlers.Activate(svc))
        v1.DELETE("/subscriptions/:id", handlers.Cancel(svc))
        v1.PUT("/subscriptions/:id/reverse", handlers.Reverse(svc))
    }
    return r
}`,
        language: "go",
      },
      {
        title: "Error mapping to HTTP status",
        description: "Domain errors are mapped to appropriate HTTP status codes at the handler boundary",
        code: `func mapError(err error) (int, ErrorResponse) {
    switch {
    case errors.Is(err, domain.ErrNotEligible):
        return http.StatusForbidden, ErrorResponse{
            Code:    "NOT_ELIGIBLE",
            Message: "Account is not eligible for this operation",
        }
    case errors.Is(err, domain.ErrSessionConsumed):
        return http.StatusConflict, ErrorResponse{
            Code:    "SESSION_CONSUMED",
            Message: "Session has already been used for an order",
        }
    case errors.Is(err, domain.ErrMerchantUnavailable):
        return http.StatusServiceUnavailable, ErrorResponse{
            Code:    "MERCHANT_UNAVAILABLE",
            Message: "Merchant provisioning service is temporarily unavailable",
        }
    default:
        return http.StatusInternalServerError, ErrorResponse{
            Code:    "INTERNAL_ERROR",
            Message: "An unexpected error occurred",
        }
    }
}`,
        language: "go",
      },
      {
        title: "Kafka event publishing (outbox pattern)",
        description: "Events are written to an outbox table in the same transaction as the order, then published asynchronously",
        code: `func (s *SubscriptionService) SubmitOrder(ctx context.Context, req SubmitRequest) (*Order, error) {
    tx, err := s.db.BeginTx(ctx, nil)
    if err != nil {
        return nil, fmt.Errorf("begin tx: %w", err)
    }
    defer tx.Rollback()

    order, err := s.repo.CreateOrder(ctx, tx, req)
    if err != nil {
        return nil, fmt.Errorf("create order: %w", err)
    }

    // Write event to outbox in the same transaction
    event := domain.NewOrderCreatedEvent(order)
    if err := s.outbox.Write(ctx, tx, event); err != nil {
        return nil, fmt.Errorf("write outbox: %w", err)
    }

    if err := tx.Commit(); err != nil {
        return nil, fmt.Errorf("commit: %w", err)
    }

    // Async publish — outbox poller will retry on failure
    go s.publisher.TryPublish(ctx, event)

    return order, nil
}`,
        language: "go",
      },
    ],
  },
};

// ─── subscription-manager-api (DECOMMISSIONED) ──────────────────────────────

const subscriptionManagerApi: ServiceDeepDive = {
  id: "subscription-manager",
  name: "subscription-manager-api",
  displayName: "Subscription Manager API",
  status: "decommissioned",
  statusNote: "Replaced by reseller-service (writes) + subscriptions-aggregator-api (reads) for single-responsibility",
  accentColor: "coral",

  business: {
    purpose:
      "Legacy monolith that previously handled both read and write operations for the subscription management platform. It was the original single API for all subscription lifecycle operations — creating, reading, updating, and cancelling subscriptions in one service.",
    domainContext:
      "subscription-manager-api was the original backend for the subscription management UI. As the platform grew, the monolithic approach created deployment bottlenecks, scaling issues, and tight coupling between read and write paths. It was decomposed into focused microservices.",
    flows: [
      { flowNum: "4–9", title: "All customer flows (historical)", role: "Handled qualification, ordering, activation, cancellation, agent flows, and plan changes in a single service" },
      { flowNum: "13", title: "Undo / Reversal (historical)", role: "Managed reversal operations with tightly coupled read/write logic" },
      { flowNum: "2", title: "Load Subscriptions (historical)", role: "Served subscription reads directly — now handled by subscriptions-aggregator-api" },
    ],
    stakeholders: [
      "Subscription Management UI (historical — via AppSync)",
      "All downstream consumers (historical)",
    ],
    consumers: [
      "Next.js BFF → AppSync → subscription-manager-api (historical)",
    ],
    businessRules: [
      {
        rule: "Combined read/write responsibility",
        description: "All CRUD operations lived in one service. Reads and writes competed for the same database connections and compute resources.",
        severity: "critical",
      },
      {
        rule: "Monolithic deployment",
        description: "Any change — even a read-path optimization — required redeploying the entire service. This created deployment bottlenecks and risk.",
        severity: "important",
      },
      {
        rule: "Shared database schema",
        description: "Read queries and write transactions used the same PostgreSQL tables with no separation, causing lock contention under high load.",
        severity: "important",
      },
    ],
    sla: {
      availability: "99.9% (historical)",
      latencyP99: "< 1.5s (historical — reads and writes combined)",
      notes: "Read latency was impacted by write-side lock contention. This was one of the key drivers for decomposition.",
    },
  },

  technical: {
    techStack: [
      { category: "Framework", name: "Gin", color: "teal" },
      { category: "API", name: "OpenAPI codegen", color: "blue" },
      { category: "Database", name: "PostgreSQL", color: "blue" },
      { category: "Messaging", name: "Kafka", color: "purple" },
      { category: "Gateway", name: "AppSync (GraphQL)", color: "blue" },
      { category: "Language", name: "Go", color: "teal" },
    ],
    endpoints: [
      {
        method: "GET",
        path: "/subscriptions",
        description: "(Deprecated) List subscriptions — now served by subscriptions-aggregator-api",
      },
      {
        method: "GET",
        path: "/subscriptions/:id",
        description: "(Deprecated) Get subscription detail — now served by subscriptions-aggregator-api",
      },
      {
        method: "POST",
        path: "/subscriptions/qualify",
        description: "(Deprecated) Eligibility check — now handled by reseller-service",
      },
      {
        method: "POST",
        path: "/subscriptions/submit",
        description: "(Deprecated) Create order — now handled by reseller-service",
      },
      {
        method: "POST",
        path: "/subscriptions/:id/activate",
        description: "(Deprecated) Activate — now handled by reseller-service",
      },
      {
        method: "DELETE",
        path: "/subscriptions/:id",
        description: "(Deprecated) Cancel — now handled by reseller-service",
      },
    ],
    dataModel: [
      {
        entity: "subscriptions (legacy)",
        description: "Combined table handling both read and write concerns — now split across services",
        fields: [
          { name: "id", type: "UUID", note: "Primary key" },
          { name: "billing_account_number", type: "VARCHAR(64)" },
          { name: "product_id", type: "VARCHAR(128)" },
          { name: "status", type: "VARCHAR(32)" },
          { name: "price", type: "DECIMAL(10,2)" },
          { name: "created_at", type: "TIMESTAMP" },
          { name: "updated_at", type: "TIMESTAMP" },
        ],
      },
    ],
    dependencies: [
      { service: "AppSync", direction: "upstream", protocol: "GraphQL", description: "All requests routed through AppSync (historical)" },
      { service: "merchant-api-*", direction: "downstream", protocol: "REST", description: "Merchant provisioning (now handled by reseller-service)" },
      { service: "audit-api", direction: "downstream", protocol: "REST", description: "Audit logging (unchanged — still called by reseller-service)" },
      { service: "PostgreSQL", direction: "downstream", protocol: "SQL", description: "Single database for all reads and writes (now split)" },
      { service: "Kafka", direction: "downstream", protocol: "Async", description: "Event publishing (now handled by reseller-service)" },
    ],
    kafkaEvents: [
      { topic: "subscription.order.created", event: "OrderCreated", direction: "publishes", description: "(Historical) Published on order creation — now published by reseller-service" },
      { topic: "subscription.status.changed", event: "StatusChanged", direction: "publishes", description: "(Historical) Published on status change — now published by reseller-service" },
    ],
    errorPatterns: [
      { scenario: "Read/write contention", handling: "Long-running read queries would block write transactions under load", retry: "N/A — architectural issue resolved by decomposition" },
      { scenario: "Deployment failures", handling: "Rolling restart affected both read and write paths simultaneously", retry: "N/A — resolved by independent deployments" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — required higher replica count due to combined workload" },
      { aspect: "Database", description: "Single PostgreSQL instance serving both reads and writes" },
      { aspect: "Status", description: "Fully decommissioned — all traffic migrated to reseller-service + subscriptions-aggregator-api" },
    ],
    codePatterns: [],
  },

  migration: {
    reason:
      "The monolithic subscription-manager-api violated single-responsibility: reads and writes shared compute, database connections, and deployment lifecycle. This caused read latency spikes during write-heavy periods, deployment risk (any change required full redeploy), and scaling inefficiency (couldn't scale reads independently from writes).",
    replacedBy: [
      "reseller-service — handles all write operations (CRUD, merchant provisioning, Kafka publishing)",
      "subscriptions-aggregator-api — handles all read operations (merges PostgreSQL + CPM data)",
    ],
    timeline: "Phased migration over several sprints. AppSync resolvers were updated to point to new services. Traffic was shifted gradually using feature flags (GOFF) until subscription-manager-api received 0% traffic, then decommissioned.",
    keyChanges: [
      {
        before: "Single service handling GET /subscriptions + POST /subscriptions/submit + all mutations",
        after: "Reads → subscriptions-aggregator-api (REST, bypasses AppSync); Writes → reseller-service (via AppSync)",
        rationale: "Single-responsibility principle — reads and writes have different scaling and availability requirements",
      },
      {
        before: "One PostgreSQL connection pool shared between reads and writes",
        after: "Separate connection pools — aggregator-api uses read replicas; reseller-service uses primary",
        rationale: "Eliminates read/write lock contention; allows independent connection tuning",
      },
      {
        before: "Single deployment pipeline — any change required full service restart",
        after: "Independent CI/CD pipelines — read-path changes don't affect write-path deployments",
        rationale: "Reduces deployment risk and enables faster iteration on each concern",
      },
      {
        before: "Combined scaling — 8 replicas to handle both read and write traffic",
        after: "aggregator-api: 5 replicas (read-heavy); reseller-service: 3 replicas (write-focused)",
        rationale: "Right-sized scaling — reads need more instances due to higher throughput; writes need fewer but more consistent resources",
      },
      {
        before: "Catalog lookup and qualification embedded in same service",
        after: "Qualification calls catalog-api as a separate service (reseller-service → catalog-api)",
        rationale: "Catalog data is a shared concern — dedicated service allows caching (Redis) and independent scaling",
      },
    ],
  },
};

// ─── order-api ───────────────────────────────────────────────────────────────

const orderApi: ServiceDeepDive = {
  id: "order",
  name: "order-api",
  displayName: "Order API",
  status: "active",
  accentColor: "blue",

  business: {
    purpose:
      "Order management and tracking service. Provides order lookup, status querying, and order history. Used by both the UI (via AppSync) and backend services for order state verification. The fallout-process Lambda uses order-api for auto-remediation of failed orders.",
    domainContext:
      "While reseller-service is the write-side orchestrator, order-api serves as the order read/query layer and state machine. It tracks order lifecycle from creation through completion or failure, and provides the data needed for fallout detection and remediation.",
    flows: [
      { flowNum: "9", title: "Plan Change", role: "Tracks order state transitions during plan change operations" },
      { flowNum: "13", title: "Undo / Reversal", role: "Provides order history needed for reversal — must reference original order" },
      { flowNum: "16", title: "Fallout & Self-Healing", role: "fallout-process Lambda queries and remediates via order-api" },
    ],
    stakeholders: [
      "Subscription Management UI (order history display)",
      "Agent Portal (order lookup and status tracking)",
      "fallout-process Lambda (auto-remediation)",
      "reseller-service (order state verification)",
    ],
    consumers: [
      "AppSync → order-api (GraphQL resolvers for order queries)",
      "fallout-process Lambda (REST — remediation callbacks)",
      "reseller-service (internal order state checks)",
    ],
    businessRules: [
      {
        rule: "Order state machine",
        description: "Orders follow a strict state machine: PENDING → COMPLETED | FAILED → REVERSED. Invalid transitions are rejected with 400 Bad Request.",
        severity: "critical",
      },
      {
        rule: "Order immutability",
        description: "Completed orders cannot be modified — only reversed via a new reversal order. This ensures audit trail integrity.",
        severity: "critical",
      },
      {
        rule: "Fallout detection",
        description: "Orders stuck in PENDING for > 15 minutes trigger a fallout alert. The fallout-process Lambda attempts auto-remediation before escalating to manual review.",
        severity: "important",
      },
      {
        rule: "Order linkage",
        description: "Reversal orders must reference the original order ID. Agent orders must reference the original customer session via cloneSession.",
        severity: "standard",
      },
    ],
    sla: {
      availability: "99.95%",
      latencyP99: "< 200ms (queries), < 500ms (state transitions)",
      notes: "Order queries are read-heavy and optimized with database indexes. State transitions require write locks but are infrequent.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Database", name: "PostgreSQL", color: "blue" },
      { category: "Gateway", name: "AppSync (GraphQL)", color: "blue" },
      { category: "API", name: "REST + GraphQL resolver", color: "purple" },
    ],
    endpoints: [
      {
        method: "GET",
        path: "/orders",
        description: "List orders for an account — supports pagination and status filtering",
        request: `Query params:
  billingAccountNumber: string (required)
  status: string (optional)
  limit: int (default 20)
  offset: int (default 0)`,
        response: `{
  "orders": [
    {
      "id": "string",
      "subscriptionId": "string",
      "operationType": "APPLY_TO_ORDER",
      "status": "COMPLETED",
      "createdAt": "ISO-8601",
      "completedAt": "ISO-8601"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}`,
      },
      {
        method: "GET",
        path: "/orders/:id",
        description: "Get order detail including items and status history",
        response: `{
  "id": "string",
  "subscriptionId": "string",
  "sessionId": "string",
  "operationType": "APPLY_TO_ORDER",
  "status": "COMPLETED",
  "items": [
    {
      "productId": "string",
      "name": "string",
      "price": 9.99,
      "action": "ADD"
    }
  ],
  "statusHistory": [
    { "status": "PENDING", "timestamp": "ISO-8601" },
    { "status": "COMPLETED", "timestamp": "ISO-8601" }
  ]
}`,
      },
      {
        method: "PUT",
        path: "/orders/:id/status",
        description: "Update order status — used by reseller-service and fallout-process Lambda",
        request: `{
  "status": "COMPLETED | FAILED",
  "reason": "string (optional)"
}`,
        response: `{
  "id": "string",
  "previousStatus": "PENDING",
  "newStatus": "COMPLETED",
  "updatedAt": "ISO-8601"
}`,
      },
      {
        method: "POST",
        path: "/orders/:id/remediate",
        description: "Fallout remediation — attempts to fix a failed order",
        request: `{
  "remediationType": "RETRY_MERCHANT | FORCE_COMPLETE | ESCALATE",
  "reason": "string"
}`,
        response: `{
  "id": "string",
  "remediationStatus": "SUCCESS | ESCALATED",
  "action": "string"
}`,
      },
    ],
    dataModel: [
      {
        entity: "orders",
        description: "Order records with full lifecycle tracking",
        fields: [
          { name: "id", type: "UUID", note: "Primary key" },
          { name: "subscription_id", type: "UUID", note: "FK to subscription" },
          { name: "session_id", type: "VARCHAR(128)", note: "Session reference" },
          { name: "billing_account_number", type: "VARCHAR(64)" },
          { name: "operation_type", type: "VARCHAR(32)", note: "APPLY_TO_ORDER | DELETE | REVERSE_*" },
          { name: "status", type: "VARCHAR(32)", note: "PENDING | COMPLETED | FAILED | REVERSED" },
          { name: "created_at", type: "TIMESTAMP" },
          { name: "completed_at", type: "TIMESTAMP" },
          { name: "failed_at", type: "TIMESTAMP" },
        ],
      },
      {
        entity: "order_items",
        description: "Line items within an order — products and pricing",
        fields: [
          { name: "id", type: "UUID", note: "Primary key" },
          { name: "order_id", type: "UUID", note: "FK to orders" },
          { name: "product_id", type: "VARCHAR(128)" },
          { name: "product_name", type: "VARCHAR(256)" },
          { name: "price", type: "DECIMAL(10,2)" },
          { name: "action", type: "VARCHAR(16)", note: "ADD | CHANGE | REMOVE" },
        ],
      },
      {
        entity: "order_status_history",
        description: "Audit trail of status transitions per order",
        fields: [
          { name: "id", type: "UUID", note: "Primary key" },
          { name: "order_id", type: "UUID", note: "FK to orders" },
          { name: "previous_status", type: "VARCHAR(32)" },
          { name: "new_status", type: "VARCHAR(32)" },
          { name: "reason", type: "TEXT", note: "Optional — set on failure or remediation" },
          { name: "changed_by", type: "VARCHAR(64)", note: "system | agent:<id> | customer" },
          { name: "created_at", type: "TIMESTAMP" },
        ],
      },
    ],
    databaseSchema: `erDiagram
    orders {
        UUID id PK
        UUID subscription_id FK
        VARCHAR session_id
        VARCHAR billing_account_number
        VARCHAR operation_type
        VARCHAR status
        TIMESTAMP created_at
        TIMESTAMP completed_at
        TIMESTAMP failed_at
    }
    order_items {
        UUID id PK
        UUID order_id FK
        VARCHAR product_id
        VARCHAR product_name
        DECIMAL price
        VARCHAR action
    }
    order_status_history {
        UUID id PK
        UUID order_id FK
        VARCHAR previous_status
        VARCHAR new_status
        TEXT reason
        VARCHAR changed_by
        TIMESTAMP created_at
    }
    orders ||--o{ order_items : "contains"
    orders ||--o{ order_status_history : "tracks"`,
    dependencies: [
      { service: "AppSync", direction: "upstream", protocol: "GraphQL", description: "Order queries routed through AppSync resolvers" },
      { service: "fallout-process Lambda", direction: "upstream", protocol: "REST", description: "Lambda calls order-api for remediation" },
      { service: "reseller-service", direction: "upstream", protocol: "REST", description: "Internal order state verification during submission" },
      { service: "PostgreSQL", direction: "downstream", protocol: "SQL", description: "Primary data store for orders, items, status history" },
    ],
    kafkaEvents: [
      { topic: "subscription.order.created", event: "OrderCreated", direction: "consumes", description: "Receives order creation events to maintain local order records" },
      { topic: "subscription.order.updated", event: "OrderUpdated", direction: "consumes", description: "Receives order updates for status tracking" },
    ],
    errorPatterns: [
      { scenario: "Invalid state transition", handling: "Returns 400 — e.g. trying to complete an already-completed order", retry: "None — client error" },
      { scenario: "Order not found", handling: "Returns 404", retry: "None — client should verify order ID" },
      { scenario: "Fallout remediation failure", handling: "Returns 500, escalates to manual review queue, sends alert", retry: "fallout-process Lambda retries up to 3 times before escalating" },
      { scenario: "Database connection exhaustion", handling: "Returns 503, triggers health check failure", retry: "Kubernetes restarts pod; connection pool auto-recovers" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas in production" },
      { aspect: "Database", description: "Amazon RDS PostgreSQL — shared cluster with reseller-service (separate schemas)" },
      { aspect: "Observability", description: "Structured JSON logging, Datadog APM, order latency dashboards" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [
      {
        title: "Order state machine",
        description: "Enforces valid state transitions using a transition map",
        code: `var validTransitions = map[OrderStatus][]OrderStatus{
    StatusPending:   {StatusCompleted, StatusFailed},
    StatusFailed:    {StatusReversed},
    StatusCompleted: {StatusReversed},
}

func (o *Order) TransitionTo(newStatus OrderStatus, reason string) error {
    allowed, ok := validTransitions[o.Status]
    if !ok {
        return fmt.Errorf("%w: no transitions from %s", ErrInvalidTransition, o.Status)
    }
    for _, s := range allowed {
        if s == newStatus {
            o.StatusHistory = append(o.StatusHistory, StatusChange{
                From:      o.Status,
                To:        newStatus,
                Reason:    reason,
                Timestamp: time.Now().UTC(),
            })
            o.Status = newStatus
            return nil
        }
    }
    return fmt.Errorf("%w: %s → %s", ErrInvalidTransition, o.Status, newStatus)
}`,
        language: "go",
      },
      {
        title: "Fallout detection query",
        description: "Finds orders stuck in PENDING beyond the threshold for auto-remediation",
        code: `func (r *OrderRepo) FindStaleOrders(ctx context.Context, threshold time.Duration) ([]Order, error) {
    cutoff := time.Now().UTC().Add(-threshold)
    rows, err := r.db.QueryContext(ctx, \`
        SELECT id, subscription_id, session_id, operation_type, status, created_at
        FROM orders
        WHERE status = $1 AND created_at < $2
        ORDER BY created_at ASC
        LIMIT 100
    \`, StatusPending, cutoff)
    if err != nil {
        return nil, fmt.Errorf("query stale orders: %w", err)
    }
    defer rows.Close()
    // ... scan rows
}`,
        language: "go",
      },
    ],
  },
};

// ─── token-api ───────────────────────────────────────────────────────────────

const tokenApi: ServiceDeepDive = {
  id: "token",
  name: "token-api",
  displayName: "Token API",
  status: "active",
  accentColor: "teal",

  business: {
    purpose:
      "Securely tokenizes sensitive JSON payloads in Redis with a 24-hour TTL. Used mid-flow to pass data between flow steps without exposing it in the URL or client-side state. The /review screen uses token-api to hydrate previously submitted data.",
    domainContext:
      "During subscription flows, sensitive data (account details, pricing, plan selections) needs to be passed between steps. Rather than encoding this data in URLs or storing it in browser state (where it could be tampered with), token-api provides a server-side token that the BFF can exchange for the original payload.",
    flows: [
      { flowNum: "5–6", title: "Place Order → Activate", role: "Tokenizes order details between submission and activation steps" },
      { flowNum: "Review screen", title: "Review Page Hydration", role: "BFF stores review data as a token; /review page fetches it back via the token" },
    ],
    stakeholders: [
      "Next.js BFF (primary consumer — stores and retrieves tokens)",
      "Subscription Management UI (uses token IDs in navigation between flow steps)",
    ],
    consumers: [
      "Next.js BFF → token-api (direct REST — does not go through AppSync)",
    ],
    businessRules: [
      {
        rule: "24-hour TTL",
        description: "All tokens expire after 24 hours. This ensures sensitive data is not stored indefinitely. Expired tokens return 404.",
        severity: "critical",
      },
      {
        rule: "Single-use optional",
        description: "Tokens can be read multiple times within their TTL. The /review page may re-fetch the same token if the user navigates back.",
        severity: "standard",
      },
      {
        rule: "Server-side only",
        description: "Token payloads are never sent to the browser. The BFF stores and retrieves them; the UI only sees the token ID.",
        severity: "critical",
      },
      {
        rule: "JSON-only payloads",
        description: "Only JSON payloads are accepted. Binary data is not supported. Max payload size: 1MB.",
        severity: "standard",
      },
    ],
    sla: {
      availability: "99.99%",
      latencyP99: "< 15ms (read), < 25ms (write)",
      notes: "Extremely low latency due to Redis-only storage. No database writes. Availability is tied to Redis cluster health.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Storage", name: "Redis", color: "coral" },
      { category: "API", name: "REST", color: "blue" },
    ],
    endpoints: [
      {
        method: "PUT",
        path: "/tokens",
        description: "Store a JSON payload and receive a token ID",
        request: `{
  "payload": {
    "sessionId": "string",
    "selectedPlan": { ... },
    "accountInfo": { ... }
  },
  "ttl": 86400
}`,
        response: `{
  "tokenId": "tok_a1b2c3d4e5f6",
  "expiresAt": "ISO-8601"
}`,
      },
      {
        method: "GET",
        path: "/tokens/:id",
        description: "Retrieve the JSON payload for a token ID",
        response: `{
  "tokenId": "tok_a1b2c3d4e5f6",
  "payload": {
    "sessionId": "string",
    "selectedPlan": { ... },
    "accountInfo": { ... }
  },
  "expiresAt": "ISO-8601"
}`,
      },
    ],
    dataModel: [
      {
        entity: "tokens (Redis keys)",
        description: "Key-value store with JSON payloads and TTL-based expiration",
        fields: [
          { name: "key", type: "STRING", note: "token:<tokenId> — prefixed for namespace isolation" },
          { name: "value", type: "JSON", note: "Serialized JSON payload (max 1MB)" },
          { name: "ttl", type: "INT", note: "24 hours (86400 seconds) default" },
        ],
      },
    ],
    dependencies: [
      { service: "Next.js BFF", direction: "upstream", protocol: "REST", description: "BFF stores and retrieves tokens — does not go through AppSync" },
      { service: "Redis", direction: "downstream", protocol: "Redis protocol", description: "Primary and only data store — SET/GET with TTL" },
    ],
    kafkaEvents: [],
    errorPatterns: [
      { scenario: "Token not found / expired", handling: "Returns 404 — token either never existed or TTL expired", retry: "None — caller should re-create the token" },
      { scenario: "Payload too large", handling: "Returns 413 — max 1MB payload", retry: "None — client error" },
      { scenario: "Redis unavailable", handling: "Returns 503 — all operations fail", retry: "BFF retries with short backoff (100ms, 200ms, 400ms)" },
      { scenario: "Invalid JSON payload", handling: "Returns 400 — payload must be valid JSON", retry: "None — client error" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas in production" },
      { aspect: "Storage", description: "Amazon ElastiCache Redis — cluster mode with automatic failover" },
      { aspect: "Networking", description: "Internal cluster DNS — only reachable from BFF. Not exposed via AppSync" },
      { aspect: "Observability", description: "Structured JSON logging, Redis memory usage alerts, TTL expiration metrics" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [
      {
        title: "Token store and retrieve",
        description: "Simple SET/GET with TTL — the core of token-api",
        code: `func (s *TokenService) Store(ctx context.Context, payload json.RawMessage) (string, error) {
    tokenID := "tok_" + generateID()
    key := "token:" + tokenID

    data, err := json.Marshal(tokenEntry{
        Payload:   payload,
        CreatedAt: time.Now().UTC(),
    })
    if err != nil {
        return "", fmt.Errorf("marshal: %w", err)
    }

    if err := s.redis.Set(ctx, key, data, 24*time.Hour).Err(); err != nil {
        return "", fmt.Errorf("redis set: %w", err)
    }

    return tokenID, nil
}

func (s *TokenService) Retrieve(ctx context.Context, tokenID string) (json.RawMessage, error) {
    key := "token:" + tokenID

    data, err := s.redis.Get(ctx, key).Bytes()
    if errors.Is(err, redis.Nil) {
        return nil, ErrTokenNotFound
    }
    if err != nil {
        return nil, fmt.Errorf("redis get: %w", err)
    }

    var entry tokenEntry
    if err := json.Unmarshal(data, &entry); err != nil {
        return nil, fmt.Errorf("unmarshal: %w", err)
    }

    return entry.Payload, nil
}`,
        language: "go",
      },
    ],
  },
};

// ─── Export ──────────────────────────────────────────────────────────────────

export const serviceDeepDives: ServiceDeepDive[] = [
  resellerService,
  subscriptionManagerApi,
  orderApi,
  tokenApi,
];

export function getServiceById(id: string): ServiceDeepDive | undefined {
  return serviceDeepDives.find((s) => s.id === id);
}
