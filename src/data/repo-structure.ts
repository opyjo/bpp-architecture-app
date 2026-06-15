// ── Types ──────────────────────────────────────────────────

export interface RepoNode {
  id: string;
  name: string;
  type: "dir" | "service" | "serverless" | "package" | "model" | "cli" | "poc" | "test" | "doc";
  color: string;          // arch-* CSS var value
  description: string;
  analogy: string;        // beginner-friendly metaphor
  children?: RepoNode[];
  tech?: string[];        // technology tags
}

export interface RepoDomain {
  id: string;
  name: string;
  color: string;
  services: string[];     // service IDs belonging to this domain
}

export interface RepoTourStep {
  id: string;
  title: string;
  narration: string;
  analogy: string;
  highlightNodes: string[];       // node IDs to highlight
  highlightEdges?: [string, string][];  // [from, to] pairs
  zoomTarget?: string;            // node ID to zoom into
  whatsInside?: string[];         // listing of what's inside
}

export interface ServiceTypePattern {
  type: string;
  description: string;
  files: string[];
}

export interface RepoEdge {
  from: string;
  to: string;
  label?: string;
}

// ── Color Constants ────────────────────────────────────────

const CORAL  = "var(--arch-coral)";
const BLUE   = "var(--arch-blue)";
const PURPLE = "var(--arch-purple)";
const TEAL   = "var(--arch-teal)";
const AMBER  = "var(--arch-amber)";
const GREEN  = "var(--arch-green)";
const GRAY   = "var(--arch-gray)";
const GREEN2 = "var(--arch-green)";

// ── Top-Level Repo Tree ────────────────────────────────────

