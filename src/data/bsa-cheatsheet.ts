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
  {
    num: 12,
    question: "Can you describe a situation where you had to analyze a complex business process?",
    answer: `On the Bell Canada Subscription Management Platform, the most complex business process I analyzed was the end-to-end subscription lifecycle — from add through activation, grace period, cancellation, and reversal — across 5 different streaming providers (Netflix, Disney+, Bell Media, Bango, Radio-Canada).

Situation: Each merchant had different provisioning protocols, different grace period windows (Netflix: 3 days, Bango: 7 days), and different callback mechanisms. The existing documentation described a simple "customer adds subscription" flow, but the actual process involved 8 microservices, 3 databases, Kafka event chains, and saga compensation logic.

Task: I needed to map the full process so the development team, QA, and product owners had a shared understanding of every step, decision point, and failure path.

Action: I started by tracing the code through reseller-service (the write orchestrator), mapping each function call to a step in the flow. I created an orchestration spec with 6 steps: session validation → qualification → order creation (PostgreSQL write) → merchant provisioning (adapter pattern) → Kafka event publish → audit logging. For each step, I documented the service responsible, the input/output payload, the failure mode, and the compensation action (saga rollback).

I also built a state machine diagram showing all subscription status transitions: PENDING → ACTIVE → GRACE_PERIOD → CANCELLED → REVERSED, with the business rules that triggered each transition. This revealed edge cases the product team hadn't considered — for example, "what happens if a customer reverses a cancellation during the grace period?"

Result: The orchestration spec became the single source of truth for the entire team. QA used it to derive 17 test scenarios. When we onboarded Radio-Canada as a new provider, the spec let us identify exactly which steps needed customization (just the adapter layer) versus which were reusable (everything else). The onboarding took 2 weeks instead of the projected 5.`,
  },
  {
    num: 13,
    question: "How do you prioritize and manage requirements in a project?",
    answer: `I use a structured approach combining business value, technical dependency, and risk to prioritize requirements. On the Bell project, I managed requirements across multiple concurrent workstreams — new merchant integrations, platform enhancements, and defect fixes.

My prioritization framework has three dimensions:

1. Business value and urgency: I work with the product owner to stack-rank features by revenue impact and contractual deadlines. On Bell, merchant launch dates were contractually fixed (e.g., Disney+ had a firm go-live date), so those integration requirements automatically took priority over internal improvements.

2. Technical dependencies: I map dependencies between requirements using orchestration specs. For example, the "Add Subscription" flow depended on session-api, catalog-api, and reseller-service — so requirements for those services had to be completed in dependency order. I visualized this in Jira using story links and blockers.

3. Risk and complexity: High-risk requirements (like the saga compensation logic) get prioritized earlier so we have time to iterate. I learned this on Bell when we discovered late that the Disney+ async provisioning model broke our synchronous flow — if we'd tackled that integration earlier, the architectural change would have been less disruptive.

For day-to-day management, I maintain a living requirements backlog in Jira with clear acceptance criteria for every story. During sprint planning, I present a prioritized list to the team with the rationale for ordering. I also run a weekly requirements triage with the product owner to re-prioritize based on new information — stakeholder feedback, technical discoveries, or external partner changes.

The key principle: requirements aren't static. I treat the backlog as a living document and re-prioritize every sprint based on what we've learned.`,
  },
  {
    num: 14,
    question: "What experience do you have with business intelligence tools like Tableau or Power BI?",
    answer: `While my primary focus on the Bell project was systems analysis and integration architecture, I leveraged data analysis and visualization skills in several important ways.

On the Bell Subscription Management Platform, I worked with operational data to support decision-making. I used data queries against PostgreSQL (subscriptions, orders, audit logs) to analyze subscription lifecycle patterns — for example, identifying which merchants had the highest provisioning failure rates, which informed our circuit breaker threshold configuration (5 failures in 30 seconds for Netflix, different thresholds for other providers).

I created data-driven artifacts that served a similar purpose to BI dashboards: latency budget tables showing P99 response times across all service hops (UI → BFF: <50ms, reseller-service → merchant-api: 300ms–1.5s), error distribution analysis across the 4 error tiers I defined (client errors, upstream failures, infrastructure failures, async failures), and Kafka event throughput analysis to validate our at-least-once delivery guarantees.

For stakeholder reporting, I built comparison documents with side-by-side analysis — for example, when recommending the adapter pattern over custom integrations, I created a cost/complexity matrix showing projected effort for each new merchant onboarding under both approaches. This is essentially the same analytical thinking that drives BI dashboard creation: identify the key metrics, collect the data, present it visually, and drive a decision.

I'm comfortable learning any BI tool quickly because the underlying skills are the same — SQL querying, data modeling, metric definition, and visual storytelling. The domain changes (subscriptions vs. benefits), but the analytical approach transfers directly.`,
  },
  {
    num: 15,
    question: "How do you handle conflicting priorities when working on multiple projects?",
    answer: `On the Bell platform, I regularly juggled competing priorities across multiple workstreams: active merchant integrations (Disney+, Radio-Canada), platform improvements (saga pattern refactoring), and production defect triage — all with different stakeholders and deadlines.

My approach has four elements:

1. Make conflicts visible: When I can't do everything simultaneously, I create a simple priority matrix showing each workstream, its deadline, its current status, and its stakeholder. I share this with all stakeholders so everyone sees the same picture. On Bell, I maintained a weekly status view showing: Disney+ integration (launch in 3 weeks, on track), Radio-Canada (launch in 6 weeks, blocked on API spec), saga refactoring (no hard deadline, paused).

2. Negotiate with data, not opinions: When the Disney+ team and the platform team both needed my analysis work in the same sprint, I didn't pick sides. I showed both stakeholders the dependency chain: "Disney+ requires the async provisioning spec by Tuesday for dev to start. The saga refactoring design doc is needed by Thursday for the architecture review. I can deliver both if I focus on Disney+ Monday–Tuesday and saga Wednesday–Thursday." When both sides see the concrete schedule, conflicts usually resolve.

3. Protect focused work time: I block mornings for deep analysis work (data mappings, orchestration specs) and use afternoons for meetings, reviews, and ad-hoc questions. This is how I delivered the Radio-Canada integration spec while simultaneously supporting Disney+ UAT — mornings on new requirements, afternoons on defect triage.

4. Escalate early: If I genuinely can't meet all deadlines, I escalate to my manager with the trade-off clearly articulated: "I can deliver A and B by Friday, or A and C. B and C conflict. Which do you want?" I never silently miss a deadline.`,
  },
  {
    num: 16,
    question: "Can you explain your approach to data analysis in your role as a Business Systems Analyst?",
    answer: `Data analysis is central to my BSA work — I use it to validate requirements, trace system behavior, and identify gaps between business expectations and technical reality.

On the Bell project, my data analysis approach had three layers:

1. Field-level data tracing: For every integration, I created end-to-end data mappings that trace each field from the UI through every service layer to the database. For the "Add Subscription" flow, I mapped 11 fields: UI Field (e.g., "Selected Plan") → GraphQL Variable (selectedProductId) → Go Struct Field (req.ProductID) → PostgreSQL Column (subscriptions.product_id). This tracing reveals data transformations, type mismatches, and missing fields before development begins.

2. Event and payload analysis: I analyzed Kafka event payloads to verify that downstream consumers receive all required data. The OrderCreated event needed to carry 10 specific fields for 3 different consumers (notification-consumer, billing-sync, analytics). I documented each field, its source (which service populates it), and its consumers. When we discovered that the billingCycle field was missing from the event payload, I caught it during analysis — not in production.

3. Operational data analysis: I analyzed production logs, error rates, and latency distributions to inform requirements. For example, analyzing the P99 latency for merchant provisioning calls revealed that Bango was consistently slower (1.2s vs. Netflix's 400ms), which led to a requirement for provider-specific timeout configurations in the circuit breaker. I also analyzed the DLQ (Dead Letter Queue) to identify recurring failure patterns — a spike in DLQ messages from the Disney+ consumer led us to discover a schema mismatch in their callback payload.

The common thread: I don't just document what the system should do — I verify what it actually does by analyzing real data flows, and I use that analysis to improve the system's design.`,
  },
  {
    num: 17,
    question: "How do you ensure successful User Acceptance Testing (UAT)?",
    answer: `I ensure UAT success by making it a natural extension of the requirements process, not a separate phase. On the Bell project, every UAT scenario traced directly back to an acceptance criterion I wrote during requirements.

My UAT approach has four stages:

1. AC-driven test plan: Each acceptance criterion in Given-When-Then format becomes a UAT test case. For "Add Subscription," I had 6 ACs covering happy path, error scenarios, edge cases, and async behavior. Each AC mapped to 1–3 UAT scenarios. QA didn't have to guess what to test — the acceptance criteria were the test plan.

2. Test data preparation: I work with the dev team to create test fixtures that cover all scenarios. On Bell, this meant: valid accounts in CPM (for happy path), expired sessions in DynamoDB (for session timeout scenarios), merchant API stubs configured to return failures (for circuit breaker testing), and specific subscription states in PostgreSQL (for grace period and reversal scenarios).

3. Environment validation: Before UAT begins, I verify the test environment matches the expected state. On Bell, I'd check that all 5 merchant-api adapters were deployed, that Kafka topics were configured, that DynamoDB session TTLs were set correctly, and that the circuit breaker thresholds matched production configuration. I learned this the hard way when a UAT cycle failed because the test environment had different circuit breaker settings than production.

4. Defect triage with traceability: When a UAT defect is found, I trace it back to the specific AC, orchestration step, and data mapping field. This means the developer can open the orchestration spec, find the exact step that failed, and identify the root cause without a lengthy investigation. On Bell, this reduced our average defect resolution time from 2 days to half a day.

The key principle: UAT should validate the requirements, not discover them. If UAT reveals a missing requirement, that's a process failure I address by improving the upstream analysis.`,
  },
  {
    num: 18,
    question: "What strategies do you use to communicate complex technical information to non-technical stakeholders?",
    answer: `I use three strategies: analogies, visual artifacts, and progressive detail.

1. Analogies from the stakeholder's world: On Bell, when explaining the circuit breaker pattern to the VP of Product, I compared it to a household fuse: "When Netflix's system has a problem, our fuse trips to protect the rest of the house. For 30 seconds, Netflix orders fail fast, but Disney+, Bell Media, and all other providers keep working. After 30 seconds, we test Netflix again." The VP immediately understood and even suggested a UX improvement: showing a provider-specific "temporarily unavailable" message instead of a generic error.

2. Visual artifacts at the right level of abstraction: For executives, I use system context diagrams showing actors and high-level service blocks — no internal implementation details. For product managers, I use state machine diagrams showing subscription lifecycle transitions (PENDING → ACTIVE → GRACE_PERIOD → CANCELLED) with business triggers for each transition. For developers, I use sequence diagrams showing exact API calls and payloads. Same system, three levels of detail for three audiences.

3. Progressive disclosure: I start with the simplest explanation and add detail only when asked. When presenting the CQRS architecture to the billing team, I started with: "Writes go through one path, reads go through another. This means there's a small delay (under 5 seconds) between when something changes and when you see the change." Only when they asked "why?" did I explain the PostgreSQL → Kafka → aggregator-api pipeline.

The meta-principle: I translate from technical language to business impact. Non-technical stakeholders don't need to know we use a saga pattern — they need to know "if the merchant fails, we automatically undo the order and the customer doesn't get charged." The technical detail is the how; the business impact is the what. I always lead with the what.`,
  },
  {
    num: 19,
    question: "How do you stay updated with industry trends and advancements in technology?",
    answer: `I stay current through a combination of hands-on practice, community engagement, and structured learning.

1. Hands-on learning through my projects: The Bell platform itself was a continuous learning environment. Working with a 60+ microservice Go backend exposed me to event-driven architecture (Kafka), saga patterns, CQRS, circuit breakers, and cloud-native patterns (AWS AppSync, DynamoDB, Lambda). Each new merchant integration brought new challenges — Disney+ introduced async provisioning, which pushed me to learn webhook callback patterns and polling fallback strategies.

2. Architecture and design pattern study: I regularly study integration patterns through resources like Martin Fowler's enterprise patterns, the Microservices.io pattern catalog, and the AWS Well-Architected Framework. On Bell, when we needed to decide between orchestration and choreography for the subscription flow, I researched both patterns, created a comparison document, and recommended orchestration (saga via flow-runner-api) because we needed explicit compensation logic for merchant provisioning failures.

3. Tool and platform awareness: I follow developments in API design (OpenAPI 3.1, AsyncAPI for event-driven APIs), observability (distributed tracing, structured logging), and integration platforms. When Canada Life or any enterprise is evaluating tools, I can bring informed perspectives on trade-offs.

4. Cross-domain learning: I actively study how patterns from one domain apply to another. The subscription lifecycle (PENDING → ACTIVE → CANCELLED) directly maps to benefits enrollment (APPLIED → ENROLLED → TERMINATED). The merchant adapter pattern maps to carrier/provider integrations in insurance. By studying multiple domains, I recognize patterns faster and can propose solutions based on proven approaches.

The key is that I don't just read about technology — I apply it. Every pattern I discuss in interviews, I've implemented or analyzed in a real production system.`,
  },
  {
    num: 20,
    question: "Can you describe your experience with Agile development methodologies?",
    answer: `I've worked in Agile (Scrum) throughout the Bell project, serving as the primary BSA embedded in a cross-functional team of developers, QA, and a product owner.

Sprint ceremonies and my role:
- Sprint Planning: I present prioritized stories with complete acceptance criteria, data mappings, and orchestration specs. I walk the team through the "what" and "why" while developers discuss the "how." I lead story pointing using relative complexity against known stories (e.g., "Radio-Canada integration is similar to Netflix but with HMAC auth, so add 3 points for adapter complexity").
- Grooming/Refinement: I use "progressive decomposition" — present what we know, explicitly list unknowns as spike stories, and time-box investigations. When the solution is unclear, I shift from "estimate this" to "what do we need to learn before we can estimate?"
- Daily Standups: I report on analysis progress, flag blockers (e.g., "waiting on Disney+ API spec"), and coordinate with QA on upcoming UAT readiness.
- Sprint Review/Demo: I demonstrate features against acceptance criteria, showing stakeholders exactly which requirements were met.
- Retrospectives: I contribute process improvements — for example, I introduced the peer review process for requirements documents after discovering that inconsistencies between data mappings and ACs were causing rework.

Agile artifacts I maintain:
- User stories with Given-When-Then acceptance criteria linked to orchestration specs
- A living requirements backlog re-prioritized every sprint
- Definition of Done that includes: AC verified, data mapping validated, error scenarios tested, Kafka events confirmed

Key Agile principle I follow: working software over comprehensive documentation — but for a BSA, "working" means the requirements are complete enough that developers don't have to guess, and concise enough that they actually read them.`,
  },
  {
    num: 21,
    question: "How do you approach gathering and documenting business requirements?",
    answer: `My approach is iterative and evidence-based — I don't write requirements in isolation, I derive them from stakeholder input, system behavior, and codebase analysis.

Step 1 — Stakeholder discovery: I identify all stakeholders and their concerns. On Bell, for a new merchant integration, that included: the product owner (business goals, launch date), the merchant's technical team (API capabilities, auth scheme), the backend lead (architectural constraints), QA (testability), and ops (monitoring, SLA). Each stakeholder contributes a different dimension of the requirement.

Step 2 — Current-state analysis: Before writing new requirements, I understand the existing system. On Bell, I traced the actual code paths in reseller-service and the merchant adapters to understand how the current flow works. This revealed implicit requirements that stakeholders forgot to mention — like the circuit breaker configuration per merchant, or the DLQ retry policy.

Step 3 — Requirements documentation: I produce four linked artifacts:
- Business Requirements Document (BRD): Business-level needs ("Bell customers need to manage streaming subscriptions through a single interface")
- Data Mappings: Field-level tracing from UI → GraphQL → Go → DB for every data flow
- Orchestration Specs: Step-by-step flow with service, action, payload, error handling, and compensation for each step
- Acceptance Criteria: Given-When-Then format covering happy path, errors, edge cases, and async behavior

Step 4 — Validation: I review requirements with developers in grooming (is this implementable?), with QA (is this testable?), and with the product owner (does this match the business intent?). On Bell, every requirements document went through a BSA peer review before the grooming session.

Step 5 — Living documentation: Requirements evolve. When a developer discovers an edge case during implementation, I update the AC and data mapping. The documents are never "done" — they're current.`,
  },
  {
    num: 22,
    question: "What techniques do you use to identify areas for process improvement?",
    answer: `I identify process improvements through three techniques: data-driven analysis, pattern recognition across integrations, and retrospective feedback loops.

1. Data-driven analysis — measuring friction: On Bell, I tracked metrics that revealed process bottlenecks. When I noticed that our average defect resolution time was 2 days, I investigated and found that developers couldn't easily trace defects back to specific requirements. I introduced AC-referenced defect tickets (e.g., "Defect violates AC-1.3: subscription status should be PENDING, actual is NULL") — this cut resolution time to half a day because developers could open the orchestration spec, find the step, and identify the root cause.

2. Pattern recognition across integrations: After onboarding 3 merchants (Netflix, Disney+, Bango), I noticed each integration followed the same pattern but was documented differently by different team members. I created standardized templates — data mapping template (UI → GraphQL → Go → DB → Notes), orchestration spec template (Step, Service, Action, Trigger, Payload, Error Handling), and AC checklist (happy path, errors, edge cases, async). When we onboarded Bell Media and Radio-Canada, these templates cut documentation time by 40%.

3. Retrospective feedback loops: After each sprint, I collected feedback on the requirements process. The key insight from our retrospectives was that developers wanted error scenarios documented upfront — they were discovering them during implementation and having to come back for clarification. I added a mandatory "Error Scenarios" section to every story, covering all 4 error tiers (client errors, upstream failures, infrastructure failures, async failures). This reduced mid-sprint clarification requests by roughly 60%.

The improvement I'm most proud of: introducing the BSA peer review process. Before any requirements document went to the dev team, another BSA reviewed it against a checklist (data mapping complete? Error scenarios covered? Orchestration spec consistent? Saga compensation path documented?). This caught 30% of issues before they reached development.`,
  },
  {
    num: 23,
    question: "How do you ensure a project stays on schedule and within budget?",
    answer: `I contribute to schedule and budget adherence through upfront analysis quality, dependency management, and early risk identification.

1. Front-loading analysis to prevent rework: The biggest schedule risk I've seen is incomplete requirements that cause mid-sprint rework. On Bell, I invested in thorough upfront analysis — complete data mappings, orchestration specs, and error scenario documentation — so developers could implement without guessing. When we had complete specs, stories were completed in the estimated time. When we didn't (early in the project), stories overran by 30-50% due to clarification cycles.

2. Dependency mapping and critical path awareness: For each feature, I map technical dependencies across services. For the "Add Subscription" flow, I identified that session-api, catalog-api, and reseller-service all needed changes, and I ordered the stories so upstream dependencies were completed first. When Disney+ changed their provisioning to async mid-project, I immediately mapped the impact: 3 stories needed revision, 2 new stories were required. I presented two options with timelines to the product owner — this let us make an informed schedule decision rather than discovering the delay at the end of the sprint.

3. Risk-based scheduling: I prioritize high-risk work (external integrations, new patterns) early in the timeline. On Bell, merchant API integrations were the highest-risk items because we depended on external teams. I pushed to start the Disney+ integration spike 2 sprints before the target sprint, which gave us time to discover and adapt to the async provisioning change.

4. Transparent status communication: I maintain a weekly status view showing each workstream's progress against plan. When something slips, I communicate immediately with the impact and options — never "we're behind" without "here's what we can do about it."

The key principle: a BSA can't control the budget, but I can control the quality of requirements that drive accurate estimation and prevent costly rework.`,
  },
  {
    num: 24,
    question: "Can you give an example of how you've used data analysis to improve a business system?",
    answer: `On the Bell platform, I used data analysis to identify and fix a critical gap in our merchant failure handling that was causing silent order failures.

Situation: After the first month of production with Netflix and Disney+ live, the ops team noticed that about 2% of orders were stuck in PENDING status indefinitely — they never transitioned to ACTIVE or FAILED.

Analysis: I traced the data flow for stuck orders by querying the subscriptions table (status = PENDING, created_at > 7 days), joining with the orders table to find the corresponding order records, and checking the audit_log for the last recorded action. I discovered that these orders had successfully written to PostgreSQL (step 2 of the saga) but the merchant provisioning call (step 3) had timed out — and crucially, the timeout wasn't being treated as a failure. The code was silently swallowing the timeout exception instead of triggering the saga compensation.

I then analyzed the Kafka DLQ to see if these failures were being captured downstream — they weren't, because the Kafka publish (step 4) never fired since the flow stopped at step 3. I also correlated the stuck orders with specific time windows and found they clustered around Netflix's maintenance windows (Sunday 2-4am EST).

Action: Based on this analysis, I wrote three new requirements: (1) Merchant provisioning timeouts must trigger saga compensation (roll back the PostgreSQL write), (2) A fallout-process Lambda must scan for orders stuck in PENDING beyond a configurable threshold and attempt auto-remediation, (3) The circuit breaker configuration must include provider-specific timeout thresholds (Netflix: 800ms, Disney+: 1.2s, Bango: 1.5s).

Result: After implementation, stuck orders dropped from 2% to 0.01% (only genuine edge cases). The data analysis directly drove three system improvements that wouldn't have been discovered through requirements alone.`,
  },
  {
    num: 25,
    question: "How do you handle changes in project scope or client requirements?",
    answer: `I handle scope changes through structured impact assessment, transparent communication, and documented trade-offs.

The best example from Bell was the Disney+ async provisioning change — two weeks before their integration launch, Disney's team notified us that their provisioning API would be asynchronous instead of synchronous. Our entire subscription flow assumed synchronous provisioning: submitSubscription called merchant-api-disney, received an activationUrl immediately, and returned it to the UI in the same response.

My response process:

1. Impact assessment (within 24 hours): I mapped the change against all existing artifacts. The orchestration spec needed a new "await callback" step. The state machine needed a new PROVISIONING intermediate state. Three acceptance criteria needed revision. The Kafka event sequence changed (ActivationCompleted would fire later via webhook, not during the same request). The UI needed a "processing" intermediate screen.

2. Options with trade-offs: I presented two options to the product owner and engineering lead:
   - Option A: Delay launch by 3 weeks to fully implement async flow with webhooks
   - Option B: Launch with a polling fallback (UI polls reseller-service every 5 seconds for status updates) while we build the webhook handler in parallel

3. Decision support: I recommended Option B with clear transition criteria — "We ship polling for launch, then cut over to webhooks when the webhook handler passes UAT. The polling code becomes the fallback for any future provider that doesn't support webhooks."

4. Updated documentation: I revised all affected artifacts within 2 days: updated orchestration spec, new acceptance criteria for the polling behavior, transition criteria for the webhook cutover, and updated data mapping showing the new intermediate state.

Result: We launched on schedule with polling. The webhook handler shipped 2 sprints later. The key was responding with a concrete impact assessment and actionable options, not just flagging the risk.`,
  },
  {
    num: 26,
    question: "What's your experience with creating and maintaining technical documentation?",
    answer: `Technical documentation is one of my core deliverables as a BSA. On the Bell project, I created and maintained six types of living documents:

1. Data Mappings: Field-level tracing documents showing UI Field → GraphQL Variable → Go Struct Field → PostgreSQL Column → Notes. I maintained 11+ mappings for the Add Subscription flow alone, and each new merchant integration added provider-specific field mappings. These were updated every time a schema changed.

2. Orchestration Specs: Step-by-step flow documents for each business operation (order submission, activation, cancellation, reversal). Each step includes: the service responsible, the action performed, the input/output payload, the error handling behavior, and the saga compensation action. I maintained 3 core flows with 6 steps each.

3. API Specifications: I reviewed and annotated OpenAPI specs for 9 backend services and 2 gRPC proto files. My role was ensuring the specs matched the data mappings and that field names, types, and constraints were consistent across layers.

4. Domain Models: I created JDL-style entity-relationship models showing 6 entities (Subscription, Order, Provision, Session, AuditLog, FlowExecution) with their attributes, lifecycle state enums, and relationships. These models were the reference for database schema reviews.

5. State Machine Diagrams: I documented the subscription lifecycle as a state machine (PENDING → ACTIVE → GRACE_PERIOD → CANCELLED → REVERSED) with all valid transitions and the business rules that trigger each.

6. Error Catalogs: I documented 17 specific error scenarios organized into 4 tiers, each with trigger condition, HTTP status code, error response body, UI behavior, and recovery path.

Key maintenance principle: I treat documentation like code — it's never "done," it's "current." Every sprint, I review and update affected documents. I also established a peer review process: before any document went to the dev team, another BSA reviewed it against a completeness checklist.`,
  },
  {
    num: 27,
    question: "How do you approach risk management in your projects?",
    answer: `I approach risk management by identifying risks early, categorizing them by likelihood and impact, and building mitigation strategies into the requirements and architecture.

On the Bell project, I categorized risks into four tiers:

1. External dependency risks (highest impact): Merchant API availability was our biggest risk. Each provider (Netflix, Disney+, Bango, Bell Media, Radio-Canada) could go down independently. Mitigation: I wrote requirements for the circuit breaker pattern — if a merchant fails 5 consecutive calls within 30 seconds, the circuit opens and subsequent calls fail fast. I also required a DLQ with auto-remediation via the fallout-process Lambda.

2. Data consistency risks: With CQRS architecture, write and read paths could diverge. Mitigation: I documented the eventual consistency window (under 5 seconds p99 via Kafka consumers) and ensured stakeholders understood and accepted this lag. I also wrote requirements for idempotent operations — submitting the same order twice returns the existing order rather than creating a duplicate.

3. Integration change risks: External partners could change their API contracts. This actually happened with Disney+ going async. Mitigation: I advocated for the adapter pattern early — each merchant behind a common interface — so changes to one provider didn't propagate through the system. The Anti-Corruption Layer (household-api wrapping legacy CPM) was another mitigation against upstream changes.

4. Knowledge and process risks: Single points of knowledge on the team. Mitigation: I created standardized templates for all BSA artifacts and established peer review, so multiple team members understood each integration. When I documented the Radio-Canada integration patterns, a junior BSA was able to independently use the templates for the next integration.

My risk management principle: every risk should have a corresponding requirement or architectural decision. If we identify a risk but don't change anything, we haven't actually mitigated it — we've just acknowledged it.`,
  },
  {
    num: 28,
    question: "Can you describe your process for developing business systems analysis reports?",
    answer: `My analysis reports follow a structured format that progresses from business context to technical detail, making them useful for both business and technical audiences.

On the Bell project, my standard analysis report structure was:

1. Business Problem Statement: What business need does this address? Example: "Bell customers need to add and manage streaming subscriptions (Netflix, Disney+, etc.) through a single unified interface, with bundled billing on their Bell account."

2. Current State Analysis: How does the system work today? I trace the actual behavior by reading the codebase — not by relying on existing documentation that may be outdated. For the subscription flow, I documented: the current services involved (reseller-service, session-api, catalog-api), the current data flow (UI → BFF → AppSync → Go services → PostgreSQL/DynamoDB), and the current limitations.

3. Gap Analysis: What's missing? For the Radio-Canada integration, the gaps were: no adapter for their specific auth scheme (HMAC), no handling for their unique grace period window (5 days), and no mapping for their product catalog format.

4. Proposed Solution: Structured as deliverable artifacts:
   - Data mapping: field-level tracing from UI to database
   - Orchestration spec: step-by-step flow with error handling
   - Acceptance criteria: testable conditions in Given-When-Then format
   - State machine updates: any new status transitions

5. Impact Assessment: Which services are affected? What's the testing scope? What are the dependencies and risks? For Disney+'s async change, I assessed impact across 4 services, 3 ACs, and the UI.

6. Recommendations: Prioritized options with trade-offs. I always present at least two options so stakeholders can make informed decisions rather than receiving a mandate.

Each report is a living document maintained in the team wiki and updated every sprint as implementation reveals new details.`,
  },
  {
    num: 29,
    question: "What tools do you consider essential for a Business Systems Analyst?",
    answer: `Based on my Bell project experience, I organize essential BSA tools into five categories:

1. Requirements Management: Jira for user stories, acceptance criteria, and backlog management. I used Jira's story linking (BR → Story → Test) to maintain traceability throughout the development lifecycle. Confluence for living documentation — data mappings, orchestration specs, and analysis reports that evolve with the project.

2. Diagramming and Modeling: Mermaid (embedded in markdown) for sequence diagrams, state machines, entity-relationship diagrams, and system context diagrams. I chose Mermaid because diagrams live alongside the code and documentation — they're version-controlled and easy to update. For more complex visuals, draw.io or Lucidchart.

3. API and Data Analysis: Postman for API testing and contract validation — verifying that actual responses match the OpenAPI spec. SQL clients for querying PostgreSQL (subscription data, orders, audit logs) to validate data mappings and analyze production behavior. On Bell, SQL queries against the audit log were how I discovered the stuck-orders issue.

4. Code and Codebase Navigation: IDE (VS Code) for reading the Go codebase and the Next.js MFE. As a BSA, I don't write production code, but I read it extensively to trace data flows, understand error handling, and validate that implementation matches requirements. Git for version control and understanding code history.

5. Communication and Collaboration: Slack for day-to-day coordination. Screen sharing tools for grooming sessions and stakeholder presentations. Whiteboarding tools (physical or Miro) for workshop-style sessions — the circuit breaker explanation to the VP was done on a physical whiteboard.

The most important "tool" isn't software — it's the structured artifact templates (data mapping, orchestration spec, AC checklist) that ensure consistency across the team. Templates are force-multipliers that let any BSA produce high-quality deliverables.`,
  },
  {
    num: 30,
    question: "How do you ensure the scalability of business systems you work on?",
    answer: `As a BSA, I ensure scalability by documenting non-functional requirements explicitly and validating that the architecture supports growth.

On the Bell project, scalability was critical because we went from 2 merchants (Netflix, Bango) to 5 (adding Disney+, Bell Media, Radio-Canada) within a year, with plans for more. Here's how I addressed scalability at the requirements level:

1. Adapter pattern for merchant scalability: I advocated for the MerchantProvider interface pattern early — a common Go interface (Provision, Deprovision, CheckStatus, HandleCallback) with provider-specific implementations. My requirements specified: "Adding a new merchant must not require changes to reseller-service core logic." This meant each new integration was isolated to implementing 4 interface methods and deploying a new merchant-api-<provider> service. The proof: Radio-Canada onboarding was 2 weeks because the pattern was established.

2. CQRS for read/write scalability: I documented the requirement for separate read and write paths. The write path (reseller-service → PostgreSQL) could be scaled independently of the read path (aggregator-api merging PostgreSQL + CPM). When read traffic spiked during promotions, only the read services needed scaling.

3. Event-driven architecture for throughput: I specified Kafka as the event backbone with at-least-once delivery semantics. This let downstream consumers (notifications, billing sync, analytics) scale independently without affecting the core transaction path. The requirement: "Kafka event publish must be non-blocking — order completion must not depend on consumer availability."

4. Latency budgets: I documented P99 latency targets for every hop in the system: UI → BFF (<50ms), AppSync → reseller-service (500ms–2s), reseller-service → merchant-api (300ms–1.5s). These budgets became the baseline for performance testing and capacity planning.

5. Circuit breaker isolation: I required per-merchant circuit breakers so one provider's failure doesn't cascade. This is horizontal scalability for reliability — each new merchant is isolated from the others.

The principle: scalability requirements should be explicit and testable, not assumed.`,
  },
  {
    num: 31,
    question: "Can you explain the difference between a Business Requirement Document (BRD) and System Requirements Specifications (SRS)?",
    answer: `The BRD and SRS serve different audiences and operate at different levels of abstraction. On the Bell project, I produced both and they were tightly linked.

Business Requirement Document (BRD) — the "what" and "why":
- Audience: Business stakeholders, product owners, executives
- Content: Business objectives, scope, high-level features, success criteria, constraints
- Language: Business terms, no technical implementation details
- Example from Bell: "Bell residential customers must be able to add, manage, and cancel streaming subscriptions (Netflix, Disney+, Bell Media, Bango, Radio-Canada) through the self-serve portal, with charges appearing on their existing Bell account. New streaming providers must be onboardable within 4 weeks."

System Requirements Specifications (SRS) — the "how":
- Audience: Developers, architects, QA, technical stakeholders
- Content: Functional requirements (data flows, API contracts, error handling), non-functional requirements (latency, availability, scalability), interface specifications, data models
- Language: Technical specifics — service names, field types, status codes, protocols
- Example from Bell: "submitSubscription mutation must: (1) validate sessionId via session-api (DynamoDB lookup), (2) write subscription record to PostgreSQL (status=PENDING), (3) call merchant-api-<providerId>.Provision(subscriptionId, productId) synchronously, (4) publish OrderCreated event to Kafka topic subscription-events (fire-and-forget), (5) log ORDER_PLACED to audit-api with correlationId. P99 latency: 500ms–2s."

How they connect: Each BRD requirement traces to one or more SRS requirements. "Customers must be able to add subscriptions" (BRD) decomposes into: the data mapping (SRS), the orchestration spec (SRS), the acceptance criteria (SRS), and the error handling spec (SRS).

On Bell, I maintained this traceability using Jira links: BR → Epic → Story (with ACs) → Test Case. The BRD was the stable anchor; the SRS evolved as the system design matured.`,
  },
  {
    num: 32,
    question: "How do you facilitate communication between business users and technical teams?",
    answer: `I serve as the translator between business and technical teams, and my primary tools are shared artifacts, structured workshops, and real-time translation.

1. Shared artifacts as common ground: On Bell, the data mapping was the artifact that both business and technical teams could point to. When the product owner said "the customer's plan should appear on the confirmation screen," I could show the data mapping: "That's the selectedProductId field, which flows from the UI through GraphQL to the subscriptions.product_id column. It's populated during the qualification step." The developer immediately knew which service and field to look at. The product owner confirmed it was the right data. Same artifact, two perspectives.

2. Structured workshops for alignment: For cross-team decisions, I facilitate sessions where both sides see the same picture. When the billing team and engineering disagreed about real-time subscription status visibility, I drew the data flow on a whiteboard, asked the billing team "how soon do you need to see changes?" (answer: 30 seconds), and asked engineering "what's the current lag?" (answer: under 5 seconds). The conflict dissolved because both sides saw the same numbers.

3. Real-time translation in meetings: In grooming sessions, when a developer says "we need to handle the race condition between the Kafka consumer and the direct API call," I translate for the product owner: "There's a small window where the customer might see stale data — we'll add a cache refresh to eliminate that." Conversely, when the product owner says "cancellation should be immediate," I translate for engineering: "The business expectation is that the UI updates immediately, even if the merchant's grace period means the subscription technically remains active for a few days."

4. Documentation at multiple abstraction levels: I create the same information at different detail levels — system context diagram for executives, sequence diagram for developers, state machine for product owners. Everyone sees the same system through their preferred lens.`,
  },
  {
    num: 33,
    question: "What strategies do you use to prioritize project requirements?",
    answer: `I use a multi-dimensional prioritization framework that considers business value, technical dependencies, risk, and stakeholder urgency.

On the Bell project, here's how I applied each dimension:

1. MoSCoW classification with stakeholder input: I categorize requirements as Must-Have, Should-Have, Could-Have, or Won't-Have (this release). For the initial platform launch, Must-Haves were: add subscription, cancel subscription, view subscriptions. Should-Haves: grace period handling, reversal flow. Could-Haves: promotional pricing, bundle management. This was validated with the product owner and the business sponsor.

2. Dependency-driven ordering: I map technical dependencies and sequence requirements accordingly. On Bell, the session-api and catalog-api requirements had to be completed before the reseller-service order submission flow, because submission depended on session validation and product qualification. I visualized these dependencies in Jira and used them to sequence sprint backlogs.

3. Risk-weighted scheduling: High-risk requirements (external integrations, new architectural patterns) get scheduled early. When we knew Disney+ would require async provisioning (a pattern we hadn't implemented), I pushed to start their integration spike 2 sprints before the target sprint. This gave us time to discover the async requirement and adapt.

4. Value vs. effort quadrants: For competing requirements with similar business priority, I use a simple 2x2 matrix — high value/low effort items first (quick wins), then high value/high effort (strategic investments), then low value/low effort (if time permits), and defer low value/high effort.

5. Contractual and regulatory constraints: Some requirements have non-negotiable deadlines. On Bell, merchant launch dates were contractual — these automatically became top priority regardless of other factors.

The key: prioritization is a continuous process, not a one-time exercise. I re-prioritize every sprint based on new information, and I make the prioritization rationale visible to all stakeholders so decisions are transparent.`,
  },
  {
    num: 34,
    question: "Can you describe a time when you had to mediate stakeholder conflicts?",
    answer: `On the Bell project, a significant conflict arose between the platform engineering team and the product team regarding the Radio-Canada integration approach.

Situation: The product team wanted a fast, custom integration to meet a contractual launch deadline (6 weeks). The platform engineering team insisted on implementing the standard MerchantProvider adapter interface, which they estimated at 4 weeks for the full implementation — leaving almost no buffer for testing.

The conflict was genuine: the product team had committed to a launch date with the Radio-Canada partnership team, while engineering had just spent weeks cleaning up technical debt from a previous rushed integration and didn't want to repeat the pattern.

Action: I mediated by reframing the conversation from "fast vs. right" to "what's the minimum scope that satisfies both constraints?"

First, I created a side-by-side comparison document: Option A (custom): 2-week delivery, but creates tech debt — separate error handling, monitoring, and onboarding docs needed. Option B (full adapter): 4-week delivery, follows the established pattern, uses existing circuit breaker and monitoring infrastructure.

Then I proposed Option C (phased adapter): Implement Provision and Deprovision first (2.5 weeks) — this covers 90% of launch requirements (customers can add and cancel Radio-Canada subscriptions). Defer CheckStatus and HandleCallback to a fast-follow sprint (1.5 weeks post-launch). The adapter interface is used from day one, but scope is reduced.

I presented this in a joint meeting with both stakeholders, showing: the product team gets their launch date (with a 1-week buffer for QA), and engineering gets the architectural consistency they need (adapter pattern from the start, no tech debt).

Result: Both sides agreed to Option C. Radio-Canada launched on time, and the deferred methods shipped 2 sprints later. The key was acknowledging both stakeholders' legitimate concerns and finding a solution that addressed the underlying constraints, not just the surface positions.`,
  },
  {
    num: 35,
    question: "How do you approach testing and quality assurance in your projects?",
    answer: `As a BSA, I contribute to quality assurance by ensuring requirements are testable, test plans are traceable, and validation covers all dimensions of system behavior.

My QA approach on the Bell project had four layers:

1. Requirements-driven test planning: Every acceptance criterion I write in Given-When-Then format becomes a test case. For the "Add Subscription" story, I had 6 ACs that generated 15+ test scenarios covering: happy path (3 scenarios), error scenarios (5 — one per error tier plus merchant-specific failures), edge cases (4 — duplicate submission, expired session, invalid account, unavailable provider), and async verification (3 — Kafka event published, notification sent, audit logged).

2. Data mapping validation: After a feature is deployed to the test environment, I trace the data end-to-end using actual API responses. I verify each field in the data mapping: Does the GraphQL response contain the correct subscriptionId? Does the PostgreSQL record have status=PENDING? Does the Kafka OrderCreated event contain the correct billingAccountNumber? This catches field-level bugs that unit tests miss.

3. Error scenario verification: I use test fixtures to simulate failures at each step of the orchestration. On Bell, I tested: merchant API returns 500 (circuit breaker should open after 5 failures), session expired (404 — UI should restart session flow), Kafka publish fails (order should still be committed, event goes to DLQ). I defined 17 specific error scenarios organized into 4 tiers, and QA used this as their negative test plan.

4. Integration contract testing: I verify that the actual API behavior matches the OpenAPI spec. Field names, types, required/optional flags, and error response shapes must match. On Bell, we caught 3 contract mismatches during spec review that would have caused production failures.

5. UAT support: I create UAT test scripts derived from acceptance criteria, prepare test data, validate the test environment, and triage defects with AC-level traceability.

The principle: quality is built into the requirements, not bolted on during testing.`,
  },
  {
    num: 36,
    question: "Can you give an example of a successful project you have worked on and your contribution to its success?",
    answer: `The Bell Canada Subscription Management Platform is the strongest example of a successful project where my BSA contributions were critical to the outcome.

Project overview: Bell Canada needed a unified platform for residential customers to add, manage, and cancel streaming subscriptions (Netflix, Disney+, Bell Media, Bango, Radio-Canada) with charges bundled on their Bell account. The platform involved 60+ Go microservices, a Next.js micro-frontend, Kafka event backbone, and integrations with 5 external streaming providers.

My specific contributions:

1. Architecture analysis and documentation: I traced the entire codebase to create the foundational artifacts — data mappings for every integration flow, orchestration specs for the 3 core flows (order submission, activation, cancellation), state machine diagrams for the subscription lifecycle, and an entity-relationship model for 7 domain entities. These artifacts became the single source of truth for the entire team.

2. Integration pattern advocacy: I analyzed the first two merchant integrations (Netflix, Bango) and identified that custom implementations wouldn't scale. I created a comparison document showing the operational cost of 5 custom integrations vs. the adapter pattern, which convinced the engineering lead to adopt the MerchantProvider interface. This decision reduced subsequent merchant onboarding from 5 weeks to 2 weeks.

3. Defect prevention through analysis: By analyzing production data, I discovered that 2% of orders were stuck in PENDING status due to unhandled merchant timeouts. My analysis led to three system improvements: saga compensation for timeouts, a fallout-process Lambda for auto-remediation, and provider-specific circuit breaker thresholds. Stuck orders dropped from 2% to 0.01%.

4. Team enablement: I created standardized templates and established a BSA peer review process that enabled junior analysts to independently document integrations. A junior BSA successfully delivered the Radio-Canada integration spec without my involvement.

5. Stakeholder alignment: I bridged communication between the billing team, product team, and engineering on complex technical decisions — from CQRS consistency trade-offs to circuit breaker behavior — by translating between business impact and technical implementation.

Result: The platform launched successfully with all 5 providers, handled production traffic reliably, and established patterns that made future integrations predictable and efficient. My BSA artifacts (data mappings, orchestration specs, ACs) were cited by the project lead as key enablers of the team's velocity.`,
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
    answer: `Situation: During a project at Bell, two separate teams were building similar reporting features independently — one for customer-facing dashboards and one for internal agents. Each team had its own backlog, its own requirements, and neither was aware of the overlap. I was the BSA on the customer side and noticed the duplication during a cross-team standup.

Task: I needed to convince both product owners — neither of whom reported to me — to consolidate the work before both teams wasted weeks building the same thing.

Action: Rather than escalating to management, I put together a one-page side-by-side comparison showing the overlapping fields, the shared data sources, and a rough estimate of the duplicated effort (about 4 weeks of combined dev time). I set up a 30-minute meeting with both POs and walked through the comparison. I framed it not as "you're doing it wrong" but as "here's an opportunity to deliver faster and share maintenance."

Result: Both POs agreed to merge the work into a single, shared component. The consolidated effort delivered 2 weeks ahead of either team's original estimate. After that, both POs started looping me into planning earlier to catch overlaps before they became a problem.`,
  },
  {
    num: 2,
    question: "Describe a situation where requirements changed late in the cycle.",
    answer: `Situation: We were two weeks from launching a new subscription feature when the external partner notified us that their response format would change — instead of sending back a confirmation immediately, they would send it later through a separate channel. Our entire user flow assumed an instant response.

Task: I needed to assess the impact quickly, communicate it clearly, and present realistic options — not just raise an alarm.

Action: Within a day, I mapped out every part of our flow that was affected: the confirmation screen (couldn't show a success message right away), the email notification (would fire too early), and the status display (would show stale data). I drafted two options for the product owner: Option A — delay the launch by 3 weeks to fully redesign the flow, or Option B — launch with a simple "processing" screen that refreshes automatically, and build the full solution in the next sprint. I included the trade-offs of each in plain language.

Result: We chose Option B. I rewrote the acceptance criteria for the interim approach and made sure to document the transition plan for the full solution. We launched on time, customer complaints were minimal because the "processing" message set the right expectation, and the permanent fix shipped two sprints later. The PM later said the impact assessment saved the team from panic-driven decisions.`,
  },
  {
    num: 3,
    question: "How do you deal with conflicting opinions between business and engineering?",
    answer: `Situation: The operations team wanted a status update to appear instantly after a customer made a change — they'd been getting complaints from agents saying "I just updated it but nothing changed." The development team pushed back, explaining that the system was designed with a small delay between writes and reads, and changing that would require a significant redesign.

Task: Both sides were talking past each other — operations saw a broken experience, engineering saw a working architecture. I needed to bridge the gap and find common ground.

Action: I set up a short meeting and asked two simple questions. To the operations team: "How quickly does the agent actually need to see the update?" Their answer was "within 30 seconds — they just don't want to wait minutes." To the dev team: "What's the actual delay right now?" Their answer was "usually under 5 seconds." I wrote both numbers on the whiteboard side by side.

Result: The conflict dissolved immediately. The 5-second delay was well within the 30-second business need. The real problem was that agents didn't know any delay existed and feared it could be minutes. We added a small "Refreshing..." indicator to the UI — a half-day fix — and agent complaints dropped to near zero. The lesson I took away is that most business-vs-engineering conflicts are really about missing information, not genuine disagreement.`,
  },
  {
    num: 4,
    question: "Tell me about a time you had to simplify a complex technical issue for non-technical stakeholders.",
    answer: `Situation: During a service outage affecting one of our streaming providers, the VP of product wanted to understand why some customers were seeing errors while others were fine, and whether this was a sign of a bigger system problem.

Task: I needed to explain the safety mechanism causing the errors in a way that was reassuring rather than alarming, without dumbing it down.

Action: I used a household analogy: "Think of it like a fuse box in your house. When one appliance has a problem — say, a short circuit in the kitchen — the fuse for that circuit trips. The kitchen loses power, but the living room, bedrooms, and everything else keeps working. After a short cooldown, the fuse resets and tries again. That's exactly what our system did — it isolated the problem with one provider so it wouldn't slow down everything else."

Result: The VP immediately understood and actually asked a great follow-up question: "Can we show the customer a friendlier message when the fuse is tripped versus when the provider actually says no?" That insight led to a new requirement I wrote up that afternoon — different error messages for temporary outages versus actual rejections. The whole conversation took 5 minutes and turned a stressful incident review into a productive improvement.`,
  },
  {
    num: 5,
    question: "How do you mentor other analysts or support team standards?",
    answer: `Situation: I joined a team where two junior BSAs were struggling with consistency — their requirements documents varied widely in format, and developers frequently came back with questions because edge cases weren't covered.

Task: I wanted to raise the quality bar without being prescriptive or making the junior analysts feel micromanaged.

Action: I took three steps. First, I created simple, reusable templates for the most common document types — a data mapping template, an acceptance criteria checklist (covering happy path, error cases, and edge cases), and a requirements summary template. Second, instead of lecturing, I paired with each analyst on their next story. I didn't write it for them — I asked guiding questions: "What happens if this step fails? Does the user need to wait for this? Where does this data actually come from?" Third, I set up a lightweight peer review process: before any requirements doc went to the dev team, another BSA reviewed it using a simple checklist.

Result: Within a month, the developers stopped asking "what about this scenario?" because the docs already covered it. One of the junior analysts independently handled a complex integration story — including edge cases I hadn't thought of — without any help from me. That was the real proof it worked. The templates and peer review process became team standards that outlasted my time on the project.`,
  },
  {
    num: 6,
    question: "Tell me about a time you missed something important in your requirements. How did you handle it?",
    answer: `Situation: I had written the acceptance criteria for a cancellation flow and felt confident it was thorough. But during QA, the testers discovered that if a customer cancelled during a promotional period, the system applied a penalty fee that nobody had accounted for — not in my requirements, not in the UI, and not in the backend logic.

Task: I needed to own the miss, fix the gap quickly, and put a safeguard in place so it wouldn't happen again.

Action: First, I acknowledged the gap openly in standup rather than trying to quietly patch it — the team needed to know, and I didn't want testers to lose trust in the requirements. Then I set up a quick call with the billing team to understand the full set of penalty scenarios (there were three, not just one). I updated the acceptance criteria within the day, added a new UI screen for the penalty disclosure, and worked with the developer to add the fee calculation logic.

Result: The fix shipped before the feature went live, so no customers were impacted. More importantly, I added "promotional/billing edge cases" as a standing item on my requirements checklist. I also started scheduling a 15-minute "what could go wrong?" brainstorm with QA before finalizing any acceptance criteria. That practice caught two similar gaps in the next quarter before they reached development.`,
  },
  {
    num: 7,
    question: "Describe a time you had to manage competing priorities from multiple stakeholders.",
    answer: `Situation: I was supporting three product owners simultaneously — one needed requirements for a new feature launching in 4 weeks, another needed urgent bug investigation for a live issue, and a third wanted me to join discovery sessions for a future initiative. All three considered their work the top priority.

Task: I couldn't do all three at full capacity at the same time, and I needed to manage expectations without damaging any of the relationships.

Action: I blocked out an hour to assess the real urgency and effort for each. The live bug turned out to need about 2 hours of investigation, not a full week. The new feature had a hard launch date but only needed 3 of the 12 user stories written immediately — the rest could follow. The discovery sessions were important but wouldn't produce actionable work for another 2 weeks. I put together a simple one-week plan showing how I'd allocate my time and shared it with all three POs in a single email, asking each to flag if they disagreed with the priority order.

Result: The transparency was the key. All three POs appreciated seeing the full picture rather than each thinking I was deprioritizing their work. The live bug was resolved that afternoon, I delivered the critical stories for the launch on schedule, and I joined the discovery sessions the following week. One PO later told me, "I've never had an analyst show me what else was on their plate — it made it much easier to be patient."`,
  },
  {
    num: 8,
    question: "Tell me about a time you disagreed with a decision. What did you do?",
    answer: `Situation: During sprint planning, the product owner decided to skip writing acceptance criteria for a set of "simple" stories, arguing they were straightforward enough that the developers could figure them out. I disagreed — in my experience, the stories that seem simple are often the ones that get misinterpreted.

Task: I didn't want to come across as bureaucratic, but I also didn't want the team to ship something that didn't match expectations and then waste time reworking it.

Action: I didn't argue in the meeting. Instead, I took one of the "simple" stories and spent 15 minutes writing quick acceptance criteria — just bullet points, nothing formal. When I shared them with the developer who'd picked up the story, he pointed out two assumptions that were wrong in the original description. If he'd built it as described, it would have needed rework.

Result: I brought this example back to the PO — not in a "told you so" way, but as evidence that even quick criteria catch misunderstandings early. The PO agreed to a compromise: we didn't need formal Given-When-Then for everything, but every story would get at least a bullet-point checklist of expected behavior before development started. That lightweight process stuck and reduced our rework rate noticeably over the next quarter.`,
  },
  {
    num: 9,
    question: "How do you build relationships with new teams or stakeholders?",
    answer: `Situation: I was moved to a new team mid-project where the developers and QA had been working together for months. I was the replacement BSA, and the previous analyst had left without much documentation. The team was skeptical of the new person slowing them down.

Task: I needed to earn the team's trust quickly and become productive without asking them to re-explain everything from scratch.

Action: For the first week, I focused on listening rather than prescribing. I sat in on every standup and retro without adding opinions. I read through the existing Jira board, past PRs, and whatever documentation existed to build my own understanding. I set up 15-minute one-on-ones with each developer and the QA lead, not to ask "how does everything work?" but to ask "what's the biggest pain point in how requirements get to you?" The answers were gold — they wanted clearer error scenarios and less ambiguity around edge cases.

Result: By week two, I was writing requirements that addressed the exact gaps the team had identified. The lead developer told me during retro that it was the smoothest BSA transition they'd experienced. The key was starting by understanding their pain points rather than imposing my own process. I've used that "listen first, then add value" approach on every new team since.`,
  },
  {
    num: 10,
    question: "Tell me about a time you improved a process or workflow on your team.",
    answer: `Situation: Our requirements review process was a bottleneck. Every requirements document had to be reviewed in a 1-hour meeting with the full team — developers, QA, PO, and the architect. These meetings were slow, often went off-topic, and people started skipping them because they felt like a waste of time. Stories were going into development with unreviewed requirements as a result.

Task: I needed to make the review process faster and more effective so the team would actually use it, not avoid it.

Action: I proposed splitting the review into two stages. Stage 1: an asynchronous review — I'd share the document 24 hours before the meeting, and reviewers would leave comments and questions directly in the document. Stage 2: a 20-minute (not 60-minute) sync meeting focused only on the unresolved questions. I also created a simple review checklist — 8 questions like "Are error scenarios covered?" and "Is the data source identified for every field?" — so reviewers knew what to look for instead of reading aimlessly.

Result: Meeting time dropped from 60 minutes to 20 minutes on average. Attendance went from about 60% to nearly 100% because people knew it would be short and focused. The quality of feedback actually improved because reviewers had time to think through the document before the meeting rather than reading it for the first time in the room. The PO adopted the same async-first pattern for design reviews, and it became a team standard.`,
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
