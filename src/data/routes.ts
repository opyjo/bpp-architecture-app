export interface Route {
  route: string;
  page: string;
  file: string;
  audience: "Customer" | "Agent";
}

export const routes: Route[] = [
  { route: "/customer", page: "Manage Subscriptions — SubscriptionDetail cards", file: "src/app/customer/page.tsx", audience: "Customer" },
  { route: "/customer/add-subscription", page: "Select a Service — catalog grid", file: "…/add-subscription/page.tsx", audience: "Customer" },
  { route: "/customer/add-subscription/review", page: "Review & Place Order", file: "…/review/page.tsx", audience: "Customer" },
  { route: "/customer/add-subscription/confirm", page: "Order Confirmed", file: "…/confirm/page.tsx", audience: "Customer" },
  { route: "/customer/change-subscription/[id]", page: "Pick New Tier", file: "…/change-subscription/[id]/page.tsx", audience: "Customer" },
  { route: "/customer/change-subscription/[id]/review", page: "Review Plan Change", file: "…/[id]/review/page.tsx", audience: "Customer" },
  { route: "/customer/cancel-subscription", page: "Review Cancellation", file: "…/cancel-subscription/page.tsx", audience: "Customer" },
  { route: "/customer/reverse-cancellation", page: "Undo Cancellation", file: "…/reverse-cancellation/page.tsx", audience: "Customer" },
  { route: "/customer/reverse-downgrade", page: "Undo Downgrade", file: "…/reverse-downgrade/page.tsx", audience: "Customer" },
  { route: "/customer/reverse-bundle-change", page: "Undo Bundle Change", file: "…/reverse-bundle-change/page.tsx", audience: "Customer" },
  { route: "/agent", page: "Agent Entry — requires ?orderNumber=", file: "src/app/agent/page.tsx", audience: "Agent" },
  { route: "/agent/review", page: "Agent Review & Submit", file: "src/app/agent/review/page.tsx", audience: "Agent" },
];

export const quickRefRows = [
  { screen: "SubscriptionDetail cards (load)", mutation: "GET /subscriptions", mutationType: "rest" as const, services: "subscriptions-aggregator-api → PostgreSQL + CPM" },
  { screen: "Any flow entry (customer)", mutation: "generateSession", mutationType: "mutation" as const, services: "session-api → DynamoDB; household-api → CPM" },
  { screen: "Agent entry", mutation: "cloneSession", mutationType: "mutation" as const, services: "session-api → DynamoDB" },
  { screen: "Catalog / tier picker", mutation: "subscriptionQualification (APPLY_TO_ORDER)", mutationType: "mutation" as const, services: "reseller-service, catalog-api → Redis" },
  { screen: "Cancel link / review", mutation: "subscriptionQualification (DELETE)", mutationType: "mutation" as const, services: "reseller-service, catalog-api" },
  { screen: "Undo screens", mutation: "subscriptionQualification (REVERSE_*)", mutationType: "mutation" as const, services: "reseller-service" },
  { screen: "Review & Place Order / Agent submit", mutation: "submitSubscription", mutationType: "mutation" as const, services: "reseller-service → PostgreSQL, merchant-api-*, Kafka, audit-api" },
  { screen: "Order Confirmed (activate)", mutation: "activateSubscription", mutationType: "mutation" as const, services: "reseller-service → merchant-api-*, audit-api" },
];