export const repoTree: RepoNode[] = [
  {
    id: "cmd",
    name: "cmd/",
    type: "dir",
    color: CORAL,
    description: "CLI entry points — each sub-directory is a main package that compiles to a binary. They parse flags, set up config, and call into services/ or pkg/.",
    analogy: "Switches you flip to start machines — each one boots a different part of the system.",
    children: [
      { id: "cmd-codegen", name: "codegen", type: "cli", color: CORAL, description: "Code generator for boilerplate service scaffolding", analogy: "The blueprint printer that creates new service templates", tech: ["Go", "Templates"] },
      { id: "cmd-dynamodb-backfill", name: "dynamodb-backfill", type: "cli", color: CORAL, description: "Backfills DynamoDB tables with missing or updated data", analogy: "The clerk who fills in missing records in the filing cabinet", tech: ["DynamoDB", "AWS"] },
      { id: "cmd-edw-importer", name: "edw-importer(decom)", type: "cli", color: CORAL, description: "Enterprise Data Warehouse importer (decommissioned)", analogy: "A retired loading dock that once brought in warehouse data", tech: ["EDW", "SQL"] },
      { id: "cmd-product-catalog-importer", name: "product-catalog-importer", type: "cli", color: CORAL, description: "Imports product catalog data from external sources", analogy: "The receiving dock for product catalog shipments", tech: ["S3", "DynamoDB"] },
      { id: "cmd-promocode-ordermax-exporter", name: "promocode-ordermax-exporter", type: "cli", color: CORAL, description: "Exports promo code order max data for reporting", analogy: "The report printer for promo code usage limits", tech: ["CSV", "S3"] },
      { id: "cmd-promocode-rtv-releaser", name: "promocode-rtv-releaser", type: "cli", color: CORAL, description: "Releases ready-to-validate promo codes back into the pool", analogy: "The recycling machine that puts unused coupons back on the shelf", tech: ["DynamoDB"] },
      { id: "cmd-promocodes-inactivator", name: "promocodes-inactivator", type: "cli", color: CORAL, description: "Bulk inactivates expired or invalid promo codes", analogy: "The expiration-date checker pulling old coupons off the rack", tech: ["DynamoDB", "Batch"] },
      { id: "cmd-promocodes-reconciler", name: "promocodes-reconciler", type: "cli", color: CORAL, description: "Reconciles promo code state across systems", analogy: "The auditor who cross-checks coupon records between offices", tech: ["DynamoDB", "S3"] },
      { id: "cmd-runflow", name: "runflow", type: "cli", color: CORAL, description: "Runs flow engine pipelines from the command line", analogy: "The master switch that triggers automated workflows", tech: ["Flow Engine"] },
    ],
  },
  {
    id: "services",
    name: "services/",
    type: "dir",
    color: BLUE,
    description: "The core business logic — 58 service packages, each owning a specific domain. Services expose REST/gRPC interfaces and depend on pkg/ for shared utilities and model/ for data types.",
    analogy: "58 specialist departments running 24/7 — each one owns a slice of the business.",
    children: [
      { id: "svc-api-doc", name: "api-doc", type: "service", color: BLUE, description: "Centralized API documentation service", analogy: "The reference library where all API manuals are kept", tech: ["OpenAPI", "Swagger"] },
      { id: "svc-apigee-deployment-crd", name: "apigee-deployment-crd", type: "service", color: BLUE, description: "Kubernetes CRD for Apigee API gateway deployments", analogy: "The deployment blueprint for the front gate", tech: ["Kubernetes", "Apigee"] },
      { id: "svc-audit-api", name: "audit-api", type: "service", color: BLUE, description: "Audit trail logging for compliance and tracking", analogy: "The security camera archive recording every action", tech: ["REST", "DynamoDB"] },
      { id: "svc-auth-api", name: "auth-api", type: "service", color: BLUE, description: "Authentication and token management", analogy: "The security badge office that verifies your identity", tech: ["JWT", "OAuth2"] },
      { id: "svc-bulk-order-import", name: "bulk-order-import", type: "service", color: BLUE, description: "Handles bulk order imports from external sources", analogy: "The receiving dock for large order shipments", tech: ["S3", "SQS"] },
      { id: "svc-catalog-api", name: "catalog-api", type: "service", color: BLUE, description: "Product catalog read/search API", analogy: "The product showroom where customers browse", tech: ["REST", "DynamoDB"] },
      { id: "svc-catalog-manager", name: "catalog-manager", type: "service", color: BLUE, description: "Product catalog management and administration", analogy: "The showroom manager who arranges and updates displays", tech: ["REST", "DynamoDB"] },
      { id: "svc-contracts-api", name: "contracts-api", type: "service", color: BLUE, description: "Manages customer and partner contracts", analogy: "The legal office handling agreements", tech: ["REST", "DynamoDB"] },
      { id: "svc-core-processor-api-v1", name: "core-processor-api-v1", type: "service", color: BLUE, description: "Core business process orchestration engine", analogy: "The central control room coordinating all departments", tech: ["REST", "Kafka"] },
      { id: "svc-customer-contract-agreements-consumer", name: "customer-contract-agreements-consumer", type: "service", color: BLUE, description: "Consumes and processes customer contract agreement events", analogy: "The clerk who files signed agreements", tech: ["Kafka", "DynamoDB"] },
      { id: "svc-customer-profile-api", name: "customer-profile-api", type: "service", color: BLUE, description: "Customer profile management and lookup", analogy: "The customer records department", tech: ["REST", "DynamoDB"] },
      { id: "svc-disney-auth-api", name: "disney-auth-api", type: "service", color: BLUE, description: "Disney-specific authentication integration", analogy: "The special VIP badge office for Disney partners", tech: ["OAuth2", "REST"] },
      { id: "svc-email-api", name: "email-api", type: "service", color: BLUE, description: "Email template rendering and delivery", analogy: "The mailroom that formats and sends letters", tech: ["SES", "REST"] },
      { id: "svc-event-hub", name: "event-hub", type: "service", color: BLUE, description: "Central event routing and distribution hub", analogy: "The central switchboard routing messages to the right department", tech: ["Kafka", "REST"] },
      { id: "svc-event-publisher", name: "event-publisher", type: "service", color: BLUE, description: "Publishes domain events to Kafka topics", analogy: "The PA system broadcasting announcements company-wide", tech: ["Kafka", "REST"] },
      { id: "svc-flow-runner-api", name: "flow-runner-api", type: "service", color: BLUE, description: "Executes configurable business process flows", analogy: "The assembly line that follows workflow blueprints", tech: ["REST", "Flow Engine"] },
      { id: "svc-gen-promocodes-api", name: "gen-promocodes-api", type: "service", color: BLUE, description: "Generates new promotional codes in bulk", analogy: "The coupon printing press", tech: ["REST", "DynamoDB"] },
      { id: "svc-household-api", name: "household-api", type: "service", color: BLUE, description: "Manages household groupings and family accounts", analogy: "The family plan coordinator", tech: ["REST", "DynamoDB"] },
      { id: "svc-http-proxy-api", name: "http-proxy-api", type: "service", color: BLUE, description: "HTTP proxy for routing requests to backend services", analogy: "The receptionist who directs visitors to the right office", tech: ["HTTP", "Proxy"] },
      { id: "svc-membership-api", name: "membership-api", type: "service", color: BLUE, description: "Membership lifecycle management", analogy: "The membership card office", tech: ["REST", "DynamoDB"] },
      { id: "svc-membership-event-consumer", name: "membership-event-consumer", type: "service", color: BLUE, description: "Consumes membership lifecycle events", analogy: "The clerk who updates records when memberships change", tech: ["Kafka", "DynamoDB"] },
      { id: "svc-merchant-api-bango-v1", name: "merchant-api-bango-v1", type: "service", color: BLUE, description: "Bango merchant integration API", analogy: "The Bango partner liaison desk", tech: ["REST", "Bango"] },
      { id: "svc-merchant-api-bellmedia", name: "merchant-api-bellmedia", type: "service", color: BLUE, description: "Bell Media merchant integration API", analogy: "The Bell Media partner liaison desk", tech: ["REST", "Bell Media"] },
      { id: "svc-merchant-api-disney", name: "merchant-api-disney", type: "service", color: BLUE, description: "Disney merchant integration API", analogy: "The Disney partner liaison desk", tech: ["REST", "Disney"] },
      { id: "svc-merchant-api-netflix", name: "merchant-api-netflix", type: "service", color: BLUE, description: "Netflix merchant integration API", analogy: "The Netflix partner liaison desk", tech: ["REST", "Netflix"] },
      { id: "svc-merchant-api-radio-canada", name: "merchant-api-radio-canada", type: "service", color: BLUE, description: "Radio-Canada merchant integration API", analogy: "The Radio-Canada partner liaison desk", tech: ["REST", "Radio-Canada"] },
      { id: "svc-merge-request-enhancer-api", name: "merge-request-enhancer-api", type: "service", color: BLUE, description: "Enhances GitLab merge requests with metadata and checks", analogy: "The code review assistant that adds context to PRs", tech: ["GitLab", "REST"] },
      { id: "svc-mtls-test", name: "mtls-test", type: "service", color: BLUE, description: "Mutual TLS connectivity test service", analogy: "The security handshake tester", tech: ["mTLS", "REST"] },
      { id: "svc-non-pay-billing-account-consumer", name: "non-pay-billing-account-consumer", type: "service", color: BLUE, description: "Processes non-payment billing account events", analogy: "The clerk handling complimentary account records", tech: ["Kafka", "DynamoDB"] },
      { id: "svc-notification-consumer", name: "notification-consumer", type: "service", color: BLUE, description: "Consumes and routes notification events", analogy: "The message center dispatcher", tech: ["Kafka", "SNS"] },
      { id: "svc-order-api", name: "order-api", type: "service", color: BLUE, description: "Order placement and management", analogy: "The order processing center", tech: ["REST", "DynamoDB"] },
      { id: "svc-policy-rule-configurator-api", name: "policy-rule-configurator-api", type: "service", color: BLUE, description: "Configures business policy rules", analogy: "The rules and regulations office", tech: ["REST", "DynamoDB"] },
      { id: "svc-policy-rule-configurator-api-v1", name: "policy-rule-configurator-api-v1", type: "service", color: BLUE, description: "V1 policy rule configuration API", analogy: "The original rules office (legacy version)", tech: ["REST", "DynamoDB"] },
      { id: "svc-product-catalog-api", name: "product-catalog-api", type: "service", color: BLUE, description: "Product catalog data access API", analogy: "The product database front desk", tech: ["REST", "DynamoDB"] },
      { id: "svc-product-order-events-consumer", name: "product-order-events-consumer", type: "service", color: BLUE, description: "Consumes product order events for analytics", analogy: "The sales data recorder", tech: ["Kafka", "DynamoDB"] },
      { id: "svc-promocode-redemptions-api", name: "promocode-redemptions-api", type: "service", color: BLUE, description: "Tracks promo code redemption history", analogy: "The coupon redemption ledger", tech: ["REST", "DynamoDB"] },
      { id: "svc-promocode-streamer-api", name: "promocode-streamer-api", type: "service", color: BLUE, description: "Streams promo codes to consumers in real time", analogy: "The live coupon distribution conveyor belt", tech: ["REST", "Streaming"] },
      { id: "svc-promocodes-api", name: "promocodes-api", type: "service", color: BLUE, description: "Core promo code management and validation", analogy: "The main coupon office", tech: ["REST", "DynamoDB"] },
      { id: "svc-promocodes-rtv-api", name: "promocodes-rtv-api", type: "service", color: BLUE, description: "Ready-to-validate promo code management", analogy: "The coupon verification checkpoint", tech: ["REST", "DynamoDB"] },
      { id: "svc-promoredeem-consumer", name: "promoredeem-consumer", type: "service", color: BLUE, description: "Consumes promo code redemption events", analogy: "The clerk processing used coupons", tech: ["Kafka", "DynamoDB"] },
      { id: "svc-promostream-consumer", name: "promostream-consumer", type: "service", color: BLUE, description: "Consumes promo code streaming events", analogy: "The coupon distribution tracker", tech: ["Kafka", "DynamoDB"] },
      { id: "svc-reseller-api-bango-v1", name: "reseller-api-bango-v1", type: "service", color: BLUE, description: "Bango reseller integration API", analogy: "The Bango reseller partnership desk", tech: ["REST", "Bango"] },
      { id: "svc-reseller-api-ext-v1", name: "reseller-api-ext-v1", type: "service", color: BLUE, description: "External reseller API (v1)", analogy: "The external reseller access window", tech: ["REST", "API"] },
      { id: "svc-reseller-api-v1", name: "reseller-api-v1", type: "service", color: BLUE, description: "Internal reseller management API", analogy: "The reseller management office", tech: ["REST", "DynamoDB"] },
      { id: "svc-reseller-service", name: "reseller-service", type: "service", color: BLUE, description: "Core reseller business logic", analogy: "The reseller operations headquarters", tech: ["REST", "DynamoDB"] },
      { id: "svc-reseller-service-bellmedia", name: "reseller-service-bellmedia", type: "service", color: BLUE, description: "Bell Media-specific reseller logic", analogy: "The Bell Media reseller operations desk", tech: ["REST", "Bell Media"] },
      { id: "svc-reseller-service-disney", name: "reseller-service-disney", type: "service", color: BLUE, description: "Disney-specific reseller logic", analogy: "The Disney reseller operations desk", tech: ["REST", "Disney"] },
      { id: "svc-retry-processor", name: "retry-processor", type: "service", color: BLUE, description: "Processes and retries failed operations", analogy: "The second-chance desk that re-attempts failed tasks", tech: ["SQS", "DynamoDB"] },
      { id: "svc-rollout-bg-demo", name: "rollout-bg-demo", type: "service", color: BLUE, description: "Blue-green deployment demo service", analogy: "The rehearsal stage for testing deployments", tech: ["Kubernetes", "Demo"] },
      { id: "svc-session-api", name: "session-api", type: "service", color: BLUE, description: "User session management", analogy: "The coat check counter tracking who's logged in", tech: ["REST", "Redis"] },
      { id: "svc-subscriber-manager-api", name: "subscriber-manager-api", type: "service", color: BLUE, description: "Manages subscriber records and state", analogy: "The subscriber records office", tech: ["REST", "DynamoDB"] },
      { id: "svc-subscription-configurator-api", name: "subscription-configurator-api", type: "service", color: BLUE, description: "Configures subscription plans, rules, and pricing tiers", analogy: "The plan designer who sets up subscription options", tech: ["REST", "DynamoDB"] },
      { id: "svc-subscription-consumer", name: "subscription-consumer", type: "service", color: BLUE, description: "Consumes subscription lifecycle events", analogy: "The clerk who updates files when subscriptions change", tech: ["Kafka", "DynamoDB"] },
      { id: "svc-subscription-manager-api-decom", name: "subscription-manager-api(decom)", type: "service", color: BLUE, description: "Legacy subscription manager (decommissioned)", analogy: "The old subscription office now closed", tech: ["REST", "Legacy"] },
      { id: "svc-subscription-report-api", name: "subscription-report-api", type: "service", color: BLUE, description: "Subscription reporting and analytics API", analogy: "The subscription stats and reports desk", tech: ["REST", "S3"] },
      { id: "svc-subscriptions-aggregator-api", name: "subscriptions-aggregator-api", type: "service", color: BLUE, description: "Aggregates subscription data from multiple sources", analogy: "The summary desk that consolidates all subscription info", tech: ["REST", "DynamoDB"] },
      { id: "svc-subscriptions-aggregator-api-mobility", name: "subscriptions-aggregator-api-mobility", type: "service", color: BLUE, description: "Mobility-specific subscription aggregation", analogy: "The mobile plan summary desk", tech: ["REST", "DynamoDB"] },
      { id: "svc-token-api", name: "token-api", type: "service", color: BLUE, description: "Token generation and validation service", analogy: "The ticket booth issuing and checking access tokens", tech: ["JWT", "REST"] },
    ],
  },
  {
    id: "serverless",
    name: "serverless/",
    type: "dir",
    color: PURPLE,
    description: "27 Lambda functions triggered by events (SQS, EventBridge, S3, CloudWatch). Each is a self-contained handler with minimal dependencies.",
    analogy: "Robots that wake up only when needed — they do one job and go back to sleep.",
    children: [
      { id: "fn-alb-proxy", name: "alb-proxy", type: "serverless", color: PURPLE, description: "ALB proxy for routing Lambda traffic", analogy: "The traffic cop directing requests through the front gate", tech: ["ALB", "Lambda"] },
      { id: "fn-billing-process", name: "billing-process", type: "serverless", color: PURPLE, description: "Processes billing events and charges", analogy: "The automated cashier processing payments", tech: ["SQS", "DynamoDB"] },
      { id: "fn-bpp-data-clean-up", name: "bpp-data-clean-up", type: "serverless", color: PURPLE, description: "Cleans up stale billing platform data", analogy: "The janitor tidying up old billing records", tech: ["DynamoDB", "Cron"] },
      { id: "fn-bpp-report", name: "bpp-report", type: "serverless", color: PURPLE, description: "Generates billing platform reports", analogy: "The billing report printer", tech: ["S3", "Cron"] },
      { id: "fn-child-records-expiry", name: "child-recods-expiry-notification-trigger", type: "serverless", color: PURPLE, description: "Triggers notifications for expiring child records", analogy: "The reminder alarm for expiring dependent records", tech: ["EventBridge", "SNS"] },
      { id: "fn-data-analytics", name: "data-analytics", type: "serverless", color: PURPLE, description: "Processes and transforms data for analytics", analogy: "The data scientist crunching numbers", tech: ["S3", "Athena"] },
      { id: "fn-emr-orchestration", name: "emr-orchestration", type: "serverless", color: PURPLE, description: "Orchestrates EMR cluster jobs for data processing", analogy: "The conductor directing the big data orchestra", tech: ["EMR", "Step Function"] },
      { id: "fn-emr-orchestration-wpc", name: "emr-orchestration-wpc", type: "serverless", color: PURPLE, description: "WPC-specific EMR orchestration", analogy: "The specialist conductor for WPC data jobs", tech: ["EMR", "Step Function"] },
      { id: "fn-entitlement-process", name: "entitlement-process", type: "serverless", color: PURPLE, description: "Processes customer entitlement grants and revocations", analogy: "The access pass activator/deactivator", tech: ["SQS", "DynamoDB"] },
      { id: "fn-fallout-automation", name: "fallout-automation", type: "serverless", color: PURPLE, description: "Automates resolution of fallout/failed transactions", analogy: "The auto-repair bot fixing failed operations", tech: ["SQS", "DynamoDB"] },
      { id: "fn-fallout-process", name: "fallout-process", type: "serverless", color: PURPLE, description: "Processes and categorizes fallout records", analogy: "The triage nurse sorting failed transaction cases", tech: ["SQS", "DynamoDB"] },
      { id: "fn-firehose-data-conversion", name: "firehose-data-conversion", type: "serverless", color: PURPLE, description: "Converts data format for Kinesis Firehose delivery", analogy: "The data format translator for the analytics pipeline", tech: ["Firehose", "Lambda"] },
      { id: "fn-fulfillment-process", name: "fulfillment-process", type: "serverless", color: PURPLE, description: "Processes order fulfillment workflows", analogy: "The warehouse robot picking and packing orders", tech: ["SQS", "DynamoDB"] },
      { id: "fn-lambda-trigger-rule", name: "lambda-trigger-rule", type: "serverless", color: PURPLE, description: "Rule-based Lambda function trigger manager", analogy: "The alarm system that decides which robot to wake up", tech: ["EventBridge", "Lambda"] },
      { id: "fn-product-catalog-report-upload", name: "product-catalog-api-report-upload", type: "serverless", color: PURPLE, description: "Uploads product catalog reports to S3", analogy: "The catalog report filing clerk", tech: ["S3", "Lambda"] },
      { id: "fn-product-catalog-cache-bump", name: "product-catalog-cache-version-bump", type: "serverless", color: PURPLE, description: "Bumps product catalog cache version on updates", analogy: "The cache refresher that ensures everyone sees the latest catalog", tech: ["Redis", "Lambda"] },
      { id: "fn-product-catalog-data-promo", name: "product-catalog-data-promo-btw-env", type: "serverless", color: PURPLE, description: "Promotes product catalog data between environments", analogy: "The data mover copying catalog from staging to production", tech: ["S3", "DynamoDB"] },
      { id: "fn-promocode-redemption-report", name: "promocode-redemption-report", type: "serverless", color: PURPLE, description: "Generates promo code redemption reports", analogy: "The coupon usage report printer", tech: ["S3", "Cron"] },
      { id: "fn-promocode-rtv-seeder", name: "promocode-rtv-seeder", type: "serverless", color: PURPLE, description: "Seeds ready-to-validate promo codes", analogy: "The coupon stock replenisher", tech: ["DynamoDB", "Lambda"] },
      { id: "fn-subscriber-customer-id-reconcile", name: "subscriber-customer-id-reconcile", type: "serverless", color: PURPLE, description: "Reconciles subscriber and customer IDs across systems", analogy: "The ID cross-checker making sure records match", tech: ["DynamoDB", "Cron"] },
      { id: "fn-subscriber-process", name: "subscriber-process", type: "serverless", color: PURPLE, description: "Processes subscriber lifecycle events", analogy: "The subscriber records updater", tech: ["SQS", "DynamoDB"] },
      { id: "fn-subscription-activation", name: "subscription-activation", type: "serverless", color: PURPLE, description: "Activates new subscriptions", analogy: "The activation robot that turns on new memberships", tech: ["SQS", "DynamoDB"] },
      { id: "fn-subscription-cancel-downgrade", name: "subscription-cancel-downgrade-batch-process", type: "serverless", color: PURPLE, description: "Batch processes subscription cancellations and downgrades", analogy: "The batch processor handling membership changes overnight", tech: ["Cron", "DynamoDB"] },
      { id: "fn-subscription-event-handler", name: "subscription-event-handler", type: "serverless", color: PURPLE, description: "Handles subscription domain events", analogy: "The dispatcher routing subscription change notifications", tech: ["Kafka", "Lambda"] },
      { id: "fn-subscription-manager", name: "subscription-manager", type: "serverless", color: PURPLE, description: "Manages subscription state transitions", analogy: "The subscription lifecycle coordinator", tech: ["SQS", "DynamoDB"] },
      { id: "fn-subscription-renewal", name: "subscription-renewal-process", type: "serverless", color: PURPLE, description: "Processes subscription renewals", analogy: "The auto-renew bot that extends memberships", tech: ["Cron", "DynamoDB"] },
      { id: "fn-subscription-retry", name: "subscription-retry", type: "serverless", color: PURPLE, description: "Retries failed subscription operations", analogy: "The second-chance machine for failed subscription tasks", tech: ["SQS", "DynamoDB"] },
    ],
  },
  {
    id: "pkg",
    name: "pkg/",
    type: "dir",
    color: TEAL,
    description: "28 shared utility packages — the internal standard library. Every service imports from here. Contains clients, middleware, helpers, and cross-cutting concerns.",
    analogy: "The shared workshop where every department borrows tools, jigs, and templates.",
    children: [
      { id: "pkg-athenautil", name: "athenautil", type: "package", color: TEAL, description: "AWS Athena query helpers and utilities", analogy: "The data warehouse query toolkit", tech: ["Athena", "AWS"] },
      { id: "pkg-config", name: "config", type: "package", color: TEAL, description: "Configuration loading and parsing", analogy: "The settings reader that loads app configuration", tech: ["Viper", "ENV"] },
      { id: "pkg-config-v1", name: "config-v1", type: "package", color: TEAL, description: "V1 configuration management (legacy)", analogy: "The original settings reader", tech: ["ENV"] },
      { id: "pkg-configmanager", name: "configmanager", type: "package", color: TEAL, description: "Dynamic configuration management with hot reloading", analogy: "The smart settings manager that updates without restarting", tech: ["DynamoDB", "Cache"] },
      { id: "pkg-coreprocessor", name: "coreprocessor", type: "package", color: TEAL, description: "Core business process execution framework", analogy: "The universal workflow engine blueprint", tech: ["Flow Engine"] },
      { id: "pkg-coreprocessor-v1", name: "coreprocessor-v1", type: "package", color: TEAL, description: "V1 core processor framework (legacy)", analogy: "The original workflow engine blueprint", tech: ["Flow Engine"] },
      { id: "pkg-cpm", name: "cpm", type: "package", color: TEAL, description: "Core Process Model shared utilities", analogy: "The process model toolbox", tech: ["Go"] },
      { id: "pkg-eventmanager", name: "eventmanager", type: "package", color: TEAL, description: "Event publishing and consumption management", analogy: "The announcement board management system", tech: ["Kafka", "SQS"] },
      { id: "pkg-featureflag", name: "featureflag", type: "package", color: TEAL, description: "Feature flag evaluation and management", analogy: "The switchboard for turning features on and off", tech: ["LaunchDarkly", "Redis"] },
      { id: "pkg-flow", name: "flow", type: "package", color: TEAL, description: "Flow engine for configurable business pipelines", analogy: "The assembly line blueprint maker", tech: ["Flow Engine", "YAML"] },
      { id: "pkg-flow-v2", name: "flow-v2", type: "package", color: TEAL, description: "V2 flow engine with enhanced capabilities", analogy: "The upgraded assembly line blueprint maker", tech: ["Flow Engine", "YAML"] },
      { id: "pkg-graphql", name: "graphql", type: "package", color: TEAL, description: "GraphQL server helpers and middleware", analogy: "The API blueprint toolkit", tech: ["gqlgen", "GraphQL"] },
      { id: "pkg-graphql-v2", name: "graphql-v2", type: "package", color: TEAL, description: "V2 GraphQL helpers with enhanced features", analogy: "The upgraded API blueprint toolkit", tech: ["gqlgen", "GraphQL"] },
      { id: "pkg-log", name: "log", type: "package", color: TEAL, description: "Structured logging with correlation IDs", analogy: "The company-wide logbook system", tech: ["Zap", "JSON"] },
      { id: "pkg-middleware", name: "middleware", type: "package", color: TEAL, description: "Common HTTP/gRPC middleware stack", analogy: "The security checkpoint template used at every door", tech: ["HTTP", "Middleware"] },
      { id: "pkg-nosqlrepos", name: "nosqlrepos", type: "package", color: TEAL, description: "DynamoDB repository abstractions", analogy: "The NoSQL filing cabinet interface", tech: ["DynamoDB"] },
      { id: "pkg-nosqlrepos-v2", name: "nosqlrepos-v2", type: "package", color: TEAL, description: "V2 DynamoDB repository with enhanced patterns", analogy: "The upgraded NoSQL filing cabinet interface", tech: ["DynamoDB"] },
      { id: "pkg-notification", name: "notification", type: "package", color: TEAL, description: "Notification sending abstractions", analogy: "The universal message dispatch toolkit", tech: ["SNS", "SES"] },
      { id: "pkg-redis", name: "redis", type: "package", color: TEAL, description: "Redis client wrapper and cache helpers", analogy: "The speed-dial notepad for quick lookups", tech: ["Redis"] },
      { id: "pkg-restapiclient", name: "restapiclient", type: "package", color: TEAL, description: "REST API client with retry and circuit breaking", analogy: "The resilient phone system for calling other services", tech: ["HTTP", "Retry"] },
      { id: "pkg-restapiclient-v2", name: "restapiclient-v2", type: "package", color: TEAL, description: "V2 REST client with enhanced observability", analogy: "The upgraded phone system with call tracking", tech: ["HTTP", "Retry"] },
      { id: "pkg-retry", name: "retry", type: "package", color: TEAL, description: "Exponential backoff retry helper", analogy: "The try-again timer that keeps retrying with patience", tech: ["Backoff"] },
      { id: "pkg-rulesengine", name: "rulesengine", type: "package", color: TEAL, description: "Business rules evaluation engine", analogy: "The decision-making robot that follows policy rules", tech: ["Rules", "Go"] },
      { id: "pkg-s3util", name: "s3util", type: "package", color: TEAL, description: "S3 storage utilities and helpers", analogy: "The cloud filing cabinet interface", tech: ["S3", "AWS"] },
      { id: "pkg-sqlrepos", name: "sqlrepos", type: "package", color: TEAL, description: "SQL database repository abstractions", analogy: "The SQL database access toolkit", tech: ["PostgreSQL", "SQL"] },
      { id: "pkg-telemetry", name: "telemetry", type: "package", color: TEAL, description: "Distributed tracing and metrics instrumentation", analogy: "The package tracking and dashboard gauge system", tech: ["OpenTelemetry", "Prometheus"] },
      { id: "pkg-telemetry-v1", name: "telemetry-v1", type: "package", color: TEAL, description: "V1 telemetry (legacy)", analogy: "The original monitoring toolkit", tech: ["Metrics"] },
      { id: "pkg-utils", name: "utils", type: "package", color: TEAL, description: "General-purpose utility functions", analogy: "The miscellaneous toolbox with handy gadgets", tech: ["Go"] },
    ],
  },
  {
    id: "model",
    name: "model/",
    type: "dir",
    color: AMBER,
    description: "25 shared data model packages — struct definitions, enums, and validation that all services agree on. The lingua franca of the monorepo.",
    analogy: "Official forms that ensure everyone speaks the same language — if two services both handle a Subscription, they use the same struct.",
    children: [
      { id: "mdl-anniversary-core-process", name: "anniversary-core-process", type: "model", color: AMBER, description: "Anniversary-related core process data models", analogy: "The anniversary event form template", tech: ["Go structs"] },
      { id: "mdl-audit-api", name: "audit-api", type: "model", color: AMBER, description: "Audit trail data structures", analogy: "The audit log entry format", tech: ["Go structs"] },
      { id: "mdl-billing-publish", name: "billing-publish", type: "model", color: AMBER, description: "Billing event publish data models", analogy: "The billing announcement message format", tech: ["Go structs"] },
      { id: "mdl-core-processor-api-v1", name: "core-processor-api-v1", type: "model", color: AMBER, description: "Core processor API v1 data models", analogy: "The workflow engine's form templates", tech: ["Go structs"] },
      { id: "mdl-cpm", name: "cpm", type: "model", color: AMBER, description: "Core Process Model data structures", analogy: "The process model data format", tech: ["Go structs"] },
      { id: "mdl-fallout-publish", name: "fallout-publish", type: "model", color: AMBER, description: "Fallout event publish data models", analogy: "The failed-transaction report format", tech: ["Go structs"] },
      { id: "mdl-fulfillment-publish", name: "fulfillmentPublish", type: "model", color: AMBER, description: "Fulfillment event publish data models", analogy: "The order fulfillment notification format", tech: ["Go structs"] },
      { id: "mdl-kafka-publish", name: "kafka-publish", type: "model", color: AMBER, description: "Kafka event publishing data models", analogy: "The standard message envelope for Kafka", tech: ["Go structs", "Kafka"] },
      { id: "mdl-mdm", name: "mdm", type: "model", color: AMBER, description: "Master Data Management data structures", analogy: "The master record format for all core entities", tech: ["Go structs"] },
      { id: "mdl-merchant-service", name: "merchant-service", type: "model", color: AMBER, description: "Merchant service data models", analogy: "The merchant registration form format", tech: ["Go structs"] },
      { id: "mdl-model", name: "model", type: "model", color: AMBER, description: "Common shared model definitions", analogy: "The universal form template used everywhere", tech: ["Go structs"] },
      { id: "mdl-order-api", name: "order-api", type: "model", color: AMBER, description: "Order API data structures", analogy: "The order form template", tech: ["Go structs"] },
      { id: "mdl-policy-rule-configurator-api", name: "policy-rule-configurator-api", type: "model", color: AMBER, description: "Policy rule configurator data models", analogy: "The business rule definition format", tech: ["Go structs"] },
      { id: "mdl-policy-rule-configurator-api-v1", name: "policy-rule-configurator-api-v1", type: "model", color: AMBER, description: "V1 policy rule configurator models", analogy: "The original business rule format", tech: ["Go structs"] },
      { id: "mdl-reseller-api-v1", name: "reseller-api-v1", type: "model", color: AMBER, description: "Reseller API v1 data structures", analogy: "The reseller registration form format", tech: ["Go structs"] },
      { id: "mdl-reseller-service", name: "reseller-service", type: "model", color: AMBER, description: "Reseller service data models", analogy: "The reseller operations data format", tech: ["Go structs"] },
      { id: "mdl-rtv", name: "rtv", type: "model", color: AMBER, description: "Ready-to-validate data structures", analogy: "The validation-ready coupon format", tech: ["Go structs"] },
      { id: "mdl-session-api", name: "session-api", type: "model", color: AMBER, description: "Session API data models", analogy: "The login session record format", tech: ["Go structs"] },
      { id: "mdl-subscriber-core-process", name: "subscriber-core-process", type: "model", color: AMBER, description: "Subscriber core process data models", analogy: "The subscriber lifecycle event format", tech: ["Go structs"] },
      { id: "mdl-subscriber-manager", name: "subscriber-manager", type: "model", color: AMBER, description: "Subscriber manager data structures", analogy: "The subscriber record format", tech: ["Go structs"] },
      { id: "mdl-subscriber-manager-event", name: "subscriber-manager-event", type: "model", color: AMBER, description: "Subscriber manager event models", analogy: "The subscriber change notification format", tech: ["Go structs"] },
      { id: "mdl-subscription-configurator", name: "subscription-configurator", type: "model", color: AMBER, description: "Subscription configurator data models", analogy: "The subscription plan setup format", tech: ["Go structs"] },
      { id: "mdl-subscription-core-process", name: "subscription-core-process", type: "model", color: AMBER, description: "Subscription core process data models", analogy: "The subscription lifecycle event format", tech: ["Go structs"] },
      { id: "mdl-subscription-email", name: "subscription-email", type: "model", color: AMBER, description: "Subscription email template data models", analogy: "The subscription notification email format", tech: ["Go structs"] },
      { id: "mdl-subscriptions-aggregator", name: "subscriptions-aggregator", type: "model", color: AMBER, description: "Subscription aggregation data structures", analogy: "The subscription summary report format", tech: ["Go structs"] },
    ],
  },
  {
    id: "poc",
    name: "poc/",
    type: "dir",
    color: GREEN,
    description: "7 proof-of-concept experiments — throwaway prototypes to validate ideas before committing to a full implementation in services/.",
    analogy: "The research lab where new ideas get prototyped on a whiteboard before anyone builds them for real.",
    children: [
      { id: "poc-open-feature-flags", name: "open-feature-flags", type: "poc", color: GREEN, description: "OpenFeature standard feature flag integration prototype", analogy: "Testing a new switchboard standard for feature flags", tech: ["OpenFeature", "Go"] },
      { id: "poc-redemption-monitoring-api", name: "redemption-monitoring-api", type: "poc", color: GREEN, description: "Real-time promo code redemption monitoring prototype", analogy: "Building a live dashboard for coupon usage", tech: ["REST", "Monitoring"] },
      { id: "poc-retry-sample-service", name: "retry-sample-service", type: "poc", color: GREEN, description: "Sample service demonstrating retry patterns", analogy: "A demo of how to build reliable retry logic", tech: ["REST", "Retry"] },
      { id: "poc-robot-e2e", name: "robot-e2e", type: "poc", color: GREEN, description: "Robot Framework end-to-end test prototype", analogy: "Training a test robot to walk through the whole system", tech: ["Robot Framework", "E2E"] },
      { id: "poc-sample-sqlrepos", name: "sample-sqlrepos", type: "poc", color: GREEN, description: "Sample SQL repository pattern implementation", analogy: "A demo of how to build SQL data access layers", tech: ["PostgreSQL", "SQL"] },
      { id: "poc-unleash", name: "unleash", type: "poc", color: GREEN, description: "Unleash feature flag platform integration", analogy: "Testing an alternative feature flag management system", tech: ["Unleash", "Feature Flags"] },
      { id: "poc-upm-mcp", name: "upm-mcp", type: "poc", color: GREEN, description: "UPM MCP integration prototype", analogy: "Building a bridge to the UPM platform", tech: ["MCP", "Integration"] },
    ],
  },
  {
    id: "tests",
    name: "tests/",
    type: "dir",
    color: GRAY,
    description: "Test frameworks — k6 for load testing and Karate for API integration testing. Unit tests live alongside source in each service.",
    analogy: "Quality control — specialized test tools that verify the system works under pressure and across services.",
    children: [
      { id: "test-k6", name: "k6", type: "test", color: GRAY, description: "Load and performance testing scripts using k6", analogy: "The stress tester that simulates thousands of users at once", tech: ["k6", "JavaScript"] },
      { id: "test-karate", name: "karate", type: "test", color: GRAY, description: "API integration test suites using Karate framework", analogy: "The API detective that walks through every endpoint scenario", tech: ["Karate", "BDD"] },
    ],
  },
  {
    id: "doc",
    name: "doc/",
    type: "dir",
    color: GREEN2,
    description: "Onboarding guides, code walkthroughs, glossary, and reference documentation for developers joining the team.",
    analogy: "The instruction manuals and handbooks — everything a new developer needs to get productive.",
    children: [
      { id: "doc-beginners-guide", name: "BEGINNERS-GUIDE.md", type: "doc", color: GREEN2, description: "Step-by-step guide for new developers", analogy: "The new employee orientation handbook", tech: ["Markdown"] },
      { id: "doc-code-walkthrough", name: "CODE-WALKTHROUGH.md", type: "doc", color: GREEN2, description: "Guided walkthrough of the codebase structure", analogy: "The building tour guide's script", tech: ["Markdown"] },
      { id: "doc-glossary", name: "GLOSSARY.md", type: "doc", color: GREEN2, description: "Definitions of domain terms and acronyms", analogy: "The company dictionary of jargon", tech: ["Markdown"] },
      { id: "doc-polm-fix-guide", name: "POLM-FIX-GUIDE.md", type: "doc", color: GREEN2, description: "Guide for fixing POLM (Pipeline of Last Mile) issues", analogy: "The troubleshooting manual for deployment pipeline fixes", tech: ["Markdown"] },
      { id: "doc-repo-onboarding", name: "REPO-ONBOARDING-GUIDE.md", type: "doc", color: GREEN2, description: "Repository onboarding and setup instructions", analogy: "The 'first day at work' checklist", tech: ["Markdown"] },
      { id: "doc-service-dependency-map", name: "SERVICE-DEPENDENCY-MAP.md", type: "doc", color: GREEN2, description: "Map of service dependencies and communication flows", analogy: "The org chart showing who talks to whom", tech: ["Markdown"] },
    ],
  },
];

