// Billing Kickout / Contingency Management — status explainer.
//
// Source of truth: docs/kickout-implemntation.md (the April 14, 2026 status
// review) plus a walk of the real repos:
//   - node-mono-real/microfrontends/contingency-management       (React BFF)
//   - node-mono-real/microfrontends/sm-contingency-container      (MFE host)
//   - node-mono-real/backends/contingency-management-api          (Express + DynamoDB)
//   - go-repo-new                                                 (Go billing platform)
//
// This drives the "Kickout Status" tab: a meeting-ready, plain-language
// explainer of what a billing kickout is, what has shipped across the three
// APOART tickets, what remains, the recommended way to finish it, and how to
// talk about it in an interview.
//
// Mermaid authoring: `flowchart TD/LR`, `{...}` = decision. classDef tints:
//   bad = red (blocked / pain), chg = blue (the change), ok = green (success).

export type SectionKind =
  | "overview"
  | "ticket"
  | "architecture"
  | "strategy"
  | "interview";

export type StatusTone = "done" | "partial" | "blocked" | "info";

export interface KickoutDiagram {
  /** Short label shown on the diagram card, e.g. "CMO" or "Edit & Retry flow". */
  label: string;
  /** One-line caption above the diagram. */
  caption: string;
  /** Accent + border tone. */
  tone: "neutral" | "bad" | "good" | "change";
  /** Mermaid `flowchart` source (style block appended automatically). */
  mermaid: string;
}

export interface QA {
  q: string;
  a: string;
}

export interface KickoutSection {
  /** Route/nav id — unique. */
  id: string;
  kind: SectionKind;
  /** Sidebar label. */
  nav: string;
  /** Ticket id when this is a ticket section, e.g. "APOART-1598". */
  ticket?: string;
  /** Detail-pane title. */
  title: string;
  /** Status pill. */
  status?: { label: string; tone: StatusTone };
  /** One-line teaser under the nav label. */
  teaser: string;
  /** Plain-language business explanation (markdown). */
  summary: string;
  /** Technical explanation (markdown). Optional. */
  technical?: string;
  /** Labelled flow diagrams. */
  diagrams?: KickoutDiagram[];
  /** Bullets — what is already built and verified. */
  done?: string[];
  /** Bullets — gaps / outstanding work. */
  gaps?: string[];
  /** Bullets — the next phase / decisions to land. */
  next?: string[];
  /** Interview Q&A (interview section). */
  qa?: QA[];
  /** Reference file paths / links. */
  references?: string[];
  /** Search + chip tags. */
  tags?: string[];
}

/** Shared Mermaid classDef block appended to every diagram for consistent tints. */
const STYLE = `
classDef bad fill:#e85a5a22,stroke:#e85a5a,stroke-width:1.5px,color:#e85a5a;
classDef chg fill:#3a7dd822,stroke:#3a7dd8,stroke-width:1.5px,color:#3a7dd8;
classDef ok fill:#2ea88a22,stroke:#2ea88a,stroke-width:1.5px,color:#2ea88a;`;

const flow = (body: string): string => `${body.trim()}\n${STYLE}`;

