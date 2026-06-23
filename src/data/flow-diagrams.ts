export interface FlowNode {
  id: string;
  label: string;
  subtitle: string;
  color: string; // tailwind color key
  x: number;
  y: number;
}

export interface FlowDiagramStep {
  label: string;
  description: string;
  activeNodes: string[];
  activeEdge: [string, string];
  mutation?: string;
  services: string[];
}

// Shared node layout for the horizontal flow diagram
export const flowNodes: FlowNode[] = [
  { id: "browser", label: "Browser", subtitle: "React MFE", color: "#7c6fcd", x: 30, y: 120 },
  { id: "bff", label: "BFF", subtitle: "Next.js API", color: "#3eb89a", x: 170, y: 120 },
  { id: "appsync", label: "AppSync", subtitle: "GraphQL", color: "#4a8fe8", x: 310, y: 120 },
  { id: "session", label: "session-api", subtitle: "DynamoDB", color: "#58b87a", x: 450, y: 50 },
  { id: "household", label: "household-api", subtitle: "CPM", color: "#58b87a", x: 450, y: 190 },
  { id: "reseller", label: "reseller-svc", subtitle: "PostgreSQL", color: "#e8a83a", x: 450, y: 120 },
  { id: "catalog", label: "catalog-api", subtitle: "Redis", color: "#e8a83a", x: 590, y: 50 },
  { id: "merchant", label: "merchant-api", subtitle: "Providers", color: "#6b7590", x: 590, y: 120 },
  { id: "audit", label: "audit-api", subtitle: "PostgreSQL", color: "#58b87a", x: 590, y: 190 },
  { id: "aggregator", label: "aggregator-api", subtitle: "REST", color: "#4a8fe8", x: 310, y: 250 },
  { id: "token", label: "token-api", subtitle: "Redis", color: "#58b87a", x: 170, y: 250 },
];

export const addSubscriptionSteps: FlowDiagramStep[] = [
  {
    label: "1. Load subscriptions",
    description: "Browser loads /customer. BFF calls aggregator-api (REST) which reads from PostgreSQL + CPM to build the subscription list.",
    activeNodes: ["browser", "bff", "aggregator"],
    activeEdge: ["bff", "aggregator"],
    mutation: "GET /subscriptions",
    services: ["aggregator-api", "PostgreSQL", "CPM"],
  },
  {
    label: "2. Start session",
    description: "Customer clicks 'Add'. BFF sends generateSession mutation through AppSync to session-api, which creates a DynamoDB session and validates the account via household-api (CPM).",
    activeNodes: ["browser", "bff", "appsync", "session", "household"],
    activeEdge: ["appsync", "session"],
    mutation: "generateSession",
    services: ["session-api", "household-api", "DynamoDB", "CPM"],
  },
  {
    label: "3. Fetch catalog",
    description: "Page navigates to /add-subscription. subscriptionQualification mutation fires through AppSync → reseller-service → catalog-api (Redis) to load eligible plans.",
    activeNodes: ["browser", "bff", "appsync", "reseller", "catalog"],
    activeEdge: ["reseller", "catalog"],
    mutation: "subscriptionQualification (APPLY_TO_ORDER)",
    services: ["reseller-service", "catalog-api", "Redis"],
  },
  {
    label: "4. Select plan",
    description: "Customer selects a plan. subscriptionQualification is re-called on each selection to validate eligibility for the chosen tier.",
    activeNodes: ["browser", "bff", "appsync", "reseller", "catalog"],
    activeEdge: ["browser", "bff"],
    mutation: "subscriptionQualification (re-called)",
    services: ["reseller-service", "catalog-api"],
  },
  {
    label: "5. Review order",
    description: "Page navigates to /review. token-api payload is read to display the order summary — no new mutation fires at this step.",
    activeNodes: ["browser", "bff", "token"],
    activeEdge: ["bff", "token"],
    services: ["token-api"],
  },
  {
    label: "6. Place order",
    description: "Customer clicks 'Place Order'. submitSubscription mutation fires. reseller-service writes to PostgreSQL, provisions via merchant-api, publishes to Kafka, and logs to audit-api.",
    activeNodes: ["browser", "bff", "appsync", "reseller", "merchant", "audit"],
    activeEdge: ["reseller", "merchant"],
    mutation: "submitSubscription",
    services: ["reseller-service", "merchant-api-*", "audit-api", "Kafka"],
  },
  {
    label: "7. Activate",
    description: "activateSubscription mutation fires. reseller-service sets status to ACTIVE, calls merchant-api for activation, logs to audit-api, and returns an activationUrl. Browser redirects to the provider.",
    activeNodes: ["browser", "bff", "appsync", "reseller", "merchant", "audit"],
    activeEdge: ["reseller", "audit"],
    mutation: "activateSubscription",
    services: ["reseller-service", "merchant-api-*", "audit-api"],
  },
];

export const cancelSubscriptionSteps: FlowDiagramStep[] = [
  {
    label: "1. Qualify cancellation",
    description: "Customer clicks 'Cancel' on a subscription card. subscriptionQualification fires with op code DELETE through AppSync → reseller-service → catalog-api.",
    activeNodes: ["browser", "bff", "appsync", "reseller", "catalog"],
    activeEdge: ["reseller", "catalog"],
    mutation: "subscriptionQualification (DELETE)",
    services: ["reseller-service", "catalog-api"],
  },
  {
    label: "2. Review cancellation",
    description: "Page navigates to /cancel-subscription. Qualification result is read from the session — no new mutation fires.",
    activeNodes: ["browser", "bff"],
    activeEdge: ["browser", "bff"],
    services: ["session (read)"],
  },
  {
    label: "3. Confirm cancellation",
    description: "Customer confirms. submitSubscription fires. reseller-service sets status to CANCELLED in PostgreSQL, deprovisions via merchant-api, publishes to Kafka, and logs to audit-api.",
    activeNodes: ["browser", "bff", "appsync", "reseller", "merchant", "audit"],
    activeEdge: ["reseller", "merchant"],
    mutation: "submitSubscription (CANCELLED)",
    services: ["reseller-service", "merchant-api-*", "audit-api", "Kafka"],
  },
];