// ── Business Domains ───────────────────────────────────────

export const repoDomains: RepoDomain[] = [
  {
    id: "dom-subscriptions",
    name: "Subscriptions",
    color: BLUE,
    services: [
      "svc-subscription-configurator-api", "svc-subscriber-manager-api", "svc-subscription-consumer",
      "svc-subscriptions-aggregator-api", "svc-subscriptions-aggregator-api-mobility",
      "svc-subscription-report-api", "svc-subscription-manager-api-decom",
      "svc-membership-api", "svc-membership-event-consumer",
    ],
  },
  {
    id: "dom-promotions",
    name: "Promotions & Codes",
    color: PURPLE,
    services: [
      "svc-promocodes-api", "svc-promocodes-rtv-api", "svc-promocode-redemptions-api",
      "svc-promocode-streamer-api", "svc-gen-promocodes-api", "svc-promoredeem-consumer",
      "svc-promostream-consumer",
    ],
  },
  {
    id: "dom-catalog",
    name: "Catalog & Products",
    color: TEAL,
    services: [
      "svc-product-catalog-api", "svc-catalog-api", "svc-catalog-manager", "svc-bulk-order-import",
    ],
  },
  {
    id: "dom-merchants",
    name: "Merchants & Resellers",
    color: AMBER,
    services: [
      "svc-merchant-api-bango-v1", "svc-merchant-api-bellmedia", "svc-merchant-api-disney",
      "svc-merchant-api-netflix", "svc-merchant-api-radio-canada", "svc-reseller-api-bango-v1", "svc-reseller-api-ext-v1",
      "svc-reseller-api-v1", "svc-reseller-service", "svc-reseller-service-bellmedia",
      "svc-reseller-service-disney",
    ],
  },
  {
    id: "dom-orders",
    name: "Orders & Contracts",
    color: CORAL,
    services: [
      "svc-order-api", "svc-contracts-api", "svc-customer-contract-agreements-consumer",
      "svc-customer-profile-api", "svc-household-api",
    ],
  },
  {
    id: "dom-identity",
    name: "Auth & Identity",
    color: GREEN,
    services: [
      "svc-auth-api", "svc-token-api", "svc-session-api", "svc-disney-auth-api",
    ],
  },
  {
    id: "dom-platform",
    name: "Platform & Infra",
    color: GRAY,
    services: [
      "svc-event-hub", "svc-event-publisher", "svc-flow-runner-api", "svc-core-processor-api-v1",
      "svc-policy-rule-configurator-api", "svc-policy-rule-configurator-api-v1", "svc-http-proxy-api",
      "svc-retry-processor", "svc-notification-consumer", "svc-email-api", "svc-api-doc",
      "svc-apigee-deployment-crd", "svc-merge-request-enhancer-api", "svc-non-pay-billing-account-consumer",
      "svc-audit-api", "svc-mtls-test", "svc-rollout-bg-demo",
    ],
  },
  {
    id: "dom-data",
    name: "Data & Analytics",
    color: PURPLE,
    services: [
      "svc-product-order-events-consumer",
    ],
  },
];

