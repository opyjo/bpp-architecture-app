/* ------------------------------------------------------------------ */
/*  Component-level integration trees for every route group           */
/* ------------------------------------------------------------------ */

export interface ComponentNode {
  id: string;
  name: string;
  file: string;
  description: string;
  hooks: string[];
  consumesContext: string[];
  props: string[];
  apiCalls: string[];
  category: "page" | "provider" | "feature" | "shared" | "mutation-trigger";
}

export interface ComponentTree {
  id: string;
  label: string;
  route: string;
  title: string;
  description: string;
  audience: "Customer" | "Agent";
  mermaidChart: string;
  components: ComponentNode[];
}

/* ------------------------------------------------------------------ */
/*  Shared class defs reused across all diagrams                      */
/* ------------------------------------------------------------------ */

const classDefs = `
  classDef provider fill:#7c6fcd22,stroke:#7c6fcd,color:#c4b5fd
  classDef page fill:#4a8fe822,stroke:#4a8fe8,color:#93c5fd
  classDef feature fill:#3eb89a22,stroke:#3eb89a,color:#6ee7b7
  classDef shared fill:#e8a83a22,stroke:#e8a83a,color:#fcd34d
  classDef trigger fill:#e8705a22,stroke:#e8705a,color:#fca5a5`;

/* ------------------------------------------------------------------ */
/*  1. /customer — Manage Subscriptions                               */
/* ------------------------------------------------------------------ */

const customerTree: ComponentTree = {
  id: "ct-customer",
  label: "/customer",
  route: "/customer",
  title: "Component tree — /customer",
  description:
    "Landing page showing all active subscriptions as cards. Each card exposes action buttons (Add, Change, Cancel) that kick off downstream flows.",
  audience: "Customer",
  mermaidChart: `flowchart TD
  subgraph Providers
    SP[SessionProvider]:::provider
    AP[AuthProvider]:::provider
  end

  CP[CustomerPage]:::page
  SL[SubscriptionLayout]:::shared
  SH[SubscriptionHeader]:::feature
  SL2[SubscriptionList]:::feature
  SC[SubscriptionCard]:::shared
  AB[AddButton]:::trigger
  CHB[ChangeButton]:::trigger
  CNB[CancelButton]:::trigger
  LI[LoadingIndicator]:::shared
  EB[ErrorBanner]:::shared

  SP --> CP
  AP --> CP
  CP --> SL
  SL --> SH
  SL --> SL2
  SL --> EB
  SL2 --> SC
  SL2 --> LI
  SC --> AB
  SC --> CHB
  SC --> CNB
${classDefs}`,
  components: [
    { id: "sp", name: "SessionProvider", file: "src/providers/SessionProvider.tsx", description: "Wraps page tree; provides session context (sessionId, account, locale).", hooks: ["useContext"], consumesContext: [], props: ["children"], apiCalls: [], category: "provider" },
    { id: "ap", name: "AuthProvider", file: "src/providers/AuthProvider.tsx", description: "SAML/Auth0 auth state; provides isAuthenticated, user, logout.", hooks: ["useContext"], consumesContext: [], props: ["children"], apiCalls: [], category: "provider" },
    { id: "cp", name: "CustomerPage", file: "src/app/customer/page.tsx", description: "Route entry point. Fetches subscription list via REST on mount.", hooks: ["useEffect", "useState"], consumesContext: ["SessionContext", "AuthContext"], props: [], apiCalls: ["GET /subscriptions"], category: "page" },
    { id: "sl", name: "SubscriptionLayout", file: "src/components/SubscriptionLayout.tsx", description: "Shared shell with header slot and content area.", hooks: [], consumesContext: [], props: ["children", "header"], apiCalls: [], category: "shared" },
    { id: "sh", name: "SubscriptionHeader", file: "src/components/SubscriptionHeader.tsx", description: "Displays account name, subscription count, and locale badge.", hooks: [], consumesContext: ["SessionContext"], props: ["accountName", "count"], apiCalls: [], category: "feature" },
    { id: "sl2", name: "SubscriptionList", file: "src/components/SubscriptionList.tsx", description: "Maps subscription array to SubscriptionCard components.", hooks: ["useMemo"], consumesContext: [], props: ["subscriptions", "isLoading"], apiCalls: [], category: "feature" },
    { id: "sc", name: "SubscriptionCard", file: "src/components/SubscriptionCard.tsx", description: "Renders single subscription: name, tier, status, action buttons.", hooks: [], consumesContext: [], props: ["subscription", "onAdd", "onChange", "onCancel"], apiCalls: [], category: "shared" },
    { id: "ab", name: "AddButton", file: "src/components/actions/AddButton.tsx", description: "Triggers generateSession then navigates to /add-subscription.", hooks: ["useRouter"], consumesContext: ["SessionContext"], props: ["accountId"], apiCalls: ["generateSession"], category: "mutation-trigger" },
    { id: "chb", name: "ChangeButton", file: "src/components/actions/ChangeButton.tsx", description: "Triggers generateSession then navigates to /change-subscription/[id].", hooks: ["useRouter"], consumesContext: ["SessionContext"], props: ["subscriptionId"], apiCalls: ["generateSession"], category: "mutation-trigger" },
    { id: "cnb", name: "CancelButton", file: "src/components/actions/CancelButton.tsx", description: "Triggers subscriptionQualification (DELETE) then navigates to /cancel-subscription.", hooks: ["useRouter"], consumesContext: ["SessionContext"], props: ["subscriptionId"], apiCalls: ["subscriptionQualification"], category: "mutation-trigger" },
    { id: "li", name: "LoadingIndicator", file: "src/components/ui/LoadingIndicator.tsx", description: "Skeleton / spinner shown while subscriptions load.", hooks: [], consumesContext: [], props: ["size"], apiCalls: [], category: "shared" },
    { id: "eb", name: "ErrorBanner", file: "src/components/ui/ErrorBanner.tsx", description: "Inline error message shown when REST call fails.", hooks: [], consumesContext: [], props: ["error", "onRetry"], apiCalls: [], category: "shared" },
  ],
};

