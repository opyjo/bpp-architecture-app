import type { ServiceDeepDive } from "./types";

export const orderApi: ServiceDeepDive = {
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

export const coreProcessorApi: ServiceDeepDive = {
  id: "core-processor",
  name: "core-processor-api",
  displayName: "Core Processor API",
  status: "active",
  accentColor: "blue",

  business: {
    purpose: "Core business logic processing service that handles complex reconciliation and recovery operations. When subscription state becomes inconsistent between PostgreSQL and merchant systems, core-processor-api orchestrates the reconciliation workflow.",
    domainContext: "core-processor-api is the brain behind account recovery (flow 15). When a subscription is in an inconsistent state — e.g., PostgreSQL says ACTIVE but the merchant says CANCELLED — core-processor-api determines the correct state and orchestrates the fix via reseller-service and the appropriate merchant-api.",
    flows: [
      { flowNum: "15", title: "Account Recovery", role: "Orchestrates reconciliation between PostgreSQL and merchant systems" },
      { flowNum: "16", title: "Fallout & Self-Healing", role: "Provides reconciliation logic for automated fallout recovery" },
    ],
    stakeholders: [
      "reseller-service (calls core-processor for complex reconciliation)",
      "account-recovery-api (orchestrates recovery workflows via core-processor)",
      "Operations team (monitors reconciliation outcomes)",
    ],
    consumers: [
      "reseller-service → core-processor-api (REST — reconciliation requests)",
      "account-recovery-api → core-processor-api (REST — recovery orchestration)",
    ],
    businessRules: [
      {
        rule: "State reconciliation priority",
        description: "When PostgreSQL and merchant state disagree, the reconciliation logic follows a priority order: merchant state takes precedence for provisioning status, PostgreSQL takes precedence for billing status.",
        severity: "critical",
      },
      {
        rule: "Audit trail for all reconciliation",
        description: "Every reconciliation action is logged to audit-api with before/after state and the reconciliation reason.",
        severity: "critical",
      },
      {
        rule: "Dry-run mode",
        description: "Reconciliation can be run in dry-run mode to preview changes before applying them. Used by ops team for manual review.",
        severity: "important",
      },
    ],
    sla: {
      availability: "99.9%",
      latencyP99: "< 2s (reconciliation involves multiple service calls)",
      notes: "Reconciliation is a background process — not on the critical customer path. Latency includes calls to merchant-api for status checks.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Database", name: "PostgreSQL", color: "blue" },
      { category: "API", name: "REST", color: "blue" },
    ],
    endpoints: [
      {
        method: "POST",
        path: "/v1/reconcile",
        description: "Reconcile subscription state between PostgreSQL and merchant systems",
        request: `{
  "subscriptionId": "string",
  "dryRun": false
}`,
        response: `{
  "subscriptionId": "string",
  "reconciled": true,
  "changes": [
    { "field": "status", "from": "ACTIVE", "to": "CANCELLED", "source": "merchant" }
  ]
}`,
      },
      {
        method: "GET",
        path: "/v1/reconcile/:subscriptionId/status",
        description: "Check reconciliation status for a subscription",
      },
    ],
    dataModel: [
      {
        entity: "reconciliation_log",
        description: "Tracks all reconciliation attempts and outcomes",
        fields: [
          { name: "id", type: "UUID", note: "Primary key" },
          { name: "subscription_id", type: "UUID" },
          { name: "pg_state", type: "JSONB", note: "PostgreSQL state at time of reconciliation" },
          { name: "merchant_state", type: "JSONB", note: "Merchant state at time of reconciliation" },
          { name: "changes_applied", type: "JSONB", note: "List of changes made" },
          { name: "dry_run", type: "BOOLEAN" },
          { name: "initiated_by", type: "VARCHAR(64)", note: "system | manual:<userId>" },
          { name: "created_at", type: "TIMESTAMP" },
        ],
      },
    ],
    dependencies: [
      { service: "reseller-service", direction: "upstream", protocol: "REST", description: "Triggers reconciliation for inconsistent subscriptions" },
      { service: "account-recovery-api", direction: "upstream", protocol: "REST", description: "Recovery workflows use core-processor for reconciliation" },
      { service: "merchant-api-*", direction: "downstream", protocol: "REST", description: "Queries merchant systems for current provisioning state" },
      { service: "audit-api", direction: "downstream", protocol: "REST", description: "Logs all reconciliation actions" },
      { service: "PostgreSQL", direction: "downstream", protocol: "SQL", description: "Reads/writes subscription state and reconciliation logs" },
    ],
    kafkaEvents: [],
    errorPatterns: [
      { scenario: "Merchant unreachable", handling: "Marks reconciliation as INCOMPLETE — retryable", retry: "Manual retry or scheduled re-attempt" },
      { scenario: "Conflicting state resolution", handling: "Logs both states, applies merchant-priority rule, flags for review", retry: "None — applied automatically with audit trail" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas in production" },
      { aspect: "Database", description: "Amazon RDS PostgreSQL" },
      { aspect: "Observability", description: "Reconciliation success/failure rates, state mismatch dashboards" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [],
  },
};

export const auditApi: ServiceDeepDive = {
  id: "audit",
  name: "audit-api",
  displayName: "Audit API",
  status: "active",
  accentColor: "blue",

  business: {
    purpose: "Compliance audit logging service. Records all significant subscription lifecycle actions — orders placed, activated, cancelled, reversed, and recovered. For agent flows, includes agent ID and the original order number. Provides query APIs for audit trail review.",
    domainContext: "Every state-changing operation in the subscription platform must be logged for compliance. audit-api receives audit events from reseller-service (synchronous REST calls) and provides a queryable audit trail for operations teams, compliance reviews, and dispute resolution.",
    flows: [
      { flowNum: "5", title: "Place Order", role: "Logs order creation with account details and selected plan" },
      { flowNum: "6", title: "Activate Subscription", role: "Logs activation with merchant response and activationUrl" },
      { flowNum: "7", title: "Cancel Subscription", role: "Logs cancellation with reason and deprovisioning status" },
      { flowNum: "8", title: "Agent-Assisted", role: "Logs agent ID, original order number, and cloned session reference" },
      { flowNum: "9", title: "Plan Change", role: "Logs plan change with before/after plan details" },
      { flowNum: "15", title: "Account Recovery", role: "Logs all reconciliation actions with before/after state" },
      { flowNum: "16", title: "Fallout & Self-Healing", role: "Logs fallout detection and auto-remediation actions" },
    ],
    stakeholders: [
      "reseller-service (primary writer — logs all state changes)",
      "core-processor-api (logs reconciliation actions)",
      "Operations team (queries audit trail for investigation)",
      "Compliance team (periodic audit reviews)",
    ],
    consumers: [
      "reseller-service → audit-api (REST — synchronous audit logging)",
      "core-processor-api → audit-api (REST — reconciliation logging)",
      "Admin portal → audit-api (REST — audit trail queries)",
    ],
    businessRules: [
      {
        rule: "Immutable audit log",
        description: "Audit records cannot be modified or deleted. Once written, an audit entry is permanent. This is a compliance requirement.",
        severity: "critical",
      },
      {
        rule: "Synchronous write",
        description: "Audit logging is synchronous — reseller-service waits for audit-api confirmation before proceeding. Failed audit writes block the operation.",
        severity: "critical",
      },
      {
        rule: "Agent attribution",
        description: "Agent-initiated actions must include agentId and originalOrderNumber. Missing agent context on agent flows is rejected.",
        severity: "important",
      },
      {
        rule: "Retention policy",
        description: "Audit records are retained for 7 years. Older records are archived to S3 Glacier via audit-stream-lambda.",
        severity: "standard",
      },
    ],
    sla: {
      availability: "99.99%",
      latencyP99: "< 50ms (write), < 200ms (query)",
      notes: "Audit writes must be extremely fast — they are on the critical path of every mutation. High availability is required as audit failures block operations.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Database", name: "PostgreSQL", color: "blue" },
      { category: "API", name: "REST", color: "blue" },
    ],
    endpoints: [
      {
        method: "POST",
        path: "/v1/audit",
        description: "Write an audit entry — synchronous, called by reseller-service on every mutation",
        request: `{
  "eventType": "ORDER_CREATED | ACTIVATED | CANCELLED | REVERSED | RECOVERED",
  "subscriptionId": "string",
  "orderId": "string",
  "accountNumber": "string",
  "agentId": "string (optional)",
  "originalOrderNumber": "string (optional)",
  "details": { ... },
  "timestamp": "ISO-8601"
}`,
        response: `{
  "auditId": "aud_abc123",
  "recorded": true
}`,
      },
      {
        method: "GET",
        path: "/v1/audit/subscription/:subscriptionId",
        description: "Get audit trail for a subscription — ordered by timestamp descending",
      },
      {
        method: "GET",
        path: "/v1/audit/account/:accountNumber",
        description: "Get all audit entries for an account — supports pagination and date range filtering",
      },
      {
        method: "GET",
        path: "/v1/audit/agent/:agentId",
        description: "Get all agent-initiated actions — for agent activity review",
      },
    ],
    dataModel: [
      {
        entity: "audit_entries",
        description: "Immutable audit log — one record per state-changing action",
        fields: [
          { name: "id", type: "UUID", note: "Primary key" },
          { name: "event_type", type: "VARCHAR(64)", note: "ORDER_CREATED | ACTIVATED | CANCELLED | REVERSED | RECOVERED" },
          { name: "subscription_id", type: "UUID" },
          { name: "order_id", type: "UUID", note: "Optional — not all events have an order" },
          { name: "account_number", type: "VARCHAR(64)" },
          { name: "agent_id", type: "VARCHAR(64)", note: "NULL for customer-initiated actions" },
          { name: "original_order_number", type: "VARCHAR(128)", note: "NULL unless agent flow" },
          { name: "details", type: "JSONB", note: "Event-specific payload (plan details, merchant response, etc.)" },
          { name: "source_service", type: "VARCHAR(64)", note: "Which service wrote this entry" },
          { name: "created_at", type: "TIMESTAMP", note: "Immutable — set on insert" },
        ],
      },
    ],
    dependencies: [
      { service: "reseller-service", direction: "upstream", protocol: "REST", description: "Primary writer — logs all subscription lifecycle events" },
      { service: "core-processor-api", direction: "upstream", protocol: "REST", description: "Logs reconciliation actions" },
      { service: "PostgreSQL", direction: "downstream", protocol: "SQL", description: "Immutable audit log storage" },
    ],
    kafkaEvents: [
      { topic: "audit.entry.created", event: "AuditEntryCreated", direction: "publishes", description: "Publishes audit entries for downstream consumers (analytics, archival)" },
    ],
    errorPatterns: [
      { scenario: "Write failure", handling: "Returns 500 — blocks the calling operation (reseller-service will not proceed)", retry: "Caller retries immediately (critical path)" },
      { scenario: "Database full", handling: "Returns 507 — triggers immediate ops alert for capacity expansion", retry: "None until capacity is expanded" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 3 replicas in production (critical path)" },
      { aspect: "Database", description: "Amazon RDS PostgreSQL — append-only table with partitioning by month" },
      { aspect: "Archival", description: "audit-stream-lambda archives records older than 1 year to S3 Glacier" },
      { aspect: "Observability", description: "Write latency dashboards, audit volume metrics, storage capacity alerts" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [
      {
        title: "Append-only audit writer",
        description: "Inserts audit entries with no UPDATE or DELETE capability — enforces immutability at the service level",
        code: `func (r *AuditRepo) Write(ctx context.Context, entry AuditEntry) error {
    _, err := r.db.ExecContext(ctx, \`
        INSERT INTO audit_entries (
            id, event_type, subscription_id, order_id,
            account_number, agent_id, original_order_number,
            details, source_service, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    \`,
        entry.ID, entry.EventType, entry.SubscriptionID, entry.OrderID,
        entry.AccountNumber, entry.AgentID, entry.OriginalOrderNumber,
        entry.Details, entry.SourceService, time.Now().UTC(),
    )
    if err != nil {
        return fmt.Errorf("insert audit: %w", err)
    }
    return nil
}

// No Update or Delete methods exist — audit entries are immutable`,
        language: "go",
      },
    ],
  },
};

export const ordersBillingServices: ServiceDeepDive[] = [orderApi, coreProcessorApi, auditApi];
