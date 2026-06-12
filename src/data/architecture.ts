export interface Step {
  num: string;
  title: string;
  body: string;
  services: string[];
  notes: string;
  edges: string[];
  nodes: string[];
}

export const steps: Record<string, Step> = {
  all: {
    num: "",
    title: "Full Architecture",
    body: `The UI <strong>never</strong> talks directly to Go services. All requests go through the <code>Next.js BFF</code>.<br/><br/><strong>Select a flow</strong> on the left or <strong>click any node</strong> for details.`,
    services: [],
    notes:
      "• Mutations → <code>AppSync</code> (GraphQL)<br/>• Reads → <code>aggregator-api</code> (REST)<br/>• Tokens never leave the BFF<br/>• Merchant APIs invisible to UI",
    edges: [],
    nodes: [],
  },
  auth: {
    num: "1",
    title: "Login & Auth",
    body: `Customer authenticates via <strong>SAML SSO</strong> (BoxyHQ) or Auth0. BFF requests an OAuth2 token from <strong>auth-api</strong>.<br/><br/>Scopes: <code>subscription-manager/query</code> and <code>subscriptions-aggregator-api/read</code>. Token is server-side only.`,
    services: ["auth-api", "next-auth (BFF)"],
    notes:
      "• Customer: <code>dit02-auth.bell.ca</code><br/>• Agent: SAML agent audience<br/>• Dev/DIT: Auth0",
    edges: ["e-ui-bff", "e-bff-auth"],
    nodes: ["n-ui", "n-bff", "n-auth"],
  },
  subs: {
    num: "2",
    title: "Load Subscriptions",
    body: `<code>GET /subscriptions?tvAccountNumber=...</code> → BFF → <strong>subscriptions-aggregator-api</strong> → PostgreSQL + CPM.<br/><br/>This is a <strong>REST read</strong> — bypasses AppSync entirely.`,
    services: ["subscriptions-aggregator-api"],
    notes:
      "• Bypasses AppSync<br/>• Merges PostgreSQL + CPM<br/>• Powers the /customer landing screen",
    edges: ["e-ui-bff", "e-bff-agg", "e-agg-read"],
    nodes: ["n-ui", "n-bff", "n-agg", "n-session"],
  },
  session: {
    num: "3",
    title: "Start Session",
    body: `<code>generateSession(customerInfo, BAN)</code> → BFF → AppSync → <strong>session-api</strong> (DynamoDB) + <strong>household-api</strong> (CPM validation).<br/><br/>Agent uses <code>cloneSession(orderNumber)</code> instead — clones existing session and links agent ID to the audit trail.`,
    services: ["session-api", "household-api"],
    notes:
      "• Session in DynamoDB with TTL<br/>• CPM validates account<br/>• Agent: <code>cloneSession</code>",
    edges: [
      "e-ui-bff",
      "e-bff-appsync",
      "e-as-session",
      "e-as-household",
    ],
    nodes: [
      "n-ui",
      "n-bff",
      "n-appsync",
      "n-session",
      "n-household",
    ],
  },
  qualify: {
    num: "4",
    title: "Check Eligibility",
    body: `<code>subscriptionQualification(sessionId, operationType)</code> → AppSync → <strong>reseller-service</strong> → <strong>catalog-api</strong> (Redis).<br/><br/>Re-called on every plan selection. Cancel uses <code>DELETE</code>; undo uses <code>REVERSE_*</code>.`,
    services: ["reseller-service", "catalog-api"],
    notes:
      "• catalog-api uses Redis for fast reads<br/>• Eligibility is account-type specific<br/>• catalog-manager keeps Redis fresh",
    edges: [
      "e-ui-bff",
      "e-bff-appsync",
      "e-as-reseller",
      "e-as-catalog",
      "e-res-catalog",
    ],
    nodes: [
      "n-ui",
      "n-bff",
      "n-appsync",
      "n-reseller",
      "n-catalog",
    ],
  },
  order: {
    num: "5",
    title: "Place Order",
    body: `<code>submitSubscription(sessionId, selectedPlan)</code> → AppSync → <strong>reseller-service</strong>:<br/><br/>1. Writes to <strong>PostgreSQL</strong><br/>2. Calls <strong>merchant-api-*</strong><br/>3. Publishes <code>OrderCreated</code> to <strong>Kafka</strong><br/>4. Logs to <strong>audit-api</strong>`,
    services: ["reseller-service", "merchant-api-*", "audit-api"],
    notes:
      "• Provider choice transparent to UI<br/>• Kafka triggers downstream consumers<br/>• Agent orders include agent ID in audit log",
    edges: [
      "e-ui-bff",
      "e-bff-appsync",
      "e-as-reseller",
      "e-res-merchant",
      "e-res-audit",
    ],
    nodes: [
      "n-ui",
      "n-bff",
      "n-appsync",
      "n-reseller",
      "n-bango",
      "n-netflix",
      "n-disney",
      "n-bellmedia",
      "n-radiocan",
      "n-audit",
    ],
  },
  activate: {
    num: "6",
    title: "Activate Subscription",
    body: `<code>activateSubscription(subscriptionId)</code> → AppSync → <strong>reseller-service</strong>:<br/><br/>1. Status → <code>ACTIVE</code> in PostgreSQL<br/>2. Provisions via <strong>merchant-api-*</strong><br/>3. Logs to <strong>audit-api</strong><br/><br/>Returns <code>activationUrl</code>. UI redirects customer to provider.`,
    services: ["reseller-service", "merchant-api-*", "audit-api"],
    notes:
      "• PENDING → ACTIVE in PostgreSQL<br/>• activationUrl redirects to provider<br/>• UI re-fetches aggregator on return",
    edges: [
      "e-ui-bff",
      "e-bff-appsync",
      "e-as-reseller",
      "e-res-merchant",
      "e-res-audit",
    ],
    nodes: [
      "n-ui",
      "n-bff",
      "n-appsync",
      "n-reseller",
      "n-bango",
      "n-netflix",
      "n-disney",
      "n-bellmedia",
      "n-radiocan",
      "n-audit",
    ],
  },
  cancel: {
    num: "7",
    title: "Cancel Subscription",
    body: `<code>subscriptionQualification(DELETE)</code> fires on card click. On confirm, <code>submitSubscription</code> sets status <code>CANCELLED</code> and deprovisions via <strong>merchant-api-*</strong>.`,
    services: [
      "reseller-service",
      "catalog-api",
      "merchant-api-*",
      "audit-api",
    ],
    notes:
      "• Same three mutations as Add<br/>• Op code: <code>DELETE</code><br/>• merchant-api-* deprovisions",
    edges: [
      "e-ui-bff",
      "e-bff-appsync",
      "e-as-reseller",
      "e-as-catalog",
      "e-res-catalog",
      "e-res-merchant",
      "e-res-audit",
    ],
    nodes: [
      "n-ui",
      "n-bff",
      "n-appsync",
      "n-reseller",
      "n-catalog",
      "n-bango",
      "n-netflix",
      "n-disney",
      "n-bellmedia",
      "n-radiocan",
      "n-audit",
    ],
  },
  agent: {
    num: "8",
    title: "Agent-Assisted",
    body: `Agent opens <code>/agent?orderNumber=XYZ</code> → <code>cloneSession(orderNumber)</code> fires. Clones the customer's session, linking the agent's action to the original order in the audit trail.<br/><br/>Qualify and submit are identical to the customer flow.`,
    services: [
      "session-api",
      "reseller-service",
      "catalog-api",
      "merchant-api-*",
      "audit-api",
    ],
    notes:
      '• <code>cloneSession</code> not <code>generateSession</code><br/>• Audit log includes agent ID + order number<br/>• Agent can act on any customer order',
    edges: [
      "e-ui-bff",
      "e-bff-appsync",
      "e-as-clone",
      "e-as-reseller",
      "e-as-catalog",
      "e-res-catalog",
      "e-res-merchant",
      "e-res-audit",
    ],
    nodes: [
      "n-ui",
      "n-bff",
      "n-appsync",
      "n-session",
      "n-reseller",
      "n-catalog",
      "n-bango",
      "n-netflix",
      "n-disney",
      "n-bellmedia",
      "n-radiocan",
      "n-audit",
    ],
  },

  // ─── BACKEND LIFECYCLE ───
  planchange: {
    num: "9",
    title: "Plan Change",
    body: `Customer selects a new plan → <code>subscriptionQualification(APPLY_TO_ORDER)</code> → <code>submitSubscription</code>.<br/><br/><strong>reseller-service</strong> updates PostgreSQL, re-provisions via <strong>merchant-api-*</strong>, and publishes <code>OrderUpdated</code> to Kafka. <strong>catalog-api</strong> re-qualifies the new plan. <strong>audit-api</strong> logs the change.`,
    services: [
      "order-api",
      "session-api",
      "reseller-service",
      "catalog-api",
      "merchant-api-*",
      "audit-api",
    ],
    notes:
      "• Same mutation path as Place Order<br/>• Op code: <code>APPLY_TO_ORDER</code><br/>• Re-qualifies via catalog-api<br/>• Merchant re-provisioned with new plan details",
    edges: [
      "e-ui-bff",
      "e-bff-appsync",
      "e-as-reseller",
      "e-as-catalog",
      "e-as-session",
      "e-res-catalog",
      "e-res-merchant",
      "e-res-audit",
    ],
    nodes: [
      "n-ui",
      "n-bff",
      "n-appsync",
      "n-reseller",
      "n-catalog",
      "n-session",
      "n-bango",
      "n-netflix",
      "n-disney",
      "n-bellmedia",
      "n-radiocan",
      "n-audit",
    ],
  },
  billing: {
    num: "10",
    title: "Billing",
    body: `<strong>billing-process Lambda</strong> runs on a schedule to sync subscription billing state with <strong>NM1</strong> (Bell's billing platform).<br/><br/>Updates <strong>subscriber-manager</strong> with billing status. Sends billing confirmation via <strong>email-api</strong>. Entirely backend — no UI interaction.`,
    services: [
      "billing-process Lambda",
      "NM1",
      "subscriber-manager",
      "email-api",
    ],
    notes:
      "• Scheduled Lambda (no UI trigger)<br/>• Syncs with NM1 billing platform<br/>• Updates subscriber-manager state<br/>• Sends confirmation emails via SES",
    edges: [],
    nodes: [],
  },
  fulfillment: {
    num: "11",
    title: "Fulfillment",
    body: `<strong>fulfillment-process Lambda</strong> consumes <code>OrderCreated</code> / <code>OrderUpdated</code> events from Kafka.<br/><br/>Calls <strong>reseller-api-v1</strong> to finalize provisioning, then dispatches to the appropriate <strong>merchant-api-*</strong> for activation with the provider.`,
    services: [
      "fulfillment-process Lambda",
      "reseller-api-v1",
      "merchant-api-*",
    ],
    notes:
      "• Kafka consumer (event-driven)<br/>• Bridges order placement and merchant provisioning<br/>• Retries with exponential backoff<br/>• DLQ for failed fulfillments",
    edges: ["e-res-merchant"],
    nodes: [
      "n-reseller",
      "n-bango",
      "n-netflix",
      "n-disney",
      "n-bellmedia",
      "n-radiocan",
    ],
  },
  renewal: {
    num: "12",
    title: "Renewal",
    body: `<strong>subscription-renewal-process Lambda</strong> runs daily. Queries <strong>PostgreSQL</strong> for subscriptions approaching their renewal date.<br/><br/>Re-validates eligibility, extends the subscription period, and publishes <code>SubscriptionRenewed</code> to Kafka for downstream consumers.`,
    services: ["subscription-renewal-process Lambda", "PostgreSQL"],
    notes:
      "• Scheduled daily Lambda<br/>• Queries subscriptions by renewal date<br/>• Re-validates eligibility before renewal<br/>• Publishes renewal events to Kafka",
    edges: [],
    nodes: [],
  },
  undo: {
    num: "13",
    title: "Undo / Reversal",
    body: `<code>subscriptionQualification(REVERSE_*)</code> → <code>submitSubscription</code>.<br/><br/>Reverses a previous order. <strong>reseller-service</strong> rolls back PostgreSQL state, calls <strong>merchant-api-*</strong> to deprovision, and logs the reversal to <strong>audit-api</strong>. <strong>session-api</strong> tracks the undo context.`,
    services: [
      "order-api",
      "session-api",
      "reseller-service",
      "catalog-api",
      "merchant-api-*",
    ],
    notes:
      "• Op codes: <code>REVERSE_ADD</code>, <code>REVERSE_DELETE</code><br/>• Must reference original order<br/>• Merchant deprovisions on reversal<br/>• Audit trail links reversal to original",
    edges: [
      "e-ui-bff",
      "e-bff-appsync",
      "e-as-reseller",
      "e-as-catalog",
      "e-as-session",
      "e-res-catalog",
      "e-res-merchant",
    ],
    nodes: [
      "n-ui",
      "n-bff",
      "n-appsync",
      "n-reseller",
      "n-catalog",
      "n-session",
      "n-bango",
      "n-netflix",
      "n-disney",
      "n-bellmedia",
      "n-radiocan",
    ],
  },
  graceperiod: {
    num: "14",
    title: "Grace Period",
    body: `When a subscription payment fails or lapses, a <strong>grace period</strong> begins. <strong>reseller-api-v1</strong> sets status to <code>GRACE_PERIOD</code>.<br/><br/><strong>merchant-api-*</strong> suspends provisioning without full cancellation. If resolved within the window, service resumes automatically via Kafka event.`,
    services: ["reseller-api-v1", "merchant-api-*", "Kafka"],
    notes:
      "• Status: <code>GRACE_PERIOD</code><br/>• Merchant suspends (not cancels)<br/>• Auto-resume on payment resolution<br/>• Configurable grace window per merchant",
    edges: ["e-res-merchant"],
    nodes: [
      "n-reseller",
      "n-bango",
      "n-netflix",
      "n-disney",
      "n-bellmedia",
      "n-radiocan",
    ],
  },
  recovery: {
    num: "15",
    title: "Account Recovery",
    body: `<strong>account-recovery-api</strong> / <strong>core-processor-api</strong> handles cases where subscription state is inconsistent between PostgreSQL and merchant systems.<br/><br/>Reconciles via <strong>reseller-api-v1</strong> + <strong>merchant-api-*</strong>. Logs all recovery actions to <strong>audit-api</strong>.`,
    services: [
      "reseller-api-v1",
      "merchant-api-*",
      "core-processor-api",
    ],
    notes:
      "• Reconciles PostgreSQL ↔ merchant state<br/>• Triggered manually or by fallout detection<br/>• Full audit trail of recovery actions<br/>• May re-provision or force-cancel",
    edges: ["e-res-merchant", "e-res-audit"],
    nodes: [
      "n-reseller",
      "n-bango",
      "n-netflix",
      "n-disney",
      "n-bellmedia",
      "n-radiocan",
      "n-audit",
    ],
  },

  // ─── SUPPORTING FLOWS ───
  fallout: {
    num: "16",
    title: "Fallout & Self-Healing",
    body: `<strong>event-hub</strong> routes failed events to the <strong>fallout-process Lambda</strong>. The Lambda inspects the failure, attempts automated remediation via <strong>order-api</strong>, and logs outcomes to <strong>audit-api</strong>.<br/><br/>If auto-heal fails, an alert is raised and the event is sent to the DLQ for manual review.`,
    services: [
      "event-hub",
      "fallout-process Lambda",
      "order-api",
      "audit-api",
      "merchant-api-netflix",
    ],
    notes:
      "• Kafka DLQ → fallout-process Lambda<br/>• Auto-remediation via order-api<br/>• Falls back to manual review queue<br/>• Alerts on repeated failures",
    edges: ["e-res-audit"],
    nodes: ["n-audit", "n-netflix"],
  },
  membership: {
    num: "17",
    title: "Membership / Loyalty",
    body: `<strong>membership-api</strong> manages loyalty tiers, reward points, and Aeroplan integration.<br/><br/>Queries <strong>CPM</strong> for account standing and communicates with the <strong>Aeroplan API</strong> for point accrual and redemption. Entirely backend — no direct UI flow.`,
    services: ["membership-api", "CPM", "Aeroplan API"],
    notes:
      "• Loyalty tier management<br/>• Aeroplan points integration<br/>• CPM account standing checks<br/>• No direct UI interaction",
    edges: [],
    nodes: [],
  },
  promos: {
    num: "18",
    title: "Promo Codes",
    body: `<strong>promocodes-api</strong> validates and applies promotional codes. <strong>promocode-redemptions-api</strong> tracks usage limits.<br/><br/><strong>promocode-streamer-api</strong> streams real-time promo events. <strong>promocodes-rtv-api</strong> handles real-time validation against <strong>catalog-api</strong> and <strong>reseller-service</strong>.`,
    services: [
      "promocodes-api",
      "promocode-redemptions-api",
      "promocode-streamer-api",
      "promocodes-rtv-api",
    ],
    notes:
      "• Validate → redeem → track flow<br/>• Real-time streaming for promo events<br/>• Usage limits enforced per code<br/>• Integrates with catalog for plan eligibility",
    edges: ["e-as-catalog", "e-as-reseller"],
    nodes: ["n-catalog", "n-reseller"],
  },
  notifications: {
    num: "19",
    title: "Notifications",
    body: `<strong>notification-consumer</strong> listens to Kafka events (order placed, activated, cancelled, renewed) and dispatches notifications via <strong>email-api</strong> → <strong>SES v2</strong>.<br/><br/>Templates are managed in SES. Queue buffering via <strong>SQS</strong> prevents throttling during burst events.`,
    services: ["email-api", "notification-consumer", "SES v2", "SQS"],
    notes:
      "• Kafka → notification-consumer → email-api<br/>• SES v2 for templated emails<br/>• SQS buffer for burst protection<br/>• Event-driven (no UI trigger)",
    edges: [],
    nodes: [],
  },

  overview: {
    num: "",
    title: "System Overview",
    body: `All <strong>go-repo</strong> services grouped by domain. Core subscription, merchants, catalog, auth, promotions, events, orders, orchestration, serverless, and infrastructure.<br/><br/>Hover a group to highlight its connections.`,
    services: [],
    notes: "• 58 services total<br/>• 29 Lambda functions<br/>• 10 domain groups",
    edges: [],
    nodes: [],
  },
  dependencies: {
    num: "",
    title: "Service Dependencies",
    body: `Visual map of <strong>all service-to-service</strong> and <strong>service-to-infrastructure</strong> connections.<br/><br/>Use this diagram to understand which services depend on each other and which infrastructure components they share.`,
    services: [],
    notes: "• UI never calls Go services directly<br/>• All mutations route through AppSync<br/>• Reads bypass AppSync via aggregator-api<br/>• Kafka decouples write-side from consumers<br/>• Redis used by catalog-api and token-api",
    edges: [],
    nodes: [],
  },
};