/* ------------------------------------------------------------------ */
/*  2. /add-subscription — Select a Service                           */
/* ------------------------------------------------------------------ */

const addSubscriptionTree: ComponentTree = {
  id: "ct-add",
  label: "/add-subscription",
  route: "/customer/add-subscription",
  title: "Component tree — /add-subscription",
  description:
    "Catalog page: shows eligible plans from subscriptionQualification. User selects a plan, which re-qualifies on each change before navigating to /review.",
  audience: "Customer",
  mermaidChart: `flowchart TD
  subgraph Providers
    SP[SessionProvider]:::provider
    AP[AuthProvider]:::provider
  end

  ASP[AddSubscriptionPage]:::page
  SL[SubscriptionLayout]:::shared
  CG[CatalogGrid]:::feature
  PC[PlanCard]:::feature
  PD[PlanDetails]:::feature
  SB[SelectButton]:::trigger
  LI[LoadingIndicator]:::shared
  EB[ErrorBanner]:::shared

  SP --> ASP
  AP --> ASP
  ASP --> SL
  SL --> CG
  SL --> EB
  CG --> PC
  CG --> LI
  PC --> PD
  PC --> SB
${classDefs}`,
  components: [
    { id: "asp", name: "AddSubscriptionPage", file: "src/app/customer/add-subscription/page.tsx", description: "Route entry. Calls subscriptionQualification (APPLY_TO_ORDER) on mount to fetch eligible plans.", hooks: ["useEffect", "useState"], consumesContext: ["SessionContext"], props: [], apiCalls: ["subscriptionQualification"], category: "page" },
    { id: "cg", name: "CatalogGrid", file: "src/components/CatalogGrid.tsx", description: "Responsive grid of PlanCards. Handles empty-state when no plans qualify.", hooks: ["useMemo"], consumesContext: [], props: ["plans", "selectedPlanId", "onSelect"], apiCalls: [], category: "feature" },
    { id: "pc", name: "PlanCard", file: "src/components/PlanCard.tsx", description: "Displays plan name, price, features. Highlights when selected.", hooks: [], consumesContext: [], props: ["plan", "isSelected", "onSelect"], apiCalls: [], category: "feature" },
    { id: "pd", name: "PlanDetails", file: "src/components/PlanDetails.tsx", description: "Expandable section showing full plan features and terms.", hooks: ["useState"], consumesContext: [], props: ["plan"], apiCalls: [], category: "feature" },
    { id: "sb", name: "SelectButton", file: "src/components/actions/SelectButton.tsx", description: "Re-calls subscriptionQualification with selected plan, then navigates to /review.", hooks: ["useRouter"], consumesContext: ["SessionContext"], props: ["planId"], apiCalls: ["subscriptionQualification"], category: "mutation-trigger" },
  ],
};

