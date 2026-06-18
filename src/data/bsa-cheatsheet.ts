// ─── BSA Cheatsheet Data ─────────────────────────────────────────────────────
// Canada Life Senior BSA Assessment Cheatsheet
// Grounded in Bell Canada Subscription Management Platform (go-repo + subscription-manager MFE)

// ─── Integration Q&A ─────────────────────────────────────────────────────────

export interface IntegrationQA {
  num: number;
  question: string;
  answer: string;
  source: string;
}

export const integrationQA: IntegrationQA[] = [
  {
    num: 1,
    question: "What is the system of record for subscription state?",
    answer:
      "reseller-service → PostgreSQL for write-side; subscriptions-aggregator-api merges PostgreSQL + CPM for reads (CQRS split).",
    source: "architecture.ts:steps.order, core-subscription.ts",
  },
  {
    num: 2,
    question: "How does the UI communicate with backend services?",
    answer:
      "UI never calls Go services directly. Mutations route through Next.js BFF → AppSync (GraphQL) → Go services. Reads bypass AppSync via BFF → aggregator-api (REST).",
    source: "architecture.ts:steps.all",
  },
  {
    num: 3,
    question: "What are the core API contracts?",
    answer:
      "5 GraphQL mutations: generateSession, subscriptionQualification, submitSubscription, activateSubscription, cloneSession. 1 REST read: GET /subscriptions.",
    source: "payloads.ts",
  },
  {
    num: 4,
    question: "How is authentication handled?",
    answer:
      "SAML SSO (BoxyHQ) for customers, SAML agent audience for agents, Auth0 for dev. BFF obtains OAuth2 tokens (scopes: subscription-manager/query, subscriptions-aggregator-api/read) and holds them server-side.",
    source: "architecture.ts:steps.auth",
  },
  {
    num: 5,
    question: "How are external partners integrated?",
    answer:
      "5 merchant adapter APIs implement a shared MerchantProvider Go interface (Provision, Deprovision, CheckStatus, HandleCallback). Each uses a different auth method (OAuth2, API key+HMAC, JWT, SHA-256).",
    source: "merchants.ts",
  },
  {
    num: 6,
    question: "What event backbone is used?",
    answer:
      "Apache Kafka for async domain events. 14+ event types on named topics. SQS for notification buffering. At-least-once delivery; consumers must be idempotent. Partition key = subscriptionId for ordering.",
    source: "events.ts, events-messaging.ts",
  },
  {
    num: 7,
    question: "How are failures handled?",
    answer:
      "Circuit breakers (Go hystrix) per merchant, exponential backoff with jitter (max 3 retries), DLQ for unprocessable events, fallout-process Lambda for auto-remediation, account-recovery-api for state reconciliation.",
    source: "merchants.ts, flow-orchestration.ts",
  },
  {
    num: 8,
    question: "How is flow orchestration managed?",
    answer:
      "flow-runner-api implements saga/compensating-transaction pattern. Steps execute in order; on failure, compensation runs in reverse. State persisted in DynamoDB with conditional writes for idempotency.",
    source: "flow-orchestration.ts",
  },
  {
    num: 9,
    question: "What data stores are used?",
    answer:
      "PostgreSQL (subscriptions, orders, audit), DynamoDB (sessions with 30-min TTL, flow state), Redis (product catalog cache, tokens with 24h TTL), Oracle (legacy CPM integration).",
    source: "go-repo config.yaml, architecture.ts",
  },
  {
    num: 10,
    question: "How are new partners onboarded?",
    answer:
      "Implement the MerchantProvider Go interface, deploy a new merchant-api-<provider> service, configure auth credentials in AWS Secrets Manager, add routing rule in reseller-service to dispatch by providerId. Independent CI/CD pipeline via GitLab → Docker → ECR → ArgoCD.",
    source: "merchants.ts",
  },
];

// ─── Requirements Review ─────────────────────────────────────────────────────

export interface Requirement {
  id: string;
  text: string;
}

export interface RequirementComponent {
  component: string;
  businessProblem: string;
  requirements: Requirement[];
}

export const requirementsReview: RequirementComponent[] = [
  {
    component: "reseller-service (Core Write Orchestrator)",
    businessProblem:
      "Bell customers need to add, change, cancel, and reverse streaming subscriptions across 5 providers through a single interface, with full audit trail and consistent state.",
    requirements: [
      { id: "R1", text: "Single API entry point for all subscription mutations (add, cancel, change, reverse)" },
      { id: "R2", text: "Provider-agnostic — UI must not know which merchant handles provisioning" },
      { id: "R3", text: "Every state change must be logged to audit-api with correlation ID" },
      { id: "R4", text: "Kafka event published on every mutation for downstream consumers" },
      { id: "R5", text: "Agent-assisted flows must link agent identity to audit trail via cloned sessions" },
      { id: "R6", text: "Idempotent order submission — duplicate calls rejected" },
    ],
  },
  {
    component: "Merchant Adapter Layer",
    businessProblem:
      "Each streaming provider (Netflix, Disney+, Bango, Bell Media, Radio-Canada) has a different API contract, auth scheme, and callback SLA. Bell must integrate all of them behind a uniform interface.",
    requirements: [
      { id: "R1", text: "Common MerchantProvider interface for all providers (Provision, Deprovision, CheckStatus, HandleCallback)" },
      { id: "R2", text: "Provider-specific auth (OAuth2, HMAC, JWT, API key)" },
      { id: "R3", text: "Circuit breaker per merchant to prevent cascade failures" },
      { id: "R4", text: "Grace period handling (3–7 days depending on provider) — suspend, don't cancel" },
      { id: "R5", text: "Async webhook support for providers with deferred provisioning" },
    ],
  },
  {
    component: "Session & Qualification Layer",
    businessProblem:
      "Before any order, the system must validate the customer's account exists in CPM and check eligibility against the product catalog — without exposing these checks to the customer.",
    requirements: [
      { id: "R1", text: "Session creation validates account via household-api → CPM" },
      { id: "R2", text: "Session stored in DynamoDB with 30-minute TTL, consumed after order submission" },
      { id: "R3", text: "Qualification re-evaluated on every plan selection change" },
      { id: "R4", text: "Agent flow uses cloneSession (not generateSession) to link audit trail" },
    ],
  },
];

// ─── Data Mapping ────────────────────────────────────────────────────────────

export interface DataMappingRow {
  uiField: string;
  graphqlVar: string;
  goField: string;
  dbColumn: string;
  notes: string;
}

export const addSubscriptionMapping: DataMappingRow[] = [
  { uiField: "Household ID (URL param)", graphqlVar: "customerInfo.householdAccountNumber", goField: "HouseholdAccountNumber", dbColumn: "— (CPM lookup key)", notes: "Validated via household-api" },
  { uiField: "Billing Account", graphqlVar: "customerInfo.billingAccountNumber", goField: "BillingAccountNumber", dbColumn: "billing_account_number (PG)", notes: "Session + subscription PK" },
  { uiField: "TV Account", graphqlVar: "customerInfo.tvAccountNumber", goField: "TVAccountNumber", dbColumn: "tv_account_number (PG)", notes: "Used for GET /subscriptions" },
  { uiField: "— (auto)", graphqlVar: "sessionId (return)", goField: "SessionID", dbColumn: "PK: SESSION#<id> (DynamoDB)", notes: "30-min TTL" },
  { uiField: "Plan card click", graphqlVar: "operationType: APPLY_TO_ORDER", goField: "OperationType", dbColumn: "— (controls flow logic)", notes: "Also: DELETE, REVERSE_*" },
  { uiField: "Selected plan", graphqlVar: "selectedPlan.productId", goField: "ProductID", dbColumn: "product_id (PG)", notes: "FK to catalog" },
  { uiField: "Billing cycle toggle", graphqlVar: "selectedPlan.billingCycle", goField: "BillingCycle", dbColumn: "billing_cycle (PG)", notes: "MONTHLY / ANNUAL" },
  { uiField: "— (auto)", graphqlVar: "orderId (return)", goField: "OrderID", dbColumn: "id (PG orders table)", notes: "UUID" },
  { uiField: "— (auto)", graphqlVar: "subscriptionId (return)", goField: "SubscriptionID", dbColumn: "id (PG subscriptions table)", notes: "UUID" },
  { uiField: "— (auto)", graphqlVar: "status (return)", goField: "Status", dbColumn: "status (PG)", notes: "PENDING → ACTIVE" },
  { uiField: "— (auto)", graphqlVar: "activationUrl (return)", goField: "ActivationURL", dbColumn: "— (from merchant)", notes: "Redirects to provider" },
];

export interface KafkaFieldRow {
  field: string;
  source: string;
  description: string;
}

export const kafkaEventPayload: KafkaFieldRow[] = [
  { field: 'eventType: "OrderCreated"', source: "reseller-service", description: "Event type discriminator" },
  { field: "eventId", source: "UUID v4", description: "Idempotency key" },
  { field: "payload.orderId", source: "PostgreSQL orders.id", description: "Links back to order" },
  { field: "payload.subscriptionId", source: "PostgreSQL subscriptions.id", description: "Links back to subscription" },
  { field: "payload.billingAccountNumber", source: "Request input", description: "Customer identifier" },
  { field: "payload.productId", source: "Request input → catalog lookup", description: "Product from catalog" },
  { field: "payload.providerId", source: "Catalog mapping", description: "netflix / disney / bango / bellmedia / radiocanada" },
  { field: 'payload.status', source: '"PENDING"', description: "Initial status" },
  { field: "payload.price", source: "Catalog → qualification result", description: "Decimal amount" },
  { field: "payload.billingCycle", source: "Request input", description: "MONTHLY / ANNUAL" },
];

