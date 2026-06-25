// APOART story catalog — plain-language explanations + current/future flow
// diagrams for the PI2 stories. Source: docs/PI2.md.
//
// CMO = Current Mode of Operation (as-is / today's flow, incl. the pain point)
// FMO = Future Mode of Operation (to-be / fixed flow, change steps highlighted)
//
// Mermaid authoring conventions used below:
//   - `flowchart TD` (or LR for short chains), `{...}` = decision nodes.
//   - classDef `bad`  -> tints blocked/pain nodes red (CMO).
//   - classDef `chg`  -> tints the [CHANGE] nodes blue (FMO).
//   - classDef `ok`   -> tints success/outcome nodes green.
// Mermaid theme variables are synced to the app theme by MermaidDiagram.tsx;
// the fixed hex tints below keep the bad/chg/ok semantics readable in both.

export type ApoartCategory =
  | "VAS APR"
  | "PROMO ENHANCE"
  | "ANNIVERSARY"
  | "TECH DEBT"
  | "MSP"
  | "Exploration"
  | "Contingency";

export interface FlowDiagram {
  /** One- or two-line plain-language caption shown above the diagram. */
  caption: string;
  /** A Mermaid `flowchart` source string. */
  mermaid: string;
}

export interface ApoartStory {
  /** Full ticket id, e.g. "APOART-2515". */
  id: string;
  /** Bare ticket number, e.g. "2515". */
  ticket: string;
  category: ApoartCategory;
  /** Short human-readable title. */
  title: string;
  /** Plain-language business explanation (markdown). */
  summary: string;
  /** Plain-language technical explanation (markdown). */
  technical: string;
  /** Current Mode of Operation — as-is / today's flow. */
  cmo: FlowDiagram;
  /** Future Mode of Operation — to-be / fixed flow. */
  fmo: FlowDiagram;
  /** Condensed implementation / change guide (markdown). */
  implementation: string;
  acceptanceCriteria?: string[];
  risks?: string[];
  references?: string[];
  /** Service / component names, used for search + filter chips. */
  tags?: string[];
}

/** Shared Mermaid classDef block appended to every diagram for consistent tints. */
const STYLE = `
classDef bad fill:#e85a5a22,stroke:#e85a5a,stroke-width:1.5px,color:#e85a5a;
classDef chg fill:#3a7dd822,stroke:#3a7dd8,stroke-width:1.5px,color:#3a7dd8;
classDef ok fill:#2ea88a22,stroke:#2ea88a,stroke-width:1.5px,color:#2ea88a;`;

/** Appends the shared style block to a flowchart body. */
function flow(body: string): string {
  return `${body.trim()}\n${STYLE}`;
}