/* ------------------------------------------------------------------ */
/*  3. /review & /confirm                                              */
/* ------------------------------------------------------------------ */

const reviewConfirmTree: ComponentTree = {
  id: "ct-review",
  label: "/review & /confirm",
  route: "/customer/add-subscription/review → /confirm",
  title: "Component tree — /review & /confirm",
  description:
    "Review page reads the session payload (no new mutation). Place Order triggers submitSubscription. Confirm page calls activateSubscription and redirects to provider.",
  audience: "Customer",
  mermaidChart: `flowchart TD
  subgraph Providers
    SP[SessionProvider]:::provider
  end

  RP[ReviewPage]:::page
  CF[ConfirmPage]:::page
  SL[SubscriptionLayout]:::shared
  OS[OrderSummary]:::feature
  TC[TermsCheckbox]:::feature
  POB[PlaceOrderButton]:::trigger
  CS[ConfirmationStatus]:::feature
  ActB[ActivateButton]:::trigger
  LI[LoadingIndicator]:::shared

  SP --> RP
  SP --> CF
  RP --> SL
  SL --> OS
  SL --> TC
  SL --> POB
  SL --> LI
  CF --> CS
  CF --> ActB
${classDefs}`,
  components: [
    { id: "rp", name: "ReviewPage", file: "src/app/customer/add-subscription/review/page.tsx", description: "Reads qualification payload from session. No API call on mount.", hooks: ["useState"], consumesContext: ["SessionContext"], props: [], apiCalls: [], category: "page" },
    { id: "cfp", name: "ConfirmPage", file: "src/app/customer/add-subscription/confirm/page.tsx", description: "Shows order confirmation. Calls activateSubscription on mount or via button.", hooks: ["useEffect", "useState"], consumesContext: ["SessionContext"], props: [], apiCalls: ["activateSubscription"], category: "page" },
    { id: "os", name: "OrderSummary", file: "src/components/OrderSummary.tsx", description: "Displays selected plan, pricing, and order details.", hooks: [], consumesContext: [], props: ["order"], apiCalls: [], category: "feature" },
    { id: "tc", name: "TermsCheckbox", file: "src/components/TermsCheckbox.tsx", description: "Terms & conditions agreement checkbox. Gates the Place Order button.", hooks: ["useState"], consumesContext: [], props: ["onAccept"], apiCalls: [], category: "feature" },
    { id: "pob", name: "PlaceOrderButton", file: "src/components/actions/PlaceOrderButton.tsx", description: "Calls submitSubscription, then navigates to /confirm on success.", hooks: ["useRouter", "useState"], consumesContext: ["SessionContext"], props: ["isDisabled"], apiCalls: ["submitSubscription"], category: "mutation-trigger" },
    { id: "cst", name: "ConfirmationStatus", file: "src/components/ConfirmationStatus.tsx", description: "Success/pending state indicator with order ID display.", hooks: [], consumesContext: [], props: ["orderId", "status"], apiCalls: [], category: "feature" },
    { id: "actb", name: "ActivateButton", file: "src/components/actions/ActivateButton.tsx", description: "Calls activateSubscription, receives activationUrl and redirects to provider.", hooks: ["useRouter"], consumesContext: ["SessionContext"], props: ["orderId"], apiCalls: ["activateSubscription"], category: "mutation-trigger" },
  ],
};