export const changePlanSteps: FlowDiagramStep[] = [
  {
    label: "1. Start session",
    description: "Customer clicks 'Change Plan'. generateSession mutation fires through AppSync → session-api to create a new DynamoDB session.",
    activeNodes: ["browser", "bff", "appsync", "session"],
    activeEdge: ["appsync", "session"],
    mutation: "generateSession",
    services: ["session-api", "DynamoDB"],
  },
  {
    label: "2. Load tier picker",
    description: "Page navigates to /change-subscription/[id]. subscriptionQualification fires with the current subscriptionId. catalog-api returns only upgrade/downgrade options.",
    activeNodes: ["browser", "bff", "appsync", "reseller", "catalog"],
    activeEdge: ["reseller", "catalog"],
    mutation: "subscriptionQualification (APPLY_TO_ORDER + currentSubId)",
    services: ["reseller-service", "catalog-api", "Redis"],
  },
  {
    label: "3. Select tier",
    description: "Customer selects a new tier. subscriptionQualification is re-called to validate the tier change eligibility.",
    activeNodes: ["browser", "bff", "appsync", "reseller", "catalog"],
    activeEdge: ["browser", "bff"],
    mutation: "subscriptionQualification (re-called)",
    services: ["reseller-service", "catalog-api"],
  },
  {
    label: "4. Confirm change",
    description: "Customer confirms the plan change. submitSubscription fires. reseller-service updates PostgreSQL, notifies merchant-api, publishes to Kafka, and logs to audit-api.",
    activeNodes: ["browser", "bff", "appsync", "reseller", "merchant", "audit"],
    activeEdge: ["reseller", "merchant"],
    mutation: "submitSubscription",
    services: ["reseller-service", "merchant-api-*", "audit-api", "Kafka"],
  },
];

export const agentAssistedSteps: FlowDiagramStep[] = [
  {
    label: "1. Clone session",
    description: "Agent opens /agent?orderNumber=XYZ. cloneSession mutation fires instead of generateSession — clones the customer's existing session and links the agent ID to the audit trail.",
    activeNodes: ["browser", "bff", "appsync", "session"],
    activeEdge: ["appsync", "session"],
    mutation: "cloneSession (orderNumber)",
    services: ["session-api", "DynamoDB"],
  },
  {
    label: "2. Select plan",
    description: "Agent selects a plan on the customer's behalf. subscriptionQualification fires through AppSync → reseller-service → catalog-api.",
    activeNodes: ["browser", "bff", "appsync", "reseller", "catalog"],
    activeEdge: ["reseller", "catalog"],
    mutation: "subscriptionQualification (APPLY_TO_ORDER)",
    services: ["reseller-service", "catalog-api"],
  },
  {
    label: "3. Review order",
    description: "Agent reviews the order details. Reads the cloned session — no new mutation fires.",
    activeNodes: ["browser", "bff"],
    activeEdge: ["browser", "bff"],
    services: ["session (read)"],
  },
  {
    label: "4. Submit order",
    description: "Agent submits on the customer's behalf. submitSubscription fires. Audit log includes the agent ID and original order number.",
    activeNodes: ["browser", "bff", "appsync", "reseller", "merchant", "audit"],
    activeEdge: ["reseller", "audit"],
    mutation: "submitSubscription (with agent ID)",
    services: ["reseller-service", "merchant-api-*", "audit-api", "Kafka"],
  },
];

export const undoFlowSteps: FlowDiagramStep[] = [
  {
    label: "1. Read existing state",
    description: "Page loads. generateSession or cloneSession fires to create a session with the existing subscription's state for reversal.",
    activeNodes: ["browser", "bff", "appsync", "session"],
    activeEdge: ["appsync", "session"],
    mutation: "generateSession / cloneSession",
    services: ["session-api", "DynamoDB"],
  },
  {
    label: "2. Qualify reversal",
    description: "System checks if the action is reversible. subscriptionQualification fires with op code REVERSE_DELETE or REVERSE_DOWNGRADE.",
    activeNodes: ["browser", "bff", "appsync", "reseller", "catalog"],
    activeEdge: ["reseller", "catalog"],
    mutation: "subscriptionQualification (REVERSE_*)",
    services: ["reseller-service", "catalog-api"],
  },
  {
    label: "3. Confirm undo",
    description: "Customer confirms the undo. submitSubscription fires. reseller-service reverts the prior state in PostgreSQL, re-provisions via merchant-api.",
    activeNodes: ["browser", "bff", "appsync", "reseller", "merchant", "audit"],
    activeEdge: ["reseller", "merchant"],
    mutation: "submitSubscription (revert)",
    services: ["reseller-service", "merchant-api-*"],
  },
];

