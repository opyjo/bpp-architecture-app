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

// Map flow IDs to their step arrays
export const flowDiagramMap: Record<string, FlowDiagramStep[]> = {
  "flow-add": addSubscriptionSteps,
  "flow-cancel": cancelSubscriptionSteps,
  "flow-change": changePlanSteps,
  "flow-agent": agentAssistedSteps,
  "flow-undo": undoFlowSteps,
};