export const nodeDetails: Record<string, { title: string; body: string }> = {
  ui: {
    title: "Subscription Manager (MFE)",
    body: "Next.js 14 + React 18 microfrontend. Embedded via Module Federation. Routes: <code>/customer/*</code> (EN), <code>/client/*</code> (FR), <code>/agent</code>. Feature flags via Unleash and OpenFeature.",
  },
  bff: {
    title: "Next.js BFF — /api/protected/*",
    body: "Validates session, fetches OAuth2 tokens (client_credentials), attaches Bearer tokens to all outbound calls. Enforces account isolation — verifies <code>householdAccountNumber</code> matches the logged-in user.",
  },
  auth: {
    title: "auth-api",
    body: "OAuth2 / Cognito / Auth0 token issuance. Issues scopes: <code>subscription-manager/query</code> and <code>subscriptions-aggregator-api/read</code>. Supports SAML SSO for customers and agents, Auth0 for DIT/dev.",
  },
  appsync: {
    title: "AWS AppSync (GraphQL gateway)",
    body: "Single entry point for all mutations. Resolvers translate each mutation into the correct downstream Go service call. The UI never calls Go services directly.",
  },
  agg: {
    title: "subscriptions-aggregator-api",
    body: "REST read-only. Aggregates subscriptions from PostgreSQL and CPM. Called directly from the BFF (bypasses AppSync). Powers the /customer subscription list screen.",
  },
  reseller: {
    title: "reseller-service",
    body: "Primary CRUD service. Gin + OpenAPI codegen. Writes to PostgreSQL, calls merchant-api-* for provisioning, publishes to Kafka on every change, triggers audit-api. Handles all op codes: APPLY_TO_ORDER, DELETE, REVERSE_*.",
  },
  catalog: {
    title: "catalog-api",
    body: "Serves product offerings, marketing offers, and categories. GraphQL (gqlgen) + Redis cache. catalog-manager keeps Redis fresh via real-time product events. Re-queried on every plan selection.",
  },
  session: {
    title: "session-api",
    body: "Manages session lifecycle: create, clone, expire. Sessions in DynamoDB with TTL. <code>generateSession</code> for customers, <code>cloneSession</code> for agents.",
  },
  household: {
    title: "household-api",
    body: "Wraps CPM (Common Provisioning Management). Returns equipment history and account-level data. Used during session generation to validate the account. GraphQL (gqlgen).",
  },
  token: {
    title: "token-api",
    body: "Tokenizes sensitive JSON payloads in Redis with 24h TTL. Used mid-flow to pass data between steps without exposing it in the URL.",
  },
  audit: {
    title: "audit-api",
    body: "Logs all significant actions to PostgreSQL: order placed, activated, cancelled, recovered. For agent flows, includes agent ID and original order number.",
  },
  bango: {
    title: "merchant-api-bango-v1",
    body: "Provisioning via the Bango aggregation platform. Acts as intermediary between Bell and multiple providers.",
  },
  netflix: {
    title: "merchant-api-netflix",
    body: "Netflix subscription provisioning. Implements Netflix API contract. Called by reseller-service for Netflix plans.",
  },
  disney: {
    title: "merchant-api-disney",
    body: "Disney+ subscription provisioning. Implements Disney API contract.",
  },
  bellmedia: {
    title: "merchant-api-bellmedia",
    body: "Bell Media content provisioning. Called for Bell Media streaming products.",
  },
  radiocan: {
    title: "merchant-api-radiocanada",
    body: "Radio Canada content provisioning. Called for Radio Canada products.",
  },
};

