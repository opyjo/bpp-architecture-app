import type { ServiceDeepDive } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// reseller-service  (FULL deep dive — moved from standalone file)
// ─────────────────────────────────────────────────────────────────────────────

export const resellerService: ServiceDeepDive = {
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

// ─────────────────────────────────────────────────────────────────────────────
// subscriptions-aggregator-api  (FULL deep dive — 4 sections)
// ─────────────────────────────────────────────────────────────────────────────

export const subscriptionsAggregatorApi: ServiceDeepDive = {
  id: "sub-aggregator",
  name: "subscriptions-aggregator-api",
  displayName: "Subscriptions Aggregator API",
  status: "active",
  accentColor: "amber",

  business: {
    purpose:
      "Read-only REST API that merges subscription data from PostgreSQL and CPM (Customer Profile Management) into a single unified response. Powers the /customer landing screen by providing a consolidated view of all subscriptions for a given TV account.",
    domainContext:
      "Handles the read side of the subscription domain. While reseller-service owns all write operations (mutations through AppSync), subscriptions-aggregator-api serves all read queries directly via REST — bypassing AppSync entirely. This separation keeps read latency low and avoids overloading the GraphQL layer with high-frequency list queries.",
    flows: [
      { flowNum: "2", title: "Load Subscriptions", role: "Primary handler — BFF calls GET /subscriptions?tvAccountNumber=... to power the /customer landing screen. Merges PostgreSQL subscription records with CPM account data." },
    ],
    stakeholders: [
      "Subscription Management UI (via Next.js BFF — REST)",
      "Agent Portal (same REST endpoint, different auth scope)",
      "reseller-service (UI re-fetches aggregator after mutations to refresh state)",
    ],
    consumers: [
      "Next.js BFF → subscriptions-aggregator-api (all subscription reads)",
    ],
    businessRules: [
      {
        rule: "Data merge strategy",
        description: "PostgreSQL is the source of truth for subscription state (status, dates, pricing). CPM provides supplementary account data (subscriber name, account type, billing info). On conflict, PostgreSQL wins.",
        severity: "critical",
      },
      {
        rule: "Read-only enforcement",
        description: "This service has no write endpoints. All mutation operations must go through reseller-service via AppSync. The database connection uses a read-only role.",
        severity: "critical",
      },
      {
        rule: "Account-scoped queries",
        description: "Every request must include a tvAccountNumber. Cross-account queries are rejected. The BFF extracts the account number from the authenticated session.",
        severity: "important",
      },
      {
        rule: "Graceful CPM degradation",
        description: "If CPM is unavailable, the API returns PostgreSQL data only with a partial flag set to true. The UI displays a warning banner but remains functional.",
        severity: "standard",
      },
    ],
    sla: {
      availability: "99.95%",
      latencyP99: "< 400ms (list), < 200ms (single subscription)",
      notes: "Read latency is critical because the /customer landing screen loads on every session. PostgreSQL read replicas and connection pooling keep response times low.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Framework", name: "Gin", color: "teal" },
      { category: "API", name: "REST (OpenAPI codegen)", color: "blue" },
      { category: "Database", name: "PostgreSQL (read replica)", color: "blue" },
      { category: "Integration", name: "CPM (SOAP/REST)", color: "coral" },
    ],
    endpoints: [
      {
        method: "GET",
        path: "/subscriptions?tvAccountNumber=:tvAccountNumber",
        description: "Returns all subscriptions for the given TV account — merges PostgreSQL + CPM data",
        response: `{
  "subscriptions": [
    {
      "subscriptionId": "string",
      "productId": "string",
      "productName": "string",
      "providerId": "string",
      "providerDisplayName": "string",
      "status": "ACTIVE | PENDING | CANCELLED | GRACE_PERIOD",
      "price": 9.99,
      "billingCycle": "MONTHLY",
      "startDate": "ISO-8601",
      "endDate": "ISO-8601 | null",
      "activationUrl": "string | null",
      "subscriber": {
        "name": "string",
        "accountType": "string",
        "billingStatus": "string"
      }
    }
  ],
  "partial": false,
  "totalCount": 3
}`,
      },
      {
        method: "GET",
        path: "/subscriptions/:id",
        description: "Returns a single subscription by ID with full detail including CPM enrichment",
        response: `{
  "subscriptionId": "string",
  "productId": "string",
  "productName": "string",
  "providerId": "string",
  "providerDisplayName": "string",
  "status": "string",
  "price": 9.99,
  "billingCycle": "MONTHLY",
  "startDate": "ISO-8601",
  "endDate": "ISO-8601 | null",
  "activationUrl": "string | null",
  "orderHistory": [
    {
      "orderId": "string",
      "operationType": "string",
      "status": "string",
      "createdAt": "ISO-8601"
    }
  ],
  "subscriber": {
    "name": "string",
    "accountType": "string",
    "billingStatus": "string",
    "linkedAccounts": ["string"]
  }
}`,
      },
    ],
    dataModel: [
      {
        entity: "subscriptions (read replica)",
        description: "Same schema as reseller-service — read replica accessed with read-only credentials",
        fields: [
          { name: "id", type: "UUID", note: "Primary key" },
          { name: "billing_account_number", type: "VARCHAR(64)", note: "Bell BAN" },
          { name: "tv_account_number", type: "VARCHAR(64)", note: "Primary query key" },
          { name: "product_id", type: "VARCHAR(128)" },
          { name: "provider_id", type: "VARCHAR(64)" },
          { name: "status", type: "VARCHAR(32)" },
          { name: "price", type: "DECIMAL(10,2)" },
          { name: "billing_cycle", type: "VARCHAR(16)" },
          { name: "start_date", type: "TIMESTAMP" },
          { name: "end_date", type: "TIMESTAMP", note: "NULL if active" },
          { name: "activation_url", type: "TEXT" },
          { name: "created_at", type: "TIMESTAMP" },
          { name: "updated_at", type: "TIMESTAMP" },
        ],
      },
    ],
    dependencies: [
      { service: "Next.js BFF", direction: "upstream", protocol: "REST", description: "BFF calls aggregator directly — bypasses AppSync" },
      { service: "PostgreSQL (read replica)", direction: "downstream", protocol: "SQL", description: "Read-only connection to subscription data via RDS read replica" },
      { service: "CPM", direction: "downstream", protocol: "REST/SOAP", description: "Customer Profile Management — enriches subscriptions with subscriber account data" },
    ],
    kafkaEvents: [],
    errorPatterns: [
      { scenario: "PostgreSQL read replica lag", handling: "Returns stale data (eventual consistency); response includes lastSyncedAt timestamp", retry: "None — read replica catches up automatically" },
      { scenario: "CPM timeout (> 2s)", handling: "Returns PostgreSQL data only with partial: true flag", retry: "None — UI shows warning banner, user can refresh" },
      { scenario: "Invalid tvAccountNumber", handling: "Returns 400 Bad Request with validation error", retry: "None — client error" },
      { scenario: "No subscriptions found", handling: "Returns 200 with empty subscriptions array and totalCount: 0", retry: "None — valid empty state" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 3 replicas minimum, HPA scales on CPU/request latency" },
      { aspect: "Database", description: "Amazon RDS PostgreSQL read replica — same cluster as reseller-service primary" },
      { aspect: "Networking", description: "Internal cluster DNS — reachable from BFF pods only. Not exposed via AppSync" },
      { aspect: "Observability", description: "Structured JSON logging, Datadog APM traces, custom metrics for CPM merge latency and partial response rate" },
      { aspect: "CI/CD", description: "GitLab CI → Docker build → ECR push → ArgoCD deployment to EKS" },
      { aspect: "Connection pooling", description: "PgBouncer sidecar for connection pooling — keeps read replica connection count manageable under high traffic" },
    ],
    codePatterns: [
      {
        title: "Data merger — PostgreSQL + CPM",
        description: "Fetches subscription records from PostgreSQL and enriches each with CPM subscriber data. Falls back gracefully if CPM is unavailable.",
        code: `func (s *AggregatorService) GetSubscriptions(ctx context.Context, tvAccountNumber string) (*SubscriptionListResponse, error) {
    // Fetch from PostgreSQL read replica
    subs, err := s.repo.FindByTVAccount(ctx, tvAccountNumber)
    if err != nil {
        return nil, fmt.Errorf("query subscriptions: %w", err)
    }

    // Enrich with CPM data (best-effort)
    cpmData, cpmErr := s.cpmClient.GetSubscriberInfo(ctx, tvAccountNumber)
    partial := cpmErr != nil
    if cpmErr != nil {
        s.logger.Warn("CPM unavailable, returning partial data",
            zap.String("tvAccountNumber", tvAccountNumber),
            zap.Error(cpmErr),
        )
    }

    // Merge results
    merged := make([]SubscriptionDTO, 0, len(subs))
    for _, sub := range subs {
        dto := mapToDTO(sub)
        if !partial {
            enrichWithCPM(&dto, cpmData)
        }
        merged = append(merged, dto)
    }

    return &SubscriptionListResponse{
        Subscriptions: merged,
        Partial:       partial,
        TotalCount:    len(merged),
    }, nil
}`,
        language: "go",
      },
      {
        title: "Read-only database connection",
        description: "Database connection is configured with a read-only role to enforce the read-only contract at the infrastructure level",
        code: `func NewReadOnlyDB(cfg config.DatabaseConfig) (*sql.DB, error) {
    dsn := fmt.Sprintf(
        "host=%s port=%d user=%s password=%s dbname=%s sslmode=require "+
            "default_transaction_read_only=on",
        cfg.ReadReplicaHost, cfg.Port, cfg.ReadOnlyUser,
        cfg.ReadOnlyPassword, cfg.DBName,
    )

    db, err := sql.Open("pgx", dsn)
    if err != nil {
        return nil, fmt.Errorf("open read-only db: %w", err)
    }

    db.SetMaxOpenConns(cfg.MaxOpenConns)
    db.SetMaxIdleConns(cfg.MaxIdleConns)
    db.SetConnMaxLifetime(cfg.ConnMaxLifetime)

    return db, nil
}`,
        language: "go",
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// subscriber-manager-api  (STANDARD — 2 sections: business + technical)
// ─────────────────────────────────────────────────────────────────────────────

export const subscriberManagerApi: ServiceDeepDive = {
  id: "subscriber-manager",
  name: "subscriber-manager-api",
  displayName: "Subscriber Manager API",
  status: "active",
  accentColor: "amber",

  business: {
    purpose:
      "Manages the subscriber lifecycle including account creation, linking, suspension, and reactivation. Maintains the relationship between billing accounts (BANs) and TV accounts, and tracks subscriber-level billing status that drives subscription eligibility.",
    domainContext:
      "Operates at the subscriber level — one layer above individual subscriptions. A subscriber can have multiple subscriptions across different merchants. This service is updated by billing-process Lambda during billing sync and is queried by reseller-service during eligibility checks to verify account standing.",
    flows: [
      { flowNum: "10", title: "Billing", role: "Receives billing status updates from billing-process Lambda after NM1 sync. Updates subscriber billing state (CURRENT, PAST_DUE, SUSPENDED)." },
    ],
    stakeholders: [
      "billing-process Lambda (billing sync updates)",
      "reseller-service (eligibility checks — subscriber standing)",
      "subscription-consumer (subscriber state reconciliation on lifecycle events)",
    ],
    consumers: [
      "billing-process Lambda → subscriber-manager-api (billing status updates)",
      "reseller-service → subscriber-manager-api (account standing queries during qualification)",
      "account-link Lambda → subscriber-manager-api (new account linking)",
    ],
    businessRules: [
      {
        rule: "Account linking integrity",
        description: "A TV account can only be linked to one billing account at a time. Re-linking requires explicit unlinking first. Orphaned TV accounts are flagged for manual review.",
        severity: "critical",
      },
      {
        rule: "Billing status propagation",
        description: "When billing status changes to SUSPENDED, all linked subscriptions are flagged for grace period processing. The subscriber-manager does not cancel subscriptions directly — it emits a status change event.",
        severity: "critical",
      },
      {
        rule: "Subscriber deactivation guard",
        description: "A subscriber cannot be deactivated while active subscriptions exist. The service returns a 409 Conflict with a list of active subscription IDs.",
        severity: "important",
      },
    ],
    sla: {
      availability: "99.95%",
      latencyP99: "< 300ms",
      notes: "Mostly simple CRUD operations against PostgreSQL. Low latency because no external service calls are required for most operations.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Framework", name: "Gin", color: "teal" },
      { category: "Database", name: "PostgreSQL", color: "blue" },
      { category: "API", name: "REST (OpenAPI codegen)", color: "blue" },
    ],
    endpoints: [
      {
        method: "GET",
        path: "/subscribers/:tvAccountNumber",
        description: "Returns subscriber record including billing status, linked accounts, and account standing",
        response: `{
  "tvAccountNumber": "string",
  "billingAccountNumber": "string",
  "billingStatus": "CURRENT | PAST_DUE | SUSPENDED",
  "accountType": "RESIDENTIAL | BUSINESS",
  "linkedAt": "ISO-8601",
  "lastBillingSync": "ISO-8601",
  "status": "ACTIVE | INACTIVE | SUSPENDED"
}`,
      },
      {
        method: "POST",
        path: "/subscribers",
        description: "Creates a new subscriber record and links billing account to TV account",
        request: `{
  "tvAccountNumber": "string",
  "billingAccountNumber": "string",
  "accountType": "RESIDENTIAL | BUSINESS"
}`,
        response: `{
  "tvAccountNumber": "string",
  "billingAccountNumber": "string",
  "status": "ACTIVE",
  "linkedAt": "ISO-8601"
}`,
      },
      {
        method: "PUT",
        path: "/subscribers/:tvAccountNumber/billing-status",
        description: "Updates billing status — called by billing-process Lambda after NM1 sync",
        request: `{
  "billingStatus": "CURRENT | PAST_DUE | SUSPENDED",
  "syncedAt": "ISO-8601",
  "source": "NM1"
}`,
        response: `{
  "tvAccountNumber": "string",
  "previousStatus": "string",
  "newStatus": "string",
  "updatedAt": "ISO-8601"
}`,
      },
      {
        method: "DELETE",
        path: "/subscribers/:tvAccountNumber/link",
        description: "Unlinks a billing account from a TV account. Fails if active subscriptions exist.",
        response: `{
  "tvAccountNumber": "string",
  "unlinkedAt": "ISO-8601"
}`,
      },
    ],
    dataModel: [
      {
        entity: "subscribers",
        description: "Core subscriber record — one row per TV account with billing account linkage",
        fields: [
          { name: "tv_account_number", type: "VARCHAR(64)", note: "Primary key" },
          { name: "billing_account_number", type: "VARCHAR(64)", note: "Linked BAN" },
          { name: "account_type", type: "VARCHAR(32)", note: "RESIDENTIAL | BUSINESS" },
          { name: "billing_status", type: "VARCHAR(32)", note: "CURRENT | PAST_DUE | SUSPENDED" },
          { name: "status", type: "VARCHAR(32)", note: "ACTIVE | INACTIVE | SUSPENDED" },
          { name: "linked_at", type: "TIMESTAMP" },
          { name: "last_billing_sync", type: "TIMESTAMP", note: "Last NM1 sync timestamp" },
          { name: "created_at", type: "TIMESTAMP" },
          { name: "updated_at", type: "TIMESTAMP" },
        ],
      },
    ],
    dependencies: [
      { service: "billing-process Lambda", direction: "upstream", protocol: "REST", description: "Receives billing status updates after NM1 sync" },
      { service: "reseller-service", direction: "upstream", protocol: "REST", description: "Queried during subscription eligibility checks" },
      { service: "account-link Lambda", direction: "upstream", protocol: "REST", description: "Creates new subscriber records during account onboarding" },
      { service: "PostgreSQL", direction: "downstream", protocol: "SQL", description: "Primary data store for subscriber records" },
    ],
    kafkaEvents: [
      { topic: "subscriber.billing.status.changed", event: "BillingStatusChanged", direction: "publishes", description: "Emitted when billing status is updated (CURRENT → PAST_DUE, PAST_DUE → SUSPENDED, etc.)" },
      { topic: "subscriber.account.linked", event: "AccountLinked", direction: "publishes", description: "Emitted when a billing account is linked to a TV account" },
      { topic: "subscriber.account.unlinked", event: "AccountUnlinked", direction: "publishes", description: "Emitted when a billing account is unlinked from a TV account" },
    ],
    errorPatterns: [
      { scenario: "Duplicate account link", handling: "Returns 409 Conflict — TV account already linked to a billing account", retry: "None — requires explicit unlink first" },
      { scenario: "Deactivation with active subscriptions", handling: "Returns 409 Conflict with list of active subscription IDs", retry: "None — subscriptions must be cancelled first" },
      { scenario: "NM1 billing sync stale data", handling: "Accepts update but logs warning if syncedAt is older than last known sync", retry: "None — billing-process Lambda retries on next schedule" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas minimum in production" },
      { aspect: "Database", description: "Amazon RDS PostgreSQL — Multi-AZ, shared cluster with other core subscription services" },
      { aspect: "Observability", description: "Structured JSON logging, Datadog APM traces, alerts on billing status change rate anomalies" },
      { aspect: "CI/CD", description: "GitLab CI → Docker build → ECR push → ArgoCD deployment to EKS" },
    ],
    codePatterns: [],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// subscription-configurator-api  (COMPACT — 1 section: business)
// ─────────────────────────────────────────────────────────────────────────────

export const subscriptionConfiguratorApi: ServiceDeepDive = {
  id: "sub-configurator",
  name: "subscription-configurator-api",
  displayName: "Subscription Configurator API",
  status: "active",
  accentColor: "amber",

  business: {
    purpose:
      "Admin-facing service that configures subscription rules and policies. Defines eligibility constraints, plan bundling rules, grace period durations, and merchant-specific configuration. Changes made here propagate to reseller-service and catalog-api at runtime via feature flags and configuration sync.",
    domainContext:
      "Provides the configuration layer that governs how subscriptions behave. Product managers and operations teams use this service (via an internal admin UI) to adjust rules without code deployments — for example, changing the grace period window for a specific merchant or enabling a new plan bundle.",
    flows: [],
    stakeholders: [
      "Product management team (via internal admin UI)",
      "Operations team (grace period and policy adjustments)",
      "reseller-service (consumes eligibility and routing rules at runtime)",
      "catalog-api (consumes plan bundling and pricing rules)",
    ],
    consumers: [
      "Internal admin UI → subscription-configurator-api (CRUD on rules and policies)",
      "config-sync Lambda → subscription-configurator-api (reads configuration for downstream distribution)",
    ],
    businessRules: [
      {
        rule: "Configuration versioning",
        description: "All rule changes are versioned. Previous configurations are retained for audit and rollback. Active configuration is always the latest approved version.",
        severity: "critical",
      },
      {
        rule: "Approval workflow",
        description: "Changes to critical rules (eligibility constraints, merchant routing) require approval from a second admin before activation. Standard rules (grace period durations) can be self-approved.",
        severity: "important",
      },
      {
        rule: "Propagation delay",
        description: "Configuration changes take up to 60 seconds to propagate to downstream services. The config-sync Lambda polls on a 30-second interval.",
        severity: "standard",
      },
    ],
    sla: {
      availability: "99.9%",
      latencyP99: "< 500ms",
      notes: "Admin-facing — lower traffic volume than customer-facing services. Availability target is slightly lower because configuration changes are infrequent and not on the critical customer path.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Framework", name: "Gin", color: "teal" },
      { category: "Database", name: "PostgreSQL", color: "blue" },
      { category: "API", name: "REST (OpenAPI codegen)", color: "blue" },
    ],
    endpoints: [
      {
        method: "GET",
        path: "/rules",
        description: "Lists all active configuration rules with optional filtering by category",
        response: `{
  "rules": [
    {
      "id": "string",
      "category": "ELIGIBILITY | BUNDLING | GRACE_PERIOD | ROUTING",
      "name": "string",
      "value": "object",
      "version": 3,
      "status": "ACTIVE | DRAFT | ARCHIVED",
      "updatedBy": "string",
      "updatedAt": "ISO-8601"
    }
  ]
}`,
      },
      {
        method: "PUT",
        path: "/rules/:id",
        description: "Updates a configuration rule — creates a new version",
        request: `{
  "value": "object",
  "reason": "string"
}`,
        response: `{
  "id": "string",
  "version": 4,
  "status": "DRAFT | ACTIVE",
  "updatedAt": "ISO-8601"
}`,
      },
    ],
    dataModel: [
      {
        entity: "configuration_rules",
        description: "Versioned configuration rules — each update creates a new version row",
        fields: [
          { name: "id", type: "UUID", note: "Rule identifier (stable across versions)" },
          { name: "category", type: "VARCHAR(64)", note: "ELIGIBILITY | BUNDLING | GRACE_PERIOD | ROUTING" },
          { name: "name", type: "VARCHAR(128)", note: "Human-readable rule name" },
          { name: "value", type: "JSONB", note: "Rule configuration payload" },
          { name: "version", type: "INT", note: "Auto-incrementing version number" },
          { name: "status", type: "VARCHAR(32)", note: "ACTIVE | DRAFT | ARCHIVED" },
          { name: "updated_by", type: "VARCHAR(128)", note: "Admin user who made the change" },
          { name: "approved_by", type: "VARCHAR(128)", note: "NULL for self-approved rules" },
          { name: "created_at", type: "TIMESTAMP" },
        ],
      },
    ],
    dependencies: [
      { service: "Internal admin UI", direction: "upstream", protocol: "REST", description: "Admin users manage rules through the internal UI" },
      { service: "config-sync Lambda", direction: "upstream", protocol: "REST", description: "Polls for configuration changes and distributes to downstream services" },
      { service: "PostgreSQL", direction: "downstream", protocol: "SQL", description: "Primary data store for versioned configuration rules" },
    ],
    kafkaEvents: [],
    errorPatterns: [
      { scenario: "Invalid rule value schema", handling: "Returns 400 Bad Request with JSON Schema validation errors", retry: "None — client error" },
      { scenario: "Approval required", handling: "Returns 202 Accepted — rule saved as DRAFT pending approval", retry: "None — requires second admin approval" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas in production (low traffic)" },
      { aspect: "Database", description: "Amazon RDS PostgreSQL — shared cluster with other core subscription services" },
      { aspect: "CI/CD", description: "GitLab CI → Docker build → ECR push → ArgoCD deployment to EKS" },
    ],
    codePatterns: [],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// subscription-consumer  (COMPACT — 1 section: business)
// ─────────────────────────────────────────────────────────────────────────────

export const subscriptionConsumer: ServiceDeepDive = {
  id: "sub-consumer",
  name: "subscription-consumer",
  displayName: "Subscription Consumer",
  status: "active",
  accentColor: "amber",

  business: {
    purpose:
      "Event-driven Kafka consumer that reacts to subscription lifecycle events published by reseller-service. Keeps downstream read models and CPM in sync by processing OrderCreated, StatusChanged, ActivationCompleted, and OrderReversed events. No REST endpoints — purely asynchronous.",
    domainContext:
      "Acts as the bridge between the write side (reseller-service publishing Kafka events) and the read side (CPM, downstream data stores). Ensures that external systems stay consistent with the subscription state managed in PostgreSQL. Uses Dapr for Kafka binding and message delivery guarantees.",
    flows: [],
    stakeholders: [
      "reseller-service (publishes events consumed by this service)",
      "CPM (Customer Profile Management — updated on subscription lifecycle changes)",
      "subscriber-manager-api (receives reconciliation updates)",
      "notification-consumer (may trigger downstream notifications based on subscription events)",
    ],
    consumers: [
      "Kafka topics → subscription-consumer (all subscription lifecycle events)",
    ],
    businessRules: [
      {
        rule: "Idempotent event processing",
        description: "Each event is processed exactly once using a deduplication key (eventId + topic). Duplicate events are acknowledged without reprocessing to prevent inconsistencies in downstream systems.",
        severity: "critical",
      },
      {
        rule: "Ordered processing per subscription",
        description: "Events for the same subscriptionId must be processed in order. Kafka partition key is set to subscriptionId to guarantee ordering within a partition.",
        severity: "critical",
      },
      {
        rule: "CPM sync failure handling",
        description: "If CPM update fails, the event is sent to a dead-letter topic (subscription.dlq) for manual review. The consumer does not block on CPM failures — it continues processing other events.",
        severity: "important",
      },
      {
        rule: "Event schema validation",
        description: "All incoming events are validated against a schema registry before processing. Malformed events are rejected and logged without acknowledgement, triggering an alert.",
        severity: "standard",
      },
    ],
    sla: {
      availability: "99.95%",
      latencyP99: "< 5s (end-to-end event processing)",
      notes: "Latency measured from Kafka publish to CPM update completion. Spikes are acceptable during high-volume events (e.g., bulk cancellation). DLQ ensures no data loss.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Messaging", name: "Kafka (Dapr binding)", color: "purple" },
      { category: "Sidecar", name: "Dapr", color: "blue" },
      { category: "Integration", name: "CPM (REST/SOAP)", color: "coral" },
    ],
    endpoints: [],
    dataModel: [],
    dependencies: [
      { service: "Kafka", direction: "upstream", protocol: "Async", description: "Consumes subscription lifecycle events from reseller-service topics" },
      { service: "CPM", direction: "downstream", protocol: "REST/SOAP", description: "Updates Customer Profile Management system with subscription state changes" },
      { service: "subscriber-manager-api", direction: "downstream", protocol: "REST", description: "Sends reconciliation updates when subscription state conflicts are detected" },
    ],
    kafkaEvents: [
      { topic: "subscription.order.created", event: "OrderCreated", direction: "consumes", description: "Processes new orders — syncs subscription record to CPM" },
      { topic: "subscription.order.updated", event: "OrderUpdated", direction: "consumes", description: "Processes plan changes and order modifications — updates CPM record" },
      { topic: "subscription.status.changed", event: "StatusChanged", direction: "consumes", description: "Processes status transitions — updates CPM and triggers downstream reconciliation" },
      { topic: "subscription.activation.completed", event: "ActivationCompleted", direction: "consumes", description: "Processes activation completions — updates CPM with activation details" },
      { topic: "subscription.order.reversed", event: "OrderReversed", direction: "consumes", description: "Processes reversals — rolls back CPM state to match reversed subscription" },
    ],
    errorPatterns: [
      { scenario: "CPM update failure", handling: "Event routed to subscription.dlq dead-letter topic; consumer continues processing other events", retry: "Manual retry from DLQ after CPM recovery" },
      { scenario: "Malformed event payload", handling: "Event rejected with schema validation error; logged and alerted", retry: "None — requires publisher fix" },
      { scenario: "Kafka consumer group rebalance", handling: "In-flight events are re-delivered after rebalance completes; idempotency key prevents duplicate processing", retry: "Automatic — Kafka redelivers uncommitted offsets" },
      { scenario: "Out-of-order events (rare)", handling: "Detected via event timestamp comparison; late events are logged and skipped if superseded", retry: "None — latest state already applied" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 3 replicas with Dapr sidecar for Kafka binding" },
      { aspect: "Messaging", description: "MSK (Managed Kafka) — consumes from 5 subscription.* topics, publishes to subscription.dlq on failure" },
      { aspect: "Observability", description: "Structured JSON logging, Datadog APM traces, consumer lag monitoring with PagerDuty alerts" },
      { aspect: "CI/CD", description: "GitLab CI → Docker build → ECR push → ArgoCD deployment to EKS" },
    ],
    codePatterns: [],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Aggregated export
// ─────────────────────────────────────────────────────────────────────────────

export const coreSubscriptionServices: ServiceDeepDive[] = [
  resellerService,
  subscriptionsAggregatorApi,
  subscriberManagerApi,
  subscriptionConfiguratorApi,
  subscriptionConsumer,
];