export const kickoutSections: KickoutSection[] = [
  // ─────────────────────────────────────────────────────────── OVERVIEW
  {
    id: "overview",
    kind: "overview",
    nav: "Big picture",
    title: "Billing Kickout & Contingency Management — the big picture",
    status: { label: "3 tickets · in flight", tone: "info" },
    teaser: "What a kickout is and why this work exists",
    tags: ["contingency", "billing", "kickout", "PENDINGBILLING"],
    summary: `
**In one sentence:** when a customer's order can't finish billing automatically, it gets *"kicked out"* of the happy path and parked. **Contingency Management** is the internal tool that lets a care agent see those stuck orders and push them through — instead of a customer waiting on a broken order or calling in twice.

**Why the business cares**
- A stuck order = revenue not recognised + a frustrated customer + a manual back-office ticket.
- Before this tool, unsticking an order meant an engineer running scripts or a manual data fix. Slow, risky, not auditable.
- Contingency Management turns that into a **self-service agent action** with an audit trail — faster resolution, fewer escalations, lower operational cost.

**The three pieces of work in this review**
| Ticket | Plain-language goal |
| --- | --- |
| **APOART-1598** | Give agents *Retry* / *Edit & Retry* buttons to unstick a billing kickout. |
| **APOART-1784** | Let agents *undo a pending cancellation* ("Cancel the Cancel"). |
| **APOART-2015** | Let agents *find orders by Subscriber ID or Billing Account Number*, not just Order ID. |

All three follow the same shape: **frontend is largely done; the remaining work is backend contracts + user feedback (toasts) + turning on feature flags.**
`,
    technical: `
**Where a kickout comes from (the platform view — from the Go billing repo)**

The order/billing pipeline is event-driven. When a subscription is submitted, a billing event is published to the Event Hub (topic \`billing/message\`, \`source=submitSubscription\`, \`type=com.billing.create\`). That event lands on an SQS queue and is consumed by the **\`billing-process\`** Lambda, which calls **NM1 / AMSS** (Bell's real billing system) to actually create/charge the subscriber.

If NM1 rejects the request, \`HandleBillingFailure\` does **three things**:
1. **Parks a Pending Transaction** in DynamoDB (\`Context = BillingKickout\`, or \`Nm1Failure\` when NM1 itself errored) — the request is not lost.
2. **Publishes a fallout event** → the **\`fallout-process\`** Lambda calls **Digitek** (SOAP) to auto-create a support work item (\`DigitekKickoutId\`).
3. **Marks the order's line items \`PendingBilling\`** and stamps the \`PendingTxnId\` onto the offering characteristics.

That \`PendingBilling\` status + \`PendingTxnId\` is exactly what the Contingency UI keys off (status shown as \`PENDINGBILLING\`). Common error classes: \`VE034\` (auto-retried in-process), \`BPPE6100\` (**address-missing → the editable/retryable class**), \`BPPE6000\` (generic).

**Kickout "contexts"** — a parked transaction carries a \`Context\` that says *why* it stuck and therefore *how* it can be retried:

| Context | Meaning | How you retry it |
| --- | --- | --- |
| \`Nm1Failure\` | A billing/number-management step failed | **Re-publish** the billing event (endpoint exists ✅) |
| \`BillingMaintenance\` | A billing maintenance kickout | Patch the request; retry path **undefined** ⚠️ |
| \`BillingKickout\` | A billing kickout | Patch the request; retry path **undefined** ⚠️ |
| \`FulfillmentKickout\` | A fulfillment kickout | Full array replacement; retry path **undefined** ⚠️ |

**The three layers involved**
1. **\`sm-contingency-container\`** — the Module-Federation shell that hosts the MFE inside the wider care app.
2. **\`contingency-management\`** — the Next.js micro-frontend (agent UI + Next API "BFF" routes).
3. **\`contingency-management-api\`** — the Express + DynamoDB service that reads/writes Pending Transactions and re-publishes billing events to the Event Hub.
`,
    diagrams: [
      {
        label: "How an order becomes a kickout",
        tone: "bad",
        caption:
          "The happy path fails at billing, so the transaction is parked as PENDINGBILLING.",
        mermaid: flow(`flowchart LR
  A[Order submitted] --> B[Billing event published<br/>type=com.billing.create]
  B --> C{Billing<br/>succeeds?}
  C -->|Yes| D[Order active]:::ok
  C -->|No| E[Parked as<br/>Pending Transaction]:::bad
  E --> F[Offering shows<br/>PENDINGBILLING KO]:::bad
  class D ok`),
      },
      {
        label: "How the platform parks it (Go side)",
        tone: "neutral",
        caption:
          "billing-process fails at NM1 → parks a Pending Transaction, raises a Digitek ticket, marks items PendingBilling.",
        mermaid: flow(`flowchart LR
  B[billing-process Lambda] --> N{NM1 / AMSS<br/>accepts?}
  N -->|Yes| OK[Order active]:::ok
  N -->|No| F[HandleBillingFailure]:::bad
  F --> P[Park Pending Txn<br/>Context: BillingKickout / Nm1Failure]:::bad
  F --> D[Fallout event → Digitek<br/>support work item]:::bad
  F --> S[Mark items PendingBilling<br/>+ stamp PendingTxnId]:::bad
  class OK ok`),
      },
      {
        label: "What Contingency Management adds",
        tone: "good",
        caption:
          "The agent sees the stuck order and resolves it with a button — no engineer, full audit trail.",
        mermaid: flow(`flowchart LR
  F[PENDINGBILLING KO]:::bad --> G[Agent opens<br/>Order Details]
  G --> H[Resolution CTAs:<br/>Retry / Edit & Retry]:::chg
  H --> I[Fix + re-publish<br/>billing event]:::chg
  I --> J[Order clears billing]:::ok
  class J ok`),
      },
    ],
    references: [
      "docs/kickout-implemntation.md",
      "microfrontends/sm-contingency-container (MFE host / module federation)",
      "microfrontends/contingency-management (agent UI + BFF)",
      "backends/contingency-management-api (Express + DynamoDB + Event Hub)",
    ],
  },

  // ─────────────────────────────────────────────────────────── APOART-1598
  {
    id: "apoart-1598",
    kind: "ticket",
    ticket: "APOART-1598",
    nav: "1598 · Address KO Resolution",
    title: "APOART-1598 — Address Kickout Resolution (Retry / Edit & Retry)",
    status: { label: "Partially implemented", tone: "partial" },
    teaser: "Retry & Edit-and-Retry CTAs on Order Details",
    tags: ["APOART-1598", "PENDINGBILLING", "Nm1Failure", "publish", "retry"],
    summary: `
**Goal:** when an offering is stuck in \`PENDINGBILLING\`, show the agent two buttons on the Order Details page — **Retry** (push it through as-is) and **Edit & Retry** (fix the billing address first, then push it through).

**Business value:** most kickouts are caused by a bad or incomplete billing address. Letting the agent correct it and re-submit in one screen removes a whole back-office round-trip.

**Where it stands:** the **Edit & Retry** path is fully built end-to-end (frontend + backend). The **direct Retry** button is a stub — and the reason is genuinely a *product decision*, not just missing code (see gaps).
`,
    technical: `
**Feature flag:** \`enable_resolution_ctas\` — CTAs are invisible until this is on.

**1. Should the buttons even show?** \`shouldShowOfferingActions()\` returns \`true\` only when: flag on **AND** status is \`PENDINGBILLING\` **AND** the offering has a \`PendingTxnId\` characteristic.
\`\`\`ts
// utils/orders/orderDetailsHelpers.ts
if (!enableResolutionCtas) return false;
const isPendingBilling = offeringStatus?.toUpperCase() === 'PENDINGBILLING';
const hasPendingTxnId = offeringCharacteristics?.some(
  (c) => c.name === 'PendingTxnId' && c.value);
return isPendingBilling && !!hasPendingTxnId;
\`\`\`

**2. Edit & Retry — the complete flow** (\`pages/orders/[orderId]/edit-retry/[pendingTxnId].tsx\`):
1. **Load** the parked transaction — \`useGetPendingTransaction(id)\` → \`GET /api/pendingTransactions/getByPendingTxnId\`
2. **Pre-fill** the form — \`mapTransactionToFormData()\` pulls the billing address from \`Request.Session.Subscribers[0].ContactMedia\`
3. **Edit** the address in \`<BillingRequestForm>\`
4. **Submit** → confirmation modal → \`PATCH /api/pendingTransactions/:id\` with \`requestUpdates\`
5. **If \`Context === 'Nm1Failure'\`** → also \`POST /api/pendingTransactions/:id/publish\` (this is the actual re-submit to billing)
6. **Return** — invalidate the \`['orders']\` cache and route back to Order Details

**Backend (\`contingency-management-api\`):**
- \`PATCH /pendingTransactions/:id\` → \`patchPendingTransactionRequest()\` — **context-aware**: \`BillingMaintenance\`/\`BillingKickout\`/\`Nm1Failure\` deep-merge the request; \`FulfillmentKickout\` does a full array replacement.
- \`POST /pendingTransactions/:id/publish\` → validates \`Context === 'Nm1Failure'\`, then \`eventHub.publishBillingEvent()\` re-sends \`PendingTransaction.Request\` to \`billing/message?source=submitSubscription&type=com.billing.create\`. Returns \`200\` **even if publish fails** (navigation must not block).
- Data access is DynamoDB: \`queryByPendingTxnId\`, \`queryByOrderId\` (GSI), \`scanBySubscriberId\`.
`,
    diagrams: [
      {
        label: "Edit & Retry (built ✅)",
        tone: "good",
        caption:
          "Load → pre-fill → edit → PATCH → (Nm1Failure) publish → back to Order Details.",
        mermaid: flow(`flowchart TD
  A[Agent clicks<br/>Edit & Retry]:::chg --> B[Load pending txn<br/>GET getByPendingTxnId]
  B --> C[Pre-fill billing form<br/>mapTransactionToFormData]
  C --> D[Agent edits address]
  D --> E[Confirm modal]
  E --> F[PATCH /pendingTransactions/:id]:::chg
  F --> G{Context ==<br/>Nm1Failure?}
  G -->|Yes| H[POST /publish<br/>re-send billing event]:::chg
  G -->|No| I[Skip publish]
  H --> J[Invalidate cache<br/>back to details]:::ok
  I --> J
  class J ok`),
      },
      {
        label: "Direct Retry (stub ❌)",
        tone: "bad",
        caption:
          "The button exists but only console.logs — the retry mechanism per context is the open decision.",
        mermaid: flow(`flowchart TD
  A[Agent clicks<br/>Retry]:::bad --> B[handleOfferingRetry]
  B --> C["console.log('retry')<br/>TODO — no API call"]:::bad
  C -.-> D{What should it do?}
  D -->|Nm1Failure| E[Call POST /publish<br/>backend already supports ✅]:::chg
  D -->|Billing/Fulfillment KO| F[No publish endpoint —<br/>mechanism undefined ⚠️]:::bad`),
      },
    ],
    done: [
      "CTA visibility gate — `shouldShowOfferingActions()` (flag + PENDINGBILLING + PendingTxnId).",
      "Order Details renders the ActionCard with Retry + Edit & Retry buttons.",
      "Edit & Retry page: load, pre-fill, edit, PATCH, conditional publish, cache invalidation, navigate back.",
      "Address mapper handles both object (`BillingMaintenance`) and array (`BillingKickout`) ContactMedia shapes.",
      "Backend: GET-by-id, context-aware PATCH, and the Nm1Failure /publish → Event Hub path.",
      "Zod validation on all query params and the PATCH body.",
    ],
    gaps: [
      "**Direct Retry is a stub** — `handleOfferingRetry()` only `console.log('retry')`.",
      "For `Nm1Failure` the retry is simply `POST /publish` (no edit) — but that's a product call.",
      "For `BillingMaintenance` / `BillingKickout` / `FulfillmentKickout` there is **no publish endpoint** — the retry mechanism is genuinely undefined.",
      "No success/error toast after Edit & Retry — the agent is silently redirected.",
      "**Agent identity not captured** — `updatedBy` is hardcoded to `'system'` on Edit & Retry (the logged-in email is available but unused).",
      "**No audit-trail write** — the Postgres schema *has* `EDIT_AND_RETRY` / `CANCEL_PENDING_ORDER` action codes, but only bulk-order import actually writes an audit row. Agent edits are not audited to Postgres today.",
      "**FulfillmentKickout not reachable from the UI** — the backend PATCH supports the array-replace path, but the Next proxy only forwards `requestUpdates`, so it can't be driven.",
      "Edit form is **address-only** — no other billing fields are editable.",
      "`enable_resolution_ctas` not yet graduated in production.",
    ],
    next: [
      "Decide Retry scope per context: wire `Nm1Failure` → `/publish`; define a mechanism (or descope) for the other three contexts.",
      "Add success/failure toasts (pick the shared notification standard).",
      "Confirm the flag graduation timeline + QA sign-off.",
    ],
    references: [
      "utils/orders/orderDetailsHelpers.ts — shouldShowOfferingActions()",
      "pages/orders/details/[id].tsx — handleOfferingRetry (stub), handleOfferingEditAndRetry",
      "pages/orders/[orderId]/edit-retry/[pendingTxnId].tsx — EditRetryPage",
      "hooks/usePendingTransaction.ts — get / update / publish",
      "backends/.../services/pendingTransaction.services.ts — patchPendingTransactionRequest()",
      "backends/.../services/eventHub.service.ts — publishBillingEvent()",
    ],
  },

  // ─────────────────────────────────────────────────────────── APOART-1784
  {
    id: "apoart-1784",
    kind: "ticket",
    ticket: "APOART-1784",
    nav: "1784 · Cancel the Cancel",
    title: "APOART-1784 — Cancel the Cancel (undo a pending cancellation)",
    status: { label: "Mostly done · toast/error gap", tone: "partial" },
    teaser: "Reverse a pending cancellation before it completes",
    tags: ["APOART-1784", "ACTIVETERMINATING", "cancel", "ordering-api"],
    summary: `
**Goal:** a customer changed their mind. Their offering is mid-cancellation (\`ACTIVETERMINATING\`) but not yet gone. **Cancel the Cancel** lets the agent reverse it in one click, so the customer keeps their service and no re-order is needed.

**Business value:** saves the customer (retention) and avoids a full re-provisioning cycle. Directly reduces churn from accidental or regretted cancellations.

**Where it stands:** the full flow works — eligibility check, confirm modal, API call, refetch. The only real gaps are **user feedback**: success and error are \`console.log\`'d instead of shown as a toast.
`,
    technical: `
**Feature flag:** \`cancel_the_cancel\` · **Access gate:** requires read/write access (\`hasRWAccess\` from \`usePermission()\`).

**Eligibility** — \`shouldEnableCancelPendingOrder(offering)\`:
\`\`\`ts
const isActiveTerminating = offering.state === 'ACTIVETERMINATING';
const isVas = isVasOffering(offering); // value-added service riding on a parent
return isActiveTerminating && !isVas;   // VAS add-ons are excluded
\`\`\`
Button shows only when: **flag on AND RW access AND eligible**.

**Flow** (\`pages/subscribers/details/[id].tsx\`):
1. Click → \`setSelectedOffering()\`, open \`<ConfirmationModal>\`
2. Confirm → \`handleConfirmCancelTheCancel()\` → \`POST /api/orders/cancelPendingOrder\` with \`{ billingAccountNumber, productOfferingId, subscriberId }\`
3. Success → set message, \`refetch()\` the subscription
4. **Gap:** \`console.log(message)\` with a TODO — should be a toast
5. Close → clear selection, close modal

**Backend is different here — it does NOT go through \`contingency-management-api\`.** The Next API route \`pages/api/orders/cancelPendingOrder.ts\` validates the three fields and proxies straight to the external **Ordering API**: \`POST {NEXT_PUBLIC_ORDERING_API}/ordering/undo\`. Returns \`200 { cancelledOrder }\` or \`502\` on upstream failure. The \`contingency-management-api\` only holds the \`CANCEL_PENDING_ORDER\` audit action code + seed data — the cancel itself is owned by Ordering.
`,
    diagrams: [
      {
        label: "Cancel the Cancel flow",
        tone: "good",
        caption:
          "Eligible offering → confirm → proxy to Ordering API /undo → refetch. Toast is the missing bit.",
        mermaid: flow(`flowchart TD
  A[Offering<br/>ACTIVETERMINATING]:::bad --> B{Eligible?<br/>flag + RW + not VAS}
  B -->|No| X[No button]
  B -->|Yes| C[Show Cancel the Cancel]:::chg
  C --> D[Confirm modal]
  D --> E[POST /api/orders/cancelPendingOrder]:::chg
  E --> F[Proxy → Ordering API<br/>POST /ordering/undo]:::chg
  F --> G[Refetch subscription]:::ok
  G --> H[console.log message<br/>TODO: toast]:::bad
  class G ok`),
      },
    ],
    done: [
      "Eligibility: `shouldEnableCancelPendingOrder()` (ACTIVETERMINATING and not a VAS add-on).",
      "Access gate on RW permission + `cancel_the_cancel` flag.",
      "Confirm modal → POST to the Next BFF route → proxy to Ordering API `/ordering/undo`.",
      "Success refetches the subscription so the UI reflects the reversal.",
      "Audit action code `CANCEL_PENDING_ORDER` + seeds present in the API's Drizzle schema.",
    ],
    gaps: [
      "**No success toast** — the confirmation message is only `console.log`'d (explicit TODO).",
      "**No error feedback** — the catch block `console.error`s and silently closes the modal.",
      "`cancel_the_cancel` not yet graduated in production.",
    ],
    next: [
      "Implement success + failure toasts (same shared standard as 1598).",
      "Decide error UX: inline modal error vs. toast.",
      "Confirm flag graduation timeline.",
    ],
    references: [
      "utils/helperFunctions.ts — shouldEnableCancelPendingOrder()",
      "pages/subscribers/details/[id].tsx — handleConfirmCancelTheCancel()",
      "pages/api/orders/cancelPendingOrder.ts — proxy to Ordering API /ordering/undo",
      "backends/.../drizzle/schema.ts — CANCEL_PENDING_ORDER audit code",
    ],
  },

  // ─────────────────────────────────────────────────────────── APOART-2015
  {
    id: "apoart-2015",
    kind: "ticket",
    ticket: "APOART-2015",
    nav: "2015 · Search by SubId / BAN",
    title: "APOART-2015 — Search by Subscriber ID / Billing Account Number",
    status: { label: "Frontend done · backend blocked", tone: "blocked" },
    teaser: "Find orders by SubId/BAN — mock data until HHOREO-5113",
    tags: ["APOART-2015", "search", "mock-data", "HHOREO-5113"],
    summary: `
**Goal:** today an agent can only find an order if they know the **Order ID**. This adds search by **Subscriber ID (SubId)** and **Billing Account Number (BAN)** — the identifiers an agent actually has when a customer calls in.

**Business value:** far fewer "I can't find your order" dead-ends. The agent searches with what the customer knows (their account or subscriber number), which speeds up every contingency task that starts with "find the order".

**Where it stands:** the entire frontend is done and demoable — **but it's running on mock data.** The real backend endpoint (ticket **HHOREO-5113**) doesn't exist yet, so this is **blocked on a backend dependency**, not on our UI.
`,
    technical: `
**Feature flag:** \`enhanced_order_search\` · **Backend dependency:** \`HHOREO-5113\` (not stable in prod).

**Frontend (done):**
- \`OrdersSearch.tsx\` — always shows the Order ID field; conditionally spreads \`subscriberId\` + \`billingAccountNumber\` fields when the flag is on.
- \`pages/orders/index.tsx\` — reads the flag, requires at least one field, persists all three across navigation (session storage).
- \`orderSearchUtils.ts\` — \`buildOrderSearchParams()\`, \`hasValidSearchParams()\`, \`extractSearchParamsFromQuery()\`.
- \`useGetOrderById\` — \`GET /api/orders/search?{params}\` and maps each order to table rows (extracts \`subscriberId\`, \`ban\`).

**The mock seam** (\`pages/api/orders/search.ts\`):
\`\`\`ts
const isEnhancedSearchEnabled = await isFeatureEnabled('enhanced_order_search');
const isSearchingByEnhancedFields = !!(subscriberId || billingAccountNumber);
const USE_MOCK_DATA = isEnhancedSearchEnabled && isSearchingByEnhancedFields;
if (USE_MOCK_DATA) {
  // TODO: remove once HHOREO-5113 backend is stable
  return res.status(200).json({ orders: generateMockOrders(searchParams) });
}
// real path — only reached when searching by Order ID
const requestUrl = \`\${env.NEXT_PUBLIC_GET_ORDER_API}/api/orders?\${queryParams}\`;
\`\`\`

**⚠️ Nuance worth raising in the meeting — the backend may be further along than the status doc says.** The status doc states the orders backend is "id-only." A walk of the *actual* \`contingency-management-api\` found the orders controller validating \`id\` / \`ban\` / \`subscriberId\` and the service already exposing \`scanOrdersByBAN()\` and \`scanOrdersBySubscriberId()\` (paginated DynamoDB scans). So a real SubId/BAN path **may already exist** in our service — the open question is whether HHOREO-5113 is meant to *replace* that with a proper endpoint/GSI (scans are expensive at scale), or whether the mock can be retired against the existing scans sooner. **Verify this before the meeting** — it changes the "blocked" framing.

The MFE's own \`search.ts\` still routes SubId/BAN to \`generateMockOrders()\` regardless, so from the user's perspective it's mock today — but the plumbing to switch to a real scan may be a shorter hop than assumed.
`,
    diagrams: [
      {
        label: "Search routing today",
        tone: "change",
        caption:
          "SubId/BAN searches hit generateMockOrders(); only Order ID reaches a real API.",
        mermaid: flow(`flowchart TD
  A[Agent searches] --> B{Which field?}
  B -->|Order ID| C[Real API<br/>GET_ORDER_API/api/orders]:::ok
  B -->|SubId / BAN| D{flag on AND<br/>enhanced field?}
  D -->|Yes| E[generateMockOrders<br/>synthetic data]:::bad
  D -->|No| C
  E -.->|HHOREO-5113 ships| F[Real SubId/BAN<br/>endpoint + GSI]:::chg
  class C ok`),
      },
    ],
    done: [
      "Search UI conditionally adds SubId + BAN fields behind the flag.",
      "Orders page orchestration: flag read, empty-guard, session-storage persistence of all three fields.",
      "Search utils: build params, validate, parse query — SubId/BAN only when flag on.",
      "Data hook maps orders to table rows including subscriberId + ban.",
      "End-to-end demoable flow via `generateMockOrders()`.",
    ],
    gaps: [
      "**MFE serves synthetic data** — `search.ts` routes SubId/BAN to `generateMockOrders()`.",
      "`generateMockOrders()` + the `USE_MOCK_DATA` branch must be removed once the real path is confirmed.",
      "**Framing to verify:** our `contingency-management-api` already has `scanOrdersByBAN()` / `scanOrdersBySubscriberId()` — so the 'no backend' claim may be stale. Confirm whether HHOREO-5113 replaces these with a proper endpoint/GSI.",
      "Scans are expensive at scale — a GSI (or the HHOREO-5113 endpoint) is the durable answer, not a table scan.",
    ],
    next: [
      "**Verify the real state first:** does HHOREO-5113 supersede the existing `scanOrdersBy*` functions, or can the mock retire against them now?",
      "Get HHOREO-5113 status + target date if it's still the intended source.",
      "Confirm the endpoint contract: URL, query params, pagination.",
      "Plan cleanup: delete the mock branch; decide GSI vs scan for the durable access pattern.",
      "Decide ownership: SubId/BAN lookup in the Ordering API or in contingency-management-api?",
    ],
    references: [
      "components/Orders/OrdersSearch.tsx",
      "pages/orders/index.tsx",
      "utils/orders/orderSearchUtils.ts",
      "pages/api/orders/search.ts — USE_MOCK_DATA + generateMockOrders()",
      "backends/.../controllers/orders.controller.ts — id-only QuerySchema",
    ],
  },

  // ─────────────────────────────────────────────────────────── ARCHITECTURE
  {
    id: "architecture",
    kind: "architecture",
    nav: "How it fits together",
    title: "System architecture — three layers, one kickout",
    status: { label: "Reference", tone: "info" },
    teaser: "Container → MFE → API → Event Hub → billing",
    tags: ["architecture", "module-federation", "dynamodb", "event-hub"],
    summary: `
The whole feature is a thin slice through a **micro-frontend + BFF + service** stack. Understanding the layering is the fastest way to reason about where any given gap lives.

- **Care app → \`sm-contingency-container\`** — the Module-Federation *host*. It embeds the contingency MFE inside the broader agent workspace so agents never leave their main tool.
- **\`contingency-management\` (Next.js MFE)** — the agent UI **and** a set of Next API routes acting as a **BFF** (backend-for-frontend). Some routes call the internal API, some proxy straight to external systems (e.g. the Ordering API for Cancel the Cancel).
- **\`contingency-management-api\` (Express + DynamoDB)** — reads/writes Pending Transactions and Orders, and **re-publishes billing events** to the Event Hub for the \`Nm1Failure\` retry.
- **Event Hub / billing platform (Go)** — the downstream that originally emitted the kickout and that a re-published event re-enters.
`,
    technical: `
**Two different backend paths — a key nuance for the meeting:**
1. **Kickout retry (1598)** → MFE → **\`contingency-management-api\`** → Event Hub → billing. *Owned by our team.*
2. **Cancel the Cancel (1784)** → MFE BFF route → **external Ordering API** \`/ordering/undo\`. *Owned by Ordering.*

That's why 1784's "backend" looks done even though our own service barely touches it — the cancel is somebody else's endpoint; we only proxy and audit.

**Data stores (DynamoDB):**
- *PendingTransactions* table — keyed on \`PendingTxnId\`; GSI on \`OrderId\`; scan on \`SubscriberId\`.
- *Orders* table — keyed on \`Id\` only (the missing SubId/BAN access pattern is exactly APOART-2015's backend gap).

**The retry re-entry:** \`POST /publish\` forwards \`PendingTransaction.Request\` to \`billing/message?source=submitSubscription&type=com.billing.create\` — i.e. it replays the *same* billing event that originally kicked out, so the platform reprocesses it as if freshly submitted.

**The platform side (Go repo) — where kickouts are born and retried**
- **\`billing-process\` Lambda** consumes the billing SQS queue → calls **NM1/AMSS**. On failure → \`HandleBillingFailure\` parks the Pending Txn, raises a fallout event, marks items \`PendingBilling\`.
- **\`fallout-process\` Lambda** consumes fallout events → calls **Digitek** (SOAP) to create the support/contingency work item.
- **\`billing-retry\` Lambda** (EventBridge schedule) auto-retries **only** \`BillingMaintenance\` parks (the NM1 maintenance-window case) — it re-publishes with \`type=com.billing.update\`. **True kickouts (\`BillingKickout\` / \`Nm1Failure\`) are *not* auto-retried** — they go to Digitek and are re-driven manually. *That manual re-drive is exactly what our Contingency UI provides.*
- The "editable" class is env-driven: \`EDIT_AND_RETRY_BILLING_KO\` lists the NM1 error codes (e.g. address-missing → \`BPPE6100\`) that are correctable and re-submittable — the natural target of Edit & Retry.
`,
    diagrams: [
      {
        label: "End-to-end architecture",
        tone: "neutral",
        caption:
          "One diagram to orient the meeting — note the two distinct backend paths.",
        mermaid: flow(`flowchart TD
  U[Care agent] --> H[sm-contingency-container<br/>Module Federation host]
  H --> M[contingency-management<br/>Next.js MFE + BFF]
  M -->|Kickout retry 1598| API[contingency-management-api<br/>Express + DynamoDB]:::chg
  M -->|Cancel the Cancel 1784| ORD[External Ordering API<br/>/ordering/undo]:::chg
  M -->|Search 2015| MOCK[Mock data<br/>scanOrdersBy* exists?]:::bad
  API --> DDB[(DynamoDB<br/>PendingTxns / Orders)]
  API -->|publish| EH[Event Hub<br/>billing/message]:::chg
  EH --> BP[billing-process Lambda<br/>calls NM1/AMSS]
  BP -->|fails| FAIL[HandleBillingFailure<br/>park + fallout + PendingBilling]:::bad
  FAIL --> FP[fallout-process → Digitek<br/>support ticket]:::bad
  BP -->|succeeds| DONE[Order active]:::ok
  class DONE ok`),
      },
    ],
    references: [
      "microfrontends/sm-contingency-container",
      "microfrontends/contingency-management/src/pages/api/*",
      "backends/contingency-management-api/src/{routes,controllers,services}",
      "go-repo-new (billing/event platform)",
    ],
  },

  // ─────────────────────────────────────────────────────────── STRATEGY
  {
    id: "best-way",
    kind: "strategy",
    nav: "Best way to finish it",
    title: "Recommended approach to finish the kickout implementation",
    status: { label: "Recommendation", tone: "info" },
    teaser: "Sequenced plan + the one design decision that unlocks it",
    tags: ["strategy", "recommendation", "retry", "toast"],
    summary: `
The three tickets share the same two blockers: **(1) an undefined backend retry contract** and **(2) missing user feedback (toasts).** Solve those two things once, generically, and all three finish quickly.

**The single most important decision:** define a **uniform "retry a kickout" contract** keyed on \`Context\`, instead of special-casing \`Nm1Failure\`. Right now only \`Nm1Failure\` has a re-publish path; the other three contexts are undefined. A context→action map turns "the real unknown" into a small, testable table.
`,
    technical: `
**Recommended sequencing (highest leverage first):**

**1. Generalise "retry" into a context-strategy map (unblocks 1598 Direct Retry).**
\`\`\`ts
// one place decides how each kickout context retries
const RETRY_STRATEGY: Record<Context, RetryAction> = {
  Nm1Failure:        { kind: 'publish' },              // exists today ✅
  BillingKickout:    { kind: 'publish' },              // extend /publish to allow it
  BillingMaintenance:{ kind: 'patch-then-publish' },   // or a new re-submit endpoint
  FulfillmentKickout:{ kind: 'resubmit-fulfillment' }, // Ordering-owned? confirm
};
\`\`\`
- Widen the \`/publish\` guard from "\`Nm1Failure\` only" to "any context whose strategy is \`publish\`".
- For contexts with no publish path, get the owning team (Ordering / Fulfillment) to confirm the endpoint — this is the real cross-team ask, so raise it first.
- \`handleOfferingRetry()\` then just looks up the strategy and calls it — no more stub.

**2. Ship one shared toast utility (unblocks 1598 + 1784 feedback).**
- Pick the notification standard once (e.g. \`sonner\`), wrap it in a \`useActionToast()\` helper with \`success\`/\`error\` variants, and drop it into Edit & Retry, Direct Retry, and Cancel the Cancel. Three TODOs close with one component.

**3. Make the mock seam a clean swap (de-risks 2015).**
- Keep \`generateMockOrders()\` behind a single \`USE_MOCK_DATA\` flag (already the case) so the day HHOREO-5113 ships, cleanup is deleting one branch + widening the Zod schema + adding the GSI. Add a contract test now against the *expected* response shape so the swap is verified, not hoped.

**4. Close the audit + identity gap (small, high-value, compliance-relevant).**
- The Postgres schema already defines \`EDIT_AND_RETRY\` and \`CANCEL_PENDING_ORDER\` action codes but only bulk-import writes an audit row. Wire the same audit writer into the PATCH / publish / cancel paths.
- Stop hardcoding \`updatedBy: 'system'\` — pass the logged-in agent's identity through so "who retried this" is answerable. Cheap fix, real operational value.

**5. Treat flags as a graduation checklist, not a launch switch.**
- \`enable_resolution_ctas\`, \`cancel_the_cancel\`, \`enhanced_order_search\` should each have explicit acceptance criteria + QA sign-off before graduating. \`enhanced_order_search\` in particular must **not** graduate until real data replaces the mock.

**Guiding principles**
- *Don't block the agent:* the \`/publish\` endpoint already returns 200 even on failure so navigation continues — mirror that "resilient UX" everywhere, but surface the outcome via toast.
- *One decision, many unblocks:* the context→strategy map is the keystone; everything else is mechanical.
- *Verify the swap, don't trust it:* a contract test against HHOREO-5113's shape converts a risky future cleanup into a safe one.
`,
    diagrams: [
      {
        label: "The keystone: context → retry strategy",
        tone: "change",
        caption:
          "Replace the Nm1Failure special-case with a table that covers every kickout context.",
        mermaid: flow(`flowchart TD
  R[Retry clicked] --> S[Look up Context<br/>in RETRY_STRATEGY]:::chg
  S --> A{strategy.kind}
  A -->|publish| P[POST /publish]:::ok
  A -->|patch-then-publish| Q[PATCH then POST /publish]:::ok
  A -->|resubmit-fulfillment| T[Ordering-owned<br/>re-submit — confirm owner]:::bad
  class P,Q ok`),
      },
    ],
    next: [
      "Get sign-off on the context→retry strategy map (this is the one cross-team decision).",
      "Build the shared toast helper and retrofit all three features.",
      "Wire audit-trail writes + real agent identity into edit/retry/cancel (schema already supports it).",
      "Verify whether `scanOrdersBy*` already unblocks 2015, or HHOREO-5113 is still required.",
      "Add a contract test against the real orders response shape.",
      "Attach acceptance criteria + QA gate to each of the three flags.",
    ],
    references: [
      "Keystone: a Context→RetryAction map replacing the Nm1Failure special-case",
      "Shared: useActionToast() over the sonner standard",
      "Safety: contract test for the HHOREO-5113 swap",
    ],
  },

  // ─────────────────────────────────────────────────────────── INTERVIEW
  {
    id: "interview",
    kind: "interview",
    nav: "Use it in interviews",
    title: "How to talk about this in an interview",
    status: { label: "Prep", tone: "info" },
    teaser: "STAR stories, talking points & likely questions",
    tags: ["interview", "STAR", "system-design", "talking-points"],
    summary: `
This work is a **goldmine of interview material** because it touches: micro-frontends, BFF pattern, event-driven billing, feature flags, resilient UX, cross-team API contracts, and pragmatic "ship behind a flag with mock data" delivery. Below are ready-to-use STAR stories and the questions they set you up to answer.

**One-line elevator pitch:** *"I worked on Contingency Management — an internal tool that lets care agents unstick billing 'kickouts' themselves instead of escalating to engineers. It's a Next.js micro-frontend over an Express/DynamoDB service that re-publishes billing events to an event hub."*
`,
    technical: `
**Three STAR stories you can tell (each maps to a ticket):**

**① "Turning a manual back-office fix into self-service" (APOART-1598)**
- **S/T:** Billing kickouts (\`PENDINGBILLING\`) had to be fixed by engineers running scripts — slow, risky, no audit trail.
- **A:** Built resolution CTAs behind a feature flag; an *Edit & Retry* flow that pre-fills the parked transaction, lets the agent fix the billing address, PATCHes it, and re-publishes the billing event to the event hub. Gated visibility on flag + state + a pending-txn id so buttons only appear when actionable.
- **R:** Agents resolve kickouts in one screen with a full audit trail; engineers off the critical path.

**② "Designing for an undefined backend" (APOART-2015)**
- **S/T:** Product wanted SubId/BAN search but the backend endpoint (another team's ticket) didn't exist yet.
- **A:** Built the full UI + BFF behind a flag, with a single \`USE_MOCK_DATA\` seam serving synthetic data so the flow was demoable and testable end-to-end — with the real path a one-branch swap once the endpoint ships.
- **R:** Unblocked frontend delivery + stakeholder demos without waiting on another team; clean, low-risk cutover planned.

**③ "Resilient UX around a flaky downstream" (APOART-1598 publish)**
- **S/T:** The billing re-publish can fail, but we must never trap the agent on a dead screen.
- **A:** Made \`/publish\` return 200 even on publish failure so navigation always continues, and separated "did the action submit" from "did billing succeed" — surfaced via notification rather than a blocking error.
- **R:** No dead-ends for agents; failures are visible but non-blocking.

**Concepts to name-drop (and be able to explain):**
- **Micro-frontend + Module Federation** — why embed vs iframe; independent deploy.
- **BFF pattern** — the Next API routes; some call our service, some proxy external (Ordering API) — and *why you'd choose each*.
- **Event-driven billing / idempotent retry** — re-publishing the same event; why the consumer must be idempotent.
- **Feature flags as a delivery strategy** — decouple deploy from release; graduate with acceptance criteria.
- **DynamoDB access patterns** — partition key vs GSI vs scan; why "search by SubId" needs a *new* access pattern, not just a query param (great single-table-design talking point).
`,
    qa: [
      {
        q: "What happens when a customer's order gets 'stuck'?",
        a: "It fails the automated billing step and gets parked as a Pending Transaction with status PENDINGBILLING — a 'kickout'. It carries a Context saying why it stuck, which determines how it can be retried. An agent then resolves it via Contingency Management.",
      },
      {
        q: "Why a micro-frontend instead of a page in the main app?",
        a: "Independent deployability and team ownership. The care app hosts it via Module Federation (sm-contingency-container) so we ship on our own cadence without redeploying the whole workspace, and the agent never context-switches out of their main tool.",
      },
      {
        q: "How do you retry a failed billing event safely?",
        a: "Re-publish the original PendingTransaction.Request to the billing topic (com.billing.create), so the platform reprocesses it. That requires the consumer to be idempotent, and we return success on the API even if the publish fails so the agent isn't blocked — the outcome is surfaced as a notification.",
      },
      {
        q: "You needed a backend that didn't exist yet. What did you do?",
        a: "Built the whole UI + BFF behind a feature flag with a single mock-data seam, so the flow was demoable and the real endpoint is a one-branch swap plus a schema widening and a new DynamoDB access pattern. I'd add a contract test against the expected shape so the cutover is verified.",
      },
      {
        q: "Why can't you just add ?subscriberId= to the existing orders query?",
        a: "The Orders table is keyed on Id only — querying by SubscriberId needs a new access pattern (a GSI or a scan), not just a new query param. That's the real backend work behind APOART-2015 and a good example of DynamoDB single-table design constraints.",
      },
      {
        q: "How do you decide what goes in the BFF vs the service?",
        a: "Orchestration, request-shaping, and calls that are purely frontend concerns live in the Next BFF (e.g. proxying Cancel-the-Cancel to the Ordering API). Durable domain logic, data access, and event publishing live in the Express service. Cancel-the-Cancel is a nice example — it's owned by another team's API, so we only proxy + audit it.",
      },
    ],
    references: [
      "Elevator pitch — memorise the one-liner",
      "3 STAR stories — one per ticket",
      "Concepts: MFE/Module Federation, BFF, event-driven idempotent retry, feature flags, DynamoDB access patterns",
    ],
  },
];

