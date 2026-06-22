// ─── Active-Recall Quiz Data ─────────────────────────────────────────────────
// Flashcards grounded in the Bell Canada Subscription Management Platform.
// Sourced from architecture.ts, system-overview.ts, and bsa-cheatsheet.ts.

export interface QuizCard {
  id: string;
  category: string;
  question: string;
  answer: string;
  hint?: string;
}

export const quizCards: QuizCard[] = [
  // ─── Architecture ──────────────────────────────────────────────────────────
  {
    id: "arch-1",
    category: "Architecture",
    question:
      "What is the end-to-end request path for a subscription mutation, from UI to backend?",
    answer:
      "Microfrontend (Next.js MFE) → Next.js BFF (/api/protected/*) → AWS AppSync (GraphQL) → Go microservices (e.g. reseller-service) → Kafka for async fan-out. The UI never calls Go services directly.",
    hint: "Five layers; the UI never talks to Go directly.",
  },
  {
    id: "arch-2",
    category: "Architecture",
    question: "How do READS differ from WRITES in the request topology?",
    answer:
      "Mutations route through AppSync (GraphQL). Reads bypass AppSync entirely: BFF → subscriptions-aggregator-api (REST) → PostgreSQL + CPM. This is a CQRS split.",
    hint: "One path uses GraphQL, the other skips the gateway.",
  },
  {
    id: "arch-3",
    category: "Architecture",
    question: "What does the Next.js BFF do, and why does it exist?",
    answer:
      "It validates the session, fetches OAuth2 tokens (client_credentials) and holds them server-side, attaches Bearer tokens to outbound calls, and enforces account isolation (verifies householdAccountNumber matches the logged-in user). Tokens never leave the BFF.",
    hint: "Backend-for-Frontend; think tokens and isolation.",
  },
  {
    id: "arch-4",
    category: "Architecture",
    question: "What is AWS AppSync's role in the architecture?",
    answer:
      "It is the single GraphQL gateway for all mutations. Its resolvers translate each mutation into the correct downstream Go service call. The UI never reaches Go services except through it.",
    hint: "GraphQL gateway / API gateway pattern.",
  },
  {
    id: "arch-5",
    category: "Architecture",
    question: "What is the system of record for subscription state?",
    answer:
      "reseller-service → PostgreSQL is the write-side source of truth. subscriptions-aggregator-api merges PostgreSQL + CPM for reads — a CQRS split between write and read models.",
    hint: "Write-side is PostgreSQL; reads merge two sources.",
  },
  {
    id: "arch-6",
    category: "Architecture",
    question: "How is the Subscription Manager MFE embedded into the host app?",
    answer:
      "It is a Next.js + React microfrontend embedded via Module Federation. Routes: /customer/* (EN), /client/* (FR), and /agent. Feature flags via Unleash and OpenFeature.",
    hint: "Module Federation; EN/FR/agent routes.",
  },
  {
    id: "arch-7",
    category: "Architecture",
    question:
      "Roughly how large is the platform in terms of services and Lambdas?",
    answer:
      "~58 services total across 10 domain groups, including 29 Lambda functions. Domains: core subscription, merchants, catalog, auth, promotions, events, orders, orchestration, serverless, infrastructure.",
    hint: "Dozens of services, ~30 Lambdas, 10 groups.",
  },

  // ─── Services ──────────────────────────────────────────────────────────────
  {
    id: "svc-1",
    category: "Services",
    question: "What is reseller-service responsible for?",
    answer:
      "The primary CRUD/write orchestrator (Gin + OpenAPI codegen). It writes to PostgreSQL, calls merchant-api-* for provisioning, publishes to Kafka on every change, and triggers audit-api. Handles op codes APPLY_TO_ORDER, DELETE, REVERSE_*.",
    hint: "The write orchestrator behind AppSync.",
  },
  {
    id: "svc-2",
    category: "Services",
    question: "What does subscriptions-aggregator-api do?",
    answer:
      "REST read-only service. Aggregates subscriptions from PostgreSQL and CPM, and is called directly by the BFF (bypasses AppSync). Powers the /customer subscription list screen.",
    hint: "The read-side of CQRS; merges PG + CPM.",
  },
  {
    id: "svc-3",
    category: "Services",
    question: "What is household-api and which legacy system does it wrap?",
    answer:
      "A gqlgen GraphQL service that wraps CPM (Common Provisioning Management). It returns equipment history and account-level data and validates the account during session generation. It acts as an Anti-Corruption Layer over legacy CPM.",
    hint: "Anti-corruption layer over CPM.",
  },
  {
    id: "svc-4",
    category: "Services",
    question: "What does session-api manage and where is state stored?",
    answer:
      "Session lifecycle: create, clone, expire. Sessions live in DynamoDB with a 30-minute TTL. generateSession for customers, cloneSession for agents.",
    hint: "DynamoDB, 30-min TTL.",
  },
  {
    id: "svc-5",
    category: "Services",
    question: "How does catalog-api serve product data fast, and how is it kept fresh?",
    answer:
      "catalog-api (gqlgen GraphQL) serves offerings/offers/categories from a Redis cache. catalog-manager consumes real-time product events from Kafka and writes them back to Redis to keep it fresh.",
    hint: "Redis-backed; a Kafka consumer keeps it warm.",
  },
  {
    id: "svc-6",
    category: "Services",
    question: "Which five merchant adapter services exist, and what providers do they cover?",
    answer:
      "merchant-api-bango-v1 (Bango aggregation platform), merchant-api-netflix, merchant-api-disney (Disney+), merchant-api-bellmedia (Bell Media), merchant-api-radiocanada (Radio-Canada). They are invisible to the UI.",
    hint: "Bango, Netflix, Disney+, Bell Media, Radio-Canada.",
  },
  {
    id: "svc-7",
    category: "Services",
    question: "What does audit-api record, and what extra detail do agent flows include?",
    answer:
      "It logs all significant actions to PostgreSQL: ORDER_PLACED, ACTIVATED, CANCELLED, RECOVERED — each with a correlationId. For agent flows it also records the agent ID and the original order number.",
    hint: "Compliance log in PostgreSQL with correlation IDs.",
  },
  {
    id: "svc-8",
    category: "Services",
    question: "What is flow-runner-api and what data store backs it?",
    answer:
      "It orchestrates multi-step business flows using the saga/compensating-transaction pattern. Flow state is persisted in DynamoDB with conditional writes for idempotency; FlowExecution rows have a 30-day TTL.",
    hint: "Saga orchestrator; DynamoDB-backed.",
  },
  {
    id: "svc-9",
    category: "Services",
    question: "What does account-recovery-api do?",
    answer:
      "It reconciles inconsistencies between PostgreSQL and merchant systems, scanning for state drift and executing corrections (re-provision or force-cancel) via reseller-service + merchant-api-*. All recovery actions are logged to audit-api.",
    hint: "Reconciles PG ↔ merchant state.",
  },
  {
    id: "svc-10",
    category: "Services",
    question: "What is token-api used for?",
    answer:
      "It tokenizes sensitive JSON payloads in Redis with a 24h TTL, used mid-flow to pass data between steps without exposing it in the URL.",
    hint: "Redis, 24h TTL, hides data from URLs.",
  },

  // ─── Events ────────────────────────────────────────────────────────────────
  {
    id: "evt-1",
    category: "Events",
    question: "What is the async event backbone, and what delivery guarantee does it give?",
    answer:
      "Apache Kafka, with 14+ event types on named topics. Delivery is at-least-once, so consumers must be idempotent. SQS buffers notifications. The partition key is subscriptionId for ordering.",
    hint: "At-least-once → idempotent consumers.",
  },
  {
    id: "evt-2",
    category: "Events",
    question: "Why is subscriptionId used as the Kafka partition key?",
    answer:
      "To preserve per-subscription event ordering. All events for a given subscription land on the same partition, so consumers see them in order.",
    hint: "Ordering guarantee per entity.",
  },
  {
    id: "evt-3",
    category: "Events",
    question: "How does reseller-service publish events relative to its database write?",
    answer:
      "Fire-and-forget after the PostgreSQL commit. PG is committed first (source of truth), then the event is published asynchronously. If Kafka fails, the event goes to the DLQ but the order is still committed.",
    hint: "DB commit first, then non-blocking publish.",
  },
  {
    id: "evt-4",
    category: "Events",
    question: "What key fields make a Kafka OrderCreated event idempotent and traceable?",
    answer:
      "eventType (discriminator), eventId (UUID v4 — the idempotency key), and payload fields orderId/subscriptionId/billingAccountNumber/productId/providerId/status/price/billingCycle linking back to PostgreSQL.",
    hint: "eventId is the dedup key.",
  },
  {
    id: "evt-5",
    category: "Events",
    question: "How does the notification flow work end-to-end?",
    answer:
      "notification-consumer listens to Kafka lifecycle events (placed, activated, cancelled, renewed) and dispatches via email-api → SES v2. SQS buffers bursts to prevent throttling. It is fully event-driven (no UI trigger).",
    hint: "Kafka → consumer → email-api → SES, with SQS buffer.",
  },
  {
    id: "evt-6",
    category: "Events",
    question: "What happens to a Kafka event that fails processing after retries?",
    answer:
      "After 3 retries it goes to a Dead-Letter Queue. event-hub routes DLQ failures to the fallout-process Lambda, which attempts auto-remediation before escalating to a manual review queue / ops alert.",
    hint: "DLQ → fallout-process Lambda → manual queue.",
  },
  {
    id: "evt-7",
    category: "Events",
    question: "Which event does the fulfillment Lambda consume, and what does it do?",
    answer:
      "fulfillment-process Lambda consumes OrderCreated / OrderUpdated from Kafka, calls reseller-api-v1 to finalize provisioning, then dispatches to the right merchant-api-* for activation. It retries with exponential backoff, with a DLQ for failures.",
    hint: "Bridges order placement and merchant provisioning.",
  },

  // ─── Patterns ──────────────────────────────────────────────────────────────
  {
    id: "pat-1",
    category: "Patterns",
    question: "How does the saga pattern handle a failed multi-step order?",
    answer:
      "Steps execute in order; on failure, compensation runs in reverse. e.g. deprovision merchant → DELETE subscription+order in PG → publish OrderReversed → log a COMPENSATED audit entry. State is persisted to DynamoDB after each step, so flows survive restarts.",
    hint: "Compensate in reverse order.",
  },
  {
    id: "pat-2",
    category: "Patterns",
    question: "How is idempotency enforced across the system?",
    answer:
      "Kafka consumers dedupe by eventId; flow-runner-api uses DynamoDB conditional writes; sessions carry a 'consumed' flag to block replay; and duplicate order submissions are rejected at submitSubscription.",
    hint: "eventId, conditional writes, consumed flag.",
  },
  {
    id: "pat-3",
    category: "Patterns",
    question: "How do circuit breakers protect the platform, and what are the default thresholds?",
    answer:
      "Go hystrix circuit breakers per merchant-api prevent cascade failures. Default: opens after 5 consecutive failures within 30s, with a 30s half-open probe window. A Netflix outage can't take down Disney+ provisioning.",
    hint: "5 failures / 30s, 30s half-open.",
  },
  {
    id: "pat-4",
    category: "Patterns",
    question: "What is the retry strategy for transient failures?",
    answer:
      "Exponential backoff with jitter, max 3 retries. Used by fulfillment-process and retry-handler Lambdas; exhausted retries route to the DLQ.",
    hint: "Backoff + jitter, capped at 3.",
  },
  {
    id: "pat-5",
    category: "Patterns",
    question: "How is the Adapter pattern applied to merchants?",
    answer:
      "All 5 merchant-api-* services implement one shared MerchantProvider Go interface (Provision, Deprovision, CheckStatus, HandleCallback). reseller-service routes by providerId without knowing each provider's details, even though they use different auth schemes.",
    hint: "One interface, five implementations.",
  },
  {
    id: "pat-6",
    category: "Patterns",
    question: "What is a grace period and how does it differ from cancellation?",
    answer:
      "When payment lapses or a customer cancels, 4 of 5 providers require a contractual grace window (3–7 days; Netflix 3, Bango 7). The subscription enters GRACE_PERIOD and the merchant SUSPENDS (not cancels). It auto-resumes via a Kafka event if resolved in the window.",
    hint: "Suspend, don't cancel; 3–7 days.",
  },
  {
    id: "pat-7",
    category: "Patterns",
    question: "How does the platform ensure data consistency across systems?",
    answer:
      "Eventual consistency via Kafka with idempotent consumers. PG is committed first; events publish fire-and-forget (DLQ on failure). Critical flows use DynamoDB conditional writes. account-recovery-api reconciles PG vs merchant drift.",
    hint: "Eventual consistency + reconciliation.",
  },
  {
    id: "pat-8",
    category: "Patterns",
    question: "Why is CQRS used here, and how is each side implemented?",
    answer:
      "Read and write paths have different needs. Write: reseller-service → PostgreSQL (business logic + event publishing). Read: aggregator-api merges PG + CPM and bypasses AppSync (direct REST). This lets each side scale and be optimized independently.",
    hint: "Separate write service and read service.",
  },

  // ─── API ───────────────────────────────────────────────────────────────────
  {
    id: "api-1",
    category: "API",
    question: "What are the 5 core GraphQL mutations and the 1 REST read?",
    answer:
      "Mutations: generateSession, subscriptionQualification, submitSubscription, activateSubscription, cloneSession. REST read: GET /subscriptions (via aggregator-api).",
    hint: "Five mutations, one read.",
  },
  {
    id: "api-2",
    category: "API",
    question: "What does the submitSubscription mutation do under the hood?",
    answer:
      "reseller-service: (1) writes subscription (status=PENDING) + order to PostgreSQL, (2) calls the right merchant-api-* (routed by providerId), (3) publishes OrderCreated to Kafka, (4) logs ORDER_PLACED to audit-api. Returns orderId, subscriptionId, status.",
    hint: "Write → provision → publish → audit.",
  },
  {
    id: "api-3",
    category: "API",
    question: "How does an agent flow differ from a customer flow at the session level?",
    answer:
      "Agents call cloneSession(orderNumber) instead of generateSession. It clones the customer's session and links the agent's identity (and original order number) to the audit trail. Qualify and submit are otherwise identical.",
    hint: "cloneSession, not generateSession.",
  },
  {
    id: "api-4",
    category: "API",
    question: "How is authentication handled, and where do tokens live?",
    answer:
      "SAML SSO (BoxyHQ) for customers, a SAML agent audience for agents, Auth0 for dev/DIT. The BFF obtains OAuth2 client_credentials tokens (scopes subscription-manager/query and subscriptions-aggregator-api/read) from auth-api and holds them server-side only.",
    hint: "SAML/Auth0 in; OAuth2 tokens held by the BFF.",
  },
  {
    id: "api-5",
    category: "API",
    question: "What are the four MerchantProvider interface methods?",
    answer:
      "Provision, Deprovision, CheckStatus, HandleCallback. Every merchant adapter implements all four, regardless of the provider's underlying auth scheme (OAuth2, API key + HMAC, JWT, SHA-256).",
    hint: "Two write, one read, one webhook.",
  },
  {
    id: "api-6",
    category: "API",
    question: "What does the OpenAPI 3.0 spec serve as in this platform?",
    answer:
      "The contract. 9+ services keep an openapi.yaml (reseller-service, order-api, auth-api, audit-api, etc.), several using codegen — the spec generates the server. The AppSync GraphQL schema is the stable frontend contract; gRPC proto files are the spec for promocodes services.",
    hint: "Spec-as-contract; codegen.",
  },
  {
    id: "api-7",
    category: "API",
    question: "What belongs in an OpenAPI spec for these services?",
    answer:
      "Endpoint definitions (method/path), request/response schemas with required vs optional fields and enums (e.g. SubscriptionStatus: PENDING|ACTIVE|CANCELLED|GRACE_PERIOD|SUSPENDED), auth/OAuth2 scopes, error responses mapped to scenarios (session expired→404, wrong status→400, merchant timeout→502), SLA/latency budgets, and examples.",
    hint: "Endpoints, schemas, auth, errors, SLAs, examples.",
  },
  {
    id: "api-8",
    category: "API",
    question: "What does Apigee provide as an API management layer?",
    answer:
      "An API gateway/management plane: it fronts APIs with proxy endpoints, applies policies (auth/OAuth2 verification, quota, spike arrest/rate limiting, transforms), and provides analytics — separating the consumer-facing contract from backend target services.",
    hint: "Gateway with policies, quotas, analytics.",
  },
  {
    id: "api-9",
    category: "API",
    question:
      "How does subscriptionQualification behave across add, cancel, and undo?",
    answer:
      "It is re-called on every plan selection. operationType=APPLY_TO_ORDER for add/plan-change, DELETE for cancel, and REVERSE_ADD/REVERSE_DELETE for undo. It routes through AppSync → reseller-service → catalog-api (Redis).",
    hint: "Op code changes per flow.",
  },

  // ─── BSA ───────────────────────────────────────────────────────────────────
  {
    id: "bsa-1",
    category: "BSA",
    question: "How do you anchor integration requirements gathering when stakeholders are unclear or remote?",
    answer:
      "Anchor every conversation on a concrete data flow (UI → BFF → AppSync → reseller-service → merchant-api → Kafka) and have each stakeholder validate their segment. Circulate shared artifacts async — data mapping spreadsheet, Mermaid sequence diagram, draft Given-When-Then ACs — and tag open questions [TBD].",
    hint: "Trace the flow; shared artifacts as conversation anchors.",
  },
  {
    id: "bsa-2",
    category: "BSA",
    question: "What columns belong in a field-level data mapping document?",
    answer:
      "UI Field → GraphQL Variable → Backend Go Field → DB Column → Notes. e.g. 'Billing Account' → customerInfo.billingAccountNumber → BillingAccountNumber → billing_account_number (PG); Notes capture it as both session PK and subscription PK. Auto fields are marked '— (auto)'.",
    hint: "Five columns tracing one field across all layers.",
  },
  {
    id: "bsa-3",
    category: "BSA",
    question: "How should acceptance criteria for integration stories be written?",
    answer:
      "Given-When-Then, covering four dimensions: happy path, error/failure, edge cases, and async/non-functional behavior. Each AC must be independently testable, name the specific error and the user-visible outcome, and call out Kafka events published (downstream contracts QA must verify).",
    hint: "GWT across 4 dimensions; testable; name the events.",
  },
  {
    id: "bsa-4",
    category: "BSA",
    question: "Give an example of a requirements-vs-behavior mismatch found on this platform.",
    answer:
      "The product owner documented cancellation as instant, but tracing the flow revealed a contractual 3–7 day GRACE_PERIOD for 4 of 5 providers. Fix: a state-machine diagram (ACTIVE → GRACE_PERIOD → CANCELLED), UX copy changed to 'ends on [date]', and a Kafka consumer to email on grace-period expiry.",
    hint: "The 'instant cancel' assumption vs grace period.",
  },
  {
    id: "bsa-5",
    category: "BSA",
    question: "What non-functional requirements would you define for this integration?",
    answer:
      "Availability SLAs (99.95% for critical path), latency budgets (generateSession 100–300ms, subscriptionQualification 300–800ms, submitSubscription 500ms–2s incl. merchant round-trip), per-merchant circuit-breaker thresholds, Kafka consumer lag <5s p99, 30-min session TTL, notification <5s, bilingual EN/FR, audit immutability, feature flags default OFF if Unleash is unreachable.",
    hint: "SLAs, latency budgets, lag, TTLs, i18n, flag fallback.",
  },
  {
    id: "bsa-6",
    category: "BSA",
    question: "How do you validate that completed integration work meets requirements?",
    answer:
      "Three layers: (1) trace the data mapping end-to-end against a real test response (fields match, status=PENDING not ACTIVE); (2) verify async behavior — OrderCreated published, notification-consumer emailed via SES, audit logged ORDER_PLACED with correlationId; (3) run the AC checklist with evidence, opening defects referencing the specific AC on failure.",
    hint: "Data trace, async checks, AC checklist with evidence.",
  },
  {
    id: "bsa-7",
    category: "BSA",
    question: "How do you onboard a new merchant partner, step by step?",
    answer:
      "Implement the MerchantProvider interface; deploy a new merchant-api-<provider> service with its own GitLab→Docker→ECR→ArgoCD pipeline; store credentials in AWS Secrets Manager (rotated by secret-rotator-lambda); add a routing rule in reseller-service by providerId; configure circuit-breaker thresholds; wire merchant-callback-lambda for async webhooks; add products to the catalog. Zero UI/AppSync changes.",
    hint: "Implement interface, deploy adapter, route by providerId.",
  },
  {
    id: "bsa-8",
    category: "BSA",
    question: "When do you choose sync vs async vs saga vs adapter integration?",
    answer:
      "Sync (AppSync) when the UI needs an immediate response. Async (Kafka pub/sub) when the user need not wait — notifications, billing sync, analytics. Saga (flow-runner-api) when a multi-step process needs atomicity with compensation. Adapter when integrating multiple external systems with different contracts. Start sync; add async to decouple; add saga for distributed transactions; add adapters for many externals; add CQRS when read/write diverge.",
    hint: "Decision framework by consistency and failure tolerance.",
  },
];
