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

export const serviceDependencyDiagram = `graph LR
  UI["Subscription Manager<br/>(Next.js MFE)"]
  BFF["Next.js BFF<br/>/api/protected/*"]
  AppSync["AWS AppSync<br/>(GraphQL)"]
  AGG["subscriptions-<br/>aggregator-api"]
  AUTH["auth-api"]
  SESSION["session-api"]
  HOUSEHOLD["household-api"]
  RESELLER["reseller-service"]
  CATALOG["catalog-api"]
  TOKEN["token-api"]
  AUDIT["audit-api"]
  BANGO["merchant-api-<br/>bango-v1"]
  NETFLIX["merchant-api-<br/>netflix"]
  DISNEY["merchant-api-<br/>disney"]
  BELLMEDIA["merchant-api-<br/>bellmedia"]
  RADIOCAN["merchant-api-<br/>radiocanada"]

  PG[(PostgreSQL)]
  DYNAMO[(DynamoDB)]
  REDIS[(Redis)]
  KAFKA[(Kafka)]
  CPM[(CPM)]

  UI --> BFF
  BFF --> AUTH
  BFF --> AGG
  BFF --> AppSync
  AGG --> PG
  AGG --> CPM
  AppSync --> SESSION
  AppSync --> HOUSEHOLD
  AppSync --> RESELLER
  AppSync --> CATALOG
  SESSION --> DYNAMO
  HOUSEHOLD --> CPM
  RESELLER --> CATALOG
  RESELLER --> PG
  RESELLER --> KAFKA
  RESELLER --> AUDIT
  RESELLER --> BANGO
  RESELLER --> NETFLIX
  RESELLER --> DISNEY
  RESELLER --> BELLMEDIA
  RESELLER --> RADIOCAN
  CATALOG --> REDIS
  TOKEN --> REDIS
  AUDIT --> PG
  KAFKA --> AUDIT
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

export const sidebarSteps = [
  { key: "all", label: "Full architecture" },
  { key: "auth", label: "1 — Login & auth" },
  { key: "subs", label: "2 — Load subscriptions" },
  { key: "session", label: "3 — Start session" },
  { key: "qualify", label: "4 — Check eligibility" },
  { key: "order", label: "5 — Place order" },
  { key: "activate", label: "6 — Activate" },
  { key: "cancel", label: "7 — Cancel" },
  { key: "agent", label: "8 — Agent-assisted" },
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
