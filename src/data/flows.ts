export interface FlowStep {
  screen: string;
  action: string;
  mutation: string;
}

export interface Flow {
  id: string;
  title: string;
  description: string;
  audience: "Customer" | "Agent" | "System";
  route: string;
  steps: FlowStep[];
}

export const flows: Flow[] = [
  {
    id: "flow-add",
    title: "Flow 1 — Add subscription",
    description: 'Four screens, three mutations, one REST call. Key handoff: subscriptionQualification (check) → submitSubscription (commit).',
    audience: "Customer",
    route: "/customer → /add-subscription → /review → /confirm",
    steps: [
      { screen: "/customer", action: "Page loads", mutation: '<span class="text-arch-teal font-mono text-[10px]">GET /subscriptions</span> → aggregator-api PostgreSQL CPM' },
      { screen: "/customer", action: 'Clicks "Add"', mutation: '<span class="text-arch-amber font-mono text-[10px]">generateSession</span> → session-api DynamoDB household-api CPM' },
      { screen: "/add-subscription", action: "Catalog renders", mutation: '<span class="text-arch-amber font-mono text-[10px]">subscriptionQualification</span> (APPLY_TO_ORDER) → reseller-service catalog-api Redis' },
      { screen: "/add-subscription", action: "Selects plan", mutation: '<span class="text-arch-amber font-mono text-[10px]">subscriptionQualification</span> re-called on each selection' },
      { screen: "/review", action: "Page loads", mutation: 'Reads token-api payload — no new mutation' },
      { screen: "/review", action: 'Clicks "Place Order"', mutation: '<span class="text-arch-amber font-mono text-[10px]">submitSubscription</span> → reseller-service PostgreSQL merchant-api-* Kafka audit-api' },
      { screen: "/confirm", action: "Page loads", mutation: '<span class="text-arch-amber font-mono text-[10px]">activateSubscription</span> → reseller-service merchant-api-* audit-api → returns activationUrl' },
    ],
  },
  {
    id: "flow-cancel",
    title: "Flow 2 — Cancel subscription",
    description: 'Same three mutations, op code DELETE. merchant-api deprovisions on confirm.',
    audience: "Customer",
    route: "/customer → /cancel-subscription",
    steps: [
      { screen: "/customer", action: 'Clicks "Cancel" on card', mutation: '<span class="text-arch-amber font-mono text-[10px]">subscriptionQualification</span> (DELETE) → reseller-service catalog-api' },
      { screen: "/cancel-subscription", action: "Page loads", mutation: 'Reads qualification result from session — no mutation' },
      { screen: "/cancel-subscription", action: "Confirms cancellation", mutation: '<span class="text-arch-amber font-mono text-[10px]">submitSubscription</span> → reseller-service status→CANCELLED PostgreSQL merchant-api-* deprovision Kafka audit-api' },
    ],
  },
  {
    id: "flow-change",
    title: "Flow 3 — Change plan",
    description: 'Same mutations as Add, scoped to an existing subscriptionId. catalog-api returns only upgrade/downgrade options.',
    audience: "Customer",
    route: "/customer → /change-subscription/[id] → /review",
    steps: [
      { screen: "/customer", action: 'Clicks "Change Plan"', mutation: '<span class="text-arch-amber font-mono text-[10px]">generateSession</span> → session-api DynamoDB' },
      { screen: "/change-subscription/[id]", action: "Tier picker loads", mutation: '<span class="text-arch-amber font-mono text-[10px]">subscriptionQualification</span> (APPLY_TO_ORDER + currentSubId) → reseller-service catalog-api Redis' },
      { screen: "/change-subscription/[id]", action: "Selects tier", mutation: '<span class="text-arch-amber font-mono text-[10px]">subscriptionQualification</span> re-called' },
      { screen: "/change-subscription/[id]/review", action: "Confirms change", mutation: '<span class="text-arch-amber font-mono text-[10px]">submitSubscription</span> → reseller-service PostgreSQL update merchant-api-* Kafka audit-api' },
    ],
  },
  {
    id: "flow-agent",
    title: "Flow 4 — Agent-assisted",
    description: 'cloneSession instead of generateSession — links the agent\'s action to the original customer order number in the audit trail.',
    audience: "Agent",
    route: "/agent?orderNumber=XYZ → /agent/review",
    steps: [
      { screen: "/agent?orderNumber=XYZ", action: "Page loads", mutation: '<span class="text-arch-amber font-mono text-[10px]">cloneSession</span> (orderNumber) → session-api DynamoDB clones existing session' },
      { screen: "/agent", action: "Selects plan on customer's behalf", mutation: '<span class="text-arch-amber font-mono text-[10px]">subscriptionQualification</span> (APPLY_TO_ORDER) → reseller-service catalog-api' },
      { screen: "/agent/review", action: "Reviews order", mutation: 'Reads cloned session — no mutation' },
      { screen: "/agent/review", action: "Submits on customer's behalf", mutation: '<span class="text-arch-amber font-mono text-[10px]">submitSubscription</span> → reseller-service PostgreSQL merchant-api-* Kafka audit-api (with agent ID)' },
    ],
  },
  {
    id: "flow-undo",
    title: "Undo flows",
    description: 'No unique mutations — same three mutations with reverse operation codes.',
    audience: "Customer",
    route: "/reverse-cancellation · /reverse-downgrade · /reverse-bundle-change",
    steps: [
      { screen: "1 — Page load", action: "Read existing state", mutation: '<span class="text-arch-amber font-mono text-[10px]">generateSession</span> or <span class="text-arch-amber font-mono text-[10px]">cloneSession</span>' },
      { screen: "2 — Qualify", action: "System checks reversibility", mutation: '<span class="text-arch-amber font-mono text-[10px]">subscriptionQualification</span> op: REVERSE_DELETE / REVERSE_DOWNGRADE' },
      { screen: "3 — Confirm", action: "Customer confirms undo", mutation: '<span class="text-arch-amber font-mono text-[10px]">submitSubscription</span> → reseller-service reverts prior state PostgreSQL merchant-api-*' },
    ],
  },
  {
    id: "flow-appsync",
    title: "AppSync — Request lifecycle",
    description: 'How AWS AppSync processes every GraphQL request: authentication, schema validation, VTL mapping, resolver execution, and observability.',
    audience: "Customer",
    route: "BFF → AppSync → Resolver → Data Source → Response",
    steps: [
      { screen: "1 — Ingress", action: "GraphQL request received", mutation: '<span class="text-arch-teal font-mono text-[10px]">POST /graphql</span> → AppSync HTTPS endpoint with SigV4 or API key' },
      { screen: "2 — Auth", action: "Authorization check", mutation: '<span class="text-arch-purple font-mono text-[10px]">IAM SigV4</span> / <span class="text-arch-purple font-mono text-[10px]">Cognito</span> / <span class="text-arch-purple font-mono text-[10px]">API Key</span> / <span class="text-arch-purple font-mono text-[10px]">Lambda auth</span> — multi-auth per-field via @auth' },
      { screen: "3 — Validate", action: "Schema validation", mutation: 'Validates against <span class="text-arch-purple font-mono text-[10px]">GraphQL SDL</span> — field existence, argument types, required fields' },
      { screen: "4 — Map request", action: "VTL request mapping", mutation: '<span class="text-arch-amber font-mono text-[10px]">VTL template</span> transforms $context.arguments → data source format' },
      { screen: "5 — Resolve", action: "Resolver invocation", mutation: '<span class="text-arch-blue font-mono text-[10px]">Unit resolver</span> (single source) or <span class="text-arch-blue font-mono text-[10px]">Pipeline resolver</span> (chained functions via $context.stash)' },
      { screen: "6 — Execute", action: "Data source call", mutation: '<span class="text-arch-teal font-mono text-[10px]">Lambda</span> (Go services) · <span class="text-arch-teal font-mono text-[10px]">DynamoDB</span> · <span class="text-arch-teal font-mono text-[10px]">HTTP</span> · <span class="text-arch-teal font-mono text-[10px]">RDS</span>' },
      { screen: "7 — Map response", action: "VTL response mapping", mutation: '<span class="text-arch-amber font-mono text-[10px]">VTL template</span> transforms $context.result → GraphQL return type · $util.error() for errors' },
      { screen: "8 — Egress", action: "Response & logging", mutation: 'Typed response → BFF · <span class="text-arch-text3 font-mono text-[10px]">CloudWatch</span> logs, latency metrics, <span class="text-arch-text3 font-mono text-[10px]">X-Ray</span> traces' },
    ],
  },
  {
    id: "flow-order",
    title: "End-to-end order flow",
    description: "The complete backend journey of an order from cart session to billing. Three phases: Configurator session/cart → Order API (one sync gate, then everything fans out async) → Billing Process Lambda. Step through the diagram below, then expand the detailed reference for every endpoint.",
    audience: "System",
    route: "Configurator → Order API → Billing λ",
    steps: [
      { screen: "Phase 1 · Configurator", action: "Initialize cart", mutation: '<span class="text-arch-teal font-mono text-[10px]">POST /cart/initialize</span> → creates session (State=Active). sessionId must be unique — a reused id returns Locked.' },
      { screen: "Phase 1 · Configurator", action: "Apply & qualify", mutation: '<span class="text-arch-amber font-mono text-[10px]">PATCH /cart/apply-qualify/{id}</span> → validates eligibility, applies promos, prices the cart → State=ConvToOrder (only state Order API accepts).' },
      { screen: "Phase 2 · Order API", action: "Create order", mutation: '<span class="text-arch-teal font-mono text-[10px]">POST /order</span> { sessionId } with X-Correlation-ID. Everything after the next step runs async.' },
      { screen: "Phase 2 · Order API", action: "ConvertToOrder (SYNC, blocking)", mutation: '<span class="text-arch-coral font-mono text-[10px]">POST /cart/convertToOrder</span> → Configurator locks session (State=Locked) + returns full cart. Fails → 500, no order created.' },
      { screen: "Phase 2 · Order API", action: "MSI service agreement (async goroutine)", mutation: '<span class="text-arch-amber font-mono text-[10px]">POST {MSI_URL}</span> after GET /cart. Skipped for batch / Netflix portal / promo-disqual. Failure logged only — order continues.' },
      { screen: "Phase 2 · Order API", action: "Product catalog lookups", mutation: '<span class="text-arch-teal font-mono text-[10px]">GET /query?offeringIds / productIds / promoIds</span> → returns productKey for fulfillment. Failure → PARTIAL_SUCCESS.' },
      { screen: "Phase 2 · Order API", action: "POLM POST — register order (async)", mutation: '<span class="text-arch-amber font-mono text-[10px]">POST /productOrder/detailedProductOrder</span> (status=inProgress). Panic-protected goroutine. Failure → fallout event, order continues (POLM fix).' },
      { screen: "Phase 2 · Order API", action: "Confirmation email", mutation: '<span class="text-arch-teal font-mono text-[10px]">POST /internal/topic</span> (email event). Skipped when BypassConfirmationEmail set. Failure → PARTIAL_SUCCESS.' },
      { screen: "Phase 2 · Order API", action: "Fulfillment via Reseller Service", mutation: '<span class="text-arch-amber font-mono text-[10px]">PATCH /reseller/subscriptions/{id}</span> → routes to merchant (Netflix/Disney/Bango/Bell Media). PendingTxnId BPP_{orderId}_{ts} in DynamoDB. Failures tracked, not blocking.' },
      { screen: "Phase 2 · Order API", action: "Subscriber profile update", mutation: '<span class="text-arch-amber font-mono text-[10px]">PATCH /subscriber/{id}</span> → new offerings + products (promos filtered). Critical — blocks the fulfillment return on failure.' },
      { screen: "Phase 2 · Order API", action: "Publish billing event", mutation: '<span class="text-arch-teal font-mono text-[10px]">POST /internal/topic</span> (billing, immediate items only) → Billing SQS queue. Handoff to Billing Lambda. Failure → PARTIAL_SUCCESS.' },
      { screen: "Phase 2 · Order API", action: "Return response", mutation: '200 SUCCESS · 200 PARTIAL_SUCCESS · 500 INTERNAL_ERROR (ConvertToOrder failed). Returns confirmationNumber + subscriptions.' },
      { screen: "Phase 3 · Billing λ", action: "Read SQS message", mutation: 'Lambda (serverless/billing-process) triggered by SQS — extracts order, session items, subscriber info, correlation ID.' },
      { screen: "Phase 3 · Billing λ", action: "NM1 billing call", mutation: '<span class="text-arch-teal font-mono text-[10px]">POST {NM1_URL}</span> → create/update billing account, assign account number. Failure → handler updates Order table + may publish fallout.' },
      { screen: "Phase 3 · Billing λ", action: "Update subscriber state (post-NM1)", mutation: '<span class="text-arch-amber font-mono text-[10px]">PATCH /subscriber/{id}</span> → reflect billing completion.' },
      { screen: "Phase 3 · Billing λ", action: "POLM PATCH — order complete", mutation: '<span class="text-arch-amber font-mono text-[10px]">PATCH /productOrder/productOrder/{id}</span> (status=completed). Failure → fallout event, order still complete (POLM fix). Order table → Completed.' },
    ],
  },
  {
    id: "flow-renewal",
    title: "Flow 12 — Renewal",
    description: "subscription-renewal-process Lambda runs daily, finds subscriptions approaching their renewal date, re-validates eligibility, extends the period, and publishes a SubscriptionRenewed event. Entirely backend — no UI trigger.",
    audience: "System",
    route: "EventBridge → renewal λ → PostgreSQL → Kafka",
    steps: [
      { screen: "EventBridge", action: "Daily schedule fires", mutation: 'EventBridge cron → invokes <span class="text-arch-blue font-mono text-[10px]">subscription-renewal-process</span> Lambda' },
      { screen: "Renewal λ", action: "Query due subscriptions", mutation: '<span class="text-arch-teal font-mono text-[10px]">SELECT</span> from PostgreSQL WHERE renewalDate within window' },
      { screen: "Renewal λ", action: "Re-validate eligibility", mutation: 'Re-checks eligibility via <span class="text-arch-amber font-mono text-[10px]">reseller-service</span> + catalog-api before renewing' },
      { screen: "Renewal λ", action: "Extend period", mutation: '<span class="text-arch-amber font-mono text-[10px]">UPDATE</span> subscription period in PostgreSQL' },
      { screen: "Renewal λ", action: "Publish renewal event", mutation: '<span class="text-arch-teal font-mono text-[10px]">SubscriptionRenewed</span> → Kafka' },
      { screen: "Consumers", action: "Downstream reacts", mutation: 'billing-process + notification-consumer act on the renewal event' },
    ],
  },
  {
    id: "flow-grace",
    title: "Flow 14 — Grace Period",
    description: "When a payment fails or lapses, reseller-api-v1 sets status to GRACE_PERIOD and merchant-api-* suspends provisioning without fully cancelling. If resolved within the window, service auto-resumes via a Kafka event.",
    audience: "System",
    route: "Payment lapse → reseller-api-v1 → merchant-api-* → Kafka",
    steps: [
      { screen: "Payment lapse", action: "Payment fails / lapses", mutation: 'Payment failure event triggers the grace-period workflow' },
      { screen: "reseller-api-v1", action: "Set GRACE_PERIOD", mutation: '<span class="text-arch-amber font-mono text-[10px]">status = GRACE_PERIOD</span> in PostgreSQL (configurable window per merchant)' },
      { screen: "merchant-api-*", action: "Suspend provisioning", mutation: 'Merchant <span class="text-arch-coral font-mono text-[10px]">suspends</span> the service — not a full cancellation' },
      { screen: "Kafka", action: "Await resolution", mutation: 'Payment resolved within window → Kafka resolution event → reseller-api-v1' },
      { screen: "Auto-resume", action: "Resume or cancel", mutation: 'reseller re-provisions via merchant-api-* → <span class="text-arch-teal font-mono text-[10px]">ACTIVE</span>; if unresolved → cancellation' },
    ],
  },
  {
    id: "flow-recovery",
    title: "Flow 15 — Account Recovery",
    description: "When subscription state is inconsistent between PostgreSQL and merchant systems, account-recovery-api / core-processor-api reconciles via reseller-api-v1 + merchant-api-* and logs every action to audit-api.",
    audience: "System",
    route: "Fallout/manual → core-processor-api → reseller-api-v1 → audit-api",
    steps: [
      { screen: "Trigger", action: "Recovery initiated", mutation: 'Triggered manually or by fallout detection of inconsistent state' },
      { screen: "core-processor-api", action: "Read HTS state", mutation: 'Reads current subscription state from <span class="text-arch-teal font-mono text-[10px]">PostgreSQL</span>' },
      { screen: "core-processor-api", action: "Compare merchant state", mutation: 'Via <span class="text-arch-amber font-mono text-[10px]">reseller-api-v1</span> compares HTS ↔ merchant-api-* provider state' },
      { screen: "core-processor-api", action: "Reconcile", mutation: 'Resolves drift — <span class="text-arch-coral font-mono text-[10px]">re-provision</span> or <span class="text-arch-coral font-mono text-[10px]">force-cancel</span> via merchant-api-*' },
      { screen: "audit-api", action: "Log recovery actions", mutation: 'Full audit trail of every recovery action → <span class="text-arch-teal font-mono text-[10px]">audit-api</span>' },
    ],
  },
  {
    id: "flow-fallout",
    title: "Flow 16 — Fallout & Self-Healing",
    description: "event-hub routes failed events from the Kafka DLQ to the fallout-process Lambda, which inspects the failure, attempts automated remediation via order-api, and logs outcomes. If auto-heal fails, an alert is raised and the event goes to manual review.",
    audience: "System",
    route: "Kafka DLQ → fallout λ → order-api → audit-api",
    steps: [
      { screen: "Event Hub", action: "Failed event routed", mutation: 'Kafka <span class="text-arch-amber font-mono text-[10px]">DLQ</span> → <span class="text-arch-blue font-mono text-[10px]">fallout-process</span> Lambda' },
      { screen: "Fallout λ", action: "Inspect failure", mutation: 'Classifies the failure and decides if auto-remediation is possible' },
      { screen: "Fallout λ", action: "Auto-remediate", mutation: 'Replays the failed operation via <span class="text-arch-coral font-mono text-[10px]">order-api</span> → merchant-api' },
      { screen: "Fallout λ", action: "Log outcome", mutation: 'Remediation outcome → <span class="text-arch-teal font-mono text-[10px]">audit-api</span>' },
      { screen: "Fallout λ", action: "Escalate if needed", mutation: 'Auto-heal fails → <span class="text-arch-amber font-mono text-[10px]">alert</span> + manual-review DLQ; repeated failures alert' },
    ],
  },
  {
    id: "flow-membership",
    title: "Flow 17 — Membership / Loyalty",
    description: "membership-api manages loyalty tiers, reward points, and Aeroplan integration. It queries CPM for account standing and communicates with the Aeroplan API for point accrual and redemption. Entirely backend — no direct UI flow.",
    audience: "System",
    route: "Lifecycle event → membership-api → CPM / Aeroplan API",
    steps: [
      { screen: "Lifecycle event", action: "Event reaches membership-api", mutation: 'Subscription lifecycle event → <span class="text-arch-blue font-mono text-[10px]">membership-api</span>' },
      { screen: "membership-api", action: "Check account standing", mutation: 'Queries <span class="text-arch-teal font-mono text-[10px]">CPM</span> for account standing / loyalty eligibility' },
      { screen: "membership-api", action: "Aeroplan integration", mutation: 'Calls <span class="text-arch-amber font-mono text-[10px]">Aeroplan API</span> for point accrual / redemption' },
      { screen: "membership-api", action: "Accrue / redeem points", mutation: 'Points accrued or redeemed against the customer\'s Aeroplan account' },
      { screen: "membership-api", action: "Update loyalty tier", mutation: 'Updates loyalty tier and reward points based on the result' },
    ],
  },
  {
    id: "flow-promo",
    title: "Flow 18 — Promo Codes",
    description: "promocodes-api validates and applies promotional codes, promocode-redemptions-api tracks usage limits, promocode-streamer-api streams real-time promo events, and promocodes-rtv-api handles real-time validation against catalog-api and reseller-service.",
    audience: "Customer",
    route: "/add-subscription → promocodes-rtv-api → catalog-api / reseller-service",
    steps: [
      { screen: "/add-subscription", action: "Enter promo code", mutation: 'Customer enters code → <span class="text-arch-amber font-mono text-[10px]">promocodes-rtv-api</span> real-time validation' },
      { screen: "promocodes-rtv-api", action: "Real-time validation", mutation: 'Validates against <span class="text-arch-teal font-mono text-[10px]">catalog-api</span> for plan eligibility' },
      { screen: "promocodes-rtv-api", action: "Apply to order", mutation: 'Applies the discount via <span class="text-arch-amber font-mono text-[10px]">reseller-service</span>' },
      { screen: "promocodes-api", action: "Validate & apply", mutation: 'Authoritative validation; applies promotional pricing once order confirmed' },
      { screen: "promocode-redemptions-api", action: "Track redemption", mutation: 'Records redemption and enforces <span class="text-arch-coral font-mono text-[10px]">usage limits</span> per code' },
      { screen: "promocode-streamer-api", action: "Stream promo events", mutation: 'Streams real-time promo events (modifications, redemptions) to consumers' },
    ],
  },
  {
    id: "flow-notifications",
    title: "Flow 19 — Notifications",
    description: "notification-consumer listens to Kafka lifecycle events (order placed, activated, cancelled, renewed) and dispatches notifications via email-api → SES v2. Templates are managed in SES; SQS buffering prevents throttling during burst events.",
    audience: "System",
    route: "Kafka → notification-consumer → email-api → SES v2",
    steps: [
      { screen: "Kafka", action: "Lifecycle event", mutation: '<span class="text-arch-teal font-mono text-[10px]">OrderCreated / Activated / Cancelled / Renewed</span> → notification-consumer' },
      { screen: "notification-consumer", action: "Buffer in SQS", mutation: 'Events buffered via <span class="text-arch-amber font-mono text-[10px]">SQS</span> to prevent throttling on bursts' },
      { screen: "notification-consumer", action: "Compose notification", mutation: 'Dispatches to <span class="text-arch-purple font-mono text-[10px]">email-api</span>, which composes from templates' },
      { screen: "email-api", action: "Send via SES", mutation: 'Templated email sent through <span class="text-arch-teal font-mono text-[10px]">SES v2</span>' },
      { screen: "Customer", action: "Deliver", mutation: 'Delivered to customer inbox (email, plus SMS/push where applicable)' },
    ],
  },
];