// ─── AppSync lifecycle ───────────────────────────────────────────────
// Separate node layout showing AppSync internals
export const appsyncFlowNodes: FlowNode[] = [
  { id: "bff",          label: "BFF",             subtitle: "Next.js API",      color: "#3eb89a", x: 30,  y: 120 },
  { id: "appsync-api",  label: "AppSync API",     subtitle: "HTTPS endpoint",   color: "#4a8fe8", x: 170, y: 120 },
  { id: "auth-layer",   label: "Authorization",   subtitle: "IAM / Cognito",    color: "#7c6fcd", x: 310, y: 40  },
  { id: "schema",       label: "Schema",          subtitle: "GraphQL SDL",      color: "#7c6fcd", x: 450, y: 40  },
  { id: "vtl-request",  label: "VTL Request",     subtitle: "Mapping template", color: "#e8a83a", x: 310, y: 120 },
  { id: "resolver",     label: "Resolver",        subtitle: "Unit / Pipeline",  color: "#4a8fe8", x: 450, y: 120 },
  { id: "datasource",   label: "Data Source",     subtitle: "Lambda / Dynamo",  color: "#58b87a", x: 590, y: 120 },
  { id: "vtl-response", label: "VTL Response",    subtitle: "Mapping template", color: "#e8a83a", x: 310, y: 200 },
  { id: "cloudwatch",   label: "CloudWatch",      subtitle: "Logs & metrics",   color: "#6b7590", x: 450, y: 200 },
];

export const appsyncLifecycleSteps: FlowDiagramStep[] = [
  {
    label: "1. GraphQL request received",
    description:
      "BFF sends a GraphQL operation (query, mutation, or subscription) to the AppSync HTTPS endpoint. The request body contains the operation name, variables, and an authorization token (IAM SigV4 signature or API key).",
    activeNodes: ["bff", "appsync-api"],
    activeEdge: ["bff", "appsync-api"],
    mutation: "POST /graphql",
    services: ["AppSync endpoint"],
  },
  {
    label: "2. Authorization",
    description:
      "AppSync evaluates the authorization mode configured for the requested field. Supported modes: IAM (SigV4), API Key, Cognito User Pool, OIDC, and Lambda authorizer. Multi-auth allows different modes per field via @auth directives in the schema.",
    activeNodes: ["appsync-api", "auth-layer"],
    activeEdge: ["appsync-api", "auth-layer"],
    services: ["IAM", "Cognito", "Lambda authorizer"],
  },
  {
    label: "3. Schema validation",
    description:
      "AppSync validates the incoming operation against the strongly-typed GraphQL SDL schema. Checks field existence, argument types, required fields, and return types. Invalid operations are rejected with a descriptive error before any resolver executes.",
    activeNodes: ["appsync-api", "auth-layer", "schema"],
    activeEdge: ["auth-layer", "schema"],
    services: ["GraphQL SDL (.graphql)"],
  },
  {
    label: "4. Request mapping (VTL)",
    description:
      "The resolver's request mapping template (Apache Velocity Template Language) transforms GraphQL arguments into the format required by the data source. Has access to $context.arguments, $context.identity, $context.stash, and $util helpers for JSON, DynamoDB, and auth operations.",
    activeNodes: ["appsync-api", "vtl-request"],
    activeEdge: ["appsync-api", "vtl-request"],
    mutation: "VTL request template",
    services: ["$context.arguments", "$context.identity", "$util.*"],
  },
  {
    label: "5. Resolver invocation",
    description:
      "AppSync invokes the resolver. Unit resolvers call a single data source. Pipeline resolvers chain multiple functions sequentially, passing results between stages via $context.stash. Each function has its own request/response mapping templates.",
    activeNodes: ["vtl-request", "resolver"],
    activeEdge: ["vtl-request", "resolver"],
    mutation: "Unit resolver / Pipeline resolver",
    services: ["Resolver functions", "$context.stash"],
  },
  {
    label: "6. Data source execution",
    description:
      "The resolver calls the configured data source. In this architecture, Lambda functions host Go microservices (reseller-service, session-api, catalog-api). Other supported data sources: DynamoDB (direct CRUD), HTTP endpoints, RDS (Aurora Serverless), OpenSearch, and EventBridge.",
    activeNodes: ["resolver", "datasource"],
    activeEdge: ["resolver", "datasource"],
    services: ["Lambda (Go)", "DynamoDB", "HTTP", "RDS"],
  },
  {
    label: "7. Response mapping (VTL)",
    description:
      "The response mapping template transforms the data source output back into the GraphQL return type. Handles error mapping ($util.error), field selection, and result shaping. For pipeline resolvers, the final function's response template produces the return value.",
    activeNodes: ["datasource", "vtl-response", "resolver"],
    activeEdge: ["datasource", "vtl-response"],
    mutation: "VTL response template",
    services: ["$util.error()", "$util.toJson()", "$context.result"],
  },
  {
    label: "8. Response & observability",
    description:
      "AppSync returns the typed GraphQL response (data + errors) to the BFF. CloudWatch captures full request/response logs (when field-level logging is enabled), resolver latency, 4XX/5XX error rates, and throttling metrics.",
    activeNodes: ["vtl-response", "appsync-api", "bff", "cloudwatch"],
    activeEdge: ["appsync-api", "bff"],
    services: ["CloudWatch Logs", "CloudWatch Metrics", "X-Ray traces"],
  },
];