// ── Dependency Edges ───────────────────────────────────────

export const repoEdges: RepoEdge[] = [
  { from: "services", to: "pkg", label: "imports utilities" },
  { from: "services", to: "model", label: "uses data types" },
  { from: "serverless", to: "pkg", label: "imports utilities" },
  { from: "serverless", to: "model", label: "uses data types" },
  { from: "cmd", to: "services", label: "bootstraps" },
  { from: "cmd", to: "pkg", label: "imports config" },
  { from: "tests", to: "services", label: "tests" },
  { from: "tests", to: "pkg", label: "uses test helpers" },
  { from: "poc", to: "pkg", label: "experiments with" },
  { from: "poc", to: "model", label: "reuses types" },
];

// ── Service Type Patterns ──────────────────────────────────

export const serviceTypePatterns: ServiceTypePattern[] = [
  {
    type: "Typical Service",
    description: "Most common pattern — a REST API service with config, internal logic, models, and containerized deployment.",
    files: ["go.mod", "server.go", "Dockerfile", ".gitlab-ci.yml", "Taskfile.yml", "sonar-project.properties", "config/features/", "internal/service/", "models/", "mocks/"],
  },
  {
    type: "Protocol Buffer Service",
    description: "Service that uses Protocol Buffers for API contracts and code generation.",
    files: ["go.mod", "server.go", "Dockerfile", ".gitlab-ci.yml", "Taskfile.yml", "buf.gen.yaml", "buf.work.yaml", "models/proto/", "models/gen/", "internal/service/"],
  },
  {
    type: "Partner API Service",
    description: "Service integrating with external partners — includes API client definitions and versioned docs.",
    files: ["go.mod", "server.go", "Dockerfile", ".gitlab-ci.yml", "Taskfile.yml", "clients/", "oapi/", "doc/", ".version", "internal/service/"],
  },
  {
    type: "Lambda Function",
    description: "Single-purpose handler triggered by AWS events (SQS, EventBridge, S3, CloudWatch).",
    files: ["go.mod", "main.go", "handler.go", "handler_test.go", "Dockerfile", ".gitlab-ci.yml", "Taskfile.yml"],
  },
];