export const customerVsAgent = {
  customer: {
    label: "Customer",
    subtitle: "Self-serve",
    rows: [
      { key: "Entry", val: "/customer" },
      { key: "Auth", val: "SAML SSO (BoxyHQ)" },
      { key: "Session init", val: "generateSession" },
      { key: "Permissions", val: "Own accounts only" },
      { key: "Audit", val: "Customer record" },
      { key: "Activate", val: "Customer activates manually" },
      { key: "Layout", val: "Full customer shell" },
    ],
  },
  agent: {
    label: "Agent",
    subtitle: "Agent-assisted",
    rows: [
      { key: "Entry", val: "/agent?orderNumber=XYZ" },
      { key: "Auth", val: "SAML SSO (agent audience)" },
      { key: "Session init", val: "cloneSession" },
      { key: "Permissions", val: "Any customer order" },
      { key: "Audit", val: "Agent ID + order number" },
      { key: "Activate", val: "May be deferred" },
      { key: "Layout", val: "Streamlined, no nav" },
    ],
  },
};

export const sequenceDiagramAscii = `(See Mermaid diagram below)`;

export const mermaidSequenceDiagram = `sequenceDiagram
    participant U as Browser/UI
    participant B as BFF
    participant AS as AppSync
    participant S as session-api
    participant H as household-api
    participant R as reseller-svc
    participant C as catalog-api
    participant M as merchant-api
    participant A as audit-api

    U->>B: login (SAML/Auth0)
    U->>B: GET /subscriptions
    B->>+AS: aggregator-api (REST)
    AS-->>-B: subscription list
    B-->>U: subscription list

    U->>B: click "Add" → generateSession
    B->>+AS: generateSession mutation
    AS->>+S: create session
    S->>H: validate account (CPM)
    H-->>S: ok
    S-->>-AS: sessionId
    AS-->>-B: sessionId
    B-->>U: sessionId

    U->>B: /add-subscription → subscriptionQualification
    B->>+AS: subscriptionQualification
    AS->>+R: qualify
    R->>C: get plans (Redis)
    C-->>R: offers
    R-->>-AS: eligible plans
    AS-->>-B: plans
    B-->>U: catalog

    U->>B: "Place Order" → submitSubscription
    B->>+AS: submitSubscription
    AS->>+R: submit
    R->>M: provision
    M-->>R: ok
    R->>A: log order
    R-->>-AS: orderId
    AS-->>-B: orderId
    B-->>U: orderId

    U->>B: activate → activateSubscription
    B->>+AS: activateSubscription
    AS->>+R: activate
    R->>M: activate
    M-->>R: activationUrl
    R->>A: log activation
    R-->>-AS: activationUrl
    AS-->>-B: redirect URL
    B-->>U: redirect to provider`;