// ─── End-to-end order flow (Configurator → Order API → Billing λ) ─────
// Backend order lifecycle across three phases. Order API is the central
// orchestrator that fans out async work after one synchronous gate.
export const orderFlowNodes: FlowNode[] = [
  { id: "ui",       label: "Customer/UI",    subtitle: "CSR · Self-serve",    color: "#7c6fcd", x: 15,  y: 130 },
  { id: "config",   label: "Configurator",   subtitle: "Cart / session",      color: "#4a8fe8", x: 150, y: 130 },
  { id: "order",    label: "Order API",      subtitle: "Orchestrator",        color: "#e8705a", x: 290, y: 130 },
  { id: "msi",      label: "MSI",            subtitle: "Svc agreement",       color: "#6b7590", x: 425, y: 10  },
  { id: "catalog",  label: "Catalog API",    subtitle: "Offerings/products",  color: "#e8a83a", x: 425, y: 72  },
  { id: "polm",     label: "POLM",           subtitle: "Order lifecycle",     color: "#6b7590", x: 425, y: 134 },
  { id: "eventhub", label: "Event Hub",      subtitle: "Kafka / SQS",         color: "#58b87a", x: 425, y: 196 },
  { id: "reseller", label: "Reseller Svc",   subtitle: "Fulfillment",         color: "#e8a83a", x: 565, y: 10  },
  { id: "submgr",   label: "Subscriber Mgr", subtitle: "Profile / state",     color: "#58b87a", x: 565, y: 72  },
  { id: "billing",  label: "Billing λ",      subtitle: "SQS consumer",        color: "#4a8fe8", x: 565, y: 134 },
  { id: "nm1",      label: "NM1",            subtitle: "Billing system",      color: "#6b7590", x: 565, y: 196 },
];

export const orderFlowSteps: FlowDiagramStep[] = [
  {
    label: "1. Initialize cart",
    description:
      "Front-end (Call Center / Self-Serve) creates a new cart session on the Subscription Configurator. The sessionId must be unique every time — a reused id always returns Locked. Session starts in state Active.",
    activeNodes: ["ui", "config"],
    activeEdge: ["ui", "config"],
    mutation: "POST /cart/initialize",
    services: ["Configurator", "State=Active"],
  },
  {
    label: "2. Apply & qualify",
    description:
      "Configurator validates eligibility, checks for conflicts with existing services, applies promo codes/discounts and calculates final pricing. The session transitions to ConvToOrder — the only state the Order API will accept.",
    activeNodes: ["ui", "config"],
    activeEdge: ["ui", "config"],
    mutation: "PATCH /cart/apply-qualify/{sessionId}",
    services: ["Configurator", "State=ConvToOrder"],
  },
  {
    label: "3. Create order",
    description:
      "UI calls the Order API with the qualified sessionId. An X-Correlation-ID header is set for tracing. Everything after the next (synchronous) step runs asynchronously in the background.",
    activeNodes: ["ui", "order"],
    activeEdge: ["ui", "order"],
    mutation: "POST /order",
    services: ["Order API", "X-Correlation-ID"],
  },
  {
    label: "4. ConvertToOrder — SYNC",
    description:
      "The only synchronous step. Order API calls Configurator to permanently lock the session (State=Locked) and return the full cart data (items, subscribers, parties). If this fails, Order API returns 500 and nothing else runs.",
    activeNodes: ["order", "config"],
    activeEdge: ["order", "config"],
    mutation: "POST /cart/convertToOrder",
    services: ["Configurator", "State=Locked", "BLOCKING"],
  },
  {
    label: "5. MSI service agreement",
    description:
      "In a background goroutine, Order API re-reads the cart (GET /cart) and posts to MSI to generate the customer's service agreement. Skipped for batch, Netflix-portal and promo-disqualification orders. Failure is logged only — order continues.",
    activeNodes: ["order", "msi"],
    activeEdge: ["order", "msi"],
    mutation: "POST {MSI_URL}",
    services: ["MSI", "goroutine", "non-blocking"],
  },
  {
    label: "6. Product catalog lookups",
    description:
      "Order API fetches offering, product and (if present) promotion specs from the Internal Product Catalog. The productKey returned is required for fulfillment. A catalog failure returns PARTIAL_SUCCESS.",
    activeNodes: ["order", "catalog"],
    activeEdge: ["order", "catalog"],
    mutation: "GET /query?offeringIds / productIds / promoIds",
    services: ["Catalog API", "productKey"],
  },
  {
    label: "7. POLM POST — register",
    description:
      "Order API notifies POLM that a new order exists (status inProgress). Runs as a panic-protected goroutine with by-value params to avoid data races. On failure a fallout event is published to Event Hub and the order still continues (POLM fix).",
    activeNodes: ["order", "polm"],
    activeEdge: ["order", "polm"],
    mutation: "POST /productOrder/detailedProductOrder",
    services: ["POLM", "status=inProgress", "fallout→Event Hub"],
  },
  {
    label: "8. Confirmation email",
    description:
      "Order API publishes a confirmation-email event to Event Hub, which triggers the email service to send the order confirmation. Skipped when the BypassConfirmationEmail flag is set. Failure returns PARTIAL_SUCCESS.",
    activeNodes: ["order", "eventhub"],
    activeEdge: ["order", "eventhub"],
    mutation: "POST /internal/topic (email)",
    services: ["Event Hub", "confirmation #"],
  },
  {
    label: "9. Fulfillment (Reseller)",
    description:
      "Order API filters immediate items, separates Offering/Product/Promotion items, generates a PendingTxnId (BPP_{orderId}_{ts}) in DynamoDB, then calls the Reseller Service which routes to the right merchant (Netflix, Disney, Bango, Bell Media). Failures are tracked, not blocking.",
    activeNodes: ["order", "reseller"],
    activeEdge: ["order", "reseller"],
    mutation: "PATCH /reseller/subscriptions/{id}",
    services: ["Reseller", "merchant-api-*", "PendingTxn (DynamoDB)"],
  },
  {
    label: "10. Subscriber profile update",
    description:
      "Order API updates the subscriber profile in Subscriber Manager with the new offerings and provisioned products (promotion items are filtered out first). A failure here is critical and blocks the fulfillment return.",
    activeNodes: ["order", "submgr"],
    activeEdge: ["order", "submgr"],
    mutation: "PATCH /subscriber/{id}",
    services: ["Subscriber Manager", "BLOCKS on fail"],
  },
  {
    label: "11. Publish billing event",
    description:
      "Order API publishes a billing event (immediate items only — deferred items excluded) to the Billing SQS queue via Event Hub. This is the handoff to the Billing Process Lambda. Failure returns PARTIAL_SUCCESS.",
    activeNodes: ["order", "eventhub"],
    activeEdge: ["order", "eventhub"],
    mutation: "POST /internal/topic (billing)",
    services: ["Event Hub", "Billing SQS"],
  },
  {
    label: "12. Order API response",
    description:
      "Order API returns to the caller while background work may still be running. 200 SUCCESS = everything completed; 200 PARTIAL_SUCCESS = order created but some async steps had issues; 500 INTERNAL_ERROR = ConvertToOrder failed, no order created.",
    activeNodes: ["order", "ui"],
    activeEdge: ["order", "ui"],
    mutation: "200 SUCCESS / PARTIAL_SUCCESS",
    services: ["confirmationNumber", "subscriptions"],
  },
  {
    label: "13. Billing λ — read SQS",
    description:
      "An AWS Lambda (serverless/billing-process) is triggered by the SQS billing message. It extracts the order details, session items, subscriber info and correlation ID for tracing.",
    activeNodes: ["eventhub", "billing"],
    activeEdge: ["eventhub", "billing"],
    mutation: "SQS trigger",
    services: ["Billing λ", "correlation ID"],
  },
  {
    label: "14. NM1 billing call",
    description:
      "Lambda calls Bell's NM1 billing system to create/update the subscriber's billing account and assign a billing account number. On failure, the billing failure handler updates the Order table and may publish a fallout event.",
    activeNodes: ["billing", "nm1"],
    activeEdge: ["billing", "nm1"],
    mutation: "POST {NM1_URL}",
    services: ["NM1", "billing account #"],
  },
  {
    label: "15. Update subscriber state",
    description:
      "After successful NM1 billing, Lambda updates the subscriber's state in Subscriber Manager to reflect billing completion.",
    activeNodes: ["billing", "submgr"],
    activeEdge: ["billing", "submgr"],
    mutation: "PATCH /subscriber/{id}",
    services: ["Subscriber Manager", "post-NM1"],
  },
  {
    label: "16. POLM PATCH — complete",
    description:
      "Final lifecycle call: Lambda notifies POLM the order is completed. On failure a fallout event is published and the order is still considered complete (POLM fix). The Order table is set to Completed and an activation email may be sent.",
    activeNodes: ["billing", "polm"],
    activeEdge: ["billing", "polm"],
    mutation: "PATCH /productOrder/productOrder/{id}",
    services: ["POLM", "status=completed", "Order=Completed"],
  },
];

