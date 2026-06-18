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