// ─── End-to-end order flow ───────────────────────────────────────────
export const mermaidOrderSequenceDiagram = `sequenceDiagram
    participant U as Customer/UI
    participant C as Configurator
    participant O as Order API
    participant X as Catalog/MSI
    participant P as POLM
    participant E as Event Hub
    participant R as Reseller
    participant S as Subscriber Mgr
    participant L as Billing λ
    participant N as NM1

    Note over U,C: PHASE 1 — Session & Cart
    U->>C: POST /cart/initialize
    C-->>U: sessionId (Active)
    U->>C: PATCH /cart/apply-qualify
    C-->>U: State = ConvToOrder

    Note over U,O: PHASE 2 — Order Creation
    U->>O: POST /order { sessionId }
    O->>+C: POST /cart/convertToOrder (SYNC)
    C-->>-O: session Locked + cart data
    Note over O,S: ASYNC steps begin
    par background work
        O->>X: MSI + Catalog lookups
    and
        O->>P: POST detailedProductOrder (inProgress)
    and
        O->>E: confirmation email event
    and
        O->>R: PATCH /reseller/subscriptions
        O->>S: PATCH /subscriber/{id}
        O->>E: publish billing event
    end
    O-->>U: 200 SUCCESS / PARTIAL_SUCCESS

    Note over E,N: PHASE 3 — Billing Lambda
    E->>L: SQS billing message
    L->>N: create / update billing account
    N-->>L: ok
    L->>S: PATCH /subscriber/{id} (post-NM1)
    L->>P: PATCH productOrder (completed)`;