// ─── Renewal (flow 12) — scheduled daily Lambda ──────────────────────
export const renewalFlowNodes: FlowNode[] = [
  { id: "sched",     label: "EventBridge", subtitle: "Daily cron",      color: "#6b7590", x: 15,  y: 130 },
  { id: "renewal",   label: "Renewal λ",   subtitle: "renewal-process", color: "#4a8fe8", x: 160, y: 130 },
  { id: "pg",        label: "PostgreSQL",  subtitle: "Subscriptions",   color: "#58b87a", x: 305, y: 45  },
  { id: "qual",      label: "reseller-svc",subtitle: "Re-validate",     color: "#e8a83a", x: 305, y: 205 },
  { id: "kafka",     label: "Kafka",       subtitle: "Event bus",       color: "#58b87a", x: 450, y: 130 },
  { id: "consumers", label: "Consumers",   subtitle: "Billing/notify",  color: "#7c6fcd", x: 595, y: 130 },
];

export const renewalFlowSteps: FlowDiagramStep[] = [
  {
    label: "1. Daily trigger",
    description: "An EventBridge cron fires the subscription-renewal-process Lambda once a day. Entirely backend — no UI interaction.",
    activeNodes: ["sched", "renewal"],
    activeEdge: ["sched", "renewal"],
    mutation: "EventBridge schedule",
    services: ["subscription-renewal-process λ"],
  },
  {
    label: "2. Query due subscriptions",
    description: "The Lambda queries PostgreSQL for subscriptions approaching their renewal date.",
    activeNodes: ["renewal", "pg"],
    activeEdge: ["renewal", "pg"],
    mutation: "SELECT … WHERE renewalDate ≤ now()+window",
    services: ["PostgreSQL"],
  },
  {
    label: "3. Re-validate eligibility",
    description: "For each due subscription, eligibility is re-validated via reseller-service before the renewal proceeds.",
    activeNodes: ["renewal", "qual"],
    activeEdge: ["renewal", "qual"],
    mutation: "re-validate eligibility",
    services: ["reseller-service", "catalog-api"],
  },
  {
    label: "4. Extend period",
    description: "Eligible subscriptions have their period extended in PostgreSQL.",
    activeNodes: ["renewal", "pg"],
    activeEdge: ["renewal", "pg"],
    mutation: "UPDATE subscription SET period…",
    services: ["PostgreSQL"],
  },
  {
    label: "5. Publish renewal event",
    description: "The Lambda publishes a SubscriptionRenewed event to Kafka for downstream consumers.",
    activeNodes: ["renewal", "kafka"],
    activeEdge: ["renewal", "kafka"],
    mutation: "SubscriptionRenewed",
    services: ["Kafka"],
  },
  {
    label: "6. Downstream consumers",
    description: "Billing and notification consumers react to the renewal event — billing is updated and a renewal email is dispatched.",
    activeNodes: ["kafka", "consumers"],
    activeEdge: ["kafka", "consumers"],
    services: ["billing-process", "notification-consumer"],
  },
];