export const apoartStories: ApoartStory[] = [
  // ───────────────────────────────────────────────────────── APOART-2199
  {
    id: "APOART-2199",
    ticket: "2199",
    category: "VAS APR",
    title: "Change Netflix VAS during pending activity",
    summary:
      "When a customer has a pending future-dated cancellation or downgrade, the system blocks **all** Netflix Portal VAS requests (Add/Delete/Swap) — so customers can't self-serve their Netflix add-on while a plan change is pending, and requests are silently dropped.\n\nThis change accepts and correctly processes those VAS requests. The outcome is driven by whether **Netflix Basic** will still exist after the Anniversary Batch runs.",
    technical:
      "The `changePlan` Order API has a hard *Decline* guard that rejects VAS changes whenever a future-dated activity exists. That guard is relaxed to inspect the pending activity type, check post-anniversary Netflix Basic presence, and route to a **retain** vs **cancel-at-anniversary** path.\n\nWhen Netflix Basic won't survive, a **Cancel-the-Cancel** compensating order keeps VAS active until the anniversary; the Billing Process and Anniversary Batch then honor the future-dated flags.",
    cmo: {
      caption:
        "Today the blanket *Decline* rule rejects the VAS change the moment any future-dated activity is detected, so the request is silently dropped.",
      mermaid: flow(`
flowchart TD
  P["Netflix Portal"] -->|"Add / Delete / Swap VAS"| O["Order API: changePlan"]
  O --> C{"profile.hasFutureDatedActivity()?"}
  C -->|"No"| OK["Process normally"]:::ok
  C -->|"Yes"| D["Hard 'Decline' rule rejects the change"]:::bad
  D --> X["Request silently dropped — customer cannot self-serve VAS"]:::bad
`),
    },
    fmo: {
      caption:
        "The Decline rule is relaxed into a future-date-aware path; the Decision Engine retains VAS, or applies it now and emits a Cancel-the-Cancel order to keep it until the anniversary.",
      mermaid: flow(`
flowchart TD
  P["Netflix Portal"] -->|"Add / Delete / Swap VAS"| O["Order API: changePlan"]
  O --> R["[CHANGE] relax Decline → processWithFutureDateAwareness()"]:::chg
  R --> L["Profile Lookup: pending activity type + post-anniversary Netflix Basic?"]
  L --> Q{"Netflix Basic remains after anniversary?"}
  Q -->|"Yes"| K["Apply VAS change; mark for retention"]:::ok
  Q -->|"No"| CC["[CHANGE] apply VAS now + emit Cancel-the-Cancel order"]:::chg
  K --> B["[CHANGE] Billing respects future-dated flags"]:::chg
  CC --> B
  B --> AB["Anniversary Batch applies pending change; retains / removes VAS"]:::ok
`),
    },
    implementation:
      "**Key changes**\n\n- **Order API `changePlan`** — relax / remove the blanket *Decline* guard; route via `processWithFutureDateAwareness()`.\n- Decision logic for post-anniversary **Netflix Basic** presence + **Cancel-the-Cancel** order emission.\n- **`serverless/billing-process/`** — read and respect future-dated profile flags.\n- **Anniversary Batch** (`serverless/subscription-cancel-downgrade-batch-process/`) — retain / remove VAS based on Netflix Basic.\n- Gated by feature toggle `vas-future-dated-activity-enabled` (built on `pkg/featureflag/`).",
    acceptanceCriteria: [
      "VAS Add/Delete/Swap accepted even when a future-dated activity exists",
      "Netflix Basic remains post-anniversary → VAS retained after the anniversary",
      "Netflix Basic won't remain → VAS kept until anniversary via Cancel-the-Cancel, then removed by the batch",
      "All five matrix outcomes (cancellation/downgrade × Add/Delete/Swap) processed correctly",
      "Behaviour gated by feature toggle — no deploy needed to flip",
    ],
    risks: [
      "Cancel-the-Cancel order conflicts with existing cancellation sequencing (needs idempotency)",
      "Billing double-charge during the gap between VAS addition and the anniversary",
      "Anniversary Batch timing race when VAS is added on the same day as the anniversary",
      "Feature toggle not propagated to all environments before release",
    ],
    references: ["APOART-2199", "APOART-1834 — Katsumi Future Enhancements"],
    tags: ["Order API", "changePlan", "billing-process", "Anniversary Batch", "Netflix"],
  },

  // ───────────────────────────────────────────────────────── APOART-2515
  {
    id: "APOART-2515",
    ticket: "2515",
    category: "PROMO ENHANCE",
    title: "Undo pending change + add promo in one transaction",
    summary:
      "A customer with a pending downgrade calls back to reverse it, and the agent wants to add a retention promo at the same time. Today this needs **two separate transactions** (undo first, then add the promo) — slow, error-prone, and able to leave the account in a bad state.\n\nThis feature lets the agent (and potentially self-serve customers) reverse the pending change **and** apply a promotion in a single order submission.",
    technical:
      "The BPP cart pipeline runs **Qualification → Apply & Qualify → Submit to Order**. `Undo` is already a valid cart action (reversing `ACTIVETERMINATING`/`NEWACTIVATING` offerings), but qualification doesn't return promotions as *selectable* during an Undo transaction.\n\nThe fix makes qualification return applicable promos when the cart has an Undo, lets the Apply & Qualify mapper hold both `Undo`(offering) and `Add`(promotion) in the same cart, and ensures order mapping and session totals handle the mixed session atomically.",
    cmo: {
      caption:
        "Qualification never surfaces promotions while the cart holds an Undo, so the agent has to submit the undo, then run a second transaction for the promo.",
      mermaid: flow(`
flowchart TD
  U["Agent UI — cart [ Undo(offering X) ]"] --> AC["configurator-api: validate Undo on ACTIVETERMINATING"]
  AC --> AQ["apply_and_qualify.go merges Undo + runs qualification"]
  AQ --> NP["Promotions NOT returned as selectable"]:::bad
  NP --> CO["convert_to_order.go → Undo items only"]
  CO --> DS["Order API → Billing → Subscriber Profile"]
  DS --> T2["Agent must run a SEPARATE 2nd transaction to add the promo"]:::bad
`),
    },
    fmo: {
      caption:
        "Qualification returns promos as selectable during an Undo; the mapper links Add-promo to the Undo offering and totals account for both — one atomic submission.",
      mermaid: flow(`
flowchart TD
  U["Agent UI — cart [ Undo(offering X), Add(promo P) ]"] --> GQ["[CHANGE] get_qualification.go returns promos Selectable on Undo cart"]:::chg
  GQ --> BR["[CHANGE] apply_and_qualify.go links Add-promo to Undo offering"]:::chg
  BR --> IC["[CHANGE] incompatibility check allows Add-promo + Undo-offering"]:::chg
  IC --> CO["[CHANGE] convert_to_order.go includes Add-promo with Undo offering"]:::chg
  CO --> TM["[CHANGE] session + subscriber totals subtract Add-promo discount"]:::chg
  TM --> DS["Order API → Billing → Subscriber Profile (reversal + promo applied atomically)"]:::ok
`),
    },
    implementation:
      "**Key changes**\n\n- `get_qualification.go` — return promos *Selectable* on an Undo cart (TBC-1 rules).\n- `apply_and_qualify.go` — `buildCartItemRelationships()` + incompatibility check for `Undo`+`Add`-promo.\n- `convert_to_order.go` — include the Add-promo when the offering action is `Undo`.\n- `subscriptionToOrder/service/mapping.go` & `subscriptionCart/service/mapping.go` — session / subscriber totals include the new promo discount.\n- Reuses `qualificationMapper.go` (`actionReasonMap[\"undo\"]`) + Flow Runner `pkg/flow` / `pkg/flow-v2`.\n- Gated by feature toggle `APOART-2515`.",
    acceptanceCriteria: [
      "Qualification response includes applicable promos alongside the Undo items",
      "Agent can select one or more promos in the same cart as the Undo",
      "Submitted order includes both Undo(offering) AND Add(promotion)",
      "Downstream billing and subscriber profile reflect both changes atomically",
      "Pending Cancellation (ACTIVETERMINATING) and Pending Addition (NEWACTIVATING) both supported",
    ],
    risks: [
      "TBC-1 unresolved: wrong promos made selectable during Undo",
      "Double-discount when an existing promo is undone and a new promo added in the same transaction",
      "Promo eligibility must be evaluated against the post-Undo profile, not the current pending state",
      "Adding a duplicate promo already on the profile",
    ],
    references: [
      "APOART-2515",
      "APOART-2046 — Promotion Enhancements",
      "APOART-2516 — sister story (qualification-side)",
    ],
    tags: ["configurator-api", "apply_and_qualify.go", "Undo", "promotion", "subscription-manager"],
  },

  // ───────────────────────────────────────────────────────── APOART-2516
  {
    id: "APOART-2516",
    ticket: "2516",
    category: "PROMO ENHANCE",
    title: "Select promos on ActiveTerminating offerings",
    summary:
      "When a customer cancels or downgrades, their plan enters `ACTIVETERMINATING` (active now, terminating at anniversary). Today no new promotion can be applied to such a plan, so a prime retention opportunity is lost — agents must call back after cancellation (too late) or undo then re-add as a second transaction.\n\nThis feature lets a promotional discount be selected and applied to an `ACTIVETERMINATING` plan **without first reversing the cancellation**. It's the qualification-side enabler, paired with transaction-side **APOART-2515**.",
    technical:
      "Three blockers prevent promo selection on `ACTIVETERMINATING` today: (1) `determineIfCartIsLockedLegacy()` locks the entire cart; (2) flow-runner policy rules require the target offering to be `ACTIVE` before a promo qualifies; (3) `setPromotionQualificationOutcome()` drops promos returned as *Unqualified*.\n\nThe fix promotes the new `determineIfCartIsLocked()` (which excludes `activeTerminating`), adds a policy rule qualifying eligible retention promos on `ACTIVETERMINATING` offerings, and updates cart-management logic to link and keep the Add-promo.",
    cmo: {
      caption:
        "Three independent blockers — cart lock, an ACTIVE-only qualification rule, and the Unqualified→drop outcome — each remove the promo before it can be applied.",
      mermaid: flow(`
flowchart TD
  A["Agent opens cart — offering is ACTIVETERMINATING"] --> IC["initialize_cart_mapper.go → determineIfCartIsLockedLegacy()"]
  IC --> L["Blocker 1: cart LOCKED — no actions possible"]:::bad
  L --> FR["Qualification → Flow Runner → Policy Rules"]
  FR --> PU["Blocker 2: rule requires ACTIVE offering → promo Unqualified"]:::bad
  PU --> DR["Blocker 3: setPromotionQualificationOutcome() drops Unqualified promo"]:::bad
  DR --> X["Promo removed from cart"]:::bad
`),
    },
    fmo: {
      caption:
        "Cart lock excludes ActiveTerminating, a new policy rule qualifies eligible retention promos on AT offerings, and the outcome becomes Add — the promo runs for the remaining period.",
      mermaid: flow(`
flowchart TD
  A["Agent opens cart — ACTIVETERMINATING offering"] --> IC["[CHANGE] determineIfCartIsLocked() excludes activeTerminating → cart ACTIVE"]:::chg
  IC --> FR["Qualification → Flow Runner → Policy Rules"]
  FR --> NR["[CHANGE] new rule: AT offering + eligible retention promo → Qualified"]:::chg
  NR --> SEL["Promos returned Selectable → agent selects promo"]
  SEL --> AQ["[CHANGE] setPromotionQualificationOutcome(): Qualified on AT → Add"]:::chg
  AQ --> BR["[CHANGE] buildCartItemRelationships() links promo to AT offering"]:::chg
  BR --> DS["convert_to_order → NM1 Billing + Subscriber Manager (promo until anniversary)"]:::ok
`),
    },
    implementation:
      "**Key changes**\n\n- `initialize_cart_mapper.go` — remove `activeTerminating` from the lock conditions; promote `determineIfCartIsLocked()` past the `LOCK_FUTURE_DATED_ORDERS` gate.\n- Policy rules (`services/policy-rule-configurator-api/`) + Flow Runner — qualify eligible retention promos on AT offerings.\n- `apply_and_qualify.go` — `buildCartItemRelationships()`, `setPromotionQualificationOutcome()` (~L1894), `ApplyCartItems()`.\n- `convert_to_order.go` + `subscriptionToOrder/mapping.go` — verify the promo discount passes through.\n- Env var `LOCK_FUTURE_DATED_ORDERS`; gated by feature toggle `APOART-2516`.",
    acceptanceCriteria: [
      "Cart is NOT locked for an ACTIVETERMINATING profile",
      "Applicable promos appear as Qualified / Selectable",
      "Agent adds a promo (Add action); the order is processed and billing updated",
      "Promo is active for the remaining period and terminated with the offering at anniversary",
      "No regression to promo selection on fully ACTIVE offerings",
    ],
    risks: [
      "Billing a promo on an offering that terminates at anniversary (cap the promo's effective period)",
      "Cart-lock removal makes other pending-change scenarios unexpectedly editable",
      "Qualifying wrong promo types (e.g. upgrade promos) on a terminating offering — restrict to retention/discount",
      "Double discount when an existing promo is already on the profile",
    ],
    references: [
      "APOART-2516",
      "APOART-2046 — Promotion Enhancements",
      "APOART-2515 — sister story (transaction-side)",
    ],
    tags: ["configurator-api", "initialize_cart_mapper.go", "Flow Runner", "ACTIVETERMINATING", "promotion"],
  },

  // ───────────────────────────────────────────────────────── APOART-2568
  {
    id: "APOART-2568",
    ticket: "2568",
    category: "ANNIVERSARY",
    title: "Delete VAS immediately during pending activity",
    summary:
      "A customer has a Netflix VAS upgrade plus a pending future-dated cancellation or bundle downgrade, and now wants to drop the VAS upgrade **immediately** (back to included Netflix Basic) via OrderMax, MyBell, or OneView. Today the Order API's blanket *Decline* rule rejects any change while future-dated activity exists, so the deletion is blocked.\n\nThis feature lets the Delete VAS go through immediately while the bundle and Netflix Basic stay in their pending state. It's the companion to Netflix-Portal story **APOART-2199**, but covers **Delete VAS only** on these agent / self-serve channels.",
    technical:
      "The `changePlan` Decline guard is relaxed specifically for **Delete VAS** requests from OrderMax/MyBell/OneView when the `APOART-2568` toggle is on. A session is created with `Delete` on the VAS offering only and `NoChange` for the bundle and Netflix Basic.\n\nFulfillment evaluates it as `CancelFulfillment` and cancels the entitlement immediately; Billing transitions only the VAS offering/product to `TERMINATED` (expiry today) while leaving bundle and Netflix Basic `ACTIVETERMINATING`. The Anniversary Batch then processes only the remaining items.",
    cmo: {
      caption:
        "The hard Decline guard rejects the Delete VAS request as soon as it sees a future-dated activity on the profile.",
      mermaid: flow(`
flowchart TD
  C["OrderMax / MyBell / OneView — Delete VAS"] --> O["Order API: changePlan"]
  O --> G{"hasFutureDatedActivity(profile)?"}
  G -->|"No"| OK["Process normally"]:::ok
  G -->|"Yes"| D["Order API DECLINES — request rejected"]:::bad
`),
    },
    fmo: {
      caption:
        "For Delete VAS on the allowed channels, the rule is relaxed; fulfillment cancels the VAS immediately and billing terminates only the VAS, leaving bundle + Netflix Basic pending.",
      mermaid: flow(`
flowchart TD
  C["OrderMax / MyBell / OneView — Delete VAS"] --> O["Order API: changePlan"]
  O --> R["[CHANGE] relax Decline for Delete VAS + channel + toggle APOART-2568"]:::chg
  R --> S["Session: Delete VAS offering only; bundle + Netflix Basic NoChange"]
  S --> AQ["configurator apply_and_qualify.go: isActionAllowed(Delete, ACTIVETERMINATING) → true"]
  AQ --> F["[CHANGE] Fulfillment → CancelFulfillment, cancel VAS immediately (today)"]:::chg
  F --> B["[CHANGE] Billing → VAS offering + product TERMINATED; bundle / Basic unchanged"]:::chg
  B --> AB["Anniversary Batch processes remaining ACTIVETERMINATING items (VAS skipped)"]:::ok
`),
    },
    implementation:
      "**Key changes**\n\n- **Order API `changePlan`** — relax Decline for Delete VAS by channel + toggle (uses `OriginatingFrom`).\n- `configurator-api` `apply_and_qualify.go` — `isActionAllowed()` / `ValidStatesOnAction[\"DELETE\"]` permits `ACTIVETERMINATING`.\n- **`serverless/fulfillment-process`** — `evaluateFulfillmentType()`, `cancelMapping()`, `RequiredDate=today`.\n- **`serverless/billing-process/.../subscriber_manager.go`** — `determineOfferingStateAndEffectivity()` → TERMINATED for VAS only.\n- **Anniversary Batch** `session_item_generator.go` — verify already-TERMINATED VAS is excluded.\n- Gated by feature toggle `APOART-2568` (`VAS_DELETE_PENDING_PROFILE`).",
    acceptanceCriteria: [
      "VAS removed immediately from the profile via fulfillment cancellation",
      "VAS billing updated immediately (NM1); VAS offering + product → TERMINATED",
      "Netflix Basic subscription remains on the profile pending the anniversary",
      "Only OrderMax/MyBell/OneView Delete VAS allowed; Add/Swap still declined; Netflix Portal still uses the APOART-2199 path",
      "Anniversary Batch processes remaining items and skips the already-TERMINATED VAS",
    ],
    risks: [
      "VAS Delete partially succeeds (billing done, fulfillment fails) — inconsistent state",
      "Netflix bundled product stuck in SUPPRESSEDTERMINATING after delete (must revert to ACTIVETERMINATING)",
      "Toggle gap: APOART-2199 enabled but APOART-2568 not → Add allowed, Delete blocked (define release order)",
      "Same-day Delete VAS and Anniversary run ordering",
    ],
    references: [
      "APOART-2568",
      "APOART-2199 — companion (Netflix Portal)",
      "APOART-1834 — Katsumi Future Enhancements",
      "BANANABYTE-833 — billing implementation",
    ],
    tags: ["Order API", "fulfillment-process", "billing-process", "Anniversary Batch", "OrderMax"],
  },

  // ───────────────────────────────────────────────────────── APOART-2467
  {
    id: "APOART-2467",
    ticket: "2467",
    category: "TECH DEBT",
    title: "Automate NM1 disconnect cleanup Lambdas",
    summary:
      "When Bell's billing system (**NM1**) cancels an account for fraud, collections, or agent-initiated reasons, it processes the disconnect directly in NM1 **without** going through BPP — so the BPP subscription record (entitlements, profile, streaming access) is never cleaned up.\n\nToday this cleanup is done manually via a support-run SQL/script against EDW, then a manual revoke/terminate. This story automates the workflow for all three disconnect categories using a pair of Lambdas each, bringing Fraud, Collections, and Other to a consistent, auditable standard.",
    technical:
      "**Lambda 1 (EDW Extractor)** runs a named Athena query against EDW for a reason-code category and writes affected subscribers to an S3 CSV (`subscriber_id, ban`). An EventBridge *S3 Object Created* event then triggers **Lambda 2 (Processor)**, which per subscriber revokes the entitlement (Reseller Service), updates the subscriber profile to `TERMINATED` (Subscriber Manager API), and terminates NM1/AMSS billing.\n\nIt extends an existing pattern in `serverless/bpp-data-clean-up` using semaphore-limited goroutines, error CSVs, and move-to-processed.",
    cmo: {
      caption:
        "NM1 cancels directly, BPP is never told, and support cleans up by hand — a per-category SQL pull plus manual revoke/terminate, with no extractor Lambda in place.",
      mermaid: flow(`
flowchart TD
  NM["NM1 cancels account directly (fraud / collections / agent)"] --> NB["BPP record NOT cleaned up"]:::bad
  NB --> SUP["Support runs SQL / script against EDW by hand"]:::bad
  SUP --> EX["Extracts affected subscribers manually"]
  EX --> MAN["Manually revoke entitlement + terminate billing"]:::bad
  MAN --> GAP["Lambda 2 exists partially; no Lambda 1 extractor"]:::bad
`),
    },
    fmo: {
      caption:
        "An extractor Lambda queries EDW and drops a CSV in S3; the S3 event triggers a processor Lambda that revokes, terminates the profile and bills off NM1 — with error/processed CSVs for audit.",
      mermaid: flow(`
flowchart TD
  CRON["EventBridge cron / manual invoke"] --> L1["[CHANGE] Lambda 1 — EDW Extractor"]:::chg
  L1 --> Q["pkg/athenautil: query EDW by reason codes, exclude already-processed"]
  Q --> CSV["pkg/s3util: write CSV (subscriber_id, ban) to S3 prefix"]
  CSV --> EV["S3 Object Created → EventBridge"]
  EV --> L2["[CHANGE] Lambda 2 — Processor (per category)"]:::chg
  L2 --> P["Per subscriber: revoke entitlement → profile TERMINATED → terminate NM1 / AMSS billing"]
  P --> R["Errors → _errors.csv; source → _processed.csv"]:::ok
`),
    },
    implementation:
      "**Key changes**\n\n- New Lambda 1 extractors: `cmd/edwFraudExtractor/`, `cmd/edwCollectionsExtractor/`, `cmd/edwOtherExtractor/`.\n- New Lambda 2 processors: `cmd/fraudNM1Terminate/`, `cmd/collectionsNM1Terminate/`, `cmd/otherNM1Terminate/`.\n- Reuse `cmd/terminateFraudAccounts/service/accountCleanup.go` and `cmd/terminateNM1/service/terminate_nm1_cleanup.go`.\n- `serverless.yaml` — add the three Lambda pairs + EventBridge triggers shipping `enabled: false`.\n- Libraries: `pkg/athenautil`, `pkg/s3util`, `pkg/coreprocessor/billing` (`TerminateSubscriberWithoutLogin`).",
    acceptanceCriteria: [
      "Lambda 1 produces the exact CSV format `subscriber_id,ban` per category",
      "Lambda 2 auto-triggered by S3 Object Created on the category prefix",
      "Per subscriber: entitlement revoked, profile TERMINATED, NM1/AMSS billing terminated",
      "Failed records → `_errors.csv`; source moved to `_processed.csv`",
      "Triggers ship `enabled: false`, enabled only after support sign-off",
    ],
    risks: [
      "Double-processing if a subscriber reappears in EDW — query must exclude already-TERMINATED",
      "Partial failure mid-batch (revoke succeeds, billing fails) — re-run from the error file",
      "Lambda timeout on large/slow AMSS batches — semaphore limit 5–10, 900s timeout",
      "EDW stale data / propagation delay; same-day S3 prefix collisions — add timestamp to filename",
    ],
    references: ["APOART-2467", "APOART-1912 — Technical Debt: Subscriptions (epic)"],
    tags: ["serverless", "Lambda", "EDW", "Athena", "S3", "EventBridge", "NM1"],
  },

  // ───────────────────────────────────────────────────────── APOART-2577
  {
    id: "APOART-2577",
    ticket: "2577",
    category: "PROMO ENHANCE",
    title: "Move promo ranking from Flowrunner to Configurator",
    summary:
      "When a customer qualifies for multiple competing, non-stackable promotions, the system must pick which one to present as the automatic choice (Default / Mandatory / Recommended) using each promotion's **rank**.\n\nToday the **Flowrunner** does both qualification *and* this rank-based conflict resolution, mixing business rules into what should be a pure rules evaluator. This story moves ranking/conflict resolution into the **Configurator** so the Flowrunner only declares promotions qualified. The customer-facing outcome is identical — it's a separation-of-concerns improvement.",
    technical:
      "Gate the Flowrunner's `rankDMRIncompatible()` behind feature flag `APOART-2577` so it returns all DMR outcomes as-is. Add a new `resolveRankConflicts()` in the Configurator's `apply_and_qualify.go` that runs after `addParentPromotion()`, using `PromotionSpecByIDMap` (rank) and `ItemRelationshipLinks` (IncompatibleWith) to keep only the best-ranked DMR tag among incompatible non-stackable promos.\n\nTies remove DMR from both; stackable promos are untouched; already-selected incompatible promos suppress defaulting.",
    cmo: {
      caption:
        "Rank-based conflict resolution lives inside the Flowrunner: it strips the DMR tags from lower-ranked incompatible promos before the Configurator ever sees them.",
      mermaid: flow(`
flowchart TD
  C["Configurator → Flowrunner (cart + promotion specs)"] --> V["validatePromotions() evaluates rules"]
  V --> RK["rankDMRIncompatible() resolves rank conflicts (business logic in rules engine)"]:::bad
  RK --> ST["Strip DMR from lower-ranked incompatible promos"]
  ST --> RET["Returns A = Qualified+Default, B = Qualified"]
  RET --> AP["Configurator addParentPromotion() just reads state"]:::ok
`),
    },
    fmo: {
      caption:
        "The Flowrunner returns all qualified promos untouched; the Configurator now resolves rank conflicts, producing an identical final cart but with the business rule in the right place.",
      mermaid: flow(`
flowchart TD
  C["Configurator → Flowrunner (cart + promotion specs)"] --> V["validatePromotions() evaluates rules"]
  V --> SK["[CHANGE] rankDMRIncompatible() flagged OFF → A and B both Qualified+Default"]:::chg
  SK --> AP["Configurator addParentPromotion() adds DMR to all qualified promos"]
  AP --> RC["[CHANGE] resolveRankConflicts() keeps best-ranked DMR among incompatibles"]:::chg
  RC --> TIE["[CHANGE] tie → remove DMR from both; stackable → leave; already-selected → no default"]:::chg
  TIE --> FIN["Final cart identical (A Default=true, B no Default)"]:::ok
`),
    },
    implementation:
      "**Key changes**\n\n- `pkg/flow/components/policyRulesValidatorWithToggleOutcome.go` — gate `rankDMRIncompatible()`, `processResults()`, `buildRankByID()`.\n- `services/subscription-configurator-api/.../configurator/apply_and_qualify.go` — new `resolveRankConflicts()` after `addParentPromotion()`.\n- Helpers: `hasAnyDMRCharacteristic`, `getPromoRank`, `removeDMRCharacteristics`, `isIncompatibleViaGroup`.\n- `models/catalog/promotion_specification.go` — `Rank *int`; `get_qualification.go` — `ItemRelationshipLinks`, `IncompatibleWithGroupId`.\n- Gated by feature toggle `APOART-2577` (both Flowrunner + Configurator); update `.feature` tests.",
    acceptanceCriteria: [
      "AC1: multiple Recommended (GBB) non-stackable promos → only best-ranked is Recommended",
      "AC2: multiple Default non-stackable promos → only best-ranked is Defaulted",
      "AC3: a promo already selected on the cart → any incompatible promo is NOT Defaulted",
      "Stackable Default/Mandatory promos → both keep DMR tags regardless of rank",
      "Same rank (tie) → neither gets DMR",
      "Flowrunner with APOART-2577 enabled returns full DMR outcomes (no stripping)",
    ],
    risks: [
      "Flag coordination gap (both services strip) — keep idempotent so order is safe",
      "Different `worstRank` constant between services — standardize on `math.MaxInt`",
      "Mandatory-vs-Default tie at same rank — Mandatory must win (replicate existing behaviour)",
      "AC3 edge: newly added promo (State=New, Action=NoChange) — check both Action==NoChange AND State!=New",
    ],
    references: ["APOART-2577", "APOART-2046 — Promotion Enhancements (epic)"],
    tags: ["Flowrunner", "pkg/flow", "configurator-api", "apply_and_qualify.go", "ranking"],
  },

  // ───────────────────────────────────────────────────────── APOART-2514
  {
    id: "APOART-2514",
    ticket: "2514",
    category: "MSP",
    title: "Dynamic service names for TV warnings",
    summary:
      "Bell offers discounted streaming bundles (e.g. Crave + Netflix + Disney+) tied to an active **Bell TV service**, and the UI must warn agents/customers that cancelling would lose the offer.\n\nToday those warnings hard-code the generic word **\"TV\"** regardless of which Bell TV product the customer actually has (Fibe TV, Satellite TV, Fibe TV App, or legacy Television). This story replaces the hard-coded text with logic that reads the customer's actual service type and displays the correct specific service name across all the relevant cancel/subscribe UI components.",
    technical:
      "The subscription-manager already tracks `SubscriberType` (TELEVISION, FIBE_TV, SATELLITE_TELEVISION, FIBE_TV_APP, MOBILITY). Recent BDU work (gated by `enableTvBduProducts`) added these types to the show/hide warning logic, but the helpers and translation keys that produce the text were never updated.\n\nThe fix extends `getIncludedServiceName()` to cover all BDU TV types, passes `subscriberType` into `ServiceIncludedWarningPopUpContent`, updates `AlreadySubscribedContent`'s `BduCard` for per-type labels, and adds CMS translation keys for FIBE_TV, SATELLITE_TELEVISION, and FIBE_TV_APP.",
    cmo: {
      caption:
        "The name helpers only handle TELEVISION + MOBILITY and the popups hard-code 'TV', while getIncludedByServiceInfo() collapses all BDU types to TELEVISION — so the UI always says 'TV'.",
      mermaid: flow(`
flowchart TD
  U["Customer / agent cancels a TV-linked streaming bundle"] --> G["getIncludedServiceName(): only TELEVISION + MOBILITY"]:::bad
  G --> W["Warning popups hard-code the generic word 'TV'"]:::bad
  W --> H["getIncludedByServiceInfo() collapses Fibe / Satellite / App → TELEVISION"]:::bad
  H --> X["UI shows 'TV' regardless of the actual service"]:::bad
`),
    },
    fmo: {
      caption:
        "Helpers map each BDU type to its own CMS key, subscriberType flows into the popups, and new EN/FR keys yield the correct specific service name in every component.",
      mermaid: flow(`
flowchart TD
  U["Customer / agent cancels a TV-linked streaming bundle"] --> G["[CHANGE] getIncludedServiceName() maps FIBE_TV / APP and SATELLITE_TV keys"]:::chg
  G --> P["[CHANGE] pass subscriberType into ServiceIncludedWarningPopUpContent"]:::chg
  P --> D["[CHANGE] getServiceNameFromSubscriberType() derives the specific name"]:::chg
  D --> B["[CHANGE] BduCard getManageThroughText() returns per-type label"]:::chg
  B --> K["[CHANGE] add CMS keys (EN / FR) for Fibe TV / Satellite TV / Fibe TV App"]:::chg
  K --> OUT["UI shows the correct specific service name"]:::ok
`),
    },
    implementation:
      "**Key changes**\n\n- `cancel-subscription/CancelSubscriptionPopUp.tsx` — `getIncludedServiceName()`, `IncludedByServiceBanner`.\n- `cancel-subscription/ServiceIncludedWarningPopUpContent.tsx` — new `subscriberType` prop + `getServiceNameFromSubscriberType()`.\n- `add-subscription/selection-popup/AlreadySubscribedContent.tsx` — `BduCard`, `getManageThroughText()`.\n- `review-subscription/NoteOnServicesAccordion.tsx` — `TvLobPromoCancellationNote`.\n- `utils/subscriptionsHelperFunctions.ts` — `getIncludedByServiceInfo()` (preserve specific BDU type), `getTvServiceURL()`.\n- New CMS keys (`..._FIBE_TV`, `..._SATELLITE_TV`) in `Subscriptions.xml` (EN/FR); flag `enableTvBduProducts`.",
    acceptanceCriteria: [
      "Cancel subscription popup shows the actual service name (Bell Fibe TV / Bell Satellite TV / Bell TV) per subscriberType",
      "Service included warning popup derives serviceName dynamically from subscriberType",
      "AlreadySubscribed BduCard shows the correct per-BDU-type \"Manage through\" label",
      "Warning names the correct LOB the customer must keep to maintain the offer",
      "All BDU TV types produce correct names in all four components",
    ],
    risks: [
      "`getIncludedByServiceInfo` collapses BDU types to TELEVISION → distinct labels never reached; confirm with design",
      "New CMS keys missing at deploy time → add English `defaultValue` fallbacks in `t()`",
      "`ServiceIncludedWarningPopUpContent` is agent-only → `includedByService` may not be populated everywhere",
      "`TVAddOnSubscription` on the customer page still TV-specific → may need a BDU variant",
    ],
    references: [
      "APOART-2514",
      "APOART-1777 — Katsumi Multi-Service Promotions Post-MVP (epic)",
    ],
    tags: ["SM UI", "CancelSubscriptionPopUp", "subscriberType", "BDU", "CMS keys"],
  },

  // ───────────────────────────────────────────────────────── APOART-2419
  {
    id: "APOART-2419",
    ticket: "2419",
    category: "MSP",
    title: "MyBell: add À la carte on the Change Bundle page",
    summary:
      "Bell customers with a streaming bundle (e.g. a Crave + Netflix + Disney+ Trio) can today only downgrade to individual **À la carte (ALC)** subscriptions in two steps — cancel the bundle, then return later to add ALC.\n\nThis story lets the customer select ALC **directly** on the *Change your Bundle* page and complete the downgrade in a single transaction. ALC options are scoped to the platforms in the customer's current bundle, and eligible promo credits (e.g. the $11.99cr) carry over automatically. MyBell self-serve only.",
    technical:
      "Add a third tab **\"À la carte\"** to `ChangeProductTier.tsx` (alongside *Change your plan* and *Change your bundle*). Derive ALC items from the existing `bundleChildToALCQualificationItemsMap` (built in `DataProvider.tsx` via `INCLUDES` relationships) plus `getMultiTierCategory`, and render them with the reused `TierCarousel`.\n\nOn selection, submit a paired qualification order: `DELETE` the bundle + `ADD` the chosen ALC in one transaction. Add a CTA in `CreditLossPopup` to redirect to the ALC tab.",
    cmo: {
      caption:
        "The Change Bundle page only offers plan and bundle tabs — there's no ALC option, so a bundle→ALC downgrade requires cancelling first and returning as a separate transaction.",
      mermaid: flow(`
flowchart TD
  C["Customer on Change Bundle page → ChangeProductTier.tsx"] --> T0["Tab: Change your plan (TierCarousel)"]
  C --> T1["Tab: Change your bundle (TierCarousel)"]
  C --> NO["No À la carte tab"]:::bad
  NO --> S1["Step 1: cancel bundle (effective at anniversary), leave"]:::bad
  S1 --> S2["Step 2: return later as a separate transaction to add ALC"]:::bad
`),
    },
    fmo: {
      caption:
        "A new À la carte tab (MyBell only) lists ALC tiers scoped to the bundle's platforms; selecting one fires a paired DELETE-bundle + ADD-ALC order in a single submission.",
      mermaid: flow(`
flowchart TD
  C["Customer on Change Bundle page → ChangeProductTier.tsx"] --> NT["[CHANGE] new À la carte tab (SWITCH_TO_ALC), MyBell only"]:::chg
  NT --> AL["[CHANGE] alcItems from bundleChildToALCQualificationItemsMap + getMultiTierCategory"]:::chg
  AL --> RC["[CHANGE] renderSwitchToALC() → TierCarousel(alcItems)"]:::chg
  RC --> SEL["Customer selects an ALC tier"]
  SEL --> PA["[CHANGE] paired action: selectItem(ALC, ADD) + selectItem(bundle, DELETE)"]:::chg
  PA --> SUB["Single qualification order — bundle removed + ALC added; shared promo credit carries over"]:::ok
`),
    },
    implementation:
      "**Key changes**\n\n- `ChangeProductTier.tsx` — new `SWITCH_TO_ALC` tab, `alcItems` memo, `renderSwitchToALC()`.\n- `bundleChildToALCQualificationItemsMap` (DataContext) — built in `DataProvider.tsx` via `findALCSubscriptionId` / `INCLUDES`.\n- Reuse `TierCarousel.tsx` to render ALC tiers.\n- `CreditLossPopup.tsx` — new optional `onSwitchToALC` prop + CTA.\n- `subscriptionsHelperFunctions.ts` — `getCatalogSubscriptionsForCategory` (optional `skipPlatformFilter`), `getMultiTierCategory`.\n- Translation keys: `BUTTONS_SWITCH_TO_ALC`, `CHANGE_TIER_AVAILABLE_ALC`, `CREDIT_LOSS_POPUP_SWITCH_TO_ALC_CTA`.",
    acceptanceCriteria: [
      "ALC rate cards with applicable promos shown on the Change Bundle page alongside bundle options",
      "ALC options scoped to current bundle platforms (Trio → 3 platforms, Duo → 2)",
      "Single transaction: bundle removed + ALC added at the same time",
      "No change to existing upgrade/downgrade anniversary rules",
      "CTA in `CreditLossPopup` redirects the customer to select ALC",
    ],
    risks: [
      "ALC tab must be hidden in agent view (MyBell only) and when no ALC equivalent exists",
      "`onTierSelect` may not handle bundle→ALC (different category) — may need a dedicated handler",
      "Bundle-only promos (e.g. $1.98cr) correctly drop; only shared credits (e.g. $11.99cr) carry over",
      "Platform-filter bypass decision (param vs direct-map) affects risk",
    ],
    references: [
      "APOART-2419",
      "APOART-1777 — Katsumi Multi-Service Promotions Post-MVP (epic)",
    ],
    tags: ["SM UI", "ChangeProductTier.tsx", "TierCarousel", "ALC", "MyBell"],
  },

  // ───────────────────────────────────────────────────────── APOART-2124
  {
    id: "APOART-2124",
    ticket: "2124",
    category: "Exploration",
    title: "Exceptions for Netflix VAS on pending bundle change",
    summary:
      "A customer with a bundle containing Netflix that is **pending cancellation** (effective at anniversary) may have a Netflix VAS upgrade (e.g. Standard → Premium 4K) placed on top of the soon-to-be-removed subscription. If that VAS order fails at fulfillment or billing, the profile can be left **locked** or inconsistent, requiring manual intervention.\n\nThis exploration enumerates all such exception scenarios and recommends how each entry point should handle them — automated prevention/recovery vs manual contingency.",
    technical:
      "When BPP processes an order it locks the cart (`\"Locked\"`), calls the Netflix reseller API (fulfillment), publishes billing, then updates subscriber manager. If fulfillment and/or billing fail for a VAS order, the profile stays `Locked`, which blocks the Anniversary Batch from running the pending cancellation, plus blocks CTC orders and further VAS changes.\n\nThe exploration defines what each entry point (batch, CTC/order-api, Netflix Portal, OrderMax/OneView/MyBell) should do when it detects a `Locked` cart or `pendingCancellation` bundle, reusing/extending `isVasChangeBlocked()` and `handleLockedCartResponse()`.",
    cmo: {
      caption:
        "A VAS order on a pending-cancel bundle locks the cart; if fulfillment or billing fails the profile stays Locked, which blocks the Anniversary Batch — so the customer is billed indefinitely.",
      mermaid: flow(`
flowchart TD
  T0["Customer cancels Trio bundle → ActiveTerminating (pending cancel)"] --> T1["VAS request: Netflix Standard → Premium 4K"]
  T1 --> T2["Configurator locks cart; convertToOrder succeeds"]
  T2 --> T3["VAS fulfillment FAILS (Netflix reseller) or billing publish fails"]:::bad
  T3 --> T4["Profile left Locked; VAS stuck NewActivating"]:::bad
  T4 --> T5["Anniversary Batch blocked by the lock — customer billed indefinitely"]:::bad
`),
    },
    fmo: {
      caption:
        "Recommended handling per entry point: each detects a Locked cart / pendingCancellation and re-queues, declines, or rejects; true split-failures fall back to a documented manual contingency.",
      mermaid: flow(`
flowchart TD
  L{"Cart Locked or bundle pendingCancellation?"} --> B["[CHANGE] Anniversary Batch checks Locked → re-queue with backoff"]:::chg
  L --> C["[CHANGE] CTC order-api handleLockedCartResponse() → 202 Declined"]:::chg
  L --> N["[CHANGE] Netflix Portal rejects → OfferingPendingCancellation / locked error"]:::chg
  L --> O["[CHANGE] OrderMax / OneView / MyBell block VAS via isVasChangeBlocked()"]:::chg
  B --> M["Split fulfillment / billing failure → manual contingency (BPPE7100 fallout, runbook)"]:::ok
  C --> M
  N --> M
  O --> M
`),
    },
    implementation:
      "**Recommended handling (per entry point)**\n\n- `order-api/internal/post_order_helper.go` — extend `isVasChangeBlocked()` (flag `VAS_BUNDLE_PENDING_CHANGE_ORDER_API`).\n- `order-api/internal/plan_change.go` — `handleLockedCartResponse()` / `LockedState` (extend the `APOART-2398` `DeclineLocked` pattern).\n- `subscription-cancel-downgrade-batch-process/.../fulfillment.go` — re-kickout/re-queue locked items with backoff.\n- `merchant-api-netflix/services/merchant_utils.go` — Netflix Portal locked / pending rejection.\n- `model/order-api/error.go` — `OfferingPendingCancellation` constant; `apply_and_qualify.go` — `InvalidCartStates = [ConvToOrder, Locked]`; fallout `BPPE7100`.\n\n*This is an exploration story — output is the scenario catalog + a split of automated dev stories vs manual contingency.*",
    acceptanceCriteria: [
      "Identify all exception scenarios and resulting profile-item states for VAS-on-pending-cancel with VAS failure",
      "Propose handling per entry point: automated dev stories vs manual contingency",
      "Scope: Scenarios 10/11/12 — VAS add fulfillment fail, VAS add billing fail, VAS change fulfillment fail",
    ],
    risks: [
      "Locked profile indefinitely blocks anniversary cancellation → ongoing billing",
      "Fulfillment succeeds but billing fails → Netflix active, Bell not billing (manual reconcile)",
      "`isVasChangeBlocked()` currently only checks `pendingCancellation`, not a `Locked` cart",
      "Out of scope: profiles without pending cancel/bundle change, and downgrade (not cancel)",
    ],
    references: [
      "APOART-2124 — exploration",
      "APOART-1834 — parent",
      "Related: APOART-2199 / 2568 / 2107 / 2398",
    ],
    tags: ["order-api", "Netflix", "Locked cart", "Anniversary Batch", "exploration"],
  },

  // ───────────────────────────────────────────────────────── APOART-2502
  {
    id: "APOART-2502",
    ticket: "2502",
    category: "PROMO ENHANCE",
    title: "Show a dash for negative price on rate cards",
    summary:
      "When stacked promotions exceed a subscription's base price, the net price can go **negative**. Today the UI silently clamps it to `$0.00` via `Math.max(0, price)`.\n\nThis ticket changes the display: the customer (MyBell) view shows a dash **\"—\"** (signals *no charge*), while the agent view shows the **actual negative amount** (e.g. `-$2.01/mo.`) so agents can understand the promo stacking and advise correctly.",
    technical:
      "The qualification API returns a `netPrice` (`PRICE_WITH_LIMITED_AND_ONGOING_CREDITS`) that can be negative. Four card components apply `Math.max(0, price)` before `PriceDisplay`; replace that single guard with context-aware logic using `isAgentView(router.pathname)`: negative + customer → \"—\"; negative + agent → `-$X.XX/mo.` (minus before `$`, locale-aware); zero/positive → unchanged.\n\nBecause `PriceDisplay.tsx` always prepends `$` and splits on `.` (yielding `$-2.01`), the dash and negative cases **bypass** `PriceDisplay` and render a plain styled `<span>`. Gated behind new flag `enableNegativePriceDisplay` (`APOART-2502`).",
    cmo: {
      caption:
        "Every card clamps the net price to zero before rendering, so a -$2.01 promo stack shows as $0.00 to both customer and agent — the agent loses all visibility of the stacking.",
      mermaid: flow(`
flowchart TD
  Q["QualificationItem.netPrice = -2.01"] --> CARD["TierCard / TierCardBundle / AddSubscriptionCard"]
  CARD --> CLAMP["Math.max(0, price) clamps negative to 0"]:::bad
  CLAMP --> PD["PriceDisplay → renders $0.00/mo."]
  PD --> X["Customer AND agent both see $0.00 — agent loses stacking visibility"]:::bad
`),
    },
    fmo: {
      caption:
        "Behind the flag, cards branch on view: customer sees a dash, agent sees the real negative amount (both bypassing PriceDisplay); zero/positive and flag-off keep the legacy path.",
      mermaid: flow(`
flowchart TD
  Q["netPrice = -2.01 reaches the card"] --> CMP["[CHANGE] compute isNegative + isAgentView(router.pathname)"]:::chg
  CMP --> FLAG{"enableNegativePriceDisplay AND price below 0?"}
  FLAG -->|"No"| LEG["Legacy Math.max(0,...) → PriceDisplay ($0.00)"]
  FLAG -->|"Yes · customer"| DASH["[CHANGE] render span '—' (dash), bypass PriceDisplay"]:::chg
  FLAG -->|"Yes · agent"| NEG["[CHANGE] render -$2.01/mo. (FR -2,01$/mois), bypass PriceDisplay"]:::chg
  DASH --> A["ARIA labels applied"]:::ok
  NEG --> A
`),
    },
    implementation:
      "**Key changes**\n\n- `TierCard.tsx` — add `isAgentView` + `useRouter`, replace `Math.max(0,...)`, dash/negative render.\n- `TierCardBundle.tsx` — `getFormattedBundlePrice()` accepts `isAgent` + `locale`, returns `{ formattedPrice, isDash, isNegativeAgent }`.\n- `AddSubscriptionCard.tsx` + `AddSubscriptionCardFooter.tsx` — dash/negative logic + new `isDashDisplay` / `isNegativeAgentDisplay` props.\n- `FlagContext.tsx` / `FlagProvider.tsx` — new `enableNegativePriceDisplay` via `useOpenFeatureFlag('APOART-2502')`.\n- `PriceDisplay.tsx` — **unchanged** (intentionally bypassed); new keys `ARIA_LABEL_PRICE_FREE`, `ARIA_LABEL_PRICE_NEGATIVE`.",
    acceptanceCriteria: [
      "Customer view: negative net price → show dash \"—\" on impacted rate cards",
      "Agent view: negative net price → show the actual negative amount (e.g. -$2.01/mo.)",
      "Net price exactly 0 → still $0.00/mo. (unchanged)",
      "Flag off → legacy clamp-to-0 behaviour",
      "Behaviour applies across all four card components",
    ],
    risks: [
      "`PriceDisplay` mishandles negatives ($-2.01) and dash ($—) — must bypass it",
      "`isDashDisplay` / `isNegativeAgentDisplay` must flow `AddSubscriptionCard` → `AddSubscriptionCardFooter`",
      "French locale formatting (-2,01$/mois) and disabled rate-card styling must be preserved",
      "Distinct from `enableNegativePricingWarning` (APOART-2003) — don't conflate the flags",
    ],
    references: [
      "APOART-2502",
      "APOART-2046 — Promotion Enhancements (epic)",
      "Related: APOART-2003 — negative pricing error popup",
    ],
    tags: ["SM UI", "TierCard", "PriceDisplay", "negative pricing", "feature flag"],
  },

  // ───────────────────────────────────────────────────────── APOART-2211
  {
    id: "APOART-2211",
    ticket: "2211",
    category: "Contingency",
    title: "Read customer name from CPM into the BPP UI",
    summary:
      "Bell back-office agents use the BPP **Contingency UI** to look up subscribers and orders, but it shows **no customer name** — forcing them to cross-reference other systems.\n\nThis story surfaces the customer's name (sourced from **CPM**, Customer Profile Management) in four places: the Subscriber Search results table, the Subscriber Details page, the Order Search results table, and the Order Details page. New eShop/OrderMax orders without a CPM name gracefully show **\"N/A\"**.",
    technical:
      "A `customer-profile-api` Go microservice already wraps CPM and returns name fields (`party[].formattedName`, `customer[].name`, `relatedParty[].individual.formattedName`). The contingency UI pipeline never picks the name up: the `Party` TS type has no name field and both customer-info builders have `name` commented out.\n\nThe fix is two-part — **backend**: enrich subscriber/order data with the name by calling `customer-profile-api` via the BAN (preferred) or a frontend secondary fetch; **frontend**: add name fields to types, uncomment the `name` field in the builders, and add a *Customer Name* column to the search tables.",
    cmo: {
      caption:
        "CPM and the customer-profile-api already expose the name, but the subscriber pipeline drops it — the Party type has no name field and both customer-info builders keep `name` commented out.",
      mermaid: flow(`
flowchart TD
  CPM["CPM holds the authoritative customer name"] --> API["customer-profile-api exposes name (already built)"]
  API --> SM["subscription-manager response has no name; Party type lacks name fields"]:::bad
  SM --> TBL["SubscriberTableRow has no customerName → no column"]:::bad
  TBL --> BLD["Customer-info builders: name field commented out"]:::bad
  BLD --> X["Agent must cross-reference another system"]:::bad
`),
    },
    fmo: {
      caption:
        "The name is enriched from customer-profile-api (lifecycle path A or a Next.js proxy path B), threaded through the types, and surfaced as a Customer Name column / field in all four UI locations.",
      mermaid: flow(`
flowchart TD
  CPM["CPM (Customer360 by BAN)"] --> API["customer-profile-api GET /customer-profile/account/{BAN}"]
  API --> PA["[CHANGE] Path A: aggregator includes party.formattedName through lifecycle"]:::chg
  API --> PB["[CHANGE] Path B: Next.js proxy /api/customer-profile/[ban]"]:::chg
  PA --> TYP["[CHANGE] add name fields to Party + customerName to SubscriberTableRow"]:::chg
  PB --> TYP
  TYP --> COL["[CHANGE] add Customer Name column to SubscriberTable + OrdersTable"]:::chg
  COL --> UNC["[CHANGE] uncomment name in customer-info builders"]:::chg
  UNC --> OUT["Name shown in 4 places; missing CPM name → N/A"]:::ok
`),
    },
    implementation:
      "**Key changes**\n\n- `customer-profile-api` (Go) — already exposes `GET /customer-profile/account/{accountId}` via `mapPartyInfo()` / `mapCustomerInfo()` (`cpm/mapper.go`); just called.\n- `packages/types/.../subscriberTypes.ts` — add name fields to `Party`, `customerName?` to `SubscriberTableRow`.\n- `src/pages/api/customer-profile/[ban].ts` — new proxy route; `searchSubscribers.ts` — enrich with `customerName` (soft-fail).\n- `SubscriberTable.tsx` + `OrdersTable.tsx` — new `customerName` column.\n- `helperFunctions.ts` `createCustomerInfoStructure()` + `transformDataForOrderDetails.ts` `customerInformationMapping()` — uncomment `name`, add param; details pages fetch + pass name. Keys `customer-info.name`, `customer-name`.",
    acceptanceCriteria: [
      "Customer name visible on the Subscriber Search results table",
      "Customer name visible on the Subscriber Details Customer Information section",
      "Customer name visible on the Order Search results table",
      "Customer name visible on the Order Details Customer Information section",
      "New eShop/OrderMax orders with no CPM name show \"N/A\", not an error",
    ],
    risks: [
      "Name enrichment must be a soft failure (404 / timeout / missing name → \"N/A\", page still loads)",
      "Choice between backend enrichment (Path A, lifecycle) vs frontend secondary fetch (Path B)",
      "Name precedence: `party.formattedName` → `relatedParty.individual.formattedName` → `customer.name`",
      "Order search route also needs CPM enrichment via subscriber BAN (more plumbing)",
    ],
    references: [
      "APOART-2211",
      "APOART-2024 — Contingency Tool (epic)",
      "Related: APOART-2210 — send customer name to DigiTek",
    ],
    tags: ["Contingency UI", "customer-profile-api", "CPM", "SubscriberTable", "OrdersTable"],
  },
];

