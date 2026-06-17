import type { ServiceDeepDive } from "./types";

export const eventHub: ServiceDeepDive = {
  id: "event-hub",
  name: "event-hub",
  displayName: "Event Hub",
  status: "active",
  accentColor: "blue",

  business: {
    purpose: "Central event routing and distribution service. Consumes events from multiple Kafka topics and routes them to the appropriate downstream consumers based on configurable routing rules. Acts as a fan-out layer to decouple event producers from consumers.",
    domainContext: "In the subscription platform, many services publish events to Kafka (reseller-service, promocodes-api, product-catalog-api). event-hub provides a centralized routing layer that directs events to the correct consumers, handles dead-letter routing for failed events, and supports event filtering and transformation.",
    flows: [
      { flowNum: "16", title: "Fallout & Self-Healing", role: "Routes failed events to the fallout-process Lambda for auto-remediation" },
      { flowNum: "19", title: "Notifications", role: "Routes subscription lifecycle events to notification-consumer" },
    ],
    stakeholders: [
      "All Kafka consumers (receive routed events)",
      "All Kafka producers (events flow through event-hub's routing rules)",
      "Platform operations (routing rule configuration)",
    ],
    consumers: [],
    businessRules: [
      {
        rule: "Configurable routing",
        description: "Routing rules are defined in configuration — which event types go to which consumer topics. Rules can be updated without code changes.",
        severity: "critical",
      },
      {
        rule: "Dead-letter routing",
        description: "Events that fail processing after max retries are routed to a dead-letter topic for manual review. Preserves the original event payload and failure context.",
        severity: "critical",
      },
      {
        rule: "Event ordering",
        description: "Events for the same subscription are guaranteed to be delivered in order. Kafka partition key is set to subscriptionId.",
        severity: "important",
      },
      {
        rule: "At-least-once delivery",
        description: "Events may be delivered more than once. All consumers must be idempotent.",
        severity: "important",
      },
    ],
    sla: {
      availability: "99.95%",
      latencyP99: "< 50ms (routing overhead)",
      notes: "event-hub adds minimal latency — it's a routing layer, not a processing layer. Availability is critical as it's the backbone of async communication.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Messaging", name: "Kafka (consumer + producer)", color: "purple" },
      { category: "Config", name: "Routing rules (YAML)", color: "amber" },
    ],
    endpoints: [
      { method: "GET", path: "/health", description: "Health check — verifies Kafka connectivity and consumer group lag" },
      { method: "GET", path: "/routes", description: "Returns current routing configuration (admin)" },
      { method: "PUT", path: "/routes", description: "Updates routing rules (admin, requires approval)" },
    ],
    dataModel: [],
    dependencies: [
      { service: "Kafka", direction: "upstream", protocol: "Consumer", description: "Consumes events from all source topics" },
      { service: "Kafka", direction: "downstream", protocol: "Producer", description: "Produces routed events to destination topics" },
    ],
    kafkaEvents: [
      { topic: "subscription.*", event: "All subscription events", direction: "consumes", description: "Consumes all subscription lifecycle events for routing" },
      { topic: "promo.*", event: "All promo events", direction: "consumes", description: "Consumes promo events for routing to analytics" },
      { topic: "*.dlq", event: "Dead-letter events", direction: "publishes", description: "Routes failed events to dead-letter topics" },
    ],
    errorPatterns: [
      { scenario: "Consumer lag spike", handling: "Auto-scales consumer instances within Kubernetes HPA limits", retry: "Events are buffered in Kafka — no data loss" },
      { scenario: "Routing rule error", handling: "Falls back to default routing — events go to DLQ if no rule matches", retry: "None — requires routing rule fix" },
      { scenario: "Downstream topic unavailable", handling: "Retries with backoff, routes to DLQ after max retries", retry: "3 retries with exponential backoff" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 3 replicas with HPA (auto-scaling on consumer lag)" },
      { aspect: "Messaging", description: "Kafka consumer groups with configurable parallelism per topic" },
      { aspect: "Observability", description: "Consumer lag monitoring via Datadog, routing rule hit rate dashboards, DLQ depth alerts" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [
      {
        title: "Event routing engine",
        description: "Routes events to destination topics based on configurable rules",
        code: `type Router struct {
    rules   []RoutingRule
    producer sarama.SyncProducer
}

type RoutingRule struct {
    SourceTopic string
    EventType   string
    DestTopic   string
    Filter      func(event Event) bool
}

func (r *Router) Route(ctx context.Context, msg *sarama.ConsumerMessage) error {
    event, err := parseEvent(msg)
    if err != nil {
        return r.sendToDLQ(ctx, msg, err)
    }

    matched := false
    for _, rule := range r.rules {
        if rule.matches(event) {
            if err := r.forward(ctx, rule.DestTopic, msg); err != nil {
                return fmt.Errorf("forward to %s: %w", rule.DestTopic, err)
            }
            matched = true
        }
    }

    if !matched {
        return r.sendToDLQ(ctx, msg, ErrNoMatchingRule)
    }
    return nil
}`,
        language: "go",
      },
    ],
  },
};

export const eventPublisher: ServiceDeepDive = {
  id: "event-publisher",
  name: "event-publisher",
  displayName: "Event Publisher",
  status: "active",
  accentColor: "blue",

  business: {
    purpose: "Generic event publishing utility that provides a standardized way to publish domain events to Kafka. Used by services that need Kafka publishing but don't have their own built-in publisher. Handles serialization, partitioning, and delivery confirmation.",
    domainContext: "While reseller-service has its own outbox-based Kafka publisher, smaller services use event-publisher as a shared publishing library. It ensures consistent event format, partition key assignment, and delivery guarantees across the platform.",
    flows: [],
    stakeholders: [
      "Multiple Go services (use as a shared publishing dependency)",
      "event-hub (consumes published events for routing)",
    ],
    consumers: [],
    businessRules: [
      {
        rule: "Standardized event envelope",
        description: "All events are wrapped in a standard envelope with eventId, eventType, timestamp, source, and correlationId.",
        severity: "critical",
      },
      {
        rule: "Partition key consistency",
        description: "Events for the same entity use the entityId as Kafka partition key, ensuring ordering within a partition.",
        severity: "important",
      },
    ],
    sla: {
      availability: "99.95%",
      latencyP99: "< 20ms (publish confirmation)",
      notes: "Synchronous producer — waits for Kafka acknowledgment before returning.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Messaging", name: "Kafka (producer)", color: "purple" },
    ],
    endpoints: [],
    dataModel: [],
    dependencies: [
      { service: "Kafka", direction: "downstream", protocol: "Producer", description: "Publishes events to configured Kafka topics" },
    ],
    kafkaEvents: [
      { topic: "Various", event: "Domain events", direction: "publishes", description: "Publishes events on behalf of Go services that use it as a shared library" },
    ],
    errorPatterns: [
      { scenario: "Kafka unavailable", handling: "Returns error to caller — caller must handle retry or outbox pattern", retry: "Caller-managed retries" },
      { scenario: "Serialization error", handling: "Returns error — invalid event payload", retry: "None — caller error" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas in production" },
      { aspect: "Messaging", description: "Kafka sync producer with acks=all for strong delivery guarantee" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [],
  },
};

export const notificationConsumer: ServiceDeepDive = {
  id: "notification-consumer",
  name: "notification-consumer",
  displayName: "Notification Consumer",
  status: "active",
  accentColor: "blue",

  business: {
    purpose: "Processes notification events from Kafka and dispatches customer notifications via email-api (SES). Listens for subscription lifecycle events (order placed, activated, cancelled, renewed) and sends appropriate notification templates to customers.",
    domainContext: "Notifications are fully event-driven — the subscription UI never triggers notifications directly. notification-consumer listens to Kafka events published by reseller-service and sends templated emails via email-api → SES v2. SQS buffering prevents throttling during burst events.",
    flows: [
      { flowNum: "19", title: "Notifications", role: "Listens to Kafka events and dispatches customer notifications via email-api → SES" },
      { flowNum: "5", title: "Place Order", role: "Sends order confirmation email when OrderCreated event is received" },
      { flowNum: "6", title: "Activate Subscription", role: "Sends activation confirmation with provider access instructions" },
      { flowNum: "7", title: "Cancel Subscription", role: "Sends cancellation confirmation email" },
    ],
    stakeholders: [
      "Customers (receive notification emails)",
      "email-api (downstream — sends emails via SES)",
      "reseller-service (upstream — publishes lifecycle events)",
    ],
    consumers: [],
    businessRules: [
      {
        rule: "Template-based notifications",
        description: "Each event type maps to an SES email template. Templates are managed in SES and support EN/FR localization.",
        severity: "critical",
      },
      {
        rule: "Burst protection",
        description: "SQS queue buffers notifications to prevent SES throttling during high-volume events (e.g., batch renewals).",
        severity: "important",
      },
      {
        rule: "Notification deduplication",
        description: "Duplicate events are deduplicated by eventId to prevent sending the same notification twice.",
        severity: "important",
      },
      {
        rule: "Opt-out respect",
        description: "Notification preferences are checked before sending. Customers can opt out of non-critical notifications.",
        severity: "standard",
      },
    ],
    sla: {
      availability: "99.9%",
      latencyP99: "< 5s (from event to email dispatch)",
      notes: "Notifications are not real-time — 5-second SLA is acceptable. SQS buffering adds latency during bursts.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Messaging", name: "Kafka (consumer)", color: "purple" },
      { category: "Email", name: "SES v2 (via email-api)", color: "amber" },
      { category: "Queue", name: "SQS (burst buffer)", color: "blue" },
    ],
    endpoints: [],
    dataModel: [],
    dependencies: [
      { service: "Kafka", direction: "upstream", protocol: "Consumer", description: "Consumes subscription lifecycle events" },
      { service: "email-api", direction: "downstream", protocol: "REST", description: "Sends templated emails via SES" },
      { service: "SQS", direction: "downstream", protocol: "AWS SDK", description: "Burst buffer — notifications queued before email dispatch" },
    ],
    kafkaEvents: [
      { topic: "subscription.order.created", event: "OrderCreated", direction: "consumes", description: "Triggers order confirmation notification" },
      { topic: "subscription.activation.completed", event: "ActivationCompleted", direction: "consumes", description: "Triggers activation confirmation notification" },
      { topic: "subscription.status.changed", event: "StatusChanged", direction: "consumes", description: "Triggers status change notifications (cancellation, renewal)" },
    ],
    errorPatterns: [
      { scenario: "email-api unavailable", handling: "Retries via SQS with exponential backoff", retry: "5 retries over 10 minutes before DLQ" },
      { scenario: "SES throttling", handling: "SQS absorbs burst — messages processed at SES rate limit", retry: "Automatic via SQS visibility timeout" },
      { scenario: "Invalid template", handling: "Logs error, sends to DLQ for manual review", retry: "None — requires template fix" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas in production" },
      { aspect: "Email", description: "SES v2 — templated emails with EN/FR localization" },
      { aspect: "Queue", description: "SQS standard queue — burst buffer with 14-day retention" },
      { aspect: "Observability", description: "Notification delivery rate, template usage metrics, SQS depth alerts" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [],
  },
};

export const eventsMessagingServices: ServiceDeepDive[] = [eventHub, eventPublisher, notificationConsumer];