// ─── API Specs ───────────────────────────────────────────────────────────────

export interface ApiSpecRow {
  service: string;
  location: string;
  protocol: string;
}

export const openApiSpecs: ApiSpecRow[] = [
  { service: "order-api", location: "/services/order-api/openapi.yaml", protocol: "REST" },
  { service: "reseller-service", location: "/services/reseller-service/doc/openapi.yaml", protocol: "REST (codegen)" },
  { service: "subscription-configurator-api", location: "/services/subscription-configurator-api/openapi.yaml", protocol: "REST" },
  { service: "auth-api", location: "/services/auth-api/openapi.yaml", protocol: "REST" },
  { service: "membership-api", location: "/services/membership-api/openapi.yaml", protocol: "REST" },
  { service: "audit-api", location: "/services/audit-api/openapi.yaml", protocol: "REST" },
  { service: "promocode-redemptions-api", location: "/services/promocode-redemptions-api/gen/doc/openapi.yaml", protocol: "gRPC+REST" },
  { service: "core-processor-api", location: "/services/core-processor-api-v1/openapi.yaml", protocol: "REST" },
  { service: "event-publisher", location: "/services/event-publisher/doc/openapi.yaml", protocol: "REST" },
];

export interface ProtoSpecRow {
  service: string;
  location: string;
}

export const grpcProtoFiles: ProtoSpecRow[] = [
  { service: "promocodes-api", location: "/services/promocodes-api/models/proto/promocode/promocode.proto" },
  { service: "promocode-redemptions-api", location: "/services/promocode-redemptions-api/proto/promocode-redemptions/promocode_redemptions.proto" },
];

// ─── JDL Domain Model ───────────────────────────────────────────────────────

export const jdlDomainModel = `entity Subscription {
  id                   UUID        required
  billingAccountNumber String      required  /** Bell BAN */
  tvAccountNumber      String      required
  productId            String      required  /** FK to catalog */
  providerId           String      required  /** netflix|disney|bango|bellmedia|radiocanada */
  status               SubscriptionStatus required
  price                BigDecimal  required
  billingCycle         BillingCycle required
  startDate            Instant     required
  endDate              Instant
  activationUrl        String               /** merchant redirect URL */
}

entity Order {
  id                UUID             required
  subscriptionId    UUID             required  /** FK → Subscription */
  sessionId         String           required  /** DynamoDB reference */
  operationType     OperationType    required
  status            OrderStatus      required
  merchantResponse  TextBlob                  /** raw provider JSON */
  createdAt         Instant          required
  completedAt       Instant
}

entity Provision {
  id                 UUID             required
  orderId            UUID             required  /** FK → Order */
  providerId         String           required
  merchantStatus     MerchantStatus   required
  externalReference  String                    /** merchant's order ID */
  attemptCount       Integer          required
  lastError          String
}

entity Session {
  sessionId          String    required  /** DynamoDB PK */
  accountNumber      String    required  /** BAN */
  tvAccountNumber    String    required
  agentId            String             /** null for customer flows */
  originalSessionId  String             /** for cloned agent sessions */
  consumed           Boolean   required  /** true after order submit */
  ttl                Long      required  /** Unix timestamp, 30-min */
}

entity AuditLog {
  id            UUID     required
  action        String   required  /** ORDER_PLACED|ACTIVATED|CANCELLED|RECOVERED */
  entityType    String   required  /** subscription|order|provision */
  entityId      UUID     required
  agentId       String            /** null for customer actions */
  correlationId String   required
  beforeState   TextBlob
  afterState    TextBlob
  createdAt     Instant  required
}

entity FlowExecution {
  flowId         String       required  /** DynamoDB PK */
  flowType       FlowType     required
  status         FlowStatus   required
  currentStep    Integer      required
  correlationId  String       required
  ttl            Long         required  /** 30-day auto-cleanup */
}

enum SubscriptionStatus { PENDING, ACTIVE, CANCELLED, GRACE_PERIOD, SUSPENDED }
enum OrderStatus { PENDING, COMPLETED, FAILED, REVERSED }
enum OperationType { APPLY_TO_ORDER, DELETE, REVERSE_ADD, REVERSE_DELETE, REVERSE_DOWNGRADE }
enum BillingCycle { MONTHLY, QUARTERLY, ANNUAL }
enum MerchantStatus { PROVISIONED, DEPROVISIONED, SUSPENDED, FAILED }
enum FlowType { ORDER_SUBMISSION, ACTIVATION, RECOVERY }
enum FlowStatus { RUNNING, COMPLETED, FAILED, COMPENSATING, COMPENSATION_FAILED }

relationship OneToMany {
  Subscription{orders} to Order{subscription}
  Order{provisions} to Provision{order}
}`;

// ─── Orchestration Specs ─────────────────────────────────────────────────────

export interface OrchestrationStep {
  step: number;
  service: string;
  action: string;
  trigger: string;
  payload: string;
  errorHandling: string;
}

export const orderSubmissionFlow: OrchestrationStep[] = [
  { step: 1, service: "reseller-service", action: "Validate session", trigger: "submitSubscription mutation via AppSync", payload: "sessionId, selectedPlan", errorHandling: "Session expired → 404 → UI restarts session" },
  { step: 2, service: "reseller-service → PostgreSQL", action: "Write subscription + order", trigger: "Step 1 success", payload: "billingAccountNumber, productId, billingCycle, price", errorHandling: "DB failure → transaction rollback → 500" },
  { step: 3, service: "reseller-service → merchant-api-*", action: "Provision with provider", trigger: "Step 2 success; providerId routes to correct adapter", payload: "ProvisionRequest{SubscriptionID, AccountNumber, ProductID, PlanDetails}", errorHandling: "Merchant reject → mark FAILED; circuit breaker opens after 5 failures" },
  { step: 4, service: "reseller-service → Kafka", action: "Publish OrderCreated", trigger: "Step 2 success (fire-and-forget)", payload: "Full OrderCreated event payload (see Data Mapping)", errorHandling: "Kafka failure → DLQ; order still committed" },
  { step: 5, service: "reseller-service → audit-api", action: "Log order action", trigger: "Step 2 success", payload: "action: ORDER_PLACED, entityId, correlationId, agentId (if agent)", errorHandling: "Audit failure → logged but non-blocking" },
  { step: 6, service: "Return to UI", action: "orderId, subscriptionId, status: PENDING", trigger: "Steps 2–3 complete", payload: "GraphQL response", errorHandling: "—" },
];

export const activationFlow: OrchestrationStep[] = [
  { step: 1, service: "reseller-service", action: "Validate subscription exists, status=PENDING", trigger: "activateSubscription mutation", payload: "subscriptionId", errorHandling: "Not found/wrong status → 400" },
  { step: 2, service: "reseller-service → PostgreSQL", action: "Update status PENDING → ACTIVE", trigger: "Step 1 success", payload: "status: ACTIVE, activatedAt", errorHandling: "Rollback on failure" },
  { step: 3, service: "reseller-service → merchant-api-*", action: "Activate with provider", trigger: "Step 2 success", payload: "ProvisionRequest + subscriptionId", errorHandling: "Failure → status stays PENDING; retry via fulfillment-process Lambda" },
  { step: 4, service: "reseller-service → Kafka", action: "Publish ActivationCompleted", trigger: "Step 3 success", payload: "activationUrl, activatedAt", errorHandling: "DLQ on Kafka failure" },
  { step: 5, service: "reseller-service → audit-api", action: "Log activation", trigger: "Step 3 success", payload: "action: ACTIVATED", errorHandling: "Non-blocking" },
  { step: 6, service: "Return to UI", action: "activationUrl (redirect to provider)", trigger: "Step 3 success", payload: "GraphQL response with activationUrl", errorHandling: "—" },
];

export interface SagaStep {
  step: string;
  execute: string;
  compensate: string;
}

export const sagaSteps: SagaStep[] = [
  { step: "1. Validate account", execute: "household-api → CPM check", compensate: "— (read-only, no compensation)" },
  { step: "2. Check eligibility", execute: "catalog-api → Redis qualification", compensate: "— (read-only)" },
  { step: "3. Provision merchant", execute: "merchant-api-* → external provider", compensate: "Deprovision via same merchant-api" },
  { step: "4. Write to PostgreSQL", execute: "reseller-service → INSERT subscription+order", compensate: "DELETE subscription+order" },
  { step: "5. Publish event", execute: 'Kafka OrderCreated', compensate: "Publish OrderReversed" },
  { step: "6. Log audit", execute: "audit-api → PostgreSQL", compensate: 'Log COMPENSATED entry' },
];

// ─── Acceptance Criteria ─────────────────────────────────────────────────────

export interface AcceptanceCriterion {
  id: string;
  text: string;
}

export interface UserStory {
  num: number;
  title: string;
  asA: string;
  iWantTo: string;
  soThat: string;
  criteria: AcceptanceCriterion[];
}