// ── Guided Tour Steps ──────────────────────────────────────

export const repoTourSteps: RepoTourStep[] = [
  {
    id: "tour-welcome",
    title: "Welcome to the Monorepo",
    narration: "This Go monorepo contains the entire backend for a large subscription and digital services platform. Instead of 162 separate repositories, everything lives under one roof — making it easier to share code, refactor across boundaries, and run integration tests. What you see here matches exactly what you'd see in VS Code's file explorer when you open the go-repo-new project.",
    analogy: "Think of it as a company headquarters building. Each floor is a different department, but they all share the same lobby, cafeteria, and security system.",
    highlightNodes: ["cmd", "services", "serverless", "pkg", "model", "poc", "tests", "doc"],
    whatsInside: ["9 CLI tools", "58 backend services", "27 serverless functions", "28 shared packages", "25 data models", "7 proof-of-concepts", "2 test frameworks", "6 documentation files"],
  },
  {
    id: "tour-cmd",
    title: "The Switches: cmd/",
    narration: "Every Go program starts with a main package. The cmd/ directory contains 9 CLI tools — each one compiles to a binary you can run. codegen scaffolds new services, runflow executes workflow pipelines, and tools like promocodes-reconciler and promocodes-inactivator handle promo code maintenance. The dynamodb-backfill tool is used to patch DynamoDB data.",
    analogy: "These are the switches you flip to start machines. The codegen command creates new service blueprints, the runflow command triggers automated workflows, and the reconciler commands clean up promo code data.",
    highlightNodes: ["cmd"],
    zoomTarget: "cmd",
    whatsInside: ["codegen — service scaffolding", "runflow — workflow pipeline runner", "dynamodb-backfill — DynamoDB data repair", "product-catalog-importer — catalog data import", "promocode-ordermax-exporter — promo reporting", "promocode-rtv-releaser — recycles unused promos", "promocodes-inactivator — expires old promos", "promocodes-reconciler — cross-system promo audit", "edw-importer(decom) — retired data importer"],
  },
  {
    id: "tour-services",
    title: "The Departments: services/",
    narration: "This is the heart of the system — 58 service packages, each owning a specific business domain. You'll find subscriber-manager-api managing subscriber records, merchant-api-netflix and merchant-api-disney for partner integrations, promocodes-api for promo code management, and core-processor-api-v1 orchestrating business workflows. Each service exposes REST APIs, manages its own data, and publishes events.",
    analogy: "Imagine 58 specialist departments running 24/7. The subscriber-manager department handles memberships, the merchant-api departments handle partner integrations, and the promocodes department manages coupons. Each knows its own job, but they collaborate through events and APIs.",
    highlightNodes: ["services"],
    zoomTarget: "services",
    whatsInside: ["subscription-configurator-api, subscriber-manager-api", "promocodes-api, promocode-redemptions-api", "merchant-api-netflix, merchant-api-disney", "merchant-api-radio-canada, reseller-service", "order-api, contracts-api", "auth-api, token-api, session-api", "core-processor-api-v1, flow-runner-api", "...and 40+ more"],
  },
  {
    id: "tour-serverless",
    title: "Behind the Scenes: serverless/",
    narration: "27 Lambda functions that handle asynchronous work. billing-process handles payment charges, subscription-activation turns on new memberships, fulfillment-process manages order workflows, and fallout-automation resolves failed transactions. Data pipeline functions like emr-orchestration handle large-scale analytics.",
    analogy: "Robots that wake up only when needed. They do one specific job (activate a subscription, process billing, generate a report) and go right back to sleep. You don't pay for them when they're idle.",
    highlightNodes: ["serverless"],
    zoomTarget: "serverless",
    whatsInside: ["billing-process — payment processing", "subscription-activation — turns on new subs", "fulfillment-process — order workflows", "fallout-automation — auto-fix failures", "emr-orchestration — big data analytics", "subscription-renewal-process — auto-renewals", "subscriber-process — subscriber lifecycle", "...and 20 more"],
  },
  {
    id: "tour-pkg",
    title: "The Shared Workshop: pkg/",
    narration: "28 utility packages that every service imports. Instead of each team writing their own database helper or logger, they all use the same battle-tested tools from pkg/. The flow and flow-v2 packages power the configurable workflow engine. redis provides caching, sqlrepos and nosqlrepos provide database abstractions, and telemetry handles distributed tracing.",
    analogy: "The shared workshop where every department borrows tools. Instead of each floor buying their own drill, they all check out the same high-quality drill from the central tool room.",
    highlightNodes: ["pkg"],
    zoomTarget: "pkg",
    whatsInside: ["flow, flow-v2 — workflow engine", "redis — caching layer", "nosqlrepos, sqlrepos — DB abstractions", "telemetry — distributed tracing", "config, configmanager — configuration", "middleware — HTTP middleware stack", "restapiclient — resilient HTTP client", "...and 21 more"],
  },
  {
    id: "tour-model",
    title: "The Common Language: model/",
    narration: "25 data model packages that define the shared vocabulary. When the subscriber-manager service processes a subscription and the notification-consumer needs to email about it, they both use the same structs from model/. Key models include mdm (Master Data Management), merchant-service for partner data, and subscription-configurator for plan definitions.",
    analogy: "Official forms so everyone speaks the same language. If the billing department needs to know about a subscription, they use the exact same subscription form that the subscriber-manager department filled out.",
    highlightNodes: ["model"],
    zoomTarget: "model",
    whatsInside: ["mdm — master data structures", "merchant-service — merchant data", "subscription-configurator — plan models", "kafka-publish — event message formats", "subscriber-manager — subscriber records", "order-api — order data structures", "billing-publish — billing events", "...and 18 more"],
  },
  {
    id: "tour-poc",
    title: "The Research Lab: poc/",
    narration: "7 proof-of-concept experiments. open-feature-flags tests the OpenFeature standard, unleash evaluates an alternative feature flag platform, and robot-e2e prototypes Robot Framework for end-to-end testing. upm-mcp explores a new platform integration. If an idea works, it graduates to services/.",
    analogy: "Where new ideas are prototyped on a whiteboard. The team tried OpenFeature flags here before deciding on a standard, and experimented with Robot Framework for automated testing.",
    highlightNodes: ["poc"],
    zoomTarget: "poc",
    whatsInside: ["open-feature-flags — OpenFeature standard", "unleash — alternative feature flags", "robot-e2e — Robot Framework testing", "redemption-monitoring-api — live monitoring", "retry-sample-service — retry pattern demo", "sample-sqlrepos — SQL pattern demo", "upm-mcp — UPM platform bridge"],
  },
  {
    id: "tour-tests",
    title: "Quality Control: tests/",
    narration: "Two specialized test frameworks live here. k6 handles load and performance testing — simulating thousands of concurrent users to find bottlenecks. Karate handles API integration testing — writing BDD-style scenarios that exercise every endpoint. Unit tests live alongside source code in each service.",
    analogy: "The QA lab with two specialized machines: k6 is the stress tester that simulates rush hour, and Karate is the API detective that walks through every endpoint scenario step by step.",
    highlightNodes: ["tests"],
    zoomTarget: "tests",
    whatsInside: ["k6 — load & performance testing", "karate — API integration testing (BDD)"],
  },
  {
    id: "tour-doc",
    title: "The Library: doc/",
    narration: "6 documentation files that help developers get productive. BEGINNERS-GUIDE.md is the starting point for new team members, CODE-WALKTHROUGH.md explains the code structure, GLOSSARY.md defines domain terms, and SERVICE-DEPENDENCY-MAP.md shows how services connect. POLM-FIX-GUIDE.md helps troubleshoot deployment pipeline issues.",
    analogy: "The instruction manuals for the entire company. Every important concept is documented so new team members can get up to speed without bugging senior engineers.",
    highlightNodes: ["doc"],
    zoomTarget: "doc",
    whatsInside: ["BEGINNERS-GUIDE.md — new dev start here", "CODE-WALKTHROUGH.md — code structure guide", "GLOSSARY.md — domain terminology", "POLM-FIX-GUIDE.md — pipeline troubleshooting", "REPO-ONBOARDING-GUIDE.md — setup instructions", "SERVICE-DEPENDENCY-MAP.md — service connections"],
  },
  {
    id: "tour-connections",
    title: "How Things Connect",
    narration: "The real power of a monorepo is how pieces connect. Services import from pkg/ for utilities and model/ for shared types. The cmd/ binaries bootstrap services. Serverless functions also use pkg/ and model/. Tests verify that everything works end-to-end.",
    analogy: "This is the org chart showing who talks to whom. Services are the workers, pkg/ is the shared toolbox, model/ is the common language, and cmd/ is the power switch that starts everything up.",
    highlightNodes: ["cmd", "services", "serverless", "pkg", "model", "tests", "poc"],
    highlightEdges: [
      ["services", "pkg"],
      ["services", "model"],
      ["serverless", "pkg"],
      ["serverless", "model"],
      ["cmd", "services"],
      ["cmd", "pkg"],
      ["tests", "services"],
      ["poc", "pkg"],
    ],
    whatsInside: ["services → pkg (shared utilities)", "services → model (data types)", "serverless → pkg (shared utilities)", "cmd → services (bootstrapping)", "tests → services (verification)", "poc → pkg (experimentation)"],
  },
  {
    id: "tour-inside-service",
    title: "Inside a Service",
    narration: "Let's zoom into subscriber-manager-api, a typical service. Most services follow the same file layout: go.mod for dependencies, server.go as entry point, Dockerfile for containerization, .gitlab-ci.yml for CI/CD, Taskfile.yml for task automation, openapi.yaml for the API contract, config/ for feature flags, internal/service/ for business logic, models/ for data types, mocks/ for testing, schemas/ for validation, and recipes/ for deployment configurations.",
    analogy: "Every department has the same office layout — a reception desk (server.go), a rulebook (.gitlab-ci.yml), workers to handle requests (internal/service/), and a filing system (models/). This consistency means once you know one service, you know them all.",
    highlightNodes: ["services"],
    zoomTarget: "svc-subscriber-manager-api",
    whatsInside: ["go.mod — dependency manifest", "server.go — entry point & wiring", "Dockerfile — container build", ".gitlab-ci.yml — CI/CD pipeline", "Taskfile.yml — task automation", "openapi.yaml — API contract", "config/ — feature flags", "internal/service/ — business logic", "models/ — data types", "mocks/ — test doubles", "schemas/ — validation rules", "recipes/ — deployment configs"],
  },
  {
    id: "tour-domains",
    title: "Business Domains",
    narration: "The 58 services group into 8 business domains: Subscriptions (subscriber-manager, membership, aggregators), Promotions & Codes (promocodes, redemptions, streaming), Catalog & Products (product-catalog, catalog-manager), Merchants & Resellers (Bango, Bell Media, Disney, Netflix integrations), Orders & Contracts, Auth & Identity, Platform & Infra, and Data & Analytics.",
    analogy: "Even though there are 58 departments, they belong to 8 divisions. The Merchants & Resellers division includes Bango, Bell Media, Disney, and Netflix partner desks — they're separate teams but they all handle partner integrations.",
    highlightNodes: ["services"],
    whatsInside: ["Subscriptions — configurator, subscriber-manager, aggregators", "Promotions — promocodes, redemptions, streaming", "Catalog — product-catalog, catalog-manager", "Merchants — Bango, Bell Media, Disney, Netflix, Radio-Canada", "Orders — order-api, contracts, household", "Auth — auth-api, token-api, session-api", "Platform — event-hub, flow-runner, core-processor", "Data — product-order-events-consumer"],
  },
];