// ─── Grace Period (flow 14) — payment lapse, suspend-not-cancel ───────
export const graceFlowNodes: FlowNode[] = [
  { id: "lapse",    label: "Payment lapse", subtitle: "Failed/expired", color: "#e8705a", x: 15,  y: 130 },
  { id: "reseller", label: "reseller-api",  subtitle: "v1",             color: "#e8a83a", x: 160, y: 130 },
  { id: "pg",       label: "PostgreSQL",    subtitle: "GRACE_PERIOD",   color: "#58b87a", x: 305, y: 45  },
  { id: "merchant", label: "merchant-api",  subtitle: "Suspend",        color: "#6b7590", x: 305, y: 205 },
  { id: "kafka",    label: "Kafka",         subtitle: "Resolution",     color: "#58b87a", x: 450, y: 130 },
  { id: "resume",   label: "Auto-resume",   subtitle: "Re-provision",   color: "#3eb89a", x: 595, y: 130 },
];

export const graceFlowSteps: FlowDiagramStep[] = [
  {
    label: "1. Payment lapses",
    description: "A subscription payment fails or lapses, triggering the grace-period workflow.",
    activeNodes: ["lapse", "reseller"],
    activeEdge: ["lapse", "reseller"],
    mutation: "payment failure event",
    services: ["reseller-api-v1"],
  },
  {
    label: "2. Set GRACE_PERIOD",
    description: "reseller-api-v1 sets the subscription status to GRACE_PERIOD in PostgreSQL — a configurable window per merchant.",
    activeNodes: ["reseller", "pg"],
    activeEdge: ["reseller", "pg"],
    mutation: "status = GRACE_PERIOD",
    services: ["PostgreSQL"],
  },
  {
    label: "3. Suspend provisioning",
    description: "merchant-api-* suspends provisioning with the provider — the service is paused, not fully cancelled.",
    activeNodes: ["reseller", "merchant"],
    activeEdge: ["reseller", "merchant"],
    mutation: "suspend (not cancel)",
    services: ["merchant-api-*"],
  },
  {
    label: "4. Resolution event",
    description: "If the payment is resolved within the grace window, a Kafka event signals the resolution back to reseller-api-v1.",
    activeNodes: ["kafka", "reseller"],
    activeEdge: ["kafka", "reseller"],
    mutation: "payment resolved",
    services: ["Kafka"],
  },
  {
    label: "5. Auto-resume",
    description: "Service resumes automatically — reseller re-provisions via merchant-api-* and status returns to ACTIVE. If unresolved, the subscription moves to cancellation.",
    activeNodes: ["reseller", "resume"],
    activeEdge: ["reseller", "resume"],
    mutation: "re-provision → ACTIVE",
    services: ["reseller-api-v1", "merchant-api-*"],
  },
];

// ─── Account Recovery (flow 15) — reconcile PG ↔ merchant ────────────
export const recoveryFlowNodes: FlowNode[] = [
  { id: "trigger",  label: "Trigger",      subtitle: "Fallout/manual", color: "#e8705a", x: 15,  y: 130 },
  { id: "recovery", label: "core-proc-api",subtitle: "Reconciler",     color: "#4a8fe8", x: 160, y: 130 },
  { id: "pg",       label: "PostgreSQL",   subtitle: "HTS state",      color: "#58b87a", x: 305, y: 45  },
  { id: "reseller", label: "reseller-api", subtitle: "v1",             color: "#e8a83a", x: 305, y: 205 },
  { id: "merchant", label: "merchant-api", subtitle: "Provider state", color: "#6b7590", x: 450, y: 130 },
  { id: "audit",    label: "audit-api",    subtitle: "Recovery log",   color: "#58b87a", x: 595, y: 130 },
];

export const recoveryFlowSteps: FlowDiagramStep[] = [
  {
    label: "1. Trigger recovery",
    description: "Triggered manually or by fallout detection when subscription state is inconsistent between PostgreSQL and merchant systems.",
    activeNodes: ["trigger", "recovery"],
    activeEdge: ["trigger", "recovery"],
    mutation: "recovery initiated",
    services: ["account-recovery-api", "core-processor-api"],
  },
  {
    label: "2. Read HTS state",
    description: "core-processor-api reads the current subscription state from PostgreSQL.",
    activeNodes: ["recovery", "pg"],
    activeEdge: ["recovery", "pg"],
    services: ["PostgreSQL"],
  },
  {
    label: "3. Compare merchant state",
    description: "Via reseller-api-v1, the reconciler compares HTS state against the actual provider state in merchant-api-*.",
    activeNodes: ["recovery", "reseller", "merchant"],
    activeEdge: ["reseller", "merchant"],
    mutation: "compare PG ↔ merchant",
    services: ["reseller-api-v1", "merchant-api-*"],
  },
  {
    label: "4. Reconcile",
    description: "The reconciler resolves the drift — re-provisioning or force-cancelling via merchant-api-* to bring both sides into agreement.",
    activeNodes: ["reseller", "merchant"],
    activeEdge: ["reseller", "merchant"],
    mutation: "re-provision / force-cancel",
    services: ["reseller-api-v1", "merchant-api-*"],
  },
  {
    label: "5. Log recovery actions",
    description: "Every recovery action is written to audit-api for a full audit trail.",
    activeNodes: ["recovery", "audit"],
    activeEdge: ["recovery", "audit"],
    services: ["audit-api"],
  },
];