export const userStories: UserStory[] = [
  {
    num: 1,
    title: "Add Subscription (Flow 1)",
    asA: "Bell residential customer",
    iWantTo: "add a streaming subscription (Netflix/Disney+/etc.) to my account",
    soThat: "I get bundled billing and provider access",
    criteria: [
      { id: "AC-1.1", text: 'Given a valid householdAccountNumber, when I click "Add", then generateSession creates a DynamoDB session with 30-min TTL and validates my account via CPM' },
      { id: "AC-1.2", text: "Given a valid session, when the catalog renders, then subscriptionQualification(APPLY_TO_ORDER) returns only plans I'm eligible for based on my account type and province" },
      { id: "AC-1.3", text: 'Given I select a plan, when I click "Place Order", then submitSubscription writes a subscription (status=PENDING) and order to PostgreSQL, calls the appropriate merchant-api-* for provisioning, publishes OrderCreated to Kafka, and logs to audit-api' },
      { id: "AC-1.4", text: "Given order submission succeeds, when the confirm screen loads, then activateSubscription returns an activationUrl that redirects me to the provider's signup page" },
      { id: "AC-1.5", text: "Given merchant provisioning fails, then the order status is set to FAILED, the fulfillment-process Lambda retries with exponential backoff, and the UI shows a provider-specific error" },
      { id: "AC-1.6", text: "Given I submit the same order twice, then the second call is rejected (idempotent)" },
    ],
  },
  {
    num: 2,
    title: "Cancel Subscription (Flow 2)",
    asA: "Bell customer",
    iWantTo: "cancel a streaming subscription",
    soThat: "I stop being billed",
    criteria: [
      { id: "AC-2.1", text: 'Given I click "Cancel" on a subscription card, then subscriptionQualification(DELETE) validates I can cancel' },
      { id: "AC-2.2", text: "Given I confirm cancellation, then submitSubscription sets status to CANCELLED in PostgreSQL, calls merchant-api-* to deprovision, publishes StatusChanged to Kafka, and logs to audit-api" },
      { id: "AC-2.3", text: "Given the merchant has a grace period (3–7 days), then the subscription enters GRACE_PERIOD status instead of immediate CANCELLED" },
      { id: "AC-2.4", text: "Given cancellation succeeds, then notification-consumer sends a cancellation confirmation email via SES" },
    ],
  },
  {
    num: 3,
    title: "Onboard New Merchant Partner",
    asA: "platform engineer",
    iWantTo: "onboard a new streaming provider",
    soThat: "Bell can offer their content to customers",
    criteria: [
      { id: "AC-3.1", text: "Given the new provider's API spec, then a new merchant-api-<provider> Go service implements the MerchantProvider interface (Provision, Deprovision, CheckStatus, HandleCallback)" },
      { id: "AC-3.2", text: "Given the service is deployed, then reseller-service routes to it based on the new providerId in the product catalog" },
      { id: "AC-3.3", text: "Given the provider uses async callbacks, then the merchant-callback-lambda is configured to receive and process webhooks" },
      { id: "AC-3.4", text: "Given the provider is integrated, then circuit breaker thresholds are configured (default: 5 failures / 30s half-open)" },
      { id: "AC-3.5", text: "Given provider API keys, then credentials are stored in AWS Secrets Manager and rotated via secret-rotator-lambda" },
      { id: "AC-3.6", text: "Given the merchant service is deployed independently, then it has its own GitLab CI → Docker → ECR → ArgoCD pipeline" },
    ],
  },
];

// ─── Domain Model & Integration Patterns ─────────────────────────────────────

export interface SystemOfRecordRow {
  entity: string;
  systemOfRecord: string;
  readPath: string;
  writePath: string;
}

export const systemsOfRecord: SystemOfRecordRow[] = [
  { entity: "Subscription state", systemOfRecord: "reseller-service → PostgreSQL", readPath: "aggregator-api (merges PG+CPM)", writePath: "reseller-service (via AppSync)" },
  { entity: "Equipment/account", systemOfRecord: "CPM (via household-api)", readPath: "household-api → CPM", writePath: "— (external system)" },
  { entity: "Product catalog", systemOfRecord: "catalog-api → Redis", readPath: "catalog-api (GraphQL, Redis cache)", writePath: "catalog-manager (Kafka consumer keeps Redis fresh)" },
  { entity: "Sessions", systemOfRecord: "session-api → DynamoDB", readPath: "session-api", writePath: "session-api (30-min TTL)" },
  { entity: "Provisioning state", systemOfRecord: "merchant-api-* → external providers", readPath: "CheckStatus on merchant-api", writePath: "Provision/Deprovision on merchant-api" },
  { entity: "Audit trail", systemOfRecord: "audit-api → PostgreSQL", readPath: "audit-api", writePath: "audit-api (also Kafka consumer)" },
  { entity: "Flow execution", systemOfRecord: "flow-runner-api → DynamoDB", readPath: "GET /v1/flows/:flowId", writePath: "POST /v1/flows" },
];

export interface IntegrationPatternRow {
  pattern: string;
  whereUsed: string;
  evidence: string;
}

export const integrationPatterns: IntegrationPatternRow[] = [
  { pattern: "Orchestration (Saga)", whereUsed: "flow-runner-api — multi-step flows with compensating transactions", evidence: "flow-orchestration.ts: FlowExecutor.Execute() + compensate() in reverse order" },
  { pattern: "Event-Driven (Pub/Sub)", whereUsed: "Kafka topics for all subscription lifecycle events", evidence: "events.ts: 14 event types, 10 consumers, at-least-once delivery" },
  { pattern: "Adapter", whereUsed: '5 merchant-api-* services behind MerchantProvider interface', evidence: "merchants.ts: common interface, provider-specific implementations" },
  { pattern: "CQRS", whereUsed: "Write: reseller-service → PG. Read: aggregator-api → PG+CPM", evidence: "architecture.ts: separate write/read services, different protocols" },
  { pattern: "API Gateway", whereUsed: "AppSync (GraphQL gateway) for all mutations", evidence: "architecture.ts: UI → BFF → AppSync → Go services" },
  { pattern: "BFF (Backend-for-Frontend)", whereUsed: "Next.js /api/protected/* — holds tokens, enforces account isolation", evidence: "architecture.ts:nodeDetails.bff" },
  { pattern: "Circuit Breaker", whereUsed: "Go hystrix per merchant-api with provider-specific thresholds", evidence: "merchants.ts: 5 failures/30s, 30s half-open window" },
  { pattern: "Dead-Letter Queue", whereUsed: "Kafka DLQ for failed events → fallout-process Lambda", evidence: "events-messaging.ts: event-hub routes failures to DLQ" },
  { pattern: "Outbox/Fire-and-Forget", whereUsed: "reseller-service publishes to Kafka after PG commit (non-blocking)", evidence: 'errors.ts: "Kafka failure → DLQ; order still created"' },
  { pattern: "Compensating Transaction", whereUsed: "flow-runner-api rolls back completed steps in reverse order on failure", evidence: "flow-orchestration.ts: compensate() function" },
  { pattern: "Anti-Corruption Layer", whereUsed: "household-api wraps CPM (legacy SOAP/REST) behind clean GraphQL", evidence: "flow-orchestration.ts:householdApi: CPM client with graceful degradation" },
];

// ─── Assessment Q&A ──────────────────────────────────────────────────────────

export interface AssessmentQA {
  num: number;
  question: string;
  answer: string;
}

