export interface Runbook {
  id: string;
  title: string;
  severity: "P1" | "P2" | "P3" | "P4";
  description: string;
  symptoms: string[];
  affectedServices: string[];
  tags: string[];
  resolutionSteps: string[];
  rollbackSteps: string[];
  escalationPath: string;
  relatedKafkaEvents?: string[];
  estimatedResolutionTime: string;
}

export const severityColors: Record<string, string> = {
  P1: "arch-red",
  P2: "arch-coral",
  P3: "arch-amber",
  P4: "arch-teal",
};

export const runbookCatalog: Runbook[] = [
  {
    id: "rb-merchant-provisioning",
    title: "Merchant Provisioning Failures",
    severity: "P1",
    description:
      "Merchant API provisioning calls fail, preventing subscription activation for one or more providers (Netflix, Disney+, Bell Media, etc.).",
    symptoms: [
      "activateSubscription returns 5xx errors",
      "Merchant callback URLs not responding",
      "Provisioning state stuck in PENDING",
      "Customer sees spinner on confirmation page indefinitely",
    ],
    affectedServices: [
      "reseller-service",
      "merchant-api-netflix",
      "merchant-api-disney",
      "merchant-api-bellmedia",
      "audit-api",
    ],
    tags: ["provisioning", "merchant", "activation", "subscription"],
    resolutionSteps: [
      "Check merchant-api-* health endpoints for each provider",
      "Verify merchant callback URLs are reachable (curl test from same VPC)",
      "Check reseller-service logs for provisioning timeout errors",
      "Review DynamoDB provisioning state table for stuck records",
      "If single merchant: disable affected provider in catalog-api feature flag",
      "If widespread: check network ACLs and security group changes",
      "Retry stuck provisioning requests via admin API endpoint",
      "Verify audit-api is recording provisioning events correctly",
    ],
    rollbackSteps: [
      "Revert any recent merchant-api deployments",
      "Restore previous network ACL configuration",
      "Re-enable disabled feature flags",
    ],
    escalationPath:
      "Platform Lead → Merchant Integration Team → Provider contact (Netflix/Disney/Bell)",
    relatedKafkaEvents: [
      "subscription.activated",
      "subscription.provisioning.failed",
      "merchant.callback.received",
    ],
    estimatedResolutionTime: "30-60 minutes",
  },
  {
    id: "rb-kafka-consumer-lag",
    title: "Kafka Consumer Lag Spike",
    severity: "P2",
    description:
      "Consumer groups falling behind on processing Kafka events, causing delayed subscription state updates, missed notifications, and stale data.",
    symptoms: [
      "CloudWatch consumer lag metrics > 10,000 messages",
      "Event-driven state changes are delayed (e.g., activation not reflecting)",
      "notification-consumer not sending emails/push",
      "Promo stream processing backlog",
    ],
    affectedServices: [
      "subscription-consumer",
      "notification-consumer",
      "promostream-consumer",
      "promoredemption-consumer",
      "event-hub",
    ],
    tags: ["kafka", "consumer", "lag", "events", "processing"],
    resolutionSteps: [
      "Identify which consumer group(s) have high lag via CloudWatch",
      "Check consumer pod health and restart count in ECS",
      "Review consumer error logs for deserialization or processing errors",
      "Check if Kafka brokers are healthy (MSK console)",
      "If specific topic: check producer rate for unusual spikes",
      "Scale up consumer task count in ECS service definition",
      "If DLQ is filling: investigate poison messages and clear",
      "Monitor lag decrease after scaling",
    ],
    rollbackSteps: [
      "Reset consumer offset to last committed position if needed",
      "Scale back consumer count after lag resolves",
      "Revert any recent consumer code deployments",
    ],
    escalationPath:
      "Platform Lead → Infrastructure Team → AWS Support (MSK)",
    relatedKafkaEvents: [
      "subscription.state.changed",
      "notification.send",
      "promo.applied",
    ],
    estimatedResolutionTime: "15-45 minutes",
  },
  {
    id: "rb-dynamodb-throttling",
    title: "DynamoDB Throttling",
    severity: "P2",
    description:
      "DynamoDB tables hitting provisioned capacity limits, causing read/write throttling and degraded API performance.",
    symptoms: [
      "DynamoDB ThrottledRequests metric spiking",
      "API latency increasing across session and token operations",
      "session-api returning 429 or 500 errors",
      "User sessions failing to create or validate",
    ],
    affectedServices: [
      "session-api",
      "token-api",
      "household-api",
      "flow-runner-api",
    ],
    tags: ["dynamodb", "throttling", "capacity", "performance"],
    resolutionSteps: [
      "Check DynamoDB console for throttled tables",
      "Review consumed vs provisioned capacity in CloudWatch",
      "Enable DynamoDB auto-scaling if not already configured",
      "Increase provisioned WCU/RCU for affected tables",
      "Check for hot partition keys (uneven access patterns)",
      "Review recent code changes for increased read/write patterns",
      "Enable DAX caching for read-heavy operations if applicable",
      "Monitor throttle metrics after capacity increase",
    ],
    rollbackSteps: [
      "Revert capacity changes if they cause unexpected costs",
      "Disable DAX if it introduces consistency issues",
    ],
    escalationPath: "Platform Lead → Infrastructure Team → AWS Support",
    estimatedResolutionTime: "15-30 minutes",
  },
  {
    id: "rb-redis-cache-miss",
    title: "Redis Cache Miss Storm",
    severity: "P2",
    description:
      "Redis cache hit rate drops significantly, causing thundering herd on downstream services as all requests bypass cache.",
    symptoms: [
      "Redis cache hit ratio drops below 50%",
      "catalog-api and reseller-service latency spikes",
      "subscriptionQualification calls timing out",
      "ElastiCache CPU > 80%",
    ],
    affectedServices: [
      "reseller-service",
      "catalog-api",
      "subscription-configurator-api",
    ],
    tags: ["redis", "cache", "performance", "thundering-herd"],
    resolutionSteps: [
      "Check ElastiCache cluster health and memory usage",
      "Verify cache TTL configuration hasn't changed",
      "Look for recent FLUSHALL or mass eviction events",
      "Check if cache warming jobs ran successfully",
      "Add circuit breaker to prevent thundering herd on backend",
      "Manually trigger cache warm for critical catalog data",
      "Scale ElastiCache node type if memory-constrained",
      "Monitor cache hit rate recovery",
    ],
    rollbackSteps: [
      "Revert any Redis configuration changes",
      "Restore from Redis backup if data was flushed",
    ],
    escalationPath: "Platform Lead → Infrastructure Team",
    estimatedResolutionTime: "15-30 minutes",
  },
  {
    id: "rb-stuck-orders",
    title: "Stuck Orders",
    severity: "P1",
    description:
      "Orders stuck in processing state, not completing activation or cancellation. Customers unable to manage subscriptions.",
    symptoms: [
      "order-api shows orders in PROCESSING state for > 5 minutes",
      "core-processor-api not completing order workflows",
      "Customers stuck on loading screen after order placement",
      "Audit trail shows order created but no subsequent state changes",
    ],
    affectedServices: [
      "order-api",
      "core-processor-api",
      "reseller-service",
      "audit-api",
    ],
    tags: ["orders", "stuck", "processing", "workflow"],
    resolutionSteps: [
      "Query order-api for orders in PROCESSING state > 5 min",
      "Check core-processor-api logs for workflow errors",
      "Verify reseller-service is responding to order completion calls",
      "Check if downstream merchant-api calls are timing out",
      "Review PostgreSQL connection pool health for order-api",
      "Manually advance stuck orders via admin API if safe",
      "If widespread: check for database locks or deadlocks",
      "Verify Kafka order events are being published and consumed",
    ],
    rollbackSteps: [
      "Revert recent order-api or core-processor deployments",
      "Kill long-running database transactions if deadlocked",
    ],
    escalationPath:
      "Platform Lead → Order Processing Team → Database Admin",
    relatedKafkaEvents: [
      "order.created",
      "order.completed",
      "order.failed",
    ],
    estimatedResolutionTime: "30-90 minutes",
  },
  {
    id: "rb-auth-token-failures",
    title: "Auth Token Failures",
    severity: "P1",
    description:
      "Authentication token generation or validation failing, preventing users from accessing the platform.",
    symptoms: [
      "token-api returning 401/403 for valid credentials",
      "JWT validation failures across services",
      "Users unable to log in or getting redirected to login repeatedly",
      "auth-api health check degraded",
    ],
    affectedServices: [
      "auth-api",
      "token-api",
      "session-api",
      "disney-auth-api",
    ],
    tags: ["auth", "token", "jwt", "login", "security"],
    resolutionSteps: [
      "Check auth-api and token-api health endpoints",
      "Verify JWT signing key hasn't been rotated unexpectedly",
      "Check DynamoDB session table for write throttling",
      "Review recent deployments to auth services",
      "Verify Cognito/identity provider is responding",
      "Check certificate expiration on auth endpoints",
      "Test token generation manually via curl",
      "If key rotation: coordinate rolling update across all services",
    ],
    rollbackSteps: [
      "Revert auth service deployments",
      "Restore previous JWT signing key if rotated",
      "Clear any cached invalid tokens",
    ],
    escalationPath:
      "Platform Lead → Security Team → Identity Provider Support",
    estimatedResolutionTime: "15-60 minutes",
  },
  {
    id: "rb-db-connection-pool",
    title: "DB Connection Pool Exhaustion",
    severity: "P1",
    description:
      "PostgreSQL connection pools exhausted, causing services to queue or reject new database operations.",
    symptoms: [
      "PostgreSQL max_connections reached",
      "Services logging 'connection pool exhausted' errors",
      "API requests timing out waiting for DB connections",
      "RDS CPU/memory normal but connections at limit",
    ],
    affectedServices: [
      "reseller-service",
      "order-api",
      "subscriptions-aggregator-api",
      "audit-api",
    ],
    tags: ["database", "postgresql", "connections", "pool", "performance"],
    resolutionSteps: [
      "Check RDS connection count vs max_connections",
      "Identify which services are consuming most connections",
      "Look for connection leaks (connections not being returned to pool)",
      "Review recent code changes for missing defer conn.Close() patterns",
      "Terminate idle connections: SELECT pg_terminate_backend(pid) for idle > 10min",
      "Increase connection pool max size in service configuration",
      "Consider PgBouncer if not already in use",
      "Scale RDS instance if connection limit is the constraint",
    ],
    rollbackSteps: [
      "Revert pool size changes",
      "Revert recent service deployments with connection leaks",
    ],
    escalationPath: "Platform Lead → Database Admin → AWS Support (RDS)",
    estimatedResolutionTime: "15-45 minutes",
  },
  {
    id: "rb-appsync-timeouts",
    title: "AppSync/GraphQL Timeouts",
    severity: "P2",
    description:
      "AppSync GraphQL resolver timeouts causing BFF failures and degraded frontend experience.",
    symptoms: [
      "AppSync returning timeout errors on mutations",
      "Frontend mutations hanging or failing silently",
      "CloudWatch AppSync 5xx error rate > 1%",
      "BFF logging resolver timeout errors",
    ],
    affectedServices: [
      "reseller-service",
      "subscriptions-aggregator-api",
      "session-api",
    ],
    tags: ["appsync", "graphql", "timeout", "bff", "frontend"],
    resolutionSteps: [
      "Check AppSync console for error rates and latency",
      "Identify which resolvers are timing out",
      "Check downstream service health that resolvers call",
      "Review VTL resolver mapping templates for issues",
      "Increase AppSync resolver timeout if currently too low",
      "Check Lambda resolver cold starts if using Lambda data sources",
      "Add caching to frequently-called resolvers",
      "Monitor error rate after fixes",
    ],
    rollbackSteps: [
      "Revert AppSync schema or resolver changes",
      "Restore previous timeout configuration",
    ],
    escalationPath: "Platform Lead → Frontend Team → AWS Support (AppSync)",
    estimatedResolutionTime: "30-60 minutes",
  },
  {
    id: "rb-subscription-state",
    title: "Subscription State Inconsistency",
    severity: "P2",
    description:
      "Subscription state mismatch between services (e.g., reseller shows ACTIVE, merchant shows CANCELLED), causing customer confusion.",
    symptoms: [
      "Customer reports active subscription but content access denied",
      "aggregator-api returns different state than reseller-service",
      "Audit trail shows conflicting state transitions",
      "Merchant callback received but state not updated locally",
    ],
    affectedServices: [
      "reseller-service",
      "subscriptions-aggregator-api",
      "subscriber-manager-api",
      "subscription-consumer",
    ],
    tags: [
      "subscription",
      "state",
      "consistency",
      "reconciliation",
    ],
    resolutionSteps: [
      "Query subscription state in reseller-service PostgreSQL",
      "Compare with subscriber-manager-api state",
      "Check audit-api trail for the subscription lifecycle",
      "Look for missed Kafka events in subscription-consumer",
      "Check for failed merchant callbacks that weren't retried",
      "Manually reconcile state if clear which is correct",
      "Trigger re-sync from merchant if state is stale",
      "Add monitoring alert for state divergence",
    ],
    rollbackSteps: [
      "Restore previous subscription state from audit trail",
      "Re-process missed Kafka events from topic offset",
    ],
    escalationPath:
      "Platform Lead → Subscription Team → Merchant Integration Team",
    relatedKafkaEvents: [
      "subscription.state.changed",
      "subscription.activated",
      "subscription.cancelled",
    ],
    estimatedResolutionTime: "30-90 minutes",
  },
  {
    id: "rb-event-hub-routing",
    title: "Event Hub Routing Failure",
    severity: "P2",
    description:
      "Event hub failing to route events to correct consumers, causing missed event processing and stale data.",
    symptoms: [
      "Events published but not received by expected consumers",
      "event-hub error logs showing routing failures",
      "event-publisher dead letter queue growing",
      "Downstream services not receiving state change notifications",
    ],
    affectedServices: [
      "event-hub",
      "event-publisher",
      "notification-consumer",
      "subscription-consumer",
    ],
    tags: ["events", "routing", "event-hub", "messaging"],
    resolutionSteps: [
      "Check event-hub service health and error logs",
      "Verify routing configuration hasn't changed",
      "Check Kafka topic partitions and consumer group assignments",
      "Review dead letter queue for failed events",
      "Verify event schema compatibility (no breaking changes)",
      "Restart event-hub if routing table is stale",
      "Re-process events from DLQ after fix",
      "Verify downstream consumers are receiving events again",
    ],
    rollbackSteps: [
      "Revert event-hub deployment",
      "Restore previous routing configuration",
    ],
    escalationPath: "Platform Lead → Events Team → Infrastructure Team",
    relatedKafkaEvents: ["event.routed", "event.routing.failed"],
    estimatedResolutionTime: "20-45 minutes",
  },
  {
    id: "rb-lambda-cold-starts",
    title: "Lambda Cold Start Latency",
    severity: "P3",
    description:
      "Lambda functions experiencing high cold start latency, affecting time-sensitive operations like provisioning callbacks.",
    symptoms: [
      "Lambda execution duration spikes on first invocation",
      "p99 latency > 3s for Lambda-backed operations",
      "Intermittent timeouts on infrequently-called functions",
      "CloudWatch shows high init duration metrics",
    ],
    affectedServices: [
      "reseller-service",
      "http-proxy-api",
      "email-api",
    ],
    tags: ["lambda", "cold-start", "latency", "performance"],
    resolutionSteps: [
      "Identify which Lambda functions have highest cold start times",
      "Check Lambda memory/CPU configuration (increase for faster init)",
      "Review Lambda package size — reduce bundled dependencies",
      "Enable provisioned concurrency for critical functions",
      "Add Lambda warming pings for infrequently-called functions",
      "Consider moving to container-based deployment if cold starts are chronic",
      "Review VPC configuration — VPC Lambdas have longer cold starts",
      "Monitor p99 latency improvement after changes",
    ],
    rollbackSteps: [
      "Revert provisioned concurrency changes",
      "Restore previous Lambda configuration",
    ],
    escalationPath: "Platform Lead → Infrastructure Team",
    estimatedResolutionTime: "30-60 minutes",
  },
  {
    id: "rb-promo-code-failures",
    title: "Promo Code Failures",
    severity: "P3",
    description:
      "Promotional code validation or redemption failing, preventing customers from applying discounts to subscriptions.",
    symptoms: [
      "promocodes-api returning validation errors for valid codes",
      "Promo redemption consumer not processing redemption events",
      "Customers seeing 'invalid promo code' for active promotions",
      "Campaign dashboard showing 0 redemptions for active campaign",
    ],
    affectedServices: [
      "promocodes-api",
      "promoredemption-consumer",
      "promostream-consumer",
      "promo-migration-consumer",
    ],
    tags: ["promotions", "promo-codes", "redemption", "campaign"],
    resolutionSteps: [
      "Verify promo code exists and is active in promocodes-api database",
      "Check campaign start/end dates and usage limits",
      "Review promocodes-api validation logic for recent changes",
      "Check promoredemption-consumer for processing errors",
      "Verify Kafka promo events are being published correctly",
      "Test promo code validation manually via API",
      "Check if promo-migration-consumer has synced latest campaigns",
      "Review any recent changes to promo eligibility rules",
    ],
    rollbackSteps: [
      "Revert promocodes-api deployment",
      "Restore promo campaign configuration from backup",
    ],
    escalationPath: "Platform Lead → Promotions Team → Marketing",
    relatedKafkaEvents: [
      "promo.validated",
      "promo.redeemed",
      "promo.campaign.updated",
    ],
    estimatedResolutionTime: "15-30 minutes",
  },
];