/** Strip the appended classDef style block so copied / chat-context diagrams
 *  stay clean (the tints only matter for on-screen rendering). */
function cleanMermaid(src: string): string {
  return src
    .split("\n")
    .filter((l) => !l.trim().startsWith("classDef "))
    .join("\n")
    .trim();
}

/** Serialize a story to a self-contained Markdown document. Used by the
 *  "Copy as Markdown" button and as the grounding context for the per-story
 *  AI chat. */
export function storyToMarkdown(s: ApoartStory): string {
  const out: string[] = [
    `# ${s.id} — ${s.title}`,
    "",
    `**Category:** ${s.category}`,
  ];
  if (s.tags?.length) out.push(`**Tags:** ${s.tags.join(", ")}`);
  out.push(
    "",
    "## What it is",
    s.summary,
    "",
    "## Technical idea",
    s.technical,
    "",
    "## Current flow — CMO (as-is)"
  );
  if (s.cmo.caption) out.push(`_${s.cmo.caption}_`, "");
  out.push("```mermaid", cleanMermaid(s.cmo.mermaid), "```", "", "## Future flow — FMO (to-be)");
  if (s.fmo.caption) out.push(`_${s.fmo.caption}_`, "");
  out.push("```mermaid", cleanMermaid(s.fmo.mermaid), "```", "", "## Implementation", s.implementation);
  if (s.acceptanceCriteria?.length) {
    out.push("", "## Acceptance criteria", ...s.acceptanceCriteria.map((c) => `- ${c}`));
  }
  if (s.risks?.length) {
    out.push("", "## Risks & edge cases", ...s.risks.map((r) => `- ${r}`));
  }
  if (s.references?.length) {
    out.push("", "## References", ...s.references.map((r) => `- ${r}`));
  }
  return out.join("\n");
}