export const assessmentQA: AssessmentQA[] = [
  {
    num: 1,
    question: "Walk me through an integration end-to-end",
    answer: `I'll trace the Add Subscription flow. The customer authenticates via SAML SSO and the BFF obtains an OAuth2 token from auth-api. When they click 'Add', the BFF sends a generateSession mutation through AppSync to session-api, which creates a DynamoDB session and validates the account via household-api → CPM. The catalog screen triggers subscriptionQualification(APPLY_TO_ORDER), which goes through AppSync to reseller-service, which calls catalog-api (Redis-cached) for eligible plans. On 'Place Order', submitSubscription hits reseller-service, which writes to PostgreSQL, calls the appropriate merchant-api-* for provisioning (routed by providerId), publishes an OrderCreated event to Kafka, and logs to audit-api. Finally, activateSubscription returns an activationUrl that redirects the customer to the provider. Downstream, Kafka consumers handle notifications, billing sync, and fulfillment confirmation asynchronously.`,
  },
  {
    num: 2,
    question: "How do you onboard a new partner?",
    answer: `We implement the MerchantProvider Go interface — four methods: Provision, Deprovision, CheckStatus, HandleCallback. Deploy as a new merchant-api-<provider> microservice with its own CI/CD pipeline (GitLab → Docker → ECR → ArgoCD). Add the provider's auth credentials to AWS Secrets Manager. Configure reseller-service to route to the new adapter by providerId. Set circuit breaker thresholds (default 5 failures / 30s). Configure the merchant-callback-lambda for webhook handling. Add the provider's products to the catalog with the new providerId. The adapter pattern means zero changes to the UI or AppSync layer.`,
  },
  {
    num: 3,
    question: "How do you handle failures in a multi-step integration?",
    answer: `Three layers. First, flow-runner-api implements the saga pattern — steps execute in order, and on failure, compensation runs in reverse (e.g., deprovision merchant → delete DB records → publish reversal event). State is persisted to DynamoDB after each step, so flows survive service restarts. Second, circuit breakers (Go hystrix) per merchant prevent cascade failures — opens after 5 consecutive failures, half-open probe after 30s. Third, Kafka DLQ catches events that fail processing after 3 retries, and the fallout-process Lambda attempts auto-remediation before escalating to the ops team.`,
  },
  {
    num: 4,
    question: "How do you ensure data consistency across systems?",
    answer: `We use eventual consistency via Kafka events with idempotent consumers. reseller-service commits to PostgreSQL first (source of truth for write-side), then publishes events asynchronously (fire-and-forget — if Kafka fails, events go to DLQ but the order is still committed). Consumers are idempotent — deduplication by eventId. For critical multi-step flows, flow-runner-api uses DynamoDB conditional writes for idempotency. Sessions have a 'consumed' flag to prevent replay attacks. For state reconciliation, account-recovery-api scans for inconsistencies between PostgreSQL and merchant systems and executes corrections.`,
  },
  {
    num: 5,
    question: "What's your approach to requirements gathering for an API integration?",
    answer: `I start with the business problem — in our case, 'Bell customers need to manage streaming subscriptions from 5 providers through a single interface.' Then I identify the integration questions: What's the system of record? What are the data flows? What failure modes exist? I document field-level data mappings (UI → GraphQL → Go → database), define the API contracts (we use OpenAPI specs and a shared MerchantProvider Go interface), and write acceptance criteria that cover the happy path, error scenarios, and edge cases like grace periods and idempotency. I validate requirements by tracing each user flow end-to-end through the architecture.`,
  },
  {
    num: 6,
    question: "How do you handle API versioning and contract changes?",
    answer: `Our services use OpenAPI codegen — the spec is the contract. reseller-service, order-api, auth-api, and others each maintain an openapi.yaml. The AppSync GraphQL schema acts as the stable frontend contract. For merchant integrations, the adapter pattern isolates provider API changes — a Netflix API change only affects merchant-api-netflix, not reseller-service or the UI. For breaking changes, we deploy a new versioned service (e.g., reseller-api-v2) alongside the old one, migrate consumers, then decommission.`,
  },
  {
    num: 7,
    question: "Describe the CQRS pattern in your system",
    answer: `Write-side: all mutations go through reseller-service → PostgreSQL. Read-side: subscription listing goes through subscriptions-aggregator-api, which merges PostgreSQL data with CPM (equipment, account info) and bypasses AppSync entirely (direct REST from BFF). This separation lets us scale reads independently, optimize the read model for the UI's needs, and keep the write-side focused on business logic and event publishing. The read model stays in sync via Kafka consumers that react to write-side events.`,
  },
  {
    num: 8,
    question: "What non-functional requirements would you define for this integration?",
    answer: `From our code: Availability SLAs (99.95% for critical path services like reseller-service and event-hub). Latency budgets — generateSession: 100–300ms, subscriptionQualification: 300–800ms, submitSubscription: 500ms–2s (includes merchant round-trip). Circuit breaker thresholds per merchant. Kafka consumer lag < 5s p99. Session TTL of 30 minutes. Notification delivery < 5s from event to email dispatch. Token refresh before expiry. Bilingual support (EN/FR routing). Audit trail immutability. Feature flag fallback (all flags default OFF if Unleash unreachable).`,
  },
];

// ─── General BSA Questions ───────────────────────────────────────────────────