/** Serialise a section to Markdown — used for the copy button + AI chat grounding. */
export function sectionToMarkdown(s: KickoutSection): string {
  const lines: string[] = [];
  lines.push(`# ${s.title}`);
  if (s.ticket) lines.push(`**Ticket:** ${s.ticket}`);
  if (s.status) lines.push(`**Status:** ${s.status.label}`);
  lines.push("");
  lines.push("## Business summary");
  lines.push(s.summary.trim());
  if (s.technical) {
    lines.push("");
    lines.push("## Technical detail");
    lines.push(s.technical.trim());
  }
  if (s.diagrams?.length) {
    lines.push("");
    lines.push("## Flows");
    for (const d of s.diagrams) {
      lines.push(`### ${d.label}`);
      lines.push(d.caption);
      lines.push("```mermaid");
      lines.push(d.mermaid);
      lines.push("```");
    }
  }
  const list = (title: string, items?: string[]) => {
    if (!items?.length) return;
    lines.push("");
    lines.push(`## ${title}`);
    for (const i of items) lines.push(`- ${i}`);
  };
  list("Done", s.done);
  list("Gaps", s.gaps);
  list("Next phase", s.next);
  if (s.qa?.length) {
    lines.push("");
    lines.push("## Likely questions");
    for (const qa of s.qa) {
      lines.push(`**Q: ${qa.q}**`);
      lines.push(qa.a);
      lines.push("");
    }
  }
  if (s.references?.length) {
    lines.push("");
    lines.push("## References");
    for (const r of s.references) lines.push(`- ${r}`);
  }
  return lines.join("\n");
}

/** Full-tab markdown — for "copy everything" / whole-deck AI grounding. */
export function allSectionsToMarkdown(): string {
  return kickoutSections.map(sectionToMarkdown).join("\n\n---\n\n");
}