export const serviceDependencyDiagram = `flowchart TD
  subgraph Frontend["Frontend"]
    UI["Subscription Manager<br/>(Next.js MFE)"]
    BFF(["Next.js BFF<br/>/api/protected/*"])
  end

  subgraph Gateway["API Gateway"]
    AppSync(["AWS AppSync<br/>(GraphQL)"])
    AGG(["subscriptions-<br/>aggregator-api"])
  end

  subgraph CoreSub["Core Subscription"]
    RESELLER["reseller-service"]
    SUBMGR["subscriber-<br/>manager-api"]
    SUBCONFIG["subscription-<br/>configurator-api"]
    SUBCONS["subscription-<br/>consumer"]
  end

  subgraph Catalog["Catalog & Products"]
    CATAPI["catalog-api"]
    CATMGR["catalog-manager"]
    PRODCAT["product-<br/>catalog-api"]
  end

  subgraph AuthSess["Auth & Session"]
    AUTH["auth-api"]
    SESSION["session-api"]
    TOKEN["token-api"]
    DISNEYAUTH["disney-auth-api"]
  end

  subgraph Orders["Orders & Billing"]
    ORDERAPI["order-api"]
    COREPROC["core-processor-api"]
    AUDIT["audit-api"]
  end

  subgraph FlowOrch["Flow & Orchestration"]
    FLOWRUN["flow-runner-api"]
    HOUSEHOLD["household-api"]
    ACCTREC["account-<br/>recovery-api"]
  end

  subgraph Promos["Promotions"]
    PROMO["promocodes-api"]
    PROMORED["promoredeem-<br/>consumer"]
    PROMOSTR["promostream-<br/>consumer"]
    PROMOMIG["promo-migration-<br/>consumer"]
  end

  subgraph Events["Events & Messaging"]
    EVENTHUB["event-hub"]
    EVENTPUB["event-publisher"]
    NOTIFCONS["notification-<br/>consumer"]
  end

  subgraph Merchants["Merchant APIs"]
    BANGO["merchant-api-<br/>bango-v1"]
    NETFLIX["merchant-api-<br/>netflix"]
    DISNEY["merchant-api-<br/>disney"]
    BELLMEDIA["merchant-api-<br/>bellmedia"]
    RADIOCAN["merchant-api-<br/>radiocanada"]
  end

  subgraph InfraSvc["Infrastructure Services"]
    HTTPPROXY["http-proxy-api"]
    EMAIL["email-api"]
    POLICYRULE["policy-rule-<br/>configurator"]
  end

  subgraph Serverless["Serverless — Lambda"]
    SUBEVTL["subscription-event"]
    NOTIFL["notification"]
    CATSYNCL["catalog-sync"]
    ORDERPROCL["order-processor"]
    AUDITSL["audit-stream"]
    PROMOVALL["promo-validator"]
    SESSCLEANUPL["session-cleanup"]
    MERCHANTCBL["merchant-callback"]
    EVTTRANSL["event-transformer"]
    BILLSYNCL["billing-sync"]
    ACCTLINKL["account-link"]
    REPORTGENL["report-generator"]
    DATAEXPL["data-export"]
    HEALTHL["health-check"]
    CONFIGSYNCL["config-sync"]
    RATELIMITL["rate-limiter"]
    CACHEWARML["cache-warmer"]
    RETRYL["retry-handler"]
    DLQPROCL["dlq-processor"]
    METRICAGGL["metric-aggregator"]
    FFLAGSYNCL["feature-flag-sync"]
    SCHEMAVAL["schema-validator"]
    SECRETROTL["secret-rotator"]
    LOGARCHL["log-archiver"]
    DEPLOYNOTIFL["deployment-notifier"]
    COSTTRACKL["cost-tracker"]
    BACKUPL["backup"]
    MIGRATIONL["migration"]
    CLEANUPL["cleanup"]
  end

  subgraph Infra["Infrastructure"]
    PG[("PostgreSQL")]
    DYNAMO[("DynamoDB")]
    REDIS[("Redis")]
    KAFKA[("Kafka")]
    CPM[("CPM")]
    COGNITO[("Cognito")]
    SES[("SES")]
    S3[("S3")]
    SNS[("SNS")]
  end

  %% Frontend → Gateway
  UI -->|"HTTP"| BFF
  BFF -->|"OAuth2"| AUTH
  BFF -->|"REST"| AGG
  BFF -->|"GraphQL"| AppSync

  %% Gateway → Services
  AGG -->|"SQL"| PG
  AGG -->|"REST"| CPM
  AppSync -->|"GraphQL"| RESELLER
  AppSync -->|"GraphQL"| SESSION
  AppSync -->|"GraphQL"| HOUSEHOLD
  AppSync -->|"GraphQL"| CATAPI
  AppSync -->|"GraphQL"| ORDERAPI

  %% Core Subscription
  RESELLER -->|"SQL"| PG
  RESELLER -->|"async"| KAFKA
  RESELLER -->|"REST"| AUDIT
  RESELLER -->|"GraphQL"| CATAPI
  RESELLER -->|"REST"| BANGO
  RESELLER -->|"REST"| NETFLIX
  RESELLER -->|"REST"| DISNEY
  RESELLER -->|"REST"| BELLMEDIA
  RESELLER -->|"REST"| RADIOCAN
  SUBMGR -->|"SQL"| PG
  SUBCONFIG -->|"SQL"| PG
  SUBCONS -->|"consume"| KAFKA

  %% Catalog
  CATAPI -->|"cache"| REDIS
  CATMGR -->|"consume"| KAFKA
  CATMGR -->|"write"| REDIS
  PRODCAT -->|"SQL"| PG

  %% Auth & Session
  AUTH -->|"OAuth2"| COGNITO
  SESSION -->|"read/write"| DYNAMO
  TOKEN -->|"cache"| REDIS
  DISNEYAUTH -->|"REST"| DISNEY

  %% Orders & Billing
  ORDERAPI -->|"SQL"| PG
  COREPROC -->|"SQL"| PG
  AUDIT -->|"SQL"| PG

  %% Flow & Orchestration
  FLOWRUN -->|"read/write"| DYNAMO
  HOUSEHOLD -->|"REST"| CPM
  ACCTREC -->|"SQL"| PG

  %% Promotions
  PROMO -->|"SQL"| PG
  PROMORED -->|"consume"| KAFKA
  PROMOSTR -->|"consume"| KAFKA
  PROMOMIG -->|"consume"| KAFKA

  %% Events & Messaging
  EVENTHUB -->|"route"| KAFKA
  EVENTPUB -->|"publish"| KAFKA
  NOTIFCONS -->|"consume"| KAFKA
  KAFKA -->|"event"| AUDIT

  %% Infrastructure Services
  EMAIL -->|"send"| SES
  POLICYRULE -->|"SQL"| PG

  %% Key Lambda connections
  SUBEVTL -->|"consume"| KAFKA
  NOTIFL -->|"send"| SNS
  CATSYNCL -->|"sync"| REDIS
  ORDERPROCL -->|"consume"| KAFKA
  AUDITSL -->|"stream"| S3
  PROMOVALL -->|"read"| PG
  SESSCLEANUPL -->|"cleanup"| DYNAMO
  MERCHANTCBL -->|"consume"| KAFKA
  EVTTRANSL -->|"consume"| KAFKA
  BILLSYNCL -->|"SQL"| PG
  ACCTLINKL -->|"SQL"| PG
  REPORTGENL -->|"write"| S3
  DATAEXPL -->|"write"| S3
  CACHEWARML -->|"warm"| REDIS
  RETRYL -->|"consume"| KAFKA
  DLQPROCL -->|"consume"| KAFKA
  BACKUPL -->|"backup"| DYNAMO
  MIGRATIONL -->|"SQL"| PG
  LOGARCHL -->|"archive"| S3

  classDef purple fill:#7c6fcd,stroke:#5a4fb0,color:#fff
  classDef teal fill:#3eb89a,stroke:#2d9478,color:#fff
  classDef blue fill:#4a8fe8,stroke:#3570b8,color:#fff
  classDef amber fill:#e8a83a,stroke:#c08a2a,color:#fff
  classDef gray fill:#6b7590,stroke:#535a70,color:#fff
  classDef coral fill:#e8705a,stroke:#c05545,color:#fff
  classDef green fill:#58b87a,stroke:#429860,color:#fff
  classDef infraGreen fill:#2d8a55,stroke:#1e6b3f,color:#fff
  classDef lambda fill:#3eb89a,stroke:#2d9478,color:#fff

  class UI purple
  class BFF teal
  class AppSync,AGG blue
  class RESELLER,SUBMGR,SUBCONFIG,SUBCONS amber
  class CATAPI,CATMGR,PRODCAT amber
  class ORDERAPI,COREPROC,AUDIT amber
  class AUTH,SESSION,TOKEN,DISNEYAUTH coral
  class FLOWRUN,HOUSEHOLD,ACCTREC purple
  class PROMO,PROMORED,PROMOSTR,PROMOMIG green
  class EVENTHUB,EVENTPUB,NOTIFCONS blue
  class BANGO,NETFLIX,DISNEY,BELLMEDIA,RADIOCAN gray
  class HTTPPROXY,EMAIL,POLICYRULE gray
  class SUBEVTL,NOTIFL,CATSYNCL,ORDERPROCL,AUDITSL,PROMOVALL,SESSCLEANUPL,MERCHANTCBL,EVTTRANSL,BILLSYNCL lambda
  class ACCTLINKL,REPORTGENL,DATAEXPL,HEALTHL,CONFIGSYNCL,RATELIMITL,CACHEWARML,RETRYL,DLQPROCL,METRICAGGL lambda
  class FFLAGSYNCL,SCHEMAVAL,SECRETROTL,LOGARCHL,DEPLOYNOTIFL,COSTTRACKL,BACKUPL,MIGRATIONL,CLEANUPL lambda
  class PG,DYNAMO,REDIS,KAFKA,CPM,COGNITO,SES,S3,SNS infraGreen

  style Frontend fill:transparent,stroke:#7c6fcd,stroke-width:2px,color:#7c6fcd
  style Gateway fill:transparent,stroke:#4a8fe8,stroke-width:2px,color:#4a8fe8
  style CoreSub fill:transparent,stroke:#e8a83a,stroke-width:2px,color:#e8a83a
  style Catalog fill:transparent,stroke:#e8a83a,stroke-width:2px,color:#e8a83a
  style AuthSess fill:transparent,stroke:#e8705a,stroke-width:2px,color:#e8705a
  style Orders fill:transparent,stroke:#e8a83a,stroke-width:2px,color:#e8a83a
  style FlowOrch fill:transparent,stroke:#7c6fcd,stroke-width:2px,color:#7c6fcd
  style Promos fill:transparent,stroke:#58b87a,stroke-width:2px,color:#58b87a
  style Events fill:transparent,stroke:#4a8fe8,stroke-width:2px,color:#4a8fe8
  style Merchants fill:transparent,stroke:#6b7590,stroke-width:2px,color:#6b7590
  style InfraSvc fill:transparent,stroke:#6b7590,stroke-width:2px,color:#6b7590
  style Serverless fill:transparent,stroke:#3eb89a,stroke-width:2px,color:#3eb89a
  style Infra fill:transparent,stroke:#2d8a55,stroke-width:2px,color:#2d8a55
`;