export const generalBsaQuestions: AssessmentQA[] = [
  {
    num: 1,
    question: "Walk me through your experience as a Business Systems Analyst on integration or API work.",
    answer: `I've spent over two years as a BSA on Bell Canada's subscription management platform — a 60+ microservice Go backend integrated with a Next.js micro-frontend. My core responsibility was bridging business stakeholders (product owners, marketing, billing) with engineering teams building API integrations for 5 streaming providers (Netflix, Disney+, Bango, Bell Media, Radio-Canada).

Day to day, I owned the integration requirements lifecycle: gathering business needs from stakeholders, translating them into technical artifacts (data mappings, OpenAPI spec reviews, orchestration flow specs), writing acceptance criteria for integration stories, and validating delivered work against the original requirements. I maintained field-level data mapping documents tracing every field from the UI through GraphQL mutations, Go service handlers, down to PostgreSQL columns and Kafka event payloads.

I also led grooming sessions with developers, walked QA through end-to-end test scenarios across the saga orchestration pattern (flow-runner-api), and facilitated incident reviews when merchant provisioning failures exposed gaps between documented and actual system behavior. The platform uses CQRS, event-driven architecture (Kafka with 14+ event types), circuit breakers per merchant, and a saga pattern with compensating transactions — so I needed deep understanding of these patterns to write requirements that accounted for async behavior, eventual consistency, and failure recovery.`,
  },
  {
    num: 2,
    question: "How do you gather and document integration requirements when stakeholders are unclear or in different locations?",
    answer: `I use a structured approach that doesn't depend on having everyone in the same room. First, I anchor every conversation around a concrete data flow. On the Bell project, I would sketch the end-to-end path — UI input → BFF → AppSync → reseller-service → merchant-api → Kafka → downstream consumers — and ask each stakeholder to validate their segment. Product owners confirm the business rules, backend developers confirm the service contracts, and QA confirms the edge cases.

For remote/async collaboration, I create shared artifacts that act as conversation anchors: a data mapping spreadsheet (UI Field → GraphQL Variable → Go Field → DB Column → Notes), a Mermaid sequence diagram of the flow, and a draft acceptance criteria list in Given-When-Then format. I circulate these asynchronously, mark open questions with "[TBD]" tags, and schedule focused 15-minute calls to resolve specific ambiguities rather than broad requirement-gathering meetings.

When stakeholders are unclear, I use the "walk me through the user's journey" technique — I ask them to describe what the customer sees and does at each step, then I map those UI actions to the underlying API calls. This surfaces implicit assumptions. For example, on Bell, the product owner assumed cancellation was instant, but tracing the flow revealed a 3–7 day grace period depending on the provider — a critical business rule that wasn't documented until I mapped the data flow.`,
  },
  {
    num: 3,
    question: "How do you create and maintain data mapping documents between front end, back end, and APIs?",
    answer: `I create a multi-column mapping table that traces each field across all integration layers. On the Bell project, the columns were: UI Field (what the user sees/interacts with), GraphQL Variable (the mutation input field name), Backend Go Field (the struct field in the service), Database Column (PostgreSQL column or DynamoDB key), and Notes (constraints, transformations, defaults).

For example, the "Billing Account" field maps as: UI "Billing Account" input → GraphQL customerInfo.billingAccountNumber → Go BillingAccountNumber → PG billing_account_number (PG). The Notes column captures that this field serves as both the session PK and subscription PK.

For auto-generated fields (like subscriptionId, orderId, sessionId), I mark the UI column as "— (auto)" and document where the value originates and what triggers its generation. For Kafka event payloads, I maintain a separate mapping showing which fields come from the request input versus database lookups versus catalog enrichment.

I keep these documents alive by treating them as part of the story definition — every integration story must reference or update the data mapping before it's accepted into a sprint. During grooming, I pull up the mapping to confirm field names, types, and nullable constraints with developers. After deployment, I validate the mapping by tracing a real request through logs to confirm the actual field values match the documented path.`,
  },
  {
    num: 4,
    question: "What information do you include in API product specifications or OpenAPI-related documentation?",
    answer: `On the Bell platform, we maintained OpenAPI specs for 9+ services (reseller-service, order-api, auth-api, audit-api, subscription-configurator-api, membership-api, promocode-redemptions-api, core-processor-api, event-publisher). Each spec includes:

1. Endpoint definitions — method, path, description (e.g., POST /v1/orders, GET /v1/subscriptions/{id})
2. Request/response schemas — field names, types, required vs. optional, enums with exact allowed values (e.g., SubscriptionStatus: PENDING | ACTIVE | CANCELLED | GRACE_PERIOD | SUSPENDED)
3. Authentication requirements — which OAuth2 scopes are needed (subscription-manager/query, subscriptions-aggregator-api/read)
4. Error responses — HTTP status codes with error body schemas, mapping specific business scenarios to codes (session expired → 404, wrong subscription status → 400, merchant timeout → 502)
5. Rate limiting and SLA information — latency budgets (e.g., submitSubscription: 500ms–2s p99)
6. Examples — request/response samples for happy path and key error scenarios

For the GraphQL layer (AppSync), I documented the 5 mutations and 1 REST read with their complete input types and return types. For gRPC services (promocodes-api), the proto files serve as the spec. I always cross-reference the OpenAPI spec against the actual data mapping to ensure field names, types, and constraints are consistent across layers.`,
  },
  {
    num: 5,
    question: "How do you write acceptance criteria for integration stories?",
    answer: `I write acceptance criteria in Given-When-Then format, and I always cover four dimensions: happy path, error/failure scenarios, edge cases, and non-functional requirements.

For the "Add Subscription" story on Bell, the criteria looked like:
- Happy path: "Given a valid householdAccountNumber, when I click 'Add', then generateSession creates a DynamoDB session with 30-min TTL and validates my account via CPM"
- Error scenario: "Given merchant provisioning fails, then the order status is set to FAILED, the fulfillment-process Lambda retries with exponential backoff, and the UI shows a provider-specific error"
- Edge case: "Given I submit the same order twice, then the second call is rejected (idempotent)"
- Async behavior: "Given cancellation succeeds, then notification-consumer sends a cancellation confirmation email via SES"

Key principles: Each AC must be independently testable. I avoid vague language like "the system should handle errors" — instead I specify which error, what the system does, and what the user sees. For integration stories specifically, I include the Kafka events that should be published (e.g., "publishes OrderCreated to Kafka") because those are downstream contracts that QA needs to verify.

I also link each AC back to a specific step in the orchestration spec, so QA can trace exactly which service interaction each criterion is testing.`,
  },
  {
    num: 6,
    question: "How do you lead grooming and story pointing with developers when the solution is still being clarified?",
    answer: `When the solution is unclear, I shift the grooming from "estimate this" to "what do we need to learn before we can estimate this?" I use a technique I call "progressive decomposition."

First, I present what we do know — typically a sequence diagram showing the proposed data flow and a draft data mapping. On Bell, I'd show the flow through AppSync → reseller-service → merchant-api and say "here's what we think the request looks like, here's where we think the data lands."

Then I explicitly list the unknowns as spike stories. For example, when integrating a new merchant (Radio-Canada), the unknowns were: What auth scheme do they use? Do they support sync or async provisioning? What's their webhook format? Each of these became a time-boxed investigation story (e.g., "Spike: Investigate Radio-Canada API auth — 2 days").

For the main story, I point using relative complexity against known stories. "This is similar to the Netflix integration, which was X points, but their auth is HMAC instead of OAuth2, so add Y for the adapter complexity."

I also keep a parking lot of "decisions needed" items visible during grooming. If a developer raises a concern about error handling that we haven't resolved, I capture it, assign an owner, and set a deadline — but I don't let it block the grooming session. The goal is to leave with a shared understanding of the shape of the work, even if details are still evolving.`,
  },
  {
    num: 7,
    question: "Tell me about a time you found a mismatch between business requirements and system behavior.",
    answer: `On the Bell project, the product owner documented that cancelling a subscription should immediately remove it from the customer's account. When I traced the actual flow through the codebase, I discovered a significant mismatch: the system didn't cancel immediately. Instead, for 4 of the 5 providers, the subscription entered a GRACE_PERIOD status (3–7 days depending on the merchant) during which the customer retained access. This was a contractual requirement from the streaming providers — Netflix required a 3-day window, Bango required 7 days.

The gap existed because the original requirements were written from the customer's perspective ("I cancel and it's done"), but the system behavior was driven by merchant contract constraints that weren't visible to the product team.

I documented the mismatch with a state machine diagram showing all the transitions: ACTIVE → GRACE_PERIOD → CANCELLED (with auto-resume path if payment was resolved). I presented this to the product owner and UX team together, and we redesigned the cancellation confirmation screen to show "Your subscription will end on [date]" instead of "Your subscription has been cancelled." We also added a Kafka event consumer that sends a follow-up email when the grace period expires.

The broader lesson was that integration requirements need to be validated against the external system's behavior, not just the business team's assumptions. I now always ask: "What does the external system actually do when we call this API?" — not just "What do we want it to do?"`,
  },
  {
    num: 8,
    question: "How do you validate that completed work meets the original requirements?",
    answer: `I use a three-layer validation approach. First, I trace the data mapping end-to-end: I use the actual API response from a test transaction and verify each field matches the documented mapping. For example, I check that the GraphQL response contains subscriptionId matching the PostgreSQL subscriptions.id, that the status is PENDING (not ACTIVE), and that the Kafka OrderCreated event payload contains the correct billingAccountNumber and providerId.

Second, I verify async behavior by checking Kafka topic consumers. On Bell, I verify that the OrderCreated event was published after submitSubscription, that notification-consumer received it and dispatched the email via SES, and that the audit-api logged the ORDER_PLACED action with the correct correlationId.

Third, I run through the acceptance criteria checklist against the deployed feature. Each AC is a checkbox — I mark it pass/fail and capture evidence (screenshot, API response, log entry). For error scenarios, I use test fixtures to simulate merchant failures and verify the circuit breaker opens, the DLQ captures the event, and the UI shows the correct error message.

If any validation fails, I open a defect with the specific AC reference, the expected behavior (from the data mapping or orchestration spec), and the actual behavior observed. This traceability from requirement → AC → test → defect makes it easy for the developer to locate and fix the issue.`,
  },
  {
    num: 9,
    question: "How do you handle ambiguity or competing stakeholder priorities?",
    answer: `I make the trade-offs visible and let the right people decide. On the Bell project, a recurring tension was between the product team wanting fast time-to-market for new features and the platform team wanting architectural consistency across merchant integrations.

For example, when onboarding the Radio-Canada provider, the product team wanted a custom integration path to meet a launch deadline, while the platform team insisted on implementing the standard MerchantProvider interface (Provision, Deprovision, CheckStatus, HandleCallback). Both had legitimate concerns — speed vs. maintainability.

I documented both approaches side by side: Option A (custom) — 2-week delivery, but creates tech debt and requires separate error handling, monitoring, and onboarding docs. Option B (standard adapter) — 4-week delivery, but follows the same pattern as the other 4 merchants, uses the same circuit breaker configuration, and requires no new operational runbooks.

I presented this to both stakeholders together with a recommendation: "Let's do Option B but negotiate the scope — implement Provision and Deprovision first (covers 90% of launch needs), defer CheckStatus and HandleCallback to a fast-follow sprint." Both sides agreed because they could see their concerns addressed.

The key is: I don't resolve ambiguity by choosing sides. I resolve it by making the cost and benefit of each option explicit, then recommending a path that acknowledges the constraints of both parties.`,
  },
  {
    num: 10,
    question: "What integration patterns are you familiar with, and when would you choose one over another?",
    answer: `On the Bell platform, we used 11 integration patterns, and the choice between them was driven by two factors: consistency requirements and failure tolerance.

Synchronous API Gateway (AppSync) for mutations where the UI needs an immediate response — the customer clicks "Place Order" and needs to see a confirmation. Orchestration (Saga) via flow-runner-api when a multi-step process needs atomicity — order submission involves database writes, merchant provisioning, event publishing, and audit logging, all of which need to be compensated if any step fails.

Event-Driven Pub/Sub (Kafka) for downstream processing that doesn't need to block the user — notifications, billing sync, analytics. The key decision is: does the user need to wait for this? If no, publish an event and let consumers handle it asynchronously.

Adapter pattern for integrating multiple external systems with different contracts — the 5 merchant-api services each implement the same Go interface but handle different auth schemes (OAuth2, HMAC, JWT, API key). This lets the core reseller-service route by providerId without knowing the details of each merchant.

CQRS when read and write paths have different performance or data requirements — writes go through reseller-service → PostgreSQL, reads go through aggregator-api which merges PostgreSQL with CPM data. This lets us optimize and scale each path independently.

Circuit Breaker per external dependency to prevent cascade failures — if Netflix's API is down, we don't want it to take down Disney+ provisioning. Anti-Corruption Layer (household-api) to wrap a legacy system (CPM) behind a clean API.

The decision framework: Start with sync for simplicity. Add async (events) when you need to decouple. Add saga when you need distributed transactions. Add adapters when you have multiple external systems. Add CQRS when read and write patterns diverge.`,
  },
  {
    num: 11,
    question: "How do you approach domain modelling for a benefits or retirement product?",
    answer: `I'd apply the same methodology I used for the Bell subscription domain. Start by identifying the core entities and their lifecycle states, then map the relationships and integration boundaries.

For a benefits or retirement product at Canada Life, I'd start with: Who are the actors? (Plan member, employer/plan sponsor, advisor, administrator.) What are the core entities? (Member, Plan, Coverage/Benefit, Claim, Contribution, Payout.) What are the lifecycle states? (Coverage: PENDING → ACTIVE → SUSPENDED → TERMINATED, similar to how we modeled subscription status.)

Then I'd map the systems of record — which system owns each entity? The policy admin system owns plan definitions and coverage. The claims system owns claim adjudication. The payment system owns contributions and payouts. This is the same exercise we did on Bell, where reseller-service owned subscription state for writes but aggregator-api merged data from multiple sources for reads.

I'd define the integration boundaries: Where does data cross system boundaries? What's the contract? Are the interactions sync (API call) or async (event/message queue)? For example, when a plan member submits a claim, does the claims system call the eligibility system synchronously (like Bell's session validation), or does eligibility publish events that the claims system consumes (like Bell's Kafka pattern)?

The JDL-style domain model I created for Bell — with entities, enums for lifecycle states, and explicit relationship cardinalities — would translate directly. The key insight is: identify the bounded contexts (enrollment, claims, contributions, payouts), define the shared language within each context, and document the anti-corruption layers where contexts integrate.`,
  },
];

// ─── Technical Follow-up Questions ───────────────────────────────────────────

