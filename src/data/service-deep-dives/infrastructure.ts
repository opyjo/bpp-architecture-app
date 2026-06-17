import type { ServiceDeepDive } from "./types";

export const httpProxyApi: ServiceDeepDive = {
  id: "http-proxy",
  name: "http-proxy-api",
  displayName: "HTTP Proxy API",
  status: "active",
  accentColor: "gray",

  business: {
    purpose: "HTTP proxy service for legacy system integration. Provides a standardized REST interface over legacy SOAP and proprietary HTTP APIs. Handles request/response translation, authentication header injection, and SSL/TLS termination for legacy endpoints that don't support modern TLS.",
    domainContext: "Several backend systems at Bell use older HTTP APIs with non-standard authentication. http-proxy-api centralizes the integration logic — other services call it via standard REST, and it handles the legacy protocol translation internally.",
    flows: [],
    stakeholders: [
      "Various Go services (use as a proxy to legacy systems)",
      "Legacy backend systems (target systems behind the proxy)",
    ],
    consumers: [
      "Internal Go services → http-proxy-api (REST — proxied to legacy endpoints)",
    ],
    businessRules: [
      {
        rule: "Request sanitization",
        description: "All proxied requests are sanitized to prevent injection attacks against legacy systems that may lack input validation.",
        severity: "critical",
      },
      {
        rule: "Response normalization",
        description: "Legacy responses (XML, SOAP, proprietary formats) are normalized to JSON before returning to the caller.",
        severity: "important",
      },
    ],
    sla: {
      availability: "99.9%",
      latencyP99: "< 1s (dominated by legacy system response time)",
      notes: "Proxy adds < 20ms overhead. Latency depends entirely on the target legacy system.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "API", name: "REST", color: "blue" },
      { category: "Integration", name: "SOAP/HTTP (legacy)", color: "amber" },
    ],
    endpoints: [
      { method: "POST", path: "/v1/proxy/:target", description: "Proxy a request to a named legacy target system" },
      { method: "GET", path: "/v1/proxy/targets", description: "List configured proxy targets and their health status" },
    ],
    dataModel: [],
    dependencies: [
      { service: "Various Go services", direction: "upstream", protocol: "REST", description: "Callers use standard REST to access legacy systems" },
      { service: "Legacy systems", direction: "downstream", protocol: "SOAP/HTTP", description: "Target systems with non-standard APIs" },
    ],
    kafkaEvents: [],
    errorPatterns: [
      { scenario: "Legacy system unavailable", handling: "Returns 502 Bad Gateway with target system identifier", retry: "Caller-managed retries" },
      { scenario: "Response parsing failure", handling: "Returns 502 with raw response for debugging", retry: "None — requires investigation" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas in production" },
      { aspect: "Networking", description: "Internal cluster DNS — accesses legacy systems via internal network" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [],
  },
};

export const emailApi: ServiceDeepDive = {
  id: "email",
  name: "email-api",
  displayName: "Email API",
  status: "active",
  accentColor: "gray",

  business: {
    purpose: "Email sending service built on AWS SES v2. Provides a REST API for sending templated transactional emails. Used by notification-consumer for subscription lifecycle emails and by billing processes for billing confirmations. Supports EN/FR localization.",
    domainContext: "email-api is the single point of email dispatch for the subscription platform. No other service sends emails directly — all notifications flow through email-api. It abstracts SES configuration, template management, and rate limiting.",
    flows: [
      { flowNum: "19", title: "Notifications", role: "Sends customer notification emails dispatched by notification-consumer" },
      { flowNum: "10", title: "Billing", role: "Sends billing confirmation emails triggered by billing-process Lambda" },
    ],
    stakeholders: [
      "notification-consumer (primary caller — sends lifecycle emails)",
      "Billing Lambda (sends billing confirmations)",
      "Customers (receive emails)",
    ],
    consumers: [
      "notification-consumer → email-api (REST — templated email dispatch)",
      "billing-process Lambda → email-api (REST — billing confirmations)",
    ],
    businessRules: [
      {
        rule: "Template-only sending",
        description: "Only pre-registered SES templates can be used. Raw HTML emails are not supported — prevents formatting inconsistencies and security issues.",
        severity: "critical",
      },
      {
        rule: "Rate limiting",
        description: "Email sending is rate-limited per SES account limits. Burst requests are queued internally.",
        severity: "important",
      },
      {
        rule: "Bilingual support",
        description: "All email templates exist in EN and FR variants. The language is determined by the customer's locale preference.",
        severity: "important",
      },
    ],
    sla: {
      availability: "99.9%",
      latencyP99: "< 500ms (includes SES API call)",
      notes: "Email delivery is best-effort — SES handles actual delivery. email-api returns success once SES accepts the message.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Email", name: "AWS SES v2", color: "amber" },
      { category: "API", name: "REST", color: "blue" },
    ],
    endpoints: [
      {
        method: "POST",
        path: "/v1/send",
        description: "Send a templated email via SES",
        request: `{
  "templateId": "order_confirmation",
  "locale": "en",
  "to": "customer@example.com",
  "templateData": {
    "customerName": "John",
    "orderNumber": "ORD-123",
    "productName": "Netflix Premium"
  }
}`,
        response: `{
  "messageId": "msg_abc123",
  "status": "ACCEPTED"
}`,
      },
      { method: "GET", path: "/v1/templates", description: "List available email templates" },
    ],
    dataModel: [],
    dependencies: [
      { service: "notification-consumer", direction: "upstream", protocol: "REST", description: "Sends lifecycle notification emails" },
      { service: "AWS SES v2", direction: "downstream", protocol: "AWS SDK", description: "Actual email delivery via SES" },
    ],
    kafkaEvents: [],
    errorPatterns: [
      { scenario: "SES throttling", handling: "Returns 429 — caller should buffer and retry", retry: "Caller-managed (notification-consumer uses SQS buffer)" },
      { scenario: "Invalid template", handling: "Returns 400 — template ID not found in SES", retry: "None — requires template registration" },
      { scenario: "SES unavailable", handling: "Returns 503 — email will not be sent", retry: "Caller retries with exponential backoff" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas in production" },
      { aspect: "Email", description: "AWS SES v2 — production sending identity verified, DKIM configured" },
      { aspect: "Templates", description: "SES email templates managed via Terraform — EN/FR variants" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [],
  },
};

export const policyRuleConfigurator: ServiceDeepDive = {
  id: "policy-rule-config",
  name: "policy-rule-configurator",
  displayName: "Policy Rule Configurator",
  status: "active",
  accentColor: "gray",

  business: {
    purpose: "Configures business policy rules that govern subscription behavior across the platform. Manages eligibility rules, pricing rules, and operational policies. Admin-facing CRUD service used by the business rules team.",
    domainContext: "Business policies like 'max 3 streaming subscriptions per account' or 'employee accounts get 20% discount' are defined in policy-rule-configurator and consumed by reseller-service during qualification. Changes take effect immediately — no deployment required.",
    flows: [],
    stakeholders: [
      "Business rules team (manages policies via admin portal)",
      "reseller-service (consumes policy rules during qualification)",
    ],
    consumers: [
      "Admin portal → policy-rule-configurator (REST — policy CRUD)",
      "reseller-service → policy-rule-configurator (REST — policy evaluation)",
    ],
    businessRules: [
      {
        rule: "Versioned policies",
        description: "Policy changes are versioned. Previous versions are retained for audit trail. Active version is always the latest.",
        severity: "important",
      },
      {
        rule: "Immediate effect",
        description: "Policy changes take effect immediately — no cache, no deployment. reseller-service fetches policies on every qualification call.",
        severity: "critical",
      },
    ],
    sla: {
      availability: "99.9%",
      latencyP99: "< 100ms (policy reads), < 300ms (policy writes)",
      notes: "Policy reads are on the qualification path — must be fast. Writes are admin-only and infrequent.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Database", name: "PostgreSQL", color: "blue" },
      { category: "API", name: "REST", color: "blue" },
    ],
    endpoints: [
      { method: "GET", path: "/v1/policies", description: "List all active policies" },
      { method: "GET", path: "/v1/policies/:id", description: "Get policy details with version history" },
      { method: "POST", path: "/v1/policies", description: "Create a new policy rule" },
      { method: "PUT", path: "/v1/policies/:id", description: "Update policy — creates new version" },
      { method: "POST", path: "/v1/policies/evaluate", description: "Evaluate policies against a subscription context" },
    ],
    dataModel: [
      {
        entity: "policy_rules",
        description: "Versioned business policy rules",
        fields: [
          { name: "id", type: "UUID", note: "Primary key" },
          { name: "name", type: "VARCHAR(256)" },
          { name: "rule_type", type: "VARCHAR(64)", note: "ELIGIBILITY | PRICING | OPERATIONAL" },
          { name: "condition", type: "JSONB", note: "Rule condition expression" },
          { name: "action", type: "JSONB", note: "Action to apply when condition matches" },
          { name: "version", type: "INT", note: "Monotonically increasing version number" },
          { name: "active", type: "BOOLEAN" },
          { name: "created_by", type: "VARCHAR(64)" },
          { name: "created_at", type: "TIMESTAMP" },
        ],
      },
    ],
    dependencies: [
      { service: "reseller-service", direction: "upstream", protocol: "REST", description: "Evaluates policies during qualification" },
      { service: "PostgreSQL", direction: "downstream", protocol: "SQL", description: "Stores versioned policy rules" },
    ],
    kafkaEvents: [],
    errorPatterns: [
      { scenario: "Invalid rule expression", handling: "Returns 400 with expression parsing error details", retry: "None — client error" },
      { scenario: "Policy conflict", handling: "Returns 409 — conflicting policies detected", retry: "None — requires rule adjustment" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas in production" },
      { aspect: "Database", description: "Amazon RDS PostgreSQL" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [],
  },
};

export const infrastructureServices: ServiceDeepDive[] = [httpProxyApi, emailApi, policyRuleConfigurator];