/* ------------------------------------------------------------------ */
/*  4. /change-subscription                                            */
/* ------------------------------------------------------------------ */

const changeSubscriptionTree: ComponentTree = {
  id: "ct-change",
  label: "/change-subscription",
  route: "/customer/change-subscription/[id]",
  title: "Component tree — /change-subscription",
  description:
    "Tier picker for upgrading/downgrading an existing subscription. Uses subscriptionQualification scoped to the current subscriptionId. Review subpage confirms the change via submitSubscription.",
  audience: "Customer",
  mermaidChart: `flowchart TD
  subgraph Providers
    SP[SessionProvider]:::provider
  end

  CSP[ChangeSubscriptionPage]:::page
  CRP[ChangeReviewPage]:::page
  SL[SubscriptionLayout]:::shared
  TP[TierPicker]:::feature
  TCard[TierCard]:::feature
  CD[ComparisonDisplay]:::feature
  CTB[ConfirmTierButton]:::trigger
  CSB[ConfirmSubmitButton]:::trigger
  LI[LoadingIndicator]:::shared

  SP --> CSP
  SP --> CRP
  CSP --> SL
  SL --> TP
  SL --> LI
  TP --> TCard
  TP --> CD
  TCard --> CTB
  CRP --> CSB
${classDefs}`,
  components: [
    { id: "csp", name: "ChangeSubscriptionPage", file: "src/app/customer/change-subscription/[id]/page.tsx", description: "Route entry. Calls subscriptionQualification (APPLY_TO_ORDER + currentSubId) on mount.", hooks: ["useEffect", "useState", "useParams"], consumesContext: ["SessionContext"], props: [], apiCalls: ["subscriptionQualification"], category: "page" },
    { id: "crp", name: "ChangeReviewPage", file: "src/app/customer/change-subscription/[id]/review/page.tsx", description: "Shows old vs new plan comparison. Confirms via submitSubscription.", hooks: ["useState"], consumesContext: ["SessionContext"], props: [], apiCalls: ["submitSubscription"], category: "page" },
    { id: "tp", name: "TierPicker", file: "src/components/TierPicker.tsx", description: "Displays available upgrade/downgrade tiers from qualification result.", hooks: ["useMemo"], consumesContext: [], props: ["tiers", "currentTierId", "onSelect"], apiCalls: [], category: "feature" },
    { id: "tc2", name: "TierCard", file: "src/components/TierCard.tsx", description: "Individual tier option with price delta and feature diff.", hooks: [], consumesContext: [], props: ["tier", "isCurrent", "isSelected", "onSelect"], apiCalls: [], category: "feature" },
    { id: "cd", name: "ComparisonDisplay", file: "src/components/ComparisonDisplay.tsx", description: "Side-by-side comparison of current vs selected tier.", hooks: [], consumesContext: [], props: ["currentTier", "selectedTier"], apiCalls: [], category: "feature" },
    { id: "ctb", name: "ConfirmTierButton", file: "src/components/actions/ConfirmTierButton.tsx", description: "Re-qualifies with selected tier and navigates to review.", hooks: ["useRouter"], consumesContext: ["SessionContext"], props: ["tierId"], apiCalls: ["subscriptionQualification"], category: "mutation-trigger" },
    { id: "csb", name: "ConfirmSubmitButton", file: "src/components/actions/ConfirmSubmitButton.tsx", description: "Calls submitSubscription for the plan change.", hooks: ["useRouter", "useState"], consumesContext: ["SessionContext"], props: ["isDisabled"], apiCalls: ["submitSubscription"], category: "mutation-trigger" },
  ],
};

/* ------------------------------------------------------------------ */
/*  5. /cancel-subscription                                            */
/* ------------------------------------------------------------------ */