export interface OrderEndpoint {
  step: number;
  method: "POST" | "PATCH" | "GET";
  path: string;
  service: string;
}

export const orderEndpoints: OrderEndpoint[] = [
  { step: 1,  method: "POST",  path: "/cart/initialize", service: "Configurator (create session)" },
  { step: 2,  method: "PATCH", path: "/cart/apply-qualify/{id}", service: "Configurator (qualify cart)" },
  { step: 3,  method: "POST",  path: "/order", service: "Order API (create order)" },
  { step: 4,  method: "POST",  path: "/cart/convertToOrder", service: "Configurator (lock + convert) — SYNC" },
  { step: 5,  method: "GET",   path: "/cart?sessionId={id}", service: "Configurator (get cart for MSI)" },
  { step: 6,  method: "POST",  path: "{MSI_URL}", service: "MSI (service agreement)" },
  { step: 7,  method: "GET",   path: "/query?offeringIds=...", service: "Product Catalog (offerings)" },
  { step: 8,  method: "GET",   path: "/query?productIds=...", service: "Product Catalog (products)" },
  { step: 9,  method: "GET",   path: "/query?promoIds=...", service: "Product Catalog (promos)" },
  { step: 10, method: "POST",  path: "/productOrder/detailedProductOrder", service: "POLM (order registration)" },
  { step: 11, method: "POST",  path: "/internal/topic", service: "Event Hub (confirmation email)" },
  { step: 12, method: "PATCH", path: "/reseller/subscriptions/{id}", service: "Reseller Service (fulfillment)" },
  { step: 13, method: "PATCH", path: "/subscriber/{id}", service: "Subscriber Manager (profile update)" },
  { step: 14, method: "POST",  path: "/internal/topic", service: "Event Hub (billing event)" },
  { step: 15, method: "POST",  path: "{NM1_URL}", service: "NM1 Billing System (Lambda)" },
  { step: 16, method: "PATCH", path: "/subscriber/{id}", service: "Subscriber Manager (post-billing)" },
  { step: 17, method: "PATCH", path: "/productOrder/productOrder/{id}", service: "POLM PATCH (order complete)" },
];