/** Display order + accent color per category (literal Tailwind classes — no
 *  dynamic interpolation, so they survive Tailwind's purge). */
export const categoryMeta: Record<
  ApoartCategory,
  { badge: string; dot: string }
> = {
  "VAS APR": {
    badge: "bg-arch-blue/10 text-arch-blue border-arch-blue/20",
    dot: "bg-arch-blue",
  },
  "PROMO ENHANCE": {
    badge: "bg-arch-purple/10 text-arch-purple border-arch-purple/20",
    dot: "bg-arch-purple",
  },
  ANNIVERSARY: {
    badge: "bg-arch-teal/10 text-arch-teal border-arch-teal/20",
    dot: "bg-arch-teal",
  },
  "TECH DEBT": {
    badge: "bg-arch-amber/10 text-arch-amber border-arch-amber/20",
    dot: "bg-arch-amber",
  },
  MSP: {
    badge: "bg-arch-green/10 text-arch-green border-arch-green/20",
    dot: "bg-arch-green",
  },
  Exploration: {
    badge: "bg-arch-coral/10 text-arch-coral border-arch-coral/20",
    dot: "bg-arch-coral",
  },
  Contingency: {
    badge: "bg-arch-red/10 text-arch-red border-arch-red/20",
    dot: "bg-arch-red",
  },
};
