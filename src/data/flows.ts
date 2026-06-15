export interface FlowStep {
  screen: string;
  action: string;
  mutation: string;
}

export interface Flow {
  id: string;
  title: string;
  description: string;
  audience: "Customer" | "Agent";
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
