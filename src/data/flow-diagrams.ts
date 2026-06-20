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

// Map flow IDs to their step arrays
export const flowDiagramMap: Record<string, FlowDiagramStep[]> = {
  "flow-add": addSubscriptionSteps,
  "flow-cancel": cancelSubscriptionSteps,
  "flow-change": changePlanSteps,
  "flow-agent": agentAssistedSteps,
  "flow-undo": undoFlowSteps,
  "flow-appsync": appsyncLifecycleSteps,
};

// Map flow IDs to custom node layouts (when different from default flowNodes)
export const flowNodeOverrides: Record<string, FlowNode[]> = {
  "flow-appsync": appsyncFlowNodes,
};