export interface OrderErrorRow {
  step: string;
  behavior: string;
  severity: "block" | "partial" | "continue";
}

export const orderErrorRows: OrderErrorRow[] = [
  { step: "ConvertToOrder", behavior: "BLOCKS — returns 500, no order created", severity: "block" },
  { step: "Catalog API", behavior: "Returns PARTIAL_SUCCESS — order created, fulfillment can't complete", severity: "partial" },
  { step: "MSI", behavior: "Logged only — order continues", severity: "continue" },
  { step: "POLM POST", behavior: "Fallout event published — order continues (POLM fix)", severity: "continue" },
  { step: "Confirmation email", behavior: "Returns PARTIAL_SUCCESS — order created", severity: "partial" },
  { step: "Fulfillment / Reseller", behavior: "Tracked in DynamoDB — partial fulfillment possible", severity: "partial" },
  { step: "Subscriber profile update", behavior: "BLOCKS the fulfillment return", severity: "block" },
  { step: "Billing publish", behavior: "Returns PARTIAL_SUCCESS — order created", severity: "partial" },
  { step: "NM1 billing", behavior: "Fallout event published — tracked in DynamoDB", severity: "continue" },
  { step: "POLM PATCH", behavior: "Fallout event published — order still complete (POLM fix)", severity: "continue" },
];

