import type { LambdaOverviewData } from "./types";

export const lambdaOverviewData: LambdaOverviewData = {
  summary: "The subscription platform uses 29 AWS Lambda functions written in Go for event-driven processing, scheduled tasks, and infrastructure automation. Lambdas handle work that doesn't fit the long-running EKS service model — one-off transformations, scheduled maintenance, async callbacks, and operational tooling.",
  totalCount: 29,
  categories: [
    {
      id: "event-processing",
      name: "Event Processing",
      description: "Lambdas that consume and process domain events from Kafka, SQS, or EventBridge",
      color: "purple",
      lambdas: [
        { name: "subscription-event-lambda", purpose: "Processes subscription lifecycle events (created, updated, cancelled) for downstream workflows", trigger: "Kafka", targets: ["PostgreSQL", "SNS"] },
        { name: "order-processor-lambda", purpose: "Async order processing pipeline — handles post-submission tasks that don't need to block the API response", trigger: "Kafka", targets: ["PostgreSQL", "merchant-api-*"] },
        { name: "event-transformer-lambda", purpose: "Transforms events between internal and external formats for cross-system integration", trigger: "Kafka", targets: ["Kafka"] },
        { name: "merchant-callback-lambda", purpose: "Handles async callbacks from merchant providers (Netflix, Disney, Bango) when provisioning completes", trigger: "API Gateway", targets: ["reseller-service", "audit-api"] },
        { name: "retry-handler-lambda", purpose: "Retries failed events from retry topics with exponential backoff and jitter", trigger: "Kafka (retry topic)", targets: ["Kafka (original topic)"] },
        { name: "dlq-processor-lambda", purpose: "Processes dead-letter queue messages — logs, alerts, and optionally retries or archives failed events", trigger: "SQS (DLQ)", targets: ["S3", "SNS (alerts)"] },
      ],
    },
    {
      id: "notifications",
      name: "Notifications & Communication",
      description: "Lambdas that send notifications, alerts, and communications via SNS, SES, and Slack",
      color: "blue",
      lambdas: [
        { name: "notification-lambda", purpose: "Sends push notifications and SMS via SNS for subscription lifecycle events", trigger: "SNS", targets: ["SNS", "SES"] },
        { name: "deployment-notifier-lambda", purpose: "Posts deployment notifications to Slack channels when ArgoCD deployments complete", trigger: "EventBridge", targets: ["Slack webhook"] },
      ],
    },
    {
      id: "data-sync",
      name: "Data Synchronization",
      description: "Lambdas that sync data between systems, warm caches, and maintain consistency",
      color: "teal",
      lambdas: [
        { name: "catalog-sync-lambda", purpose: "Syncs product catalog data from product-catalog-api to catalog-api's Redis cache on schedule", trigger: "CloudWatch Events (scheduled)", targets: ["Redis", "PostgreSQL"] },
        { name: "billing-sync-lambda", purpose: "Syncs subscription billing state with NM1 (Bell's billing platform) on schedule", trigger: "CloudWatch Events (scheduled)", targets: ["PostgreSQL", "NM1"] },
        { name: "account-link-lambda", purpose: "Links customer accounts across providers when a new subscription is provisioned", trigger: "Kafka", targets: ["PostgreSQL", "CPM"] },
        { name: "cache-warmer-lambda", purpose: "Pre-warms Redis caches for catalog-api during low-traffic windows to prevent cold-start latency", trigger: "CloudWatch Events (scheduled)", targets: ["Redis"] },
        { name: "config-sync-lambda", purpose: "Syncs configuration values (feature flags, thresholds) across environments from the config store", trigger: "CloudWatch Events (scheduled)", targets: ["SSM Parameter Store"] },
        { name: "feature-flag-sync-lambda", purpose: "Syncs feature flag state from Unleash to local Go Feature Flags (GOFF) cache", trigger: "CloudWatch Events (scheduled)", targets: ["Unleash API", "S3"] },
        { name: "promo-validator-lambda", purpose: "Pre-validates promo codes in batch for campaign launches — ensures codes are correctly configured before go-live", trigger: "S3 (CSV upload)", targets: ["PostgreSQL"] },
      ],
    },
    {
      id: "maintenance",
      name: "Maintenance & Cleanup",
      description: "Scheduled Lambdas for cleanup, backup, archival, and resource management",
      color: "amber",
      lambdas: [
        { name: "session-cleanup-lambda", purpose: "Cleans up expired DynamoDB sessions that TTL hasn't removed yet (belt-and-suspenders cleanup)", trigger: "CloudWatch Events (daily)", targets: ["DynamoDB"] },
        { name: "log-archiver-lambda", purpose: "Archives CloudWatch logs older than 90 days to S3 Glacier for long-term retention", trigger: "CloudWatch Events (weekly)", targets: ["S3 Glacier"] },
        { name: "backup-lambda", purpose: "Creates on-demand backups of DynamoDB tables and RDS snapshots before major deployments", trigger: "CloudWatch Events (daily) + manual", targets: ["DynamoDB", "RDS"] },
        { name: "cleanup-lambda", purpose: "General resource cleanup — removes orphaned S3 objects, stale ECR images, and expired secrets", trigger: "CloudWatch Events (weekly)", targets: ["S3", "ECR", "Secrets Manager"] },
        { name: "migration-lambda", purpose: "Runs database schema migrations in a controlled manner with pre/post validation", trigger: "Manual (CI/CD pipeline)", targets: ["PostgreSQL"] },
        { name: "secret-rotator-lambda", purpose: "Rotates API keys and credentials in AWS Secrets Manager on schedule (90-day rotation)", trigger: "Secrets Manager rotation", targets: ["Secrets Manager"] },
      ],
    },
    {
      id: "monitoring",
      name: "Monitoring & Observability",
      description: "Lambdas for health checks, metrics, cost tracking, and compliance reporting",
      color: "green",
      lambdas: [
        { name: "health-check-lambda", purpose: "Performs deep health checks on all services — verifies DB connectivity, Kafka consumer lag, Redis availability", trigger: "CloudWatch Events (every 5 min)", targets: ["All services", "CloudWatch"] },
        { name: "metric-aggregator-lambda", purpose: "Aggregates custom business metrics (order volume, activation rate, error rate) into CloudWatch custom metrics", trigger: "CloudWatch Events (every 1 min)", targets: ["CloudWatch Metrics"] },
        { name: "cost-tracker-lambda", purpose: "Tracks AWS cost per service using Cost Explorer API — publishes daily cost report to S3 and Slack", trigger: "CloudWatch Events (daily)", targets: ["Cost Explorer", "S3", "Slack"] },
        { name: "audit-stream-lambda", purpose: "Streams audit log entries from audit-api's PostgreSQL to S3 for long-term analytics and compliance", trigger: "DynamoDB Streams / scheduled", targets: ["S3"] },
        { name: "report-generator-lambda", purpose: "Generates weekly operational reports (subscription metrics, error rates, SLA compliance)", trigger: "CloudWatch Events (weekly)", targets: ["S3", "SES"] },
        { name: "data-export-lambda", purpose: "Exports subscription and order data for compliance audits and external analytics platforms", trigger: "Manual / scheduled", targets: ["S3"] },
      ],
    },
    {
      id: "api-edge",
      name: "API & Edge",
      description: "Lambdas at the API edge for rate limiting, schema validation, and request processing",
      color: "coral",
      lambdas: [
        { name: "rate-limiter-lambda", purpose: "Enforces API rate limits at the edge using token bucket algorithm. Protects downstream services from traffic spikes", trigger: "API Gateway (authorizer)", targets: ["DynamoDB (rate counters)"] },
        { name: "schema-validator-lambda", purpose: "Validates GraphQL schema changes in CI/CD pipeline — prevents breaking changes from reaching production", trigger: "CodePipeline", targets: ["AppSync schema registry"] },
      ],
    },
  ],
  commonPatterns: [
    {
      pattern: "Structured error handling",
      description: "All Lambdas use a shared error handling package that wraps errors with context, logs structured JSON, and reports to CloudWatch Metrics for alerting.",
      usedBy: ["All 29 Lambdas"],
    },
    {
      pattern: "Dead-letter queue (DLQ)",
      description: "Event-driven Lambdas configure SQS DLQs for failed invocations. dlq-processor-lambda monitors all DLQs and provides a centralized view of failures.",
      usedBy: ["subscription-event-lambda", "order-processor-lambda", "event-transformer-lambda", "retry-handler-lambda", "merchant-callback-lambda", "notification-lambda"],
    },
    {
      pattern: "Idempotent processing",
      description: "Lambdas that process events implement idempotency using DynamoDB conditional writes or PostgreSQL upsert semantics to handle Lambda retries safely.",
      usedBy: ["subscription-event-lambda", "order-processor-lambda", "billing-sync-lambda", "account-link-lambda", "merchant-callback-lambda"],
    },
    {
      pattern: "Structured JSON logging",
      description: "All Lambdas use zerolog for structured JSON logging with correlation IDs. Logs flow to CloudWatch and are queryable via CloudWatch Insights.",
      usedBy: ["All 29 Lambdas"],
    },
    {
      pattern: "Graceful timeout handling",
      description: "Lambdas set internal timeouts shorter than the Lambda execution timeout to ensure cleanup code runs before the runtime kills the process.",
      usedBy: ["All event-processing Lambdas", "All data-sync Lambdas"],
    },
    {
      pattern: "Secrets Manager integration",
      description: "Lambdas that access external APIs retrieve credentials from AWS Secrets Manager at cold start and cache them for the Lambda lifetime.",
      usedBy: ["merchant-callback-lambda", "billing-sync-lambda", "notification-lambda", "deployment-notifier-lambda", "cost-tracker-lambda"],
    },
  ],
  infrastructure: [
    { aspect: "Runtime", description: "AWS Lambda — Go runtime (provided.al2023), ARM64 architecture for cost optimization" },
    { aspect: "Packaging", description: "Docker container images stored in ECR — same CI/CD pipeline as EKS services" },
    { aspect: "Networking", description: "Lambdas in VPC for PostgreSQL/Redis/Kafka access. NAT Gateway for external API calls" },
    { aspect: "Observability", description: "CloudWatch Logs + Datadog Lambda extension for traces and metrics" },
    { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → Terraform (Lambda configuration) + ArgoCD (where applicable)" },
    { aspect: "Cost model", description: "Pay-per-invocation — most Lambdas are scheduled (low cost). Event-driven Lambdas scale with traffic" },
    { aspect: "Concurrency", description: "Reserved concurrency for critical Lambdas (health-check, merchant-callback). Unreserved for scheduled tasks" },
    { aspect: "Memory", description: "128MB–512MB depending on workload. data-export and report-generator use 512MB for large dataset processing" },
  ],
};