export const allEdges = [
  "e-ui-bff",
  "e-bff-appsync",
  "e-bff-agg",
  "e-bff-auth",
  "e-as-reseller",
  "e-as-catalog",
  "e-as-session",
  "e-as-household",
  "e-agg-read",
  "e-res-merchant",
  "e-res-audit",
  "e-res-catalog",
  "e-as-clone",
];

export const allNodes = [
  "n-ui",
  "n-bff",
  "n-auth",
  "n-appsync",
  "n-agg",
  "n-reseller",
  "n-catalog",
  "n-session",
  "n-household",
  "n-token",
  "n-audit",
  "n-bango",
  "n-netflix",
  "n-disney",
  "n-bellmedia",
  "n-radiocan",
];

export type SidebarItem =
  | { key: string; label: string }
  | { separator: true; header?: string };

export const sidebarSteps: SidebarItem[] = [
  { key: "all", label: "Full architecture" },
  { key: "auth", label: "1 — Login & auth" },
  { key: "subs", label: "2 — Load subscriptions" },
  { key: "session", label: "3 — Start session" },
  { key: "qualify", label: "4 — Check eligibility" },
  { key: "order", label: "5 — Place order" },
  { key: "activate", label: "6 — Activate" },
  { key: "cancel", label: "7 — Cancel" },
  { key: "agent", label: "8 — Agent-assisted" },
  { separator: true, header: "Backend Lifecycle" },
  { key: "planchange", label: "9 — Plan change" },
  { key: "billing", label: "10 — Billing" },
  { key: "fulfillment", label: "11 — Fulfillment" },
  { key: "renewal", label: "12 — Renewal" },
  { key: "undo", label: "13 — Undo / reversal" },
  { key: "graceperiod", label: "14 — Grace period" },
  { key: "recovery", label: "15 — Account recovery" },
  { separator: true, header: "Supporting Flows" },
  { key: "fallout", label: "16 — Fallout & self-healing" },
  { key: "membership", label: "17 — Membership / loyalty" },
  { key: "promos", label: "18 — Promo codes" },
  { key: "notifications", label: "19 — Notifications" },
  { separator: true },
  { key: "overview", label: "System overview" },
  { key: "dependencies", label: "Service dependencies" },
];

export const legendItems = [
  { color: "#7c6fcd", label: "UI / MFE" },
  { color: "#3eb89a", label: "BFF layer" },
  { color: "#4a8fe8", label: "API gateways" },
  { color: "#e8a83a", label: "Core Go services" },
  { color: "#58b87a", label: "Support services" },
  { color: "#e8705a", label: "Auth" },
  { color: "#6b7590", label: "Merchant APIs" },
];