const cancelSubscriptionTree: ComponentTree = {
  id: "ct-cancel",
  label: "/cancel-subscription",
  route: "/customer/cancel-subscription",
  title: "Component tree — /cancel-subscription",
  description:
    "Cancellation review page. Reads qualification result from session, shows impact summary, and confirms via submitSubscription with status CANCELLED.",
  audience: "Customer",
  mermaidChart: `flowchart TD
  subgraph Providers
    SP[SessionProvider]:::provider
  end

  CXP[CancelSubscriptionPage]:::page
  SL[SubscriptionLayout]:::shared
  CI[CancellationImpact]:::feature
  SD[SubscriptionDetails]:::feature
  CCB[ConfirmCancelButton]:::trigger
  EB[ErrorBanner]:::shared

  SP --> CXP
  CXP --> SL
  SL --> CI
  SL --> SD
  SL --> CCB
  SL --> EB
${classDefs}`,
  components: [
    { id: "cxp", name: "CancelSubscriptionPage", file: "src/app/customer/cancel-subscription/page.tsx", description: "Route entry. Reads qualification result (DELETE) from session context.", hooks: ["useState"], consumesContext: ["SessionContext"], props: [], apiCalls: [], category: "page" },
    { id: "ci", name: "CancellationImpact", file: "src/components/CancellationImpact.tsx", description: "Shows what the customer will lose: features, access dates, billing impact.", hooks: [], consumesContext: [], props: ["impact"], apiCalls: [], category: "feature" },
    { id: "sd", name: "SubscriptionDetails", file: "src/components/SubscriptionDetails.tsx", description: "Current subscription details: name, tier, renewal date.", hooks: [], consumesContext: [], props: ["subscription"], apiCalls: [], category: "feature" },
    { id: "ccb", name: "ConfirmCancelButton", file: "src/components/actions/ConfirmCancelButton.tsx", description: "Calls submitSubscription with op CANCELLED. Navigates to /customer on success.", hooks: ["useRouter", "useState"], consumesContext: ["SessionContext"], props: [], apiCalls: ["submitSubscription"], category: "mutation-trigger" },
  ],
};

/* ------------------------------------------------------------------ */
/*  6. Undo pages (reverse-cancellation, reverse-downgrade, etc.)      */
/* ------------------------------------------------------------------ */

const undoTree: ComponentTree = {
  id: "ct-undo",
  label: "Undo pages",
  route: "/reverse-cancellation · /reverse-downgrade · /reverse-bundle-change",
  title: "Component tree — Undo pages",
  description:
    "Three structurally identical pages. Each qualifies with a REVERSE_* op code and confirms via submitSubscription. Shared UndoLayout handles the common flow.",
  audience: "Customer",
  mermaidChart: `flowchart TD
  subgraph Providers
    SP[SessionProvider]:::provider
  end

  UL[UndoLayout]:::shared
  RC[ReverseCancellationPage]:::page
  RD[ReverseDowngradePage]:::page
  RB[ReverseBundleChangePage]:::page
  IS[ImpactSummary]:::feature
  UB[UndoButton]:::trigger
  LI[LoadingIndicator]:::shared

  SP --> RC
  SP --> RD
  SP --> RB
  RC --> UL
  RD --> UL
  RB --> UL
  UL --> IS
  UL --> UB
  UL --> LI
${classDefs}`,
  components: [
    { id: "rc", name: "ReverseCancellationPage", file: "src/app/customer/reverse-cancellation/page.tsx", description: "Qualifies with REVERSE_DELETE. Shows what will be restored.", hooks: ["useEffect", "useState"], consumesContext: ["SessionContext"], props: [], apiCalls: ["subscriptionQualification"], category: "page" },
    { id: "rd", name: "ReverseDowngradePage", file: "src/app/customer/reverse-downgrade/page.tsx", description: "Qualifies with REVERSE_DOWNGRADE. Shows tier change revert.", hooks: ["useEffect", "useState"], consumesContext: ["SessionContext"], props: [], apiCalls: ["subscriptionQualification"], category: "page" },
    { id: "rb", name: "ReverseBundleChangePage", file: "src/app/customer/reverse-bundle-change/page.tsx", description: "Qualifies with REVERSE_BUNDLE_CHANGE. Shows bundle revert.", hooks: ["useEffect", "useState"], consumesContext: ["SessionContext"], props: [], apiCalls: ["subscriptionQualification"], category: "page" },
    { id: "ul", name: "UndoLayout", file: "src/components/UndoLayout.tsx", description: "Shared layout for all undo pages. Renders impact summary and confirm button.", hooks: [], consumesContext: [], props: ["children", "title", "impact", "onConfirm"], apiCalls: [], category: "shared" },
    { id: "is", name: "ImpactSummary", file: "src/components/ImpactSummary.tsx", description: "Before/after comparison for the undo operation.", hooks: [], consumesContext: [], props: ["before", "after"], apiCalls: [], category: "feature" },
    { id: "ub", name: "UndoButton", file: "src/components/actions/UndoButton.tsx", description: "Calls submitSubscription with reverse op code. Navigates to /customer on success.", hooks: ["useRouter", "useState"], consumesContext: ["SessionContext"], props: ["opCode"], apiCalls: ["submitSubscription"], category: "mutation-trigger" },
  ],
};