export const technicalFollowups: AssessmentQA[] = [
  {
    num: 1,
    question: "What is the purpose of an OpenAPI specification?",
    answer: `An OpenAPI spec serves as the single source of truth for an API's contract. It defines exactly what endpoints exist, what request/response shapes look like (fields, types, required vs. optional), what authentication is needed, and what error codes are returned — all in a machine-readable format (YAML/JSON).

On the Bell project, we maintained OpenAPI specs for 9 backend services. The specs served three critical purposes: First, code generation — reseller-service used OpenAPI codegen to generate Go server stubs and client SDKs, ensuring the implementation matched the contract. Second, documentation — developers on other teams could understand our API without reading our source code. Third, contract testing — QA validated that actual responses matched the schema defined in the spec.

The practical benefit is that when the product team asked "can we add a promo code field to the order?", I could open the openapi.yaml, show them the current schema, and we could discuss the change as a diff to the spec rather than an abstract conversation. The spec was the shared artifact that aligned business, BSA, developer, and QA teams.`,
  },
  {
    num: 2,
    question: "How do you translate business rules into request and response fields?",
    answer: `I start by documenting the business rule in plain language, then trace it through the data flow to identify where each field originates, transforms, and lands.

For example, the business rule "customers can only subscribe to plans available in their province" translates into: The UI sends customerInfo.billingAccountNumber → session-api validates the account via household-api → CPM returns the province → subscriptionQualification uses the province to filter the product catalog → only eligible plans are returned in the response.

The request field is billingAccountNumber (input), the intermediate field is province (derived from CPM lookup), and the response field is an array of eligible plans filtered by province. The business rule doesn't appear as a single field — it manifests as a filter condition applied during qualification.

For enum fields, I map business language to exact values: "customer cancels" → operationType: DELETE, "customer reverses a cancellation" → operationType: REVERSE_DELETE, "customer changes plan" → operationType: APPLY_TO_ORDER. These enums must match between the GraphQL schema, the Go service, and the database column.

The key technique: for every business rule, I ask three questions. What input triggers it? Where is the logic evaluated? What output reflects it? Then I document all three in the data mapping.`,
  },
  {
    num: 3,
    question: "How do you document error scenarios, edge cases, and status codes?",
    answer: `I categorize errors into four tiers and document each with: the trigger condition, the HTTP status code, the error response body, the UI behavior, and the recovery path.

Tier 1 — Client errors (4xx): Session expired (404 — UI restarts session flow), invalid subscription status for requested operation (400 — UI shows inline validation), duplicate order submission (409 — silently rejected, idempotent).

Tier 2 — Upstream dependency failures (502/503): Merchant API timeout (502 — order marked FAILED, fulfillment-process Lambda retries with exponential backoff and jitter, UI shows "Your order is being processed"), CPM unavailable (503 — session creation fails, UI shows "Service temporarily unavailable").

Tier 3 — Infrastructure failures: Database write failure (500 — transaction rollback, no side effects), Kafka publish failure (non-blocking — order still committed, event goes to DLQ for reprocessing).

Tier 4 — Async failure handling: Kafka consumer fails after 3 retries → event routed to DLQ → fallout-process Lambda attempts auto-remediation → if still failing, alerts ops team.

For edge cases, I document the specific business scenario: "Customer cancels during grace period" → subscription reverts to ACTIVE (not CANCELLED). "Agent clones an expired session" → cloneSession fails, agent must generate new session. "Merchant callback arrives after circuit breaker opens" → callback is still processed (circuit breaker only affects outbound calls).

On Bell, we documented 17 specific error scenarios in a structured table that QA used as their test plan.`,
  },
  {
    num: 4,
    question: "What is the difference between a sync API flow and an orchestrated flow?",
    answer: `A synchronous API flow is a single request-response cycle: the client sends a request, waits for the server to process it, and gets a response. On Bell, the GET /subscriptions read path is sync — BFF calls aggregator-api, which queries PostgreSQL and CPM, merges the data, and returns the result. The client blocks until it gets the response. Latency is the sum of all hops: BFF (< 50ms) + aggregator-api (200–500ms). If any step fails, the entire request fails immediately.

An orchestrated flow coordinates multiple independent steps that may involve different services, different databases, and even external systems. On Bell, the submitSubscription flow is orchestrated via flow-runner-api: (1) validate session, (2) write to PostgreSQL, (3) provision with merchant-api, (4) publish Kafka event, (5) log to audit-api. Each step has its own failure mode and compensation logic.

The key differences: Orchestrated flows need state persistence (DynamoDB in our case) so they survive service restarts. They need compensating transactions (saga pattern) — if step 3 fails after step 2 succeeds, we need to roll back step 2. They often mix sync and async — steps 1–3 are sync (user waits), steps 4–5 are fire-and-forget (user doesn't wait).

When to choose which: Use sync for simple reads and single-service writes. Use orchestration when you need distributed transactions across multiple services, especially when external systems are involved (they're the most likely failure point). On Bell, the merchant round-trip (300ms–1.5s) was the highest-latency step, which is why we added circuit breakers specifically on that hop.`,
  },
  {
    num: 5,
    question: "How do you decide whether a requirement belongs in the API layer, orchestration layer, or downstream system?",
    answer: `I use three questions to make this decision:

1. "Does the user need to wait for this?" If yes, it belongs in the synchronous API path. If no, it can be handled asynchronously by a downstream consumer. On Bell, merchant provisioning is synchronous (user needs the activationUrl), but email notifications are asynchronous (user doesn't wait for the email).

2. "Does this affect the core transaction's success?" If yes, it belongs in the orchestration layer with compensation logic. If no, it's a fire-and-forget side effect. On Bell, the PostgreSQL write and merchant provisioning are in the saga (they must both succeed or both be compensated). The Kafka event publish is fire-and-forget — if Kafka fails, the order is still committed and the event goes to DLQ for later reprocessing.

3. "Who owns the business logic?" Validation rules (is this account eligible?) belong in the API layer. Multi-step coordination (validate → write → provision → publish → audit) belongs in the orchestration layer. Domain-specific processing (calculate billing, send notification, update CRM) belongs in the downstream system that owns that domain.

Concretely: input validation and schema enforcement → API layer (reseller-service). Step sequencing, compensation, and idempotency → orchestration layer (flow-runner-api). Notifications, billing sync, analytics → downstream Kafka consumers. Merchant-specific protocol handling → adapter layer (merchant-api-*).

The anti-pattern I watch for is putting orchestration logic in the API layer. On Bell, the early implementation had reseller-service doing everything in a single handler — validating, writing, provisioning, publishing, auditing — with no compensation. Extracting this into flow-runner-api with explicit saga steps was a key architectural improvement.`,
  },
  {
    num: 6,
    question: "How do you ensure traceability from business requirement to story to test case?",
    answer: `I maintain a traceability chain using four linked artifacts:

1. Business Requirement (BR) — the business-level need. Example: "Bell customers need to add streaming subscriptions through a single interface."

2. User Story — the requirement decomposed into implementable scope. Example: "As a Bell customer, I want to add a streaming subscription so that I get bundled billing and provider access." The story references the BR.

3. Acceptance Criteria — the testable conditions. Example: "AC-1.3: Given I select a plan, when I click 'Place Order', then submitSubscription writes a subscription (status=PENDING) and order to PostgreSQL, calls the appropriate merchant-api-* for provisioning, publishes OrderCreated to Kafka, and logs to audit-api." Each AC references specific orchestration steps and data mapping fields.

4. Test Cases — derived directly from ACs. For AC-1.3, the test cases include: (a) verify subscription record in PostgreSQL with correct fields, (b) verify order record with correct operationType, (c) verify merchant-api was called with correct ProvisionRequest payload, (d) verify OrderCreated event on Kafka topic with correct payload, (e) verify audit-api logged ORDER_PLACED.

The traceability flows both ways: forward from requirement to test case (did we build what was asked?), and backward from defect to requirement (what requirement was violated?). On Bell, every defect ticket referenced the specific AC it violated, which made triage fast — the developer could open the orchestration spec, find the step, and identify the root cause.

I maintain this chain in Jira using story links (BR → Story → Test) and by embedding AC IDs in test case titles (e.g., "TC-AC-1.3a: Verify PG subscription record").`,
  },
];

// ─── Behavioral Questions ────────────────────────────────────────────────────