// ─── Fallout & Self-Healing (flow 16) — DLQ auto-remediation ─────────
export const falloutFlowNodes: FlowNode[] = [
  { id: "eventhub", label: "Event Hub",   subtitle: "Kafka DLQ",       color: "#58b87a", x: 15,  y: 130 },
  { id: "fallout",  label: "Fallout λ",   subtitle: "fallout-process", color: "#4a8fe8", x: 160, y: 130 },
  { id: "order",    label: "order-api",   subtitle: "Remediate",       color: "#e8705a", x: 305, y: 45  },
  { id: "merchant", label: "merchant-api",subtitle: "netflix…",        color: "#6b7590", x: 305, y: 205 },
  { id: "audit",    label: "audit-api",   subtitle: "Outcome log",     color: "#58b87a", x: 450, y: 130 },
  { id: "alert",    label: "Alert / DLQ", subtitle: "Manual review",   color: "#e8a83a", x: 595, y: 130 },
];

export const falloutFlowSteps: FlowDiagramStep[] = [
  {
    label: "1. Failed event routed",
    description: "Event Hub routes failed events from the Kafka DLQ to the fallout-process Lambda.",
    activeNodes: ["eventhub", "fallout"],
    activeEdge: ["eventhub", "fallout"],
    mutation: "DLQ → fallout-process",
    services: ["event-hub", "fallout-process λ"],
  },
  {
    label: "2. Inspect failure",
    description: "The Lambda inspects the failure to classify it and decide whether automated remediation is possible.",
    activeNodes: ["fallout"],
    activeEdge: ["fallout", "fallout"],
    services: ["fallout-process λ"],
  },
  {
    label: "3. Auto-remediate",
    description: "It attempts automated remediation via order-api — typically replaying the failed operation against merchant-api.",
    activeNodes: ["fallout", "order", "merchant"],
    activeEdge: ["fallout", "order"],
    mutation: "retry via order-api",
    services: ["order-api", "merchant-api-netflix"],
  },
  {
    label: "4. Log outcome",
    description: "The outcome of the remediation attempt is logged to audit-api.",
    activeNodes: ["fallout", "audit"],
    activeEdge: ["fallout", "audit"],
    services: ["audit-api"],
  },
  {
    label: "5. Escalate if needed",
    description: "If auto-heal fails, an alert is raised and the event is sent to the manual-review DLQ. Repeated failures trigger alerting.",
    activeNodes: ["fallout", "alert"],
    activeEdge: ["fallout", "alert"],
    mutation: "alert + manual review",
    services: ["DLQ", "alerting"],
  },
];

// ─── Membership / Loyalty (flow 17) — Aeroplan integration ───────────
export const membershipFlowNodes: FlowNode[] = [
  { id: "trigger",    label: "Lifecycle evt", subtitle: "Order/billing", color: "#7c6fcd", x: 15,  y: 130 },
  { id: "membership", label: "membership-api",subtitle: "Loyalty tiers", color: "#4a8fe8", x: 175, y: 130 },
  { id: "cpm",        label: "CPM",           subtitle: "Acct standing",  color: "#58b87a", x: 340, y: 45  },
  { id: "aeroplan",   label: "Aeroplan API",  subtitle: "Points",        color: "#6b7590", x: 340, y: 205 },
  { id: "points",     label: "Accrue/Redeem", subtitle: "Tier update",   color: "#e8a83a", x: 505, y: 130 },
];

export const membershipFlowSteps: FlowDiagramStep[] = [
  {
    label: "1. Lifecycle event",
    description: "A subscription lifecycle event reaches membership-api. Entirely backend — no direct UI interaction.",
    activeNodes: ["trigger", "membership"],
    activeEdge: ["trigger", "membership"],
    services: ["membership-api"],
  },
  {
    label: "2. Check account standing",
    description: "membership-api queries CPM for the customer's account standing to determine loyalty eligibility.",
    activeNodes: ["membership", "cpm"],
    activeEdge: ["membership", "cpm"],
    mutation: "account standing lookup",
    services: ["CPM"],
  },
  {
    label: "3. Aeroplan integration",
    description: "membership-api communicates with the Aeroplan API for point accrual and redemption.",
    activeNodes: ["membership", "aeroplan"],
    activeEdge: ["membership", "aeroplan"],
    mutation: "Aeroplan accrual / redemption",
    services: ["Aeroplan API"],
  },
  {
    label: "4. Accrue / redeem points",
    description: "Points are accrued or redeemed against the customer's Aeroplan account.",
    activeNodes: ["aeroplan", "points"],
    activeEdge: ["aeroplan", "points"],
    services: ["Aeroplan API"],
  },
  {
    label: "5. Update loyalty tier",
    description: "membership-api updates the customer's loyalty tier and reward points based on the result.",
    activeNodes: ["membership", "points"],
    activeEdge: ["membership", "points"],
    mutation: "tier / points update",
    services: ["membership-api"],
  },
];

// ─── Promo Codes (flow 18) — validate → apply → track ────────────────
export const promoFlowNodes: FlowNode[] = [
  { id: "ui",          label: "Customer/UI",  subtitle: "Enter code",     color: "#7c6fcd", x: 15,  y: 130 },
  { id: "rtv",         label: "promo-rtv-api",subtitle: "Real-time val.", color: "#4a8fe8", x: 160, y: 130 },
  { id: "catalog",     label: "catalog-api",  subtitle: "Eligibility",    color: "#e8a83a", x: 305, y: 45  },
  { id: "reseller",    label: "reseller-svc", subtitle: "Apply discount", color: "#e8a83a", x: 305, y: 205 },
  { id: "promo",       label: "promocodes-api",subtitle: "Validate/apply",color: "#58b87a", x: 450, y: 45  },
  { id: "redemptions", label: "redemptions",  subtitle: "Usage limits",   color: "#58b87a", x: 450, y: 205 },
  { id: "streamer",    label: "streamer-api", subtitle: "Promo events",   color: "#6b7590", x: 595, y: 130 },
];