/* ------------------------------------------------------------------ */
/*  7. /agent — Agent-assisted flow                                    */
/* ------------------------------------------------------------------ */

const agentTree: ComponentTree = {
  id: "ct-agent",
  label: "/agent",
  route: "/agent?orderNumber=XYZ",
  title: "Component tree — /agent",
  description:
    "Agent flow: uses cloneSession instead of generateSession. Streamlined layout without customer navigation. Agent ID is attached to all audit records.",
  audience: "Agent",
  mermaidChart: `flowchart TD
  subgraph Providers
    SP[SessionProvider]:::provider
    AP[AuthProvider]:::provider
  end

  AGP[AgentPage]:::page
  ARP[AgentReviewPage]:::page
  AL[AgentLayout]:::shared
  CG[CatalogGrid]:::feature
  PC[PlanCard]:::feature
  OS[OrderSummary]:::feature
  ASB[AgentSubmitButton]:::trigger
  OI[OrderInput]:::feature
  LI[LoadingIndicator]:::shared
  EB[ErrorBanner]:::shared

  SP --> AGP
  AP --> AGP
  SP --> ARP
  AGP --> AL
  AL --> OI
  AL --> CG
  AL --> EB
  AL --> LI
  CG --> PC
  ARP --> OS
  ARP --> ASB
${classDefs}`,
  components: [
    { id: "agp", name: "AgentPage", file: "src/app/agent/page.tsx", description: "Route entry. Reads ?orderNumber from URL, calls cloneSession to create agent session.", hooks: ["useEffect", "useState", "useSearchParams"], consumesContext: ["SessionContext", "AuthContext"], props: [], apiCalls: ["cloneSession"], category: "page" },
    { id: "arp", name: "AgentReviewPage", file: "src/app/agent/review/page.tsx", description: "Agent reviews the order. Calls submitSubscription with agent ID attached.", hooks: ["useState"], consumesContext: ["SessionContext", "AuthContext"], props: [], apiCalls: ["submitSubscription"], category: "page" },
    { id: "al", name: "AgentLayout", file: "src/components/AgentLayout.tsx", description: "Streamlined layout for agent flow — no customer nav, minimal chrome.", hooks: [], consumesContext: [], props: ["children"], apiCalls: [], category: "shared" },
    { id: "oi", name: "OrderInput", file: "src/components/OrderInput.tsx", description: "Displays current order number. Allows agent to verify before proceeding.", hooks: [], consumesContext: [], props: ["orderNumber"], apiCalls: [], category: "feature" },
    { id: "asb", name: "AgentSubmitButton", file: "src/components/actions/AgentSubmitButton.tsx", description: "Calls submitSubscription with agent context. Attaches agentId to audit trail.", hooks: ["useRouter", "useState"], consumesContext: ["SessionContext", "AuthContext"], props: [], apiCalls: ["submitSubscription"], category: "mutation-trigger" },
  ],
};

/* ------------------------------------------------------------------ */
/*  Shared components (cross-page reuse view)                         */
/* ------------------------------------------------------------------ */