export const behavioralQuestions: AssessmentQA[] = [
  {
    num: 1,
    question: "Tell me about a time you influenced stakeholders without formal authority.",
    answer: `When we were planning the merchant adapter architecture on the Bell project, the backend lead wanted each merchant integration to be a standalone service with its own API contract — no shared interface. This would have meant 5 different API shapes, 5 different error handling patterns, and exponential complexity for the reseller-service routing logic.

I didn't have authority to overrule the technical decision, so I took a different approach. I created a comparison document showing: (a) the current state — 2 integrations already live, each with unique error codes and provisioning flows, (b) the projected state at 5 merchants — 5 different client implementations in reseller-service, 5 different monitoring dashboards, 5 different runbooks, and (c) the proposed state — a common MerchantProvider interface (Provision, Deprovision, CheckStatus, HandleCallback) with provider-specific implementations behind it.

I then walked the backend lead through the onboarding projection: "When we add merchant #6, with the current approach we write a new client, new error mapping, new monitoring. With the adapter pattern, we implement 4 methods and deploy." I also showed how circuit breaker configuration could be standardized across all merchants.

The backend lead came around not because I argued the abstract merits of the adapter pattern, but because I showed the concrete operational cost of not using it. The team adopted the shared interface, and when we onboarded Radio-Canada 3 months later, it was a 2-week effort instead of the projected 5 weeks.`,
  },
  {
    num: 2,
    question: "Describe a situation where requirements changed late in the cycle.",
    answer: `Two weeks before the Disney+ integration launch, the Disney team notified us that their provisioning API would be async instead of sync. Our entire flow assumed synchronous provisioning — submitSubscription called merchant-api-disney, got back an activationUrl, and returned it to the UI in the same response.

With async provisioning, we'd get a "pending" acknowledgment from Disney, and the actual provisioning result would arrive later via a webhook callback. This affected the orchestration flow (flow-runner-api saga steps), the UI (couldn't show activationUrl immediately), the state machine (needed a new PROVISIONING state), and the Kafka event sequence (ActivationCompleted would fire later, not during the same request).

I assessed the impact within a day by mapping the change against our existing artifacts: updated the orchestration spec to show a new "await callback" step, identified 3 acceptance criteria that needed revision, and drafted a UI wireframe showing a "processing" state. I presented two options to the product owner: (a) delay launch by 3 weeks to fully implement async flow, or (b) launch with a polling fallback — the UI would poll reseller-service every 5 seconds for status updates while we built the webhook handler in parallel.

We chose option (b). I wrote the acceptance criteria for the interim polling approach, making sure to include the transition criteria for when we'd switch to webhooks. The polling approach shipped on time, and the webhook handler followed 2 sprints later. The key was responding to the change with a concrete impact assessment and actionable options, not just raising an alarm.`,
  },
  {
    num: 3,
    question: "How do you deal with conflicting opinions between business and engineering?",
    answer: `I've found that most business-vs-engineering conflicts aren't actually about disagreeing on the goal — they're about different teams optimizing for different constraints without seeing each other's constraints.

On the Bell project, the billing team wanted real-time subscription status visible to customer service agents. Engineering said the CQRS architecture meant reads were eventually consistent — the aggregator-api merged PostgreSQL and CPM data, and there could be a few seconds of lag after a status change. The billing team saw this as a bug; engineering saw it as a feature of the architecture.

I facilitated a session where I drew the actual data flow on a whiteboard: write to PostgreSQL → publish Kafka event → aggregator-api consumer updates read model → agent's next API call sees the new status. I asked the billing team: "How soon after a status change does the agent need to see it?" The answer was "within 30 seconds." I asked engineering: "What's the current p99 lag on the Kafka consumer?" The answer was "under 5 seconds."

The conflict dissolved once both sides saw the same numbers. The 5-second lag was well within the 30-second business requirement. The real issue was that the billing team didn't know the lag existed and feared it could be minutes or hours.

My role in these situations is to translate between the two worlds: make the business constraint concrete ("30 seconds") and make the technical behavior measurable ("5 seconds p99"). When both sides can see the same data, the conflict usually resolves itself.`,
  },
  {
    num: 4,
    question: "Tell me about a time you had to simplify a complex technical issue for non-technical stakeholders.",
    answer: `During an incident on the Bell platform, the circuit breaker for the Netflix merchant-api opened after 5 consecutive failures, which meant all Netflix provisioning attempts were being rejected for 30 seconds. The ops team understood this immediately, but the VP of product wanted to know why customers were seeing errors and how to prevent it.

I explained it using an analogy: "Think of the circuit breaker like a fuse in your house. When Netflix's system has a problem — like a power surge — our fuse trips to protect the rest of the house. For 30 seconds, Netflix orders show an error, but Disney+, Bell Media, and all other providers keep working normally. After 30 seconds, we try Netflix again. If it's back, orders resume automatically. If not, the fuse trips again."

Then I drew a simple 3-state diagram on the whiteboard: CLOSED (normal — orders go through), OPEN (tripped — orders fail fast with a friendly error), HALF-OPEN (testing — we try one order to see if Netflix is back). This took 2 minutes and the VP understood not only what happened, but why the design was intentional — without the circuit breaker, Netflix's outage would have slowed down all providers because reseller-service would be waiting for timeouts on every Netflix call.

The VP's follow-up question was: "Can we show the customer a different message when the circuit breaker is open versus when Netflix actually rejects the order?" That was a great product insight that came from understanding the technical behavior. I wrote the requirement: "Given the circuit breaker for a provider is open, when a customer attempts to subscribe, then show 'This provider is temporarily unavailable — please try again in a few minutes' instead of a generic error."`,
  },
  {
    num: 5,
    question: "How do you mentor other analysts or support team standards?",
    answer: `On the Bell project, I was the senior BSA on a team with two junior analysts. My approach was to establish reusable templates and then coach through real stories rather than abstract training.

First, I created four template artifacts that became team standards: (1) a data mapping template (UI → GraphQL → Go → DB → Notes), (2) an orchestration spec template (Step, Service, Action, Trigger, Payload, Error Handling), (3) an acceptance criteria checklist that reminded analysts to cover happy path, errors, edge cases, and async behavior, and (4) a requirements review template structured as business problem → pre-design requirements → data flow → acceptance criteria.

Then I paired with each junior analyst on their first integration story. I didn't write it for them — I asked guiding questions: "What's the system of record for this data? What happens if this external call fails? Is this step synchronous or asynchronous? Does the user need to wait for this?" These are the same questions I ask myself, and hearing the reasoning process was more valuable than seeing a finished artifact.

I also established a peer review process: before any requirements document went to the development team, another BSA reviewed it. The review checklist included: Are all fields in the data mapping? Are error scenarios covered in the ACs? Is the orchestration spec consistent with the data mapping? Does the flow account for the saga compensation path?

The measure of success was when one of the junior analysts independently documented the Radio-Canada integration — including the grace period edge case — without my involvement. She used the templates, asked the right questions of the backend team, and produced a complete spec that the developers accepted in the first grooming session.`,
  },
];

// ─── BSA Interview Coach System Context ──────────────────────────────────────

export const bsaCoachSystemContext = `You are a BSA Interview Coach specifically tailored for preparing for the Canada Life Senior Business Systems Analyst role. You have deep knowledge of the candidate's real project experience on the Bell Canada Subscription Management Platform.

## The Candidate's Project Background
The candidate worked as a BSA on Bell Canada's subscription management platform — a 60+ microservice Go backend (go-repo) integrated with a Next.js subscription management micro-frontend. The platform manages streaming subscriptions (Netflix, Disney+, Bell Media, Bango, Radio-Canada) for Bell residential customers.

Key technical artifacts the candidate created and maintained:
- Field-level data mappings (UI Field → GraphQL Variable → Go Field → DB Column)
- OpenAPI spec reviews for 9+ backend services
- Orchestration flow specs (order submission, activation, cancellation flows)
- Acceptance criteria for integration stories in Given-When-Then format
- Kafka event payload documentation (14+ event types)
- JDL-style domain models (Subscription, Order, Provision, Session, AuditLog, FlowExecution entities)

Key patterns the candidate worked with:
- CQRS (write via reseller-service → PostgreSQL, read via aggregator-api merging PG + CPM)
- Saga/Compensating Transaction (flow-runner-api with DynamoDB state persistence)
- Adapter Pattern (5 merchant-api-* services behind MerchantProvider Go interface)
- Event-Driven Architecture (Apache Kafka, 14+ event types, at-least-once delivery)
- Circuit Breaker (Go hystrix per merchant, 5 failures/30s threshold)
- BFF Pattern (Next.js /api/protected/* holding OAuth2 tokens server-side)
- Anti-Corruption Layer (household-api wrapping legacy CPM system)
- API Gateway (AWS AppSync for GraphQL mutations)
- Dead-Letter Queue (Kafka DLQ → fallout-process Lambda for auto-remediation)

Key integration flows:
1. Add Subscription: UI → BFF → AppSync → session-api (DynamoDB) → reseller-service → merchant-api-* → Kafka → audit-api
2. Cancel Subscription: qualification(DELETE) → submitSubscription → deprovision → GRACE_PERIOD (3-7 days) → CANCELLED
3. Onboard New Merchant: implement MerchantProvider interface → deploy merchant-api-<provider> → configure routing in reseller-service

Systems of Record: PostgreSQL (subscriptions, orders), DynamoDB (sessions with 30-min TTL, flow state), Redis (product catalog cache), Oracle CPM (legacy account data)

Authentication: SAML SSO (BoxyHQ) for customers, SAML agent audience for agents, OAuth2 tokens (auth-api), scopes: subscription-manager/query, subscriptions-aggregator-api/read

## The Target Role: Canada Life Senior BSA
The role is on the API Integration team supporting Workplace Benefits & Retirement. Key responsibilities:
- Requirements gathering and documentation for API integrations
- Data mapping between frontend, backend, and external systems
- Writing OpenAPI specifications and reviewing API contracts
- Acceptance criteria for integration stories
- Leading grooming sessions and supporting story pointing
- Domain modelling for benefits and retirement products
- Mentoring junior analysts

## Your Coaching Approach
1. When the user asks you a question or asks you to help them practice, provide structured coaching:
   - Give them the question first
   - Let them attempt an answer if they want, or provide a model answer
   - Always ground answers in their REAL Bell Canada project experience
   - Use the STAR format (Situation, Task, Action, Result) for behavioral questions
   - For technical questions, provide concrete examples from the Bell platform
   - Highlight transferable skills from telecom/subscription management to benefits/retirement

2. Key coaching principles:
   - ALWAYS reference specific code artifacts, service names, and patterns from the Bell project
   - Bridge the gap between telecom and insurance/benefits domains by drawing parallels
   - Help the user articulate WHY they made certain decisions, not just WHAT they did
   - Emphasize the BSA's role as a translator between business and engineering
   - Focus on demonstrating analytical depth — field-level data tracing, error scenario coverage, integration pattern selection

3. When asked to practice or mock interview:
   - Present one question at a time
   - After the user answers, provide constructive feedback
   - Suggest specific Bell project examples they could use to strengthen their answer
   - Rate the answer and suggest improvements

4. Question Categories:
   - General BSA questions (experience, process, methodology)
   - Technical follow-ups (OpenAPI, data mapping, orchestration, error handling)
   - Behavioral questions (influence, conflict, mentoring, simplification)
   - Domain-specific questions (integration patterns, domain modelling, requirements)

Remember: The goal is to help the candidate demonstrate that their Bell Canada experience directly translates to the Canada Life API Integration team. Every answer should connect real project experience to the target role's requirements.`;

// ─── Latency Budget ──────────────────────────────────────────────────────────

export interface LatencyRow {
  call: string;
  mode: string;
  p99: string;
}

