import type { ServiceDeepDive } from "./types";

export const catalogApi: ServiceDeepDive = {
  id: "catalog",
  name: "catalog-api",
  displayName: "Catalog API",
  status: "active",
  accentColor: "amber",

  business: {
    purpose: "Serves product offerings, marketing offers, and categories to the subscription management platform. Uses GraphQL (gqlgen) with Redis caching for sub-millisecond reads. Re-queried on every plan selection during the qualification flow to ensure eligibility data is always fresh.",
    domainContext: "catalog-api is the product truth source for the qualification flow. Every time a customer or agent selects a plan, reseller-service calls catalog-api to validate eligibility and fetch plan details. The Redis cache is kept warm by catalog-manager, which consumes product update events from Kafka.",
    flows: [
      { flowNum: "4", title: "Check Eligibility", role: "Returns eligible plans and pricing for the selected account via subscriptionQualification" },
      { flowNum: "7", title: "Cancel Subscription", role: "Re-qualifies account eligibility when cancel operation fires" },
      { flowNum: "8", title: "Agent-Assisted", role: "Same qualification path — catalog-api is unaware of customer vs agent context" },
      { flowNum: "9", title: "Plan Change", role: "Re-qualifies with new plan details during APPLY_TO_ORDER" },
      { flowNum: "13", title: "Undo / Reversal", role: "Validates plan eligibility for REVERSE_* operations" },
      { flowNum: "18", title: "Promo Codes", role: "Provides plan data used by promocodes-rtv-api for real-time promo validation" },
    ],
    stakeholders: [
      "reseller-service (primary consumer — qualification calls)",
      "AppSync (GraphQL resolver)",
      "catalog-manager (writes Redis cache)",
      "Subscription Management UI (indirectly — via qualification results)",
    ],
    consumers: [
      "AppSync → catalog-api (GraphQL resolver for product queries)",
      "reseller-service → catalog-api (qualification lookups)",
      "promocodes-rtv-api → catalog-api (promo eligibility checks)",
    ],
    businessRules: [
      {
        rule: "Redis-first reads",
        description: "All product queries hit Redis first. PostgreSQL is the fallback if Redis is cold or unavailable. Cache miss triggers async Redis population.",
        severity: "critical",
      },
      {
        rule: "Account-type eligibility",
        description: "Eligibility varies by account type (residential, business, employee). catalog-api filters products based on the account's entitlement profile.",
        severity: "critical",
      },
      {
        rule: "Real-time price freshness",
        description: "Prices and promotions must reflect the latest catalog state. catalog-manager updates Redis within seconds of product changes in product-catalog-api.",
        severity: "important",
      },
      {
        rule: "Marketing offer windows",
        description: "Marketing offers have start/end dates. catalog-api filters expired offers and returns only currently active promotions.",
        severity: "standard",
      },
    ],
    sla: {
      availability: "99.95%",
      latencyP99: "< 50ms (Redis hit), < 200ms (cache miss + PostgreSQL fallback)",
      notes: "Must be fast — fires on every plan selection during customer browsing. Redis hit rate target: > 99%.",
    },
  },

  technical: {
    techStack: [
      { category: "Framework", name: "gqlgen", color: "purple" },
      { category: "API", name: "GraphQL", color: "purple" },
      { category: "Cache", name: "Redis", color: "coral" },
      { category: "Database", name: "PostgreSQL (fallback)", color: "blue" },
      { category: "Language", name: "Go", color: "teal" },
      { category: "Gateway", name: "AppSync", color: "blue" },
    ],
    endpoints: [
      {
        method: "POST",
        path: "/query (GraphQL)",
        description: "Product catalog queries — offerings, categories, marketing offers",
        request: `query {
  offerings(accountType: "RESIDENTIAL") {
    id
    name
    price
    billingCycle
    category
    provider { id name }
    promotions { code discount validUntil }
  }
}`,
        response: `{
  "data": {
    "offerings": [
      {
        "id": "prod_netflix_premium",
        "name": "Netflix Premium",
        "price": 22.99,
        "billingCycle": "MONTHLY",
        "category": "STREAMING",
        "provider": { "id": "netflix", "name": "Netflix" },
        "promotions": []
      }
    ]
  }
}`,
      },
      {
        method: "POST",
        path: "/query (GraphQL)",
        description: "Qualification query — returns eligible plans for a specific account",
        request: `query {
  qualifiedOfferings(
    accountNumber: "BAN123"
    operationType: APPLY_TO_ORDER
  ) {
    eligible
    offerings { id name price }
    restrictions { reason code }
  }
}`,
      },
    ],
    dataModel: [
      {
        entity: "products (Redis)",
        description: "Cached product catalog — key per product ID, refreshed by catalog-manager",
        fields: [
          { name: "key", type: "STRING", note: "product:<productId>" },
          { name: "value", type: "JSON", note: "Full product object including pricing, provider, category" },
          { name: "ttl", type: "INT", note: "No TTL — evicted only by catalog-manager updates" },
        ],
      },
      {
        entity: "offerings (Redis)",
        description: "Pre-computed eligible offerings per account type",
        fields: [
          { name: "key", type: "STRING", note: "offerings:<accountType>" },
          { name: "value", type: "JSON[]", note: "Array of eligible product IDs with pricing" },
        ],
      },
    ],
    dependencies: [
      { service: "AppSync", direction: "upstream", protocol: "GraphQL", description: "Product queries via AppSync resolvers" },
      { service: "reseller-service", direction: "upstream", protocol: "GraphQL", description: "Qualification lookups during order submission" },
      { service: "Redis", direction: "downstream", protocol: "Redis", description: "Primary cache — all reads hit Redis first" },
      { service: "PostgreSQL", direction: "downstream", protocol: "SQL", description: "Fallback when Redis is cold; catalog-manager populates Redis from PostgreSQL" },
    ],
    kafkaEvents: [],
    errorPatterns: [
      { scenario: "Redis unavailable", handling: "Falls back to PostgreSQL — slower but functional. Logs warning for ops team.", retry: "Automatic reconnect via Redis client" },
      { scenario: "Cache miss", handling: "Reads from PostgreSQL, populates Redis asynchronously", retry: "None — transparent to caller" },
      { scenario: "Invalid account type", handling: "Returns empty offerings list with restriction reason", retry: "None — client error" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 3 replicas in production" },
      { aspect: "Cache", description: "Amazon ElastiCache Redis — cluster mode, automatic failover" },
      { aspect: "Database", description: "Amazon RDS PostgreSQL — read replica for fallback queries" },
      { aspect: "Observability", description: "Structured JSON logging, Redis hit rate dashboard, cache miss alerts" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [
      {
        title: "Redis-first read with PostgreSQL fallback",
        description: "All queries attempt Redis first, falling back to PostgreSQL with async cache population",
        code: `func (r *CatalogRepo) GetOfferings(ctx context.Context, accountType string) ([]Offering, error) {
    key := "offerings:" + accountType

    // Try Redis first
    data, err := r.redis.Get(ctx, key).Bytes()
    if err == nil {
        var offerings []Offering
        if err := json.Unmarshal(data, &offerings); err == nil {
            return offerings, nil
        }
    }

    // Fallback to PostgreSQL
    offerings, err := r.db.QueryOfferings(ctx, accountType)
    if err != nil {
        return nil, fmt.Errorf("query offerings: %w", err)
    }

    // Async cache population
    go r.populateCache(ctx, key, offerings)

    return offerings, nil
}`,
        language: "go",
      },
    ],
  },
};

export const catalogManager: ServiceDeepDive = {
  id: "catalog-manager",
  name: "catalog-manager",
  displayName: "Catalog Manager",
  status: "active",
  accentColor: "amber",

  business: {
    purpose: "Keeps the Redis cache in catalog-api fresh by consuming real-time product update events from Kafka. When products are created, updated, or deleted in product-catalog-api, catalog-manager receives the event and updates the corresponding Redis keys.",
    domainContext: "catalog-manager bridges the gap between the product master data (in product-catalog-api's PostgreSQL) and the high-speed cache (catalog-api's Redis). Without it, catalog-api would serve stale product data.",
    flows: [
      { flowNum: "4", title: "Check Eligibility (indirect)", role: "Ensures catalog-api Redis cache has the latest product data before qualification" },
    ],
    stakeholders: [
      "catalog-api (downstream — receives fresh Redis data)",
      "product-catalog-api (upstream — publishes product events)",
    ],
    consumers: [],
    businessRules: [
      {
        rule: "Real-time cache sync",
        description: "Product updates must be reflected in Redis within 5 seconds of the Kafka event. SLA is monitored via Datadog.",
        severity: "critical",
      },
      {
        rule: "Idempotent updates",
        description: "Duplicate Kafka events are handled gracefully — Redis SET is inherently idempotent.",
        severity: "standard",
      },
    ],
    sla: {
      availability: "99.9%",
      latencyP99: "< 100ms (event processing)",
      notes: "Event-driven — no direct API calls. Availability tied to Kafka consumer health.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Messaging", name: "Kafka (consumer)", color: "purple" },
      { category: "Cache", name: "Redis (writer)", color: "coral" },
    ],
    endpoints: [],
    dataModel: [],
    dependencies: [
      { service: "Kafka", direction: "upstream", protocol: "Consumer", description: "Consumes product.updated, product.created, product.deleted events" },
      { service: "Redis", direction: "downstream", protocol: "Redis", description: "Writes updated product data to catalog-api's Redis cache" },
    ],
    kafkaEvents: [
      { topic: "product.created", event: "ProductCreated", direction: "consumes", description: "New product added — writes to Redis" },
      { topic: "product.updated", event: "ProductUpdated", direction: "consumes", description: "Product modified — updates Redis key" },
      { topic: "product.deleted", event: "ProductDeleted", direction: "consumes", description: "Product removed — deletes Redis key" },
    ],
    errorPatterns: [
      { scenario: "Redis write failure", handling: "Retries with exponential backoff; event stays in Kafka until acknowledged", retry: "3 retries, then DLQ" },
      { scenario: "Malformed event", handling: "Logs error, skips event, publishes to DLQ for manual review", retry: "None — requires manual fix" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas in production" },
      { aspect: "Messaging", description: "Kafka consumer group with auto-commit disabled for at-least-once delivery" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [],
  },
};

export const productCatalogApi: ServiceDeepDive = {
  id: "product-catalog",
  name: "product-catalog-api",
  displayName: "Product Catalog API",
  status: "active",
  accentColor: "amber",

  business: {
    purpose: "Product master data service — the source of truth for all product definitions, pricing, categories, and provider mappings. Admin-facing CRUD API used by the product management team to manage the catalog. Publishes product events to Kafka on every change.",
    domainContext: "product-catalog-api is the write-side of the catalog domain. It stores the canonical product data in PostgreSQL and publishes events that catalog-manager uses to update Redis. The subscription UI never calls product-catalog-api directly — it reads from catalog-api's Redis cache.",
    flows: [],
    stakeholders: [
      "Product management team (admin CRUD operations)",
      "catalog-manager (consumes product events via Kafka)",
      "catalog-api (indirectly — receives data via Redis)",
    ],
    consumers: [
      "Admin portal (direct REST API calls)",
    ],
    businessRules: [
      {
        rule: "Event publishing on change",
        description: "Every create, update, or delete operation publishes a Kafka event for catalog-manager to consume.",
        severity: "critical",
      },
      {
        rule: "Price validation",
        description: "Product prices must be positive. Billing cycles must be MONTHLY or ANNUAL. Provider IDs must reference a valid merchant-api.",
        severity: "important",
      },
    ],
    sla: {
      availability: "99.9%",
      latencyP99: "< 300ms",
      notes: "Admin-facing — lower traffic volume than customer-facing services. Availability is important for catalog updates.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Database", name: "PostgreSQL", color: "blue" },
      { category: "Messaging", name: "Kafka (publisher)", color: "purple" },
      { category: "API", name: "REST", color: "blue" },
    ],
    endpoints: [
      { method: "GET", path: "/products", description: "List all products with pagination and filtering" },
      { method: "POST", path: "/products", description: "Create a new product — publishes ProductCreated event" },
      { method: "PUT", path: "/products/:id", description: "Update product details — publishes ProductUpdated event" },
      { method: "DELETE", path: "/products/:id", description: "Soft-delete product — publishes ProductDeleted event" },
    ],
    dataModel: [
      {
        entity: "products",
        description: "Product master data — pricing, categories, provider mappings",
        fields: [
          { name: "id", type: "VARCHAR(128)", note: "Primary key (e.g., prod_netflix_premium)" },
          { name: "name", type: "VARCHAR(256)" },
          { name: "description", type: "TEXT" },
          { name: "price", type: "DECIMAL(10,2)" },
          { name: "billing_cycle", type: "VARCHAR(16)", note: "MONTHLY | ANNUAL" },
          { name: "category", type: "VARCHAR(64)", note: "STREAMING | SPORTS | NEWS" },
          { name: "provider_id", type: "VARCHAR(64)", note: "FK to merchant (netflix, disney, etc.)" },
          { name: "active", type: "BOOLEAN", note: "Soft-delete flag" },
          { name: "created_at", type: "TIMESTAMP" },
          { name: "updated_at", type: "TIMESTAMP" },
        ],
      },
    ],
    dependencies: [
      { service: "PostgreSQL", direction: "downstream", protocol: "SQL", description: "Primary data store for product master data" },
      { service: "Kafka", direction: "downstream", protocol: "Async", description: "Publishes product events for catalog-manager" },
    ],
    kafkaEvents: [
      { topic: "product.created", event: "ProductCreated", direction: "publishes", description: "New product added to catalog" },
      { topic: "product.updated", event: "ProductUpdated", direction: "publishes", description: "Product details modified" },
      { topic: "product.deleted", event: "ProductDeleted", direction: "publishes", description: "Product soft-deleted from catalog" },
    ],
    errorPatterns: [
      { scenario: "Duplicate product ID", handling: "Returns 409 Conflict", retry: "None — client error" },
      { scenario: "Invalid provider reference", handling: "Returns 400 — provider_id must match a known merchant", retry: "None — client error" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas in production" },
      { aspect: "Database", description: "Amazon RDS PostgreSQL — shared cluster" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [],
  },
};

export const catalogProductsServices: ServiceDeepDive[] = [catalogApi, catalogManager, productCatalogApi];