export interface OrderFeatureFlag {
  flag: string;
  effect: string;
}

export const orderFeatureFlags: OrderFeatureFlag[] = [
  { flag: "CONTINGENCY_IMPORT_ORDER", effect: "Controls the MSI call and catalog filtering behaviour." },
  { flag: "APOART_2453 (POLM fix)", effect: "Enabled: POLM failures publish a fallout event and continue. Disabled: POLM failures block the order." },
  { flag: "BypassConfirmationEmail", effect: "Request parameter that skips the confirmation email." },
];

export interface OrderDataStore {
  store: string;
  type: string;
  stored: string;
}

export const orderDataStores: OrderDataStore[] = [
  { store: "Order", type: "DynamoDB", stored: "Full order record — session data, status, subscribers" },
  { store: "PendingTransaction", type: "DynamoDB", stored: "Pending/failed fulfillment operations for retry" },
  { store: "Billing Queue", type: "SQS", stored: "Billing events awaiting processing" },
  { store: "Event Hub", type: "Kafka", stored: "Order events, confirmation emails, fallout alerts" },
];

export interface OrderEventTopic {
  event: string;
  when: string;
  topic: string;
}

export const orderEventTopics: OrderEventTopic[] = [
  { event: "Confirmation email", when: "After POLM POST", topic: "Email topic" },
  { event: "Billing event", when: "After fulfillment", topic: "Billing SQS queue" },
  { event: "POLM fallout", when: "When POLM fails", topic: "Fallout topic" },
  { event: "Fulfillment kickout", when: "When fulfillment fails", topic: "Fallout topic" },
];