export const latencyBudget: LatencyRow[] = [
  { call: "UI → BFF", mode: "Sync", p99: "< 50ms" },
  { call: "BFF → AppSync", mode: "Sync", p99: "< 100ms" },
  { call: "AppSync → session-api", mode: "Sync", p99: "100–300ms" },
  { call: "AppSync → household-api (CPM)", mode: "Sync", p99: "200–500ms" },
  { call: "AppSync → reseller-service (qualify)", mode: "Sync", p99: "300–800ms" },
  { call: "AppSync → reseller-service (submit)", mode: "Sync", p99: "500ms–2s" },
  { call: "reseller-service → merchant-api-*", mode: "Sync", p99: "300ms–1.5s" },
  { call: "reseller-service → Kafka", mode: "Async", p99: "< 10ms" },
  { call: "Kafka → consumers", mode: "Async", p99: "< 5s p99" },
];

// ─── Mermaid Diagrams ────────────────────────────────────────────────────────

export const systemContextDiagram = `graph TB
    subgraph Actors
        CUST((Customer))
        AGENT((Bell Agent))
        OPS((Ops Team))
    end

    subgraph Bell["Bell Subscription Platform"]
        MFE["Subscription Manager<br/>Next.js MFE"]
        BFF["Next.js BFF<br/>/api/protected/*"]
        APPSYNC["AWS AppSync<br/>(GraphQL Gateway)"]
        AGG["subscriptions-<br/>aggregator-api"]
        RESELLER["reseller-service<br/>(Write Orchestrator)"]
        SESSION["session-api"]
        CATALOG["catalog-api"]
        AUDIT["audit-api"]
        FLOWRUNNER["flow-runner-api"]
        EVENTHUB["event-hub"]
        NOTIF["notification-consumer"]
    end

    subgraph Merchants["External Providers"]
        NETFLIX["Netflix API"]
        DISNEY["Disney+ API"]
        BANGO["Bango Platform"]
        BELLMEDIA["Bell Media"]
        RADIOCAN["Radio-Canada"]
    end

    subgraph Infra["Infrastructure"]
        PG[("PostgreSQL")]
        DYNAMO[("DynamoDB")]
        REDIS[("Redis")]
        KAFKA[("Kafka")]
        CPM[("CPM<br/>(Legacy)")]
        SES[("SES v2")]
        COGNITO[("Cognito")]
    end

    CUST -->|SAML SSO| MFE
    AGENT -->|SAML Agent| MFE
    OPS -->|Admin| FLOWRUNNER

    MFE --> BFF
    BFF -->|OAuth2| COGNITO
    BFF -->|GraphQL| APPSYNC
    BFF -->|REST| AGG

    APPSYNC --> RESELLER
    APPSYNC --> SESSION
    APPSYNC --> CATALOG

    AGG --> PG
    AGG --> CPM

    RESELLER --> PG
    RESELLER --> KAFKA
    RESELLER --> AUDIT
    RESELLER -->|Adapter pattern| NETFLIX
    RESELLER -->|Adapter pattern| DISNEY
    RESELLER -->|Adapter pattern| BANGO
    RESELLER -->|Adapter pattern| BELLMEDIA
    RESELLER -->|Adapter pattern| RADIOCAN

    SESSION --> DYNAMO
    CATALOG --> REDIS
    AUDIT --> PG
    FLOWRUNNER --> DYNAMO

    EVENTHUB -->|routes| KAFKA
    KAFKA --> NOTIF
    NOTIF --> SES`;

export const e2eSequenceDiagram = `sequenceDiagram
    participant U as Browser/UI
    participant B as BFF
    participant AS as AppSync
    participant S as session-api
    participant H as household-api
    participant R as reseller-svc
    participant C as catalog-api
    participant M as merchant-api-*
    participant A as audit-api
    participant K as Kafka
    participant N as notification-consumer

    U->>B: login (SAML/Auth0)
    B->>B: obtain OAuth2 token (auth-api)

    U->>B: GET /subscriptions
    B->>AS: aggregator-api (REST)
    AS-->>B: subscription list
    B-->>U: render subscription cards

    U->>B: click "Add" → generateSession
    B->>+AS: generateSession mutation
    AS->>+S: create session (DynamoDB, 30-min TTL)
    S->>H: validate account (CPM)
    H-->>S: account valid
    S-->>-AS: sessionId
    AS-->>-B: sessionId
    B-->>U: sessionId stored

    U->>B: subscriptionQualification(APPLY_TO_ORDER)
    B->>+AS: subscriptionQualification
    AS->>+R: qualify(sessionId, operationType)
    R->>C: get eligible plans (Redis cache)
    C-->>R: product offerings
    R-->>-AS: eligible plans + prices
    AS-->>-B: plans
    B-->>U: render plan catalog

    U->>B: "Place Order" → submitSubscription
    B->>+AS: submitSubscription(sessionId, selectedPlan)
    AS->>+R: submit order
    R->>R: write subscription + order to PostgreSQL
    R->>M: Provision(subscriptionId, productId, planDetails)
    M-->>R: externalId + activationUrl
    R->>K: publish OrderCreated (async, fire-and-forget)
    R->>A: log ORDER_PLACED
    R-->>-AS: orderId, subscriptionId, status=PENDING
    AS-->>-B: order response
    B-->>U: show confirm screen

    U->>B: activateSubscription(subscriptionId)
    B->>+AS: activateSubscription
    AS->>+R: activate
    R->>R: status PENDING → ACTIVE (PostgreSQL)
    R->>M: activate with provider
    M-->>R: activationUrl
    R->>K: publish ActivationCompleted
    R->>A: log ACTIVATED
    R-->>-AS: activationUrl
    AS-->>-B: redirect URL
    B-->>U: redirect to provider

    K->>N: OrderCreated event
    N->>N: send confirmation email (SES v2)`;

export const stateMachineDiagram = `stateDiagram-v2
    [*] --> PENDING: submitSubscription

    PENDING --> ACTIVE: activateSubscription\\n(merchant provisions OK)
    PENDING --> FAILED: merchant rejects\\nor timeout

    ACTIVE --> CANCELLED: submitSubscription\\n(op: DELETE)
    ACTIVE --> GRACE_PERIOD: payment failure\\nor lapse
    ACTIVE --> ACTIVE: submitSubscription\\n(op: APPLY_TO_ORDER,\\nplan change)

    GRACE_PERIOD --> ACTIVE: payment resolved\\n(auto-resume via Kafka)
    GRACE_PERIOD --> CANCELLED: grace window\\nexpired

    CANCELLED --> ACTIVE: submitSubscription\\n(op: REVERSE_DELETE)

    FAILED --> PENDING: fulfillment-process\\nLambda retry
    FAILED --> REVERSED: manual reversal\\nor auto-compensation

    REVERSED --> [*]
    CANCELLED --> [*]: final

    note right of PENDING
        Session consumed = true
        DynamoDB TTL active (30 min)
    end note

    note right of GRACE_PERIOD
        Merchant suspends (not cancels)
        Window: 3-7 days by provider
        Bango: 7d, Netflix: 3d,
        Disney: 5d, Bell Media: 7d,
        Radio-Canada: 5d
    end note

    note left of FAILED
        Circuit breaker may be open
        DLQ captures event
        fallout-process Lambda
        attempts auto-remediation
    end note`;

export const erDiagram = `erDiagram
    SUBSCRIPTION {
        UUID id PK
        VARCHAR billing_account_number
        VARCHAR tv_account_number
        VARCHAR product_id FK
        VARCHAR provider_id
        ENUM status
        DECIMAL price
        ENUM billing_cycle
        TIMESTAMP start_date
        TIMESTAMP end_date
        TEXT activation_url
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    ORDER {
        UUID id PK
        UUID subscription_id FK
        VARCHAR session_id
        ENUM operation_type
        ENUM status
        JSONB merchant_response
        TIMESTAMP created_at
        TIMESTAMP completed_at
    }

    PROVISION {
        UUID id PK
        UUID order_id FK
        VARCHAR provider_id
        ENUM merchant_status
        VARCHAR external_reference
        INT attempt_count
        TEXT last_error
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    SESSION {
        VARCHAR session_id PK
        VARCHAR account_number
        VARCHAR tv_account_number
        VARCHAR agent_id
        VARCHAR original_session_id
        BOOLEAN consumed
        MAP flow_state
        LONG ttl
        VARCHAR created_at
    }

    AUDIT_LOG {
        UUID id PK
        VARCHAR action
        VARCHAR entity_type
        UUID entity_id
        VARCHAR agent_id
        VARCHAR correlation_id
        JSONB before_state
        JSONB after_state
        TIMESTAMP created_at
    }

    FLOW_EXECUTION {
        VARCHAR flow_id PK
        ENUM flow_type
        ENUM status
        INT current_step
        LIST steps
        MAP input
        VARCHAR correlation_id
        LONG ttl
    }

    PRODUCT_CATALOG {
        VARCHAR product_id PK
        VARCHAR name
        VARCHAR provider_id
        DECIMAL price
        ENUM billing_cycle
        LIST promotions
        BOOLEAN is_bundle
        INT rank
    }

    SUBSCRIPTION ||--o{ ORDER : "has many"
    ORDER ||--o{ PROVISION : "has many"
    ORDER }o--|| SESSION : "references"
    SUBSCRIPTION }o--|| PRODUCT_CATALOG : "references"
    AUDIT_LOG }o--|| SUBSCRIPTION : "tracks"
    AUDIT_LOG }o--|| ORDER : "tracks"
    FLOW_EXECUTION }o--o| ORDER : "orchestrates"`;