export const promoFlowSteps: FlowDiagramStep[] = [
  {
    label: "1. Enter promo code",
    description: "Customer enters a promo code at the add/review screen. The UI calls promocodes-rtv-api for real-time validation.",
    activeNodes: ["ui", "rtv"],
    activeEdge: ["ui", "rtv"],
    mutation: "validate code",
    services: ["promocodes-rtv-api"],
  },
  {
    label: "2. Real-time validation",
    description: "promocodes-rtv-api validates the code against catalog-api for plan eligibility.",
    activeNodes: ["rtv", "catalog"],
    activeEdge: ["rtv", "catalog"],
    mutation: "plan eligibility check",
    services: ["catalog-api"],
  },
  {
    label: "3. Apply to order",
    description: "The validated discount is applied to the order via reseller-service.",
    activeNodes: ["rtv", "reseller"],
    activeEdge: ["rtv", "reseller"],
    mutation: "apply discount",
    services: ["reseller-service"],
  },
  {
    label: "4. Validate & apply",
    description: "promocodes-api performs the authoritative validation and applies the promotional pricing once the order is confirmed.",
    activeNodes: ["rtv", "promo"],
    activeEdge: ["rtv", "promo"],
    mutation: "validate → apply",
    services: ["promocodes-api"],
  },
  {
    label: "5. Track redemption",
    description: "promocode-redemptions-api records the redemption and enforces usage limits per code.",
    activeNodes: ["promo", "redemptions"],
    activeEdge: ["promo", "redemptions"],
    mutation: "track redemption",
    services: ["promocode-redemptions-api"],
  },
  {
    label: "6. Stream promo events",
    description: "promocode-streamer-api streams real-time promo events (modifications, redemptions) to downstream consumers.",
    activeNodes: ["promo", "streamer"],
    activeEdge: ["promo", "streamer"],
    mutation: "promo event stream",
    services: ["promocode-streamer-api"],
  },
];

// ─── Notifications (flow 19) — Kafka → email → SES ───────────────────
export const notificationsFlowNodes: FlowNode[] = [
  { id: "kafka",    label: "Kafka",        subtitle: "Lifecycle evt",  color: "#58b87a", x: 15,  y: 130 },
  { id: "consumer", label: "notif-consumer",subtitle: "Dispatcher",    color: "#4a8fe8", x: 160, y: 130 },
  { id: "sqs",      label: "SQS",          subtitle: "Burst buffer",   color: "#e8a83a", x: 305, y: 45  },
  { id: "email",    label: "email-api",    subtitle: "Compose",        color: "#7c6fcd", x: 305, y: 205 },
  { id: "ses",      label: "SES v2",       subtitle: "Templated send", color: "#6b7590", x: 450, y: 130 },
  { id: "customer", label: "Customer",     subtitle: "Inbox",          color: "#3eb89a", x: 595, y: 130 },
];

export const notificationsFlowSteps: FlowDiagramStep[] = [
  {
    label: "1. Lifecycle event",
    description: "notification-consumer listens to Kafka events: order placed, activated, cancelled, renewed. Event-driven — no UI trigger.",
    activeNodes: ["kafka", "consumer"],
    activeEdge: ["kafka", "consumer"],
    mutation: "OrderCreated / Activated / …",
    services: ["notification-consumer"],
  },
  {
    label: "2. Buffer in SQS",
    description: "Events are buffered through SQS to prevent throttling during burst events.",
    activeNodes: ["consumer", "sqs"],
    activeEdge: ["consumer", "sqs"],
    mutation: "SQS buffer",
    services: ["SQS"],
  },
  {
    label: "3. Compose notification",
    description: "notification-consumer dispatches to email-api, which composes the message from the appropriate template.",
    activeNodes: ["consumer", "email"],
    activeEdge: ["consumer", "email"],
    services: ["email-api"],
  },
  {
    label: "4. Send via SES",
    description: "email-api sends the templated email through SES v2. Templates are managed in SES.",
    activeNodes: ["email", "ses"],
    activeEdge: ["email", "ses"],
    mutation: "SES v2 templated send",
    services: ["SES v2"],
  },
  {
    label: "5. Deliver",
    description: "The notification is delivered to the customer's inbox (email, and where applicable SMS/push).",
    activeNodes: ["ses", "customer"],
    activeEdge: ["ses", "customer"],
    services: ["SES v2"],
  },
];

// Map flow IDs to their step arrays
export const flowDiagramMap: Record<string, FlowDiagramStep[]> = {
  "flow-add": addSubscriptionSteps,
  "flow-cancel": cancelSubscriptionSteps,
  "flow-change": changePlanSteps,
  "flow-agent": agentAssistedSteps,
  "flow-undo": undoFlowSteps,
  "flow-appsync": appsyncLifecycleSteps,
  "flow-order": orderFlowSteps,
  "flow-renewal": renewalFlowSteps,
  "flow-grace": graceFlowSteps,
  "flow-recovery": recoveryFlowSteps,
  "flow-fallout": falloutFlowSteps,
  "flow-membership": membershipFlowSteps,
  "flow-promo": promoFlowSteps,
  "flow-notifications": notificationsFlowSteps,
};

// Map flow IDs to custom node layouts (when different from default flowNodes)
export const flowNodeOverrides: Record<string, FlowNode[]> = {
  "flow-appsync": appsyncFlowNodes,
  "flow-order": orderFlowNodes,
  "flow-renewal": renewalFlowNodes,
  "flow-grace": graceFlowNodes,
  "flow-recovery": recoveryFlowNodes,
  "flow-fallout": falloutFlowNodes,
  "flow-membership": membershipFlowNodes,
  "flow-promo": promoFlowNodes,
  "flow-notifications": notificationsFlowNodes,
};
