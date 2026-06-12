export interface ServiceInfo {
  name: string;
  description: string;
  tech: string;
}

export interface ServiceGroup {
  id: string;
  name: string;
  color: string;
  services: ServiceInfo[];
}

export const serviceGroups: ServiceGroup[] = [
  {
    id: "core",
    name: "Core Subscription",
    color: "#e8a83a",
    services: [
      { name: "reseller-service", description: "Primary CRUD, orchestrates orders, provisions merchants", tech: "Gin, PostgreSQL, Kafka" },
      { name: "subscriber-manager-api", description: "Manages subscriber lifecycle and account linking", tech: "Go, PostgreSQL" },
      { name: "subscription-configurator-api", description: "Configures subscription rules and policies", tech: "Go, PostgreSQL" },
      { name: "subscriptions-aggregator-api", description: "REST read-only, merges PostgreSQL + CPM data", tech: "Go, PostgreSQL" },
      { name: "subscription-consumer", description: "Processes subscription events from Kafka", tech: "Go, Kafka" },
    ],
  },
  {
    id: "merchants",
    name: "Merchants",
    color: "#6b7590",
    services: [
      { name: "merchant-api-bango-v1", description: "Bango aggregation platform provisioning", tech: "Go, REST" },
      { name: "merchant-api-netflix", description: "Netflix subscription provisioning", tech: "Go, REST" },
      { name: "merchant-api-disney", description: "Disney+ subscription provisioning", tech: "Go, REST" },
      { name: "merchant-api-bellmedia", description: "Bell Media content provisioning", tech: "Go, REST" },
      { name: "merchant-api-radiocanada", description: "Radio Canada content provisioning", tech: "Go, REST" },
    ],
  },
  {
    id: "catalog",
    name: "Catalog & Products",
    color: "#e8a83a",
    services: [
      { name: "catalog-api", description: "Product offerings, marketing offers, categories", tech: "gqlgen, Redis" },
      { name: "catalog-manager", description: "Keeps Redis fresh via real-time product events", tech: "Go, Kafka, Redis" },
      { name: "product-catalog-api", description: "Product master data and catalog management", tech: "Go, PostgreSQL" },
    ],
  },
  {
    id: "auth",
    name: "Auth & Session",
    color: "#e8705a",
    services: [
      { name: "auth-api", description: "OAuth2 / Cognito / Auth0 token issuance", tech: "Go, Cognito" },
      { name: "session-api", description: "Session lifecycle: create, clone, expire", tech: "Go, DynamoDB" },
      { name: "token-api", description: "Tokenizes sensitive JSON payloads (24h TTL)", tech: "Go, Redis" },
      { name: "disney-auth-api", description: "Disney-specific authentication integration", tech: "Go, REST" },
    ],
  },
  {
    id: "promos",
    name: "Promotions",
    color: "#58b87a",
    services: [
      { name: "promocodes-api", description: "Promo code validation and redemption", tech: "Go, PostgreSQL" },
      { name: "promoredeem-consumer", description: "Processes promo redemption events", tech: "Go, Kafka" },
      { name: "promostream-consumer", description: "Streams promotional events for analytics", tech: "Go, Kafka" },
      { name: "promo-migration-consumer", description: "Handles promo data migrations", tech: "Go, Kafka" },
    ],
  },
  {
    id: "events",
    name: "Events & Messaging",
    color: "#4a8fe8",
    services: [
      { name: "event-hub", description: "Central event routing and distribution", tech: "Go, Kafka" },
      { name: "event-publisher", description: "Publishes domain events to Kafka topics", tech: "Go, Kafka" },
      { name: "notification-consumer", description: "Processes notification events (email, SMS)", tech: "Go, Kafka" },
      { name: "subscription-consumer", description: "Processes subscription lifecycle events", tech: "Go, Kafka" },
    ],
  },
  {
    id: "orders",
    name: "Orders & Billing",
    color: "#e8a83a",
    services: [
      { name: "order-api", description: "Order management and tracking", tech: "Go, PostgreSQL" },
      { name: "core-processor-api", description: "Core business logic processing", tech: "Go, PostgreSQL" },
      { name: "audit-api", description: "Logs all significant actions for compliance", tech: "Go, PostgreSQL" },
    ],
  },
  {
    id: "flow",
    name: "Flow & Orchestration",
    color: "#7c6fcd",
    services: [
      { name: "flow-runner-api", description: "Orchestrates multi-step business flows", tech: "Go, DynamoDB" },
      { name: "household-api", description: "Wraps CPM, returns equipment & account data", tech: "gqlgen, CPM" },
      { name: "account-recovery-api", description: "Handles account recovery workflows", tech: "Go, PostgreSQL" },
    ],
  },
  {
    id: "serverless",
    name: "Serverless (Lambda)",
    color: "#3eb89a",
    services: [
      { name: "subscription-event-lambda", description: "Processes subscription events", tech: "Go, Lambda" },
      { name: "notification-lambda", description: "Sends notifications via SNS/SES", tech: "Go, Lambda" },
      { name: "catalog-sync-lambda", description: "Syncs catalog data across systems", tech: "Go, Lambda" },
      { name: "order-processor-lambda", description: "Async order processing pipeline", tech: "Go, Lambda" },
      { name: "audit-stream-lambda", description: "Streams audit logs to analytics", tech: "Go, Lambda" },
      { name: "promo-validator-lambda", description: "Real-time promo code validation", tech: "Go, Lambda" },
      { name: "session-cleanup-lambda", description: "Cleans up expired DynamoDB sessions", tech: "Go, Lambda" },
      { name: "merchant-callback-lambda", description: "Handles async merchant callbacks", tech: "Go, Lambda" },
      { name: "event-transformer-lambda", description: "Transforms events between formats", tech: "Go, Lambda" },
      { name: "billing-sync-lambda", description: "Syncs billing data with external systems", tech: "Go, Lambda" },
      { name: "account-link-lambda", description: "Links customer accounts across providers", tech: "Go, Lambda" },
      { name: "report-generator-lambda", description: "Generates operational reports", tech: "Go, Lambda" },
      { name: "data-export-lambda", description: "Exports data for compliance/analytics", tech: "Go, Lambda" },
      { name: "health-check-lambda", description: "Service health monitoring", tech: "Go, Lambda" },
      { name: "config-sync-lambda", description: "Syncs configuration across environments", tech: "Go, Lambda" },
      { name: "rate-limiter-lambda", description: "API rate limiting at edge", tech: "Go, Lambda" },
      { name: "cache-warmer-lambda", description: "Pre-warms Redis caches", tech: "Go, Lambda" },
      { name: "retry-handler-lambda", description: "Handles failed event retries", tech: "Go, Lambda" },
      { name: "dlq-processor-lambda", description: "Processes dead-letter queue messages", tech: "Go, Lambda" },
      { name: "metric-aggregator-lambda", description: "Aggregates custom CloudWatch metrics", tech: "Go, Lambda" },
      { name: "feature-flag-sync-lambda", description: "Syncs feature flags from Unleash", tech: "Go, Lambda" },
      { name: "schema-validator-lambda", description: "Validates GraphQL schema changes", tech: "Go, Lambda" },
      { name: "secret-rotator-lambda", description: "Rotates secrets in Secrets Manager", tech: "Go, Lambda" },
      { name: "log-archiver-lambda", description: "Archives logs to S3 Glacier", tech: "Go, Lambda" },
      { name: "deployment-notifier-lambda", description: "Notifies Slack on deployments", tech: "Go, Lambda" },
      { name: "cost-tracker-lambda", description: "Tracks AWS cost per service", tech: "Go, Lambda" },
      { name: "backup-lambda", description: "Automated DynamoDB/RDS backups", tech: "Go, Lambda" },
      { name: "migration-lambda", description: "Runs database migrations", tech: "Go, Lambda" },
      { name: "cleanup-lambda", description: "General resource cleanup", tech: "Go, Lambda" },
    ],
  },
  {
    id: "infra",
    name: "Infrastructure",
    color: "#9aa0b4",
    services: [
      { name: "http-proxy-api", description: "HTTP proxy for legacy system integration", tech: "Go, REST" },
      { name: "email-api", description: "Email sending via SES", tech: "Go, SES" },
      { name: "policy-rule-configurator", description: "Configures business policy rules", tech: "Go, PostgreSQL" },
    ],
  },
];

// Connections between groups (for visual reference)
export const groupConnections: [string, string][] = [
  ["core", "merchants"],
  ["core", "catalog"],
  ["core", "events"],
  ["core", "orders"],
  ["auth", "core"],
  ["flow", "core"],
  ["promos", "core"],
  ["serverless", "events"],
  ["serverless", "core"],
];