export interface SharedComponent {
  name: string;
  file: string;
  usedIn: string[];          // route labels
  category: ComponentNode["category"];
}

export const sharedComponents: SharedComponent[] = [
  { name: "SessionProvider", file: "src/providers/SessionProvider.tsx", usedIn: ["/customer", "/add-subscription", "/review", "/confirm", "/change-subscription", "/cancel-subscription", "Undo pages", "/agent"], category: "provider" },
  { name: "AuthProvider", file: "src/providers/AuthProvider.tsx", usedIn: ["/customer", "/agent"], category: "provider" },
  { name: "SubscriptionLayout", file: "src/components/SubscriptionLayout.tsx", usedIn: ["/customer", "/add-subscription", "/review", "/change-subscription", "/cancel-subscription"], category: "shared" },
  { name: "SubscriptionCard", file: "src/components/SubscriptionCard.tsx", usedIn: ["/customer"], category: "shared" },
  { name: "CatalogGrid", file: "src/components/CatalogGrid.tsx", usedIn: ["/add-subscription", "/agent"], category: "feature" },
  { name: "PlanCard", file: "src/components/PlanCard.tsx", usedIn: ["/add-subscription", "/agent"], category: "feature" },
  { name: "OrderSummary", file: "src/components/OrderSummary.tsx", usedIn: ["/review", "/agent"], category: "feature" },
  { name: "LoadingIndicator", file: "src/components/ui/LoadingIndicator.tsx", usedIn: ["/customer", "/add-subscription", "/change-subscription", "Undo pages", "/agent"], category: "shared" },
  { name: "ErrorBanner", file: "src/components/ui/ErrorBanner.tsx", usedIn: ["/customer", "/cancel-subscription", "/agent"], category: "shared" },
  { name: "UndoLayout", file: "src/components/UndoLayout.tsx", usedIn: ["Undo pages"], category: "shared" },
  { name: "AgentLayout", file: "src/components/AgentLayout.tsx", usedIn: ["/agent"], category: "shared" },
];

export const sharedComponentsMermaid = `flowchart LR
  SP[SessionProvider]:::provider
  AP[AuthProvider]:::provider
  SL[SubscriptionLayout]:::shared
  CG[CatalogGrid]:::feature
  PC[PlanCard]:::feature
  OS[OrderSummary]:::feature
  LI[LoadingIndicator]:::shared
  EB[ErrorBanner]:::shared
  UL[UndoLayout]:::shared
  AL[AgentLayout]:::shared

  SP --> P1["/customer"]:::page
  SP --> P2["/add-subscription"]:::page
  SP --> P3["/review & /confirm"]:::page
  SP --> P4["/change-subscription"]:::page
  SP --> P5["/cancel-subscription"]:::page
  SP --> P6["Undo pages"]:::page
  SP --> P7["/agent"]:::page
  AP --> P1
  AP --> P7
  SL --> P1
  SL --> P2
  SL --> P3
  SL --> P4
  SL --> P5
  CG --> P2
  CG --> P7
  PC --> P2
  PC --> P7
  OS --> P3
  OS --> P7
  LI --> P1
  LI --> P2
  LI --> P4
  LI --> P6
  LI --> P7
  EB --> P1
  EB --> P5
  EB --> P7
  UL --> P6
  AL --> P7
${classDefs}`;

/* ------------------------------------------------------------------ */
/*  Exports                                                            */
/* ------------------------------------------------------------------ */

export const componentTrees: ComponentTree[] = [
  customerTree,
  addSubscriptionTree,
  reviewConfirmTree,
  changeSubscriptionTree,
  cancelSubscriptionTree,
  undoTree,
  agentTree,
];

export const componentTreeMap: Record<string, ComponentTree> = Object.fromEntries(
  componentTrees.map((t) => [t.id, t]),
);

export const componentTreeSidebarItems = [
  ...componentTrees.map((t) => ({ id: t.id, label: t.label })),
  { id: "ct-shared", label: "Shared components" },
];
