import type { ServiceDeepDive } from "./types";

export const subscriptionManagerApi: ServiceDeepDive = {
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