/**
 * Serialize the runbook catalog for AI system context.
 */
export function serializeRunbookCatalog(): string {
  const parts: string[] = [
    `You are an incident response expert for a subscription management platform.`,
    `You have access to ${runbookCatalog.length} pre-built runbooks.`,
    ``,
    `When a user describes an error or incident, match it to the most relevant runbook(s) and provide contextual guidance.`,
    `If no exact match exists, synthesize guidance from the most relevant runbooks and your knowledge of the platform architecture.`,
    ``,
    `## Available Runbooks`,
    ``,
  ];

  for (const rb of runbookCatalog) {
    parts.push(
      `### ${rb.title} [${rb.severity}]`,
      `- ID: ${rb.id}`,
      `- Description: ${rb.description}`,
      `- Symptoms: ${rb.symptoms.join("; ")}`,
      `- Affected Services: ${rb.affectedServices.join(", ")}`,
      `- Resolution: ${rb.resolutionSteps.length} steps`,
      `- Est. Time: ${rb.estimatedResolutionTime}`,
      ``
    );
  }

  parts.push(
    `## Instructions`,
    `- When a user pastes an error message, identify the most likely root cause`,
    `- Reference specific runbook steps and services`,
    `- Provide severity assessment and escalation guidance`,
    `- Suggest diagnostic commands and checks`,
    `- If multiple runbooks may apply, rank them by likelihood`
  );

  return parts.join("\n");
}
