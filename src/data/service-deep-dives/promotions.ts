import type { ServiceDeepDive } from "./types";

export const promocodesApi: ServiceDeepDive = {
  id: "promocodes",
  name: "promocodes-api",
  displayName: "Promo Codes API",
  status: "active",
  accentColor: "green",

  business: {
    purpose: "Promo code validation and redemption service. Validates promotional codes against business rules (expiry, usage limits, account eligibility), applies discounts during the subscription flow, and tracks redemption history. Works with promocodes-rtv-api for real-time validation during qualification.",
    domainContext: "Promotions are applied during the subscription qualification flow. When a customer enters a promo code, reseller-service calls promocodes-api to validate and apply the discount. The promo ecosystem includes real-time validation (promocodes-rtv-api), async redemption tracking (promoredeem-consumer), analytics streaming (promostream-consumer), and data migration (promo-migration-consumer).",
    flows: [
      { flowNum: "18", title: "Promo Codes", role: "Validates promo codes, checks eligibility, applies discounts, tracks redemptions" },
      { flowNum: "4", title: "Check Eligibility", role: "Promo discounts are factored into qualification pricing when a code is applied" },
      { flowNum: "5", title: "Place Order", role: "Redeemed promo codes are recorded when the order is submitted" },
    ],
    stakeholders: [
      "Subscription Management UI (promo code entry field)",
      "reseller-service (validation during qualification)",
      "Marketing team (creates and manages promo campaigns)",
      "Analytics (promo performance tracking via promostream-consumer)",
    ],
    consumers: [
      "reseller-service → promocodes-api (REST — promo validation during qualification)",
      "Admin portal (campaign management CRUD)",
    ],
    businessRules: [
      {
        rule: "Code uniqueness",
        description: "Each promo code is unique across the platform. Codes are case-insensitive and normalized to uppercase on input.",
        severity: "critical",
      },
      {
        rule: "Usage limits",
        description: "Promo codes have per-code limits (total redemptions) and per-account limits (one per customer). Enforced at validation time.",
        severity: "critical",
      },
      {
        rule: "Expiry enforcement",
        description: "Promo codes have start and end dates. Expired codes return a clear error message. Future codes are also rejected.",
        severity: "important",
      },
      {
        rule: "Product eligibility",
        description: "Promo codes can be restricted to specific products, categories, or providers. Validated against catalog-api product data.",
        severity: "important",
      },
      {
        rule: "Stackability rules",
        description: "By default, promo codes cannot be stacked. Specific codes can be marked as stackable by the marketing team.",
        severity: "standard",
      },
    ],
    sla: {
      availability: "99.95%",
      latencyP99: "< 150ms (validation), < 200ms (redemption)",
      notes: "Validation must be fast — fires during plan qualification. Redemption is slightly slower due to PostgreSQL write.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Database", name: "PostgreSQL", color: "blue" },
      { category: "API", name: "REST", color: "blue" },
      { category: "Messaging", name: "Kafka (publisher)", color: "purple" },
    ],
    endpoints: [
      {
        method: "POST",
        path: "/v1/promocodes/validate",
        description: "Validate a promo code — checks expiry, usage limits, product eligibility",
        request: `{
  "code": "SUMMER2024",
  "accountNumber": "BAN123",
  "productId": "prod_netflix_premium"
}`,
        response: `{
  "valid": true,
  "code": "SUMMER2024",
  "discount": { "type": "PERCENTAGE", "value": 20 },
  "validUntil": "2024-09-01T00:00:00Z",
  "remainingUses": 450
}`,
      },
      {
        method: "POST",
        path: "/v1/promocodes/redeem",
        description: "Redeem a validated promo code — decrements usage count, records redemption",
        request: `{
  "code": "SUMMER2024",
  "accountNumber": "BAN123",
  "orderId": "ord_abc123",
  "productId": "prod_netflix_premium"
}`,
        response: `{
  "redemptionId": "rdm_xyz789",
  "code": "SUMMER2024",
  "discount": { "type": "PERCENTAGE", "value": 20 },
  "appliedAt": "ISO-8601"
}`,
      },
      {
        method: "GET",
        path: "/v1/promocodes/:code",
        description: "Get promo code details — campaign info, usage stats, eligibility rules",
      },
      {
        method: "GET",
        path: "/v1/promocodes/account/:accountNumber",
        description: "List all promo codes redeemed by an account",
      },
    ],
    dataModel: [
      {
        entity: "promo_codes",
        description: "Promo code definitions — campaigns, discounts, eligibility rules",
        fields: [
          { name: "id", type: "UUID", note: "Primary key" },
          { name: "code", type: "VARCHAR(64)", note: "Unique promo code (uppercase)" },
          { name: "campaign_name", type: "VARCHAR(256)", note: "Marketing campaign identifier" },
          { name: "discount_type", type: "VARCHAR(16)", note: "PERCENTAGE | FIXED_AMOUNT | FREE_MONTHS" },
          { name: "discount_value", type: "DECIMAL(10,2)", note: "Discount amount or percentage" },
          { name: "max_uses", type: "INT", note: "Total redemption limit" },
          { name: "current_uses", type: "INT", note: "Current redemption count" },
          { name: "per_account_limit", type: "INT", note: "Max uses per account (default 1)" },
          { name: "product_restrictions", type: "JSONB", note: "List of eligible product IDs or categories" },
          { name: "starts_at", type: "TIMESTAMP", note: "Campaign start date" },
          { name: "expires_at", type: "TIMESTAMP", note: "Campaign end date" },
          { name: "stackable", type: "BOOLEAN", note: "Whether this code can be combined with others" },
          { name: "created_at", type: "TIMESTAMP" },
        ],
      },
      {
        entity: "redemptions",
        description: "Redemption records — tracks who used which code on which order",
        fields: [
          { name: "id", type: "UUID", note: "Primary key" },
          { name: "promo_code_id", type: "UUID", note: "FK to promo_codes" },
          { name: "account_number", type: "VARCHAR(64)" },
          { name: "order_id", type: "VARCHAR(128)", note: "FK to order in reseller-service" },
          { name: "product_id", type: "VARCHAR(128)" },
          { name: "discount_applied", type: "DECIMAL(10,2)" },
          { name: "redeemed_at", type: "TIMESTAMP" },
        ],
      },
    ],
    dependencies: [
      { service: "reseller-service", direction: "upstream", protocol: "REST", description: "Validates promo codes during qualification flow" },
      { service: "PostgreSQL", direction: "downstream", protocol: "SQL", description: "Promo code definitions and redemption records" },
      { service: "Kafka", direction: "downstream", protocol: "Async", description: "Publishes redemption events for analytics and async processing" },
    ],
    kafkaEvents: [
      { topic: "promo.code.redeemed", event: "PromoCodeRedeemed", direction: "publishes", description: "Emitted when a promo code is successfully redeemed" },
      { topic: "promo.code.expired", event: "PromoCodeExpired", direction: "publishes", description: "Emitted when a promo code reaches its expiry date" },
      { topic: "promo.campaign.created", event: "CampaignCreated", direction: "publishes", description: "Emitted when a new promo campaign is created" },
    ],
    errorPatterns: [
      { scenario: "Code not found", handling: "Returns 404 with PROMO_NOT_FOUND error code", retry: "None — client error" },
      { scenario: "Code expired", handling: "Returns 400 with PROMO_EXPIRED error code and expiry date", retry: "None — code is permanently expired" },
      { scenario: "Usage limit reached", handling: "Returns 400 with PROMO_EXHAUSTED error code", retry: "None — code fully redeemed" },
      { scenario: "Account already redeemed", handling: "Returns 409 Conflict with ALREADY_REDEEMED", retry: "None — per-account limit enforced" },
      { scenario: "Product not eligible", handling: "Returns 400 with PRODUCT_NOT_ELIGIBLE", retry: "None — code restricted to specific products" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas in production" },
      { aspect: "Database", description: "Amazon RDS PostgreSQL — row-level locking for atomic usage count updates" },
      { aspect: "Observability", description: "Structured JSON logging, redemption rate dashboard, campaign performance metrics" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [
      {
        title: "Atomic promo code redemption",
        description: "Uses PostgreSQL row-level locking to prevent race conditions on usage count updates",
        code: `func (r *PromoRepo) Redeem(ctx context.Context, tx *sql.Tx, code string, accountNum string) error {
    // Lock the row and check limits atomically
    var currentUses, maxUses, perAccountLimit int
    err := tx.QueryRowContext(ctx, \`
        SELECT current_uses, max_uses, per_account_limit
        FROM promo_codes
        WHERE code = $1
        FOR UPDATE
    \`, code).Scan(&currentUses, &maxUses, &perAccountLimit)
    if err != nil {
        return fmt.Errorf("lock promo: %w", err)
    }

    if currentUses >= maxUses {
        return ErrPromoExhausted
    }

    // Check per-account limit
    var accountUses int
    err = tx.QueryRowContext(ctx, \`
        SELECT COUNT(*) FROM redemptions
        WHERE promo_code_id = (SELECT id FROM promo_codes WHERE code = $1)
        AND account_number = $2
    \`, code, accountNum).Scan(&accountUses)
    if err != nil {
        return fmt.Errorf("check account: %w", err)
    }

    if accountUses >= perAccountLimit {
        return ErrAlreadyRedeemed
    }

    // Increment usage count
    _, err = tx.ExecContext(ctx, \`
        UPDATE promo_codes SET current_uses = current_uses + 1
        WHERE code = $1
    \`, code)
    return err
}`,
        language: "go",
      },
    ],
  },
};

export const promoredeemConsumer: ServiceDeepDive = {
  id: "promoredeem-consumer",
  name: "promoredeem-consumer",
  displayName: "Promo Redeem Consumer",
  status: "active",
  accentColor: "green",

  business: {
    purpose: "Processes promo redemption events from Kafka. Handles async post-redemption tasks including updating campaign analytics, sending redemption confirmations, and triggering follow-up marketing workflows.",
    domainContext: "After promocodes-api records a redemption synchronously, it publishes a PromoCodeRedeemed event to Kafka. promoredeem-consumer picks up this event and handles non-critical follow-up tasks that don't need to block the order flow.",
    flows: [
      { flowNum: "18", title: "Promo Codes", role: "Processes async redemption events — updates analytics, sends confirmations" },
    ],
    stakeholders: [
      "Marketing team (campaign analytics)",
      "promocodes-api (upstream — publishes redemption events)",
    ],
    consumers: [],
    businessRules: [
      {
        rule: "Idempotent processing",
        description: "Duplicate redemption events are handled gracefully — deduplication by redemptionId.",
        severity: "important",
      },
      {
        rule: "At-least-once delivery",
        description: "Kafka consumer uses manual commit to ensure events are not lost. Duplicate processing is safe due to idempotency.",
        severity: "important",
      },
    ],
    sla: {
      availability: "99.9%",
      latencyP99: "< 500ms (event processing)",
      notes: "Event-driven — no direct API calls. Processing delays don't impact the customer flow.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Messaging", name: "Kafka (consumer)", color: "purple" },
    ],
    endpoints: [],
    dataModel: [],
    dependencies: [
      { service: "Kafka", direction: "upstream", protocol: "Consumer", description: "Consumes promo.code.redeemed events" },
      { service: "PostgreSQL", direction: "downstream", protocol: "SQL", description: "Updates campaign analytics tables" },
    ],
    kafkaEvents: [
      { topic: "promo.code.redeemed", event: "PromoCodeRedeemed", direction: "consumes", description: "Processes redemption events for analytics and follow-up" },
    ],
    errorPatterns: [
      { scenario: "Processing failure", handling: "Retries 3 times, then sends to DLQ", retry: "Exponential backoff (1s, 2s, 4s)" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas in production" },
      { aspect: "Messaging", description: "Kafka consumer group — manual commit, at-least-once delivery" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [],
  },
};

export const promostreamConsumer: ServiceDeepDive = {
  id: "promostream-consumer",
  name: "promostream-consumer",
  displayName: "Promo Stream Consumer",
  status: "active",
  accentColor: "green",

  business: {
    purpose: "Streams promotional events to the analytics pipeline. Consumes all promo-related Kafka events (redemptions, campaign changes, expirations) and forwards them to the data warehouse for reporting and campaign performance analysis.",
    domainContext: "The marketing team needs real-time and historical data on promo campaign performance. promostream-consumer bridges the operational Kafka topics and the analytics data warehouse, transforming events into a format suitable for BI tools.",
    flows: [],
    stakeholders: [
      "Data analytics team (consumes streamed data)",
      "Marketing team (campaign performance dashboards)",
    ],
    consumers: [],
    businessRules: [
      {
        rule: "Lossless streaming",
        description: "All promo events must be forwarded to the analytics pipeline. No filtering or sampling — the data warehouse handles aggregation.",
        severity: "critical",
      },
    ],
    sla: {
      availability: "99.9%",
      latencyP99: "< 1s (event forwarding)",
      notes: "Streaming latency is acceptable — analytics queries run on near-real-time data (< 1 minute lag).",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Messaging", name: "Kafka (consumer)", color: "purple" },
      { category: "Analytics", name: "S3 / Athena", color: "amber" },
    ],
    endpoints: [],
    dataModel: [],
    dependencies: [
      { service: "Kafka", direction: "upstream", protocol: "Consumer", description: "Consumes all promo.* topics" },
      { service: "S3", direction: "downstream", protocol: "AWS SDK", description: "Writes transformed events to S3 for Athena queries" },
    ],
    kafkaEvents: [
      { topic: "promo.code.redeemed", event: "PromoCodeRedeemed", direction: "consumes", description: "Streams redemption events to analytics" },
      { topic: "promo.code.expired", event: "PromoCodeExpired", direction: "consumes", description: "Streams expiration events to analytics" },
      { topic: "promo.campaign.created", event: "CampaignCreated", direction: "consumes", description: "Streams new campaign events to analytics" },
    ],
    errorPatterns: [
      { scenario: "S3 write failure", handling: "Buffers events in memory, retries with backoff", retry: "5 retries with exponential backoff" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 1 replica in production (stateless)" },
      { aspect: "Storage", description: "S3 bucket with Parquet format for cost-efficient analytics queries" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [],
  },
};

export const promoMigrationConsumer: ServiceDeepDive = {
  id: "promo-migration-consumer",
  name: "promo-migration-consumer",
  displayName: "Promo Migration Consumer",
  status: "active",
  accentColor: "green",

  business: {
    purpose: "Handles promo data migrations between the legacy and current promo systems. Consumes migration events from Kafka and ensures promo codes, campaigns, and redemption history are correctly transferred to the new schema.",
    domainContext: "During the migration from the legacy promo system to promocodes-api, promo-migration-consumer was built to handle the gradual data transfer. It continues to run for ongoing sync between systems during the transition period.",
    flows: [],
    stakeholders: [
      "promocodes-api (receives migrated data)",
      "Legacy promo system (source of migration events)",
    ],
    consumers: [],
    businessRules: [
      {
        rule: "Idempotent migration",
        description: "Migration events can be replayed without creating duplicates. Uses upsert semantics on promo code records.",
        severity: "critical",
      },
      {
        rule: "Validation on import",
        description: "Migrated promo codes are validated against current schema rules before insertion. Invalid codes are logged and skipped.",
        severity: "important",
      },
    ],
    sla: {
      availability: "99.9%",
      latencyP99: "< 2s (migration event processing)",
      notes: "Migration is a background process — latency is not customer-facing.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Messaging", name: "Kafka (consumer)", color: "purple" },
      { category: "Database", name: "PostgreSQL", color: "blue" },
    ],
    endpoints: [],
    dataModel: [],
    dependencies: [
      { service: "Kafka", direction: "upstream", protocol: "Consumer", description: "Consumes promo.migration.* events from legacy system" },
      { service: "PostgreSQL", direction: "downstream", protocol: "SQL", description: "Writes migrated promo data to promocodes-api schema" },
    ],
    kafkaEvents: [
      { topic: "promo.migration.code", event: "MigratePromoCode", direction: "consumes", description: "Migrates a promo code definition from legacy system" },
      { topic: "promo.migration.redemption", event: "MigrateRedemption", direction: "consumes", description: "Migrates redemption history from legacy system" },
    ],
    errorPatterns: [
      { scenario: "Schema mismatch", handling: "Logs validation error, skips record, continues processing", retry: "None — requires manual data fix" },
      { scenario: "Duplicate record", handling: "Upsert semantics — updates existing record if present", retry: "None — idempotent" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 1 replica in production" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [],
  },
};

export const promotionsServices: ServiceDeepDive[] = [promocodesApi, promoredeemConsumer, promostreamConsumer, promoMigrationConsumer];
