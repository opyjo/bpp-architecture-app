# APOART Stories — Combined Documentation

> Auto-generated from individual story files. Each section corresponds to one Jira ticket.

---

# APOART-2199: VAS APR — Change VAS When Pending Future-Dated Activity Exists

**Epic Parent:** [APOART-1834](https://jira.bell.corp.bce.ca/browse/APOART-1834) — Katsumi Future Enhancements (bucket)  
**Sprint:** APOART PI-26.3 | **Team:** BANANABYTE | **Priority:** Medium | **Points:** 10 (estimated 20)

---

## 1. Background & Business Problem

### Glossary

| Term                     | Meaning                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| **VAS**                  | Value Added Service — e.g., a Netflix add-on subscription tier                                     |
| **BPP**                  | Bell's subscription/billing platform                                                               |
| **Anniversary Batch**    | Nightly/periodic batch that applies pending plan changes on their effective date                   |
| **Pending Cancellation** | A future-dated order that will fully cancel the customer's subscription at anniversary             |
| **Pending Downgrade**    | A future-dated order that reduces the customer's plan at anniversary                               |
| **Cancel-the-Cancel**    | A compensating order that undoes a pending cancellation, used to keep VAS active until anniversary |

### Current Behaviour (Problem)

When a customer has a **pending future-dated activity** (cancellation or downgrade) on their profile, the `changePlan` Order API applies a hard **"Decline"** rule that blocks any incoming Netflix Portal VAS requests (Add / Delete / Swap). This means:

- The customer cannot self-serve their Netflix VAS from the Netflix Portal while their plan change is pending.
- Netflix Portal requests are silently dropped, leading to a poor customer experience.

### Desired Behaviour (Solution)

The system must **accept and correctly process** Netflix Portal VAS change requests even when a pending future-dated activity exists, with the outcome determined by whether a Netflix Basic subscription will still be present on the profile **after** the Anniversary Batch runs.

---

## 2. Scope of Pending Activity

### 2A. Pending Cancellation

The entire subscription is scheduled to be cancelled at anniversary.

### 2B. Pending Downgrade — sub-types

| Sub-type                                             | Example                                      |
| ---------------------------------------------------- | -------------------------------------------- |
| Dropping one or more **non-Netflix** subscription(s) | TrioBasic → CraveNetflix DuoBasic            |
| Dropping the **Netflix** subscription itself         | CraveNetflix DuoBasic → CraveDisney DuoBasic |
| Changing **Netflix tier**                            | TrioBasic → CraveNetflix DuoPremium          |

Each sub-type may have:

- No existing VAS on profile, **or**
- An existing VAS that will also be cancelled at anniversary, **or**
- An existing VAS that is retained under the new bundle

---

## 3. VAS Operations Requested via Netflix Portal

| Operation      | Condition                                                                       |
| -------------- | ------------------------------------------------------------------------------- |
| **Add VAS**    | No currently active VAS on profile                                              |
| **Delete VAS** | Active VAS exists (may or may not be scheduled for cancellation at anniversary) |
| **Swap VAS**   | Active VAS exists (may or may not be scheduled for cancellation at anniversary) |

---

## 4. Expected Outcomes (Acceptance Criteria)

The system's processing logic must satisfy the following decision tree:

```
Netflix Portal VAS request received
        │
        ▼
Does a future-dated activity exist on the profile?
        │
       YES
        │
        ▼
Will Netflix Basic subscription remain on the profile AFTER Anniversary Batch?
        │
   ┌────┴────────────────────────────────┐
  YES                                   NO
   │                                    │
   ▼                                    ▼
Process VAS change;              1. Retain VAS on profile
VAS is RETAINED                     UNTIL anniversary date
post-anniversary.                   (via Cancel-the-Cancel order)
                                 2. Remove VAS AT anniversary
                                    (via Anniversary Batch)
```

### Detailed Matrix

| Pending Activity                            | VAS Operation | Netflix Basic Remains Post-Anniversary? | Outcome                                            |
| ------------------------------------------- | ------------- | --------------------------------------- | -------------------------------------------------- |
| Cancellation / Downgrade (non-Netflix drop) | Add VAS       | Yes                                     | VAS added and retained at anniversary              |
| Cancellation / Downgrade (Netflix drop)     | Add VAS       | No                                      | VAS added now; removed at anniversary by batch     |
| Any downgrade (Netflix drop)                | Delete VAS    | No                                      | VAS deleted immediately or at anniversary          |
| Any downgrade (retain Netflix)              | Swap VAS      | Yes                                     | New VAS active; retained at anniversary            |
| Cancellation / Downgrade                    | Swap VAS      | No                                      | New VAS active until anniversary; removed by batch |

---

## 5. Implementation Flow

### 5.1 High-Level Architecture

```
Netflix Portal
      │  VAS Change Request (Add/Delete/Swap)
      ▼
Order API  ──────────────────────────────────────────────────────────►
  changePlan endpoint                                                 │
      │                                                               │
      │  [CHANGE] Relax "Decline" rule for future-dated profiles      │
      │                                                               │
      ▼                                                               │
Profile Lookup                                                        │
  - Identify pending future-dated activity type                       │
  - Determine post-anniversary Netflix Basic presence                 │
      │                                                               │
      ▼                                                               │
Decision Engine                                                       │
  ┌─────────────────────────────────────────────────────┐            │
  │  Netflix Basic will REMAIN post-anniversary?         │            │
  │  YES → Apply VAS change; mark for retention          │            │
  │  NO  → Apply VAS change NOW +                        │            │
  │         Create "Cancel-the-Cancel" order to keep     │            │
  │         VAS active until anniversary date            │            │
  └─────────────────────────────────────────────────────┘            │
      │                                                               │
      ▼                                                               ▼
Billing Process  ◄───────────────────────────────────────────────────┘
  [CHANGE] Respect future-dated profile flags during billing
      │
      ▼
Anniversary Batch
  - Apply pending downgrade/cancellation
  - Remove VAS if Netflix Basic is no longer present
  - Retain VAS if Netflix Basic persists
```

### 5.2 Component Changes

#### A. Order API — `changePlan` (Revert / Relax Decline Rule)

**File area:** `services/` or `serverless/` — order handling service  
**Change:** The current hard "Decline" guard that rejects VAS changes when a future-dated activity is detected must be **relaxed**. Instead of declining:

1. Inspect the pending activity type.
2. Query whether Netflix Basic will be present post-anniversary.
3. Route to the appropriate processing path (retain vs. cancel-at-anniversary).

```
Before:
  if profile.hasFutureDatedActivity() {
      return Decline  // ← REMOVE this blanket rule
  }

After:
  if profile.hasFutureDatedActivity() {
      return processWithFutureDateAwareness(profile, vasRequest)
  }
```

#### B. Billing Process — Future-Dated Profile Awareness

**File area:** `serverless/billing-process/`  
**Change:** The billing process must read and respect the future-dated flags set by the Order API so that:

- VAS charges are not incorrectly billed for the period after its scheduled removal.
- "Cancel-the-Cancel" orders are honoured and not overridden by the billing cycle.

#### C. Feature Toggle

A feature flag must gate both changes above so that the new behaviour can be enabled/disabled without a deployment.

**Expected flag key:** e.g., `vas-future-dated-activity-enabled`

```go
if featureflag.IsEnabled("vas-future-dated-activity-enabled") {
    // new relaxed path
} else {
    // existing decline path
}
```

See `pkg/featureflag/` for the existing feature flag infrastructure.

---

## 6. Implementation Checklist

### Admin

- [ ] Create feature toggle (`vas-future-dated-activity-enabled`)
- [ ] Create Test Plan
- [ ] Execute Test Plan

### Functional

- [ ] **Order API (`changePlan`):** Remove/relax hard "Decline" rule for future-dated profiles
- [ ] **Order API (`changePlan`):** Add logic to determine post-anniversary Netflix Basic presence
- [ ] **Order API (`changePlan`):** Emit "Cancel-the-Cancel" compensating order when Netflix Basic will no longer be present
- [ ] **Billing Process:** Ensure future-dated profile flags are read and respected during billing cycle
- [ ] **Anniversary Batch:** Confirm batch correctly removes VAS when Netflix Basic subscription is no longer present
- [ ] Unit tests for each new branch in the decision engine
- [ ] Integration tests covering all 3 VAS operations × all pending activity sub-types

---

## 7. Risk & Considerations

| Risk                                                                            | Mitigation                                                                                |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| "Cancel-the-Cancel" order conflicts with existing cancellation order sequencing | Ensure order processing is idempotent; add integration tests for order conflict scenarios |
| Billing double-charge during the gap between VAS addition and anniversary       | Billing Process change must pro-rate or suppress charges correctly                        |
| Feature toggle not propagated to all environments before PI release             | Gate behind toggle; verify toggle is active in all target environments pre-release        |
| Anniversary Batch timing race condition (VAS added same day as anniversary)     | Define clear cutoff time; document in runbook                                             |

---

## 8. References

- **Jira Story:** [APOART-2199](https://jira.bell.corp.bce.ca/browse/APOART-2199)
- **Parent Epic:** [APOART-1834](https://jira.bell.corp.bce.ca/browse/APOART-1834) — Katsumi Future Enhancements
- **ART:** [Acquisition, Pricing and Offers ART](https://jira.bell.corp.bce.ca/browse/APOART)
- **Related packages:** `pkg/featureflag/`, `serverless/billing-process/`, `serverless/subscription-cancel-downgrade-batch-process/`

---

# APOART-2515: PROMO ENHANCE — Undo Pending Change AND Add Promotion in a Single Transaction

**Parent Epic:** [APOART-2046](https://jira.bell.corp.bce.ca/browse/APOART-2046) — Promotion Enhancements  
**Story:** [APOART-2515](https://jira.bell.corp.bce.ca/browse/APOART-2515)  
**Sprint:** APOART PI-26.3 | **Team:** BANANABYTE | **Priority:** Medium | **Points:** 20  
**Status:** UNCOVERED — TBC items still open (see Section 3)

---

## 1. The Business Idea (Plain Language)

Imagine a customer called in and changed their plan — for example, they downgraded from TrioPremium to TrioBasic. That change is now sitting as a **pending future-dated activity** on their account: it will take effect on their next anniversary date.

Now the customer calls back. They have changed their mind and want to **undo that downgrade**. At the same time, you want to **offer them a promotional discount** to keep them happy (a retention promo).

**Today's problem:**  
An agent must complete **two separate transactions**:

1. First transaction: Undo the pending downgrade.
2. Second transaction (after the first saves): Add the promotional discount.

This is slow, error-prone, and creates unnecessary friction. If the agent makes a mistake between the two transactions, the account could end up in a bad state.

**What this feature enables:**  
An agent (and potentially a customer via self-serve) can do both in **one shot** — reverse the pending change and apply a promotion simultaneously, in a single order submission.

---

## 2. The Technical Idea (Plain Language)

The BPP subscription platform processes cart transactions through a pipeline:

1. **Qualification** — the system determines what product offerings and promotions the customer is _eligible_ for, given their current profile and what actions are in the cart.
2. **Apply & Qualify** — the agent/customer selects actions (Add/Delete/Undo) and the system merges those into a cart session stored in DynamoDB.
3. **Submit to Order** — the cart is converted into an order and sent downstream (NM1 billing, subscriber manager, etc.).

Currently, **Undo is a valid cart action** (it reverses a pending `ACTIVETERMINATING` or `NEWACTIVATING` offering). Promotions can also be added separately as `Add` actions. The problem is that the qualification step does not currently return promotions as **selectable** during an Undo transaction — it treats Undo-only carts differently from the normal Add flow where promos appear.

The fix involves:

1. Making the **qualification step** return applicable promotions when the cart contains an Undo action.
2. Making the **Apply & Qualify mapper** allow a cart to contain both `Undo` (on offerings) and `Add` (on promotions) in the same transaction.
3. Ensuring the **order mapping** correctly handles the mixed Undo+Add-promo session when converting to a downstream order.

---

## 3. Open Items (TBC)

| #     | Item                                                            | Impact                                                                     |
| ----- | --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| TBC-1 | Which **promotions qualify** based on what is being undone      | Determines qualification rules in the rules engine / flow runner           |
| TBC-2 | Is this **agent-only** or also **customer-facing** (self-serve) | Determines whether `OriginatingFrom` checks are needed to gate the feature |

These must be resolved before implementation begins on the qualification rules and UI layers.

---

## 4. Acceptance Criteria

**Given** a pending transaction on an account being "undone" (reversed):

- Pending Cancellation → offering in state `ACTIVETERMINATING`
- Pending Addition → offering in state `NEWACTIVATING`

**When** the agent (and potentially the customer) initiates the Undo:

**Then** promotions shall be made **selectable within the same transaction**:

- The qualification response must include applicable promotions alongside the Undo items.
- The agent can select one or more promotions in the same cart as the Undo.
- The order submitted must include both the Undo operation on the offering AND the Add operation on the promotion.
- The downstream billing and subscriber profile must reflect both changes atomically.

---

## 5. Current Undo Flow (Before)

```
Agent UI
  │
  │  Cart payload: [ { action: "Undo", offering: X } ]
  ▼
subscription-configurator-api
  ├── apply_subscriber_to_cart.go
  │     Validates Undo is only applied to ACTIVETERMINATING or NEWACTIVATING items
  │
  ├── apply_and_qualify.go  (ApplyAndQualifyMapper)
  │     Merges Undo item into session cart
  │     Runs qualification → promotions NOT returned as selectable
  │
  └── convert_to_order.go
        Converts cart to order — Undo items only
  │
  ▼
subscription-manager (subscriptionToOrder)
  └── mapping.go
        isUndoNewActivating() guards: Undo+NEWACTIVATING items excluded from totals
        Undo+ACTIVETERMINATING promotions contribute positive delta to total (reversing the termination)
  │
  ▼
Order API → Billing → Subscriber Profile updated
```

---

## 6. Desired Flow (After)

```
Agent UI
  │
  │  Cart payload: [
  │    { action: "Undo",  type: "Offering",   offering: X  },   ← undo pending change
  │    { action: "Add",   type: "Promotion",  promotion: P }    ← add new promo (NEW)
  │  ]
  ▼
subscription-configurator-api
  ├── apply_subscriber_to_cart.go  (no change needed — already accepts Add for promotions)
  │
  ├── apply_and_qualify.go  (ApplyAndQualifyMapper)
  │     [CHANGE] Qualification must return selectable promotions when cart has Undo action
  │     [CHANGE] Allow mixed Undo (offering) + Add (promotion) in same cart
  │     [CHANGE] buildCartItemRelationships() must link new promo to the undone offering
  │
  └── convert_to_order.go
        [CHANGE] Include Add-promo items when cart also has Undo items
  │
  ▼
subscription-manager (subscriptionToOrder)
  └── mapping.go
        [CHANGE] Session total calculation includes Add-promo discount
                 (currently only Undo-of-existing-promo is handled)
  │
  ▼
Order API → Billing → Subscriber Profile updated (Undo reversal + new promo applied atomically)
```

---

## 7. Implementation Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│  1. QUALIFICATION                                                        │
│                                                                          │
│  GET /qualification (subscription-configurator-api)                      │
│    input: subscriber profile + current cart state (with Undo item)       │
│                                                                          │
│    qualificationMapper.go (subscription-manager)                         │
│      actionReasonMap["undo"] already registered                          │
│                                                                          │
│    [CHANGE] GetQualificationResponse()                                   │
│      When cart contains Undo action:                                     │
│        → include PromotionSpec qualification items as SELECTABLE         │
│        → apply TBC-1 rules: which promos qualify for this Undo scenario  │
│                                                                          │
│    Flow Runner (pkg/flow or pkg/flow-v2)                                 │
│      Runs policy rules to determine eligible promotions                  │
│      [CHANGE] Add Undo-context rule to promotion eligibility             │
└────────────────────────────────────────────────────────────────────────┘
         │
         ▼ Promotions returned as Selectable
┌────────────────────────────────────────────────────────────────────────┐
│  2. APPLY & QUALIFY (mutation)                                           │
│                                                                          │
│  POST /apply-and-qualify (subscription-configurator-api)                 │
│    input: { items: [ Undo(offering X), Add(promo P) ] }                  │
│                                                                          │
│  apply_and_qualify.go → GetPayloadCartItemRefsMap()                      │
│    validPayloadActions = ["Add", "Delete", "Undo"]  ← already OK        │
│    PromotionSpecification type already handled                           │
│                                                                          │
│  [CHANGE] buildCartItemRelationships()                                   │
│    Promotion action is "Add", offering action is "Undo"                  │
│    Currently promo→offering relationship matching requires action match  │
│    Need to allow: Promo(Add) ↔ Offering(Undo) relationship               │
│                                                                          │
│  [CHANGE] Incompatibility check                                          │
│    Current guard:                                                        │
│      !(innerAction == Delete/Undo && action == Add) ← already partial   │
│    Verify Add-promo + Undo-offering is not blocked as incompatible       │
└────────────────────────────────────────────────────────────────────────┘
         │
         ▼ Cart session saved to DynamoDB
┌────────────────────────────────────────────────────────────────────────┐
│  3. CONVERT TO ORDER & SUBMIT                                            │
│                                                                          │
│  convert_to_order.go (subscription-configurator-api)                     │
│    [CHANGE] Ensure Promo(Add) items are included in order output         │
│    when parent offering has action Undo (currently retained product       │
│    info logic checks for Add/Undo on offerings but not mixed promo add)  │
│                                                                          │
│  subscriptionToOrder/mapping.go (subscription-manager)                  │
│    getBenefitRecurringDiscount() already handles Undo multipliers        │
│    [CHANGE] Session total: include Add-promo discount in total           │
│      Currently: only Undo(promo, ACTIVETERMINATING) adds +discount       │
│      New: Add(promo) also subtracts discount from total                  │
│                                                                          │
│  subscriptionCart/mapping.go (subscription-manager)                     │
│    Subscriber total calculation:                                         │
│      Current guard (line ~551): allows Undo promo if eligible state      │
│      [CHANGE] Also allow Add promo when Undo offering is in same session │
└────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌───────────────────────────────┐
│  4. DOWNSTREAM                │
│  Order API                    │
│  NM1 Billing                  │
│  Subscriber Manager API       │
│  (no changes expected here)   │
└───────────────────────────────┘
```

---

## 8. Code-Level Change Guide

### 8.1 Qualification — Return Promos as Selectable During Undo

**File:** `services/subscription-configurator-api/internal/service/configurator/get_qualification.go`

When the incoming cart (or qualification context) contains an `Undo` action, the qualification response should include promotion items as `Selectable` rather than `NotApplicable`. The specific promotion eligibility rules are **TBC-1**.

```go
// Pseudocode — actual rule depends on TBC-1 resolution
if cartContainsUndoAction(session) {
    // Run promo qualification with Undo context
    // Return eligible promotions as Selectable
}
```

---

### 8.2 Apply & Qualify — Allow Undo(offering) + Add(promo) Relationship

**File:** `services/subscription-configurator-api/internal/service/configurator/apply_and_qualify.go`

In `buildCartItemRelationships()`, the promotion→offering relationship matching currently requires action parity. A new branch is needed:

```go
// Existing (simplified):
if childCartItem.Action == cartItemList[cartItemId].Action { ... }

// Add new case for Undo+Promo:
|| (cartItemList[cartItemId].Type == string(models.Promotion) &&
    cartItemList[cartItemId].Action == string(models.Add) &&
    childCartItem.Action == string(models.Undo))
```

---

### 8.3 Convert to Order — Include Promo Add When Offering is Undo

**File:** `services/subscription-configurator-api/internal/service/configurator/convert_to_order.go`

Verify (and fix if needed) that an `Add` promotion cart item is included in the converted order payload even when its related offering has action `Undo`.

```go
// Current check (line ~142):
strings.EqualFold(cartItem.Action, dto.ItemActionUndo)  // retains product info for undo offering

// Ensure promotion Add items also pass through when linked to Undo offering
```

---

### 8.4 Subscription Manager — Session Total Includes New Promo Discount

**File:** `serverless/subscription-manager/app/cmd/subscriptionToOrder/service/mapping.go`

The `isUndoNewActivating` guard (line ~372) already excludes Undo+NEWACTIVATING items from totals. The new scenario is `Add` promo in an Undo session:

```go
// Add promo discount to session total even when co-exists with Undo offering
// Similar to how Undo(ACTIVETERMINATING) promo adds +discount to reverse termination,
// Add(promo) should subtract the discount value from the session total
```

---

### 8.5 Feature Toggle

Gate the new qualification + cart behaviour behind a feature toggle using the existing `pkg/featureflag/` infrastructure:

```go
const PROMO_UNDO_SINGLE_TRANSACTION = "APOART-2515"

if configmanager.IsFeatureEnabledWithDefault(client, PROMO_UNDO_SINGLE_TRANSACTION, appName, false) {
    // new Undo + Add-promo path
}
```

---

## 9. Implementation Checklist

### Admin

- [ ] Create feature toggle `APOART-2515`
- [ ] Resolve TBC-1: define which promotions qualify during Undo transaction
- [ ] Resolve TBC-2: confirm agent-only vs. customer-facing scope
- [ ] Create Test Plan
- [ ] Execute Test Plan

### Functional

- [ ] `get_qualification.go`: Return promos as Selectable when cart has Undo action (pending TBC-1)
- [ ] `apply_and_qualify.go`: Allow Undo(offering) + Add(promo) relationship in `buildCartItemRelationships`
- [ ] `apply_and_qualify.go`: Verify incompatibility check does not block Undo+Add-promo combination
- [ ] `convert_to_order.go`: Include Add-promo items in order output when paired with Undo offering
- [ ] `subscriptionToOrder/mapping.go`: Include Add-promo discount in session total calculation
- [ ] `subscriptionCart/mapping.go`: Ensure subscriber total handles Add-promo in Undo session
- [ ] If TBC-2 resolves to agent-only: add `OriginatingFrom` guard to restrict to agent channels
- [ ] Unit tests for qualification with Undo context
- [ ] Unit tests for cart building with mixed Undo+Add-promo items
- [ ] Unit tests for session total with Add-promo in Undo session
- [ ] Integration tests for end-to-end Undo + Add-promo single transaction

---

## 10. Risk & Edge Cases

| Risk                                                                                  | Mitigation                                                                                                            |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| TBC-1 unresolved — wrong promos made selectable during Undo                           | Block implementation of qualification rule until explicitly defined; use feature toggle to isolate                    |
| Double-discount: existing promo being undone + new promo added in same transaction    | Session total logic must deduct only the net new discount; verify `isUndoNewActivating` guard still applies correctly |
| Promo already exists on profile (can't add duplicate)                                 | Qualification incompatibility rules should prevent this; add test case to confirm                                     |
| Undo reverses a pending cancellation but new promo is not valid for the reverted plan | Qualification must evaluate promo eligibility against the **post-Undo** profile state, not the current pending state  |
| Feature toggle rollout — partial state where Undo is done but promo not yet added     | Toggle ensures the combined path is all-or-nothing; no partial state is possible within the same cart submission      |

---

## 11. References

- **Jira Feature:** [APOART-2515](https://jira.bell.corp.bce.ca/browse/APOART-2515)
- **Parent Epic:** [APOART-2046](https://jira.bell.corp.bce.ca/browse/APOART-2046) — Promotion Enhancements
- **ART:** [Acquisition, Pricing and Offers ART](https://jira.bell.corp.bce.ca/browse/APOART)
- **Key source files:**
  - [services/subscription-configurator-api/internal/service/configurator/apply_and_qualify.go](services/subscription-configurator-api/internal/service/configurator/apply_and_qualify.go)
  - [services/subscription-configurator-api/internal/service/configurator/apply_subscriber_to_cart.go](services/subscription-configurator-api/internal/service/configurator/apply_subscriber_to_cart.go)
  - [services/subscription-configurator-api/internal/service/configurator/convert_to_order.go](services/subscription-configurator-api/internal/service/configurator/convert_to_order.go)
  - [services/subscription-configurator-api/internal/service/configurator/get_qualification.go](services/subscription-configurator-api/internal/service/configurator/get_qualification.go)
  - [serverless/subscription-manager/app/cmd/subscriptionToOrder/service/mapping.go](serverless/subscription-manager/app/cmd/subscriptionToOrder/service/mapping.go)
  - [serverless/subscription-manager/app/cmd/subscriptionCart/service/mapping.go](serverless/subscription-manager/app/cmd/subscriptionCart/service/mapping.go)
  - [serverless/subscription-manager/app/cmd/subscriptionQualificationMutation/service/qualificationMapper.go](serverless/subscription-manager/app/cmd/subscriptionQualificationMutation/service/qualificationMapper.go)
  - [pkg/featureflag/](pkg/featureflag/)

---

# APOART-2516: PROMO ENHANCE — Enable Promo Selection While Products Are in "ActiveTerminating" Status

**Parent Epic:** [APOART-2046](https://jira.bell.corp.bce.ca/browse/APOART-2046) — Promotion Enhancements  
**Story:** [APOART-2516](https://jira.bell.corp.bce.ca/browse/APOART-2516)  
**Sprint:** APOART PI-26.3 | **Team:** BANANABYTE | **Priority:** Medium | **Points:** 20  
**Requirement Status:** UNCOVERED — No acceptance criteria entered yet (shell feature)

---

## 1. The Business Idea (Plain Language)

When a customer decides to cancel or downgrade their subscription, their plan enters a **"pending cancellation"** state. The plan is still active today but is scheduled to end on their next anniversary date. In the system this state is called **`ACTIVETERMINATING`** — it means "active now, but terminating soon."

**Today's problem:**  
While a product is in this `ACTIVETERMINATING` state, agents (and customers) **cannot select or apply any new promotions** to it. The system treats these profiles as if they are already done, so retention promotions (discounts) cannot be applied.

**Why this matters for the business:**  
This is a missed retention opportunity. A customer who is scheduled to cancel is exactly the person you want to offer a promo to — but the system won't let you. Agents must either:

- Call back after the cancellation takes effect (too late), or
- First undo the cancellation, then offer a promo as a second transaction (slow and complex)

**What this feature enables:**  
An agent (and potentially a customer) can select and apply a promotional discount to a plan that is in `ACTIVETERMINATING` status — without first needing to reverse the cancellation.

> This feature is the **qualification-side enablement** (can the promo be shown/selected?). It is closely related to [APOART-2515](./APOART-2515.md) which handles the **transaction-side** (undo + add promo in one submit).

---

## 2. The Technical Idea (Plain Language)

In the subscription configurator pipeline, every product offering and promotion on a customer's profile goes through a **qualification** step — a rules engine decides whether each item is `Qualified` (selectable), `Unqualified` (not available), or `Recommended` for the customer.

There are **two separate blockers** that prevent promo selection on `ACTIVETERMINATING` offerings today:

### Blocker 1 — Cart Lock

In `initialize_cart_mapper.go`, the function `determineIfCartIsLockedLegacy()` locks the cart entirely when any offering, product, or promotion is in `activeTerminating` state. A **locked cart** prevents any action from being taken — add, delete, or select a promo.

The **new** `determineIfCartIsLocked()` function (gated by the `LOCK_FUTURE_DATED_ORDERS` env var) already removes `activeTerminating` from the lock conditions. Enabling this new function is step one.

### Blocker 2 — Qualification Rules

Even with an unlocked cart, the flow runner's policy rules determine promo eligibility. Currently, the qualification rules require the target offering to be in `ACTIVE` state before a promotion is considered `Qualified`. When the offering is `ACTIVETERMINATING`, promos are returned as `Unqualified` or not returned at all.

The fix is to update the qualification rules (in the flow runner / policy rule configurator) to allow certain promotions to be `Qualified` even when their target offering is in `ACTIVETERMINATING` state.

### Blocker 3 — Cart Management Logic

After the flow runner runs, `setPromotionQualificationOutcome()` in `apply_and_qualify.go` determines what happens to a promotion cart item based on the qualification result. If the promotion outcome is `Unqualified`, the promo is either removed or set to `Delete`. This logic needs to handle the `ACTIVETERMINATING` scenario gracefully.

---

## 3. Glossary

| Term                                   | Meaning                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `ACTIVETERMINATING`                    | Offering/promotion is active now but pending termination at anniversary date                            |
| **Cart Lock**                          | A flag set on the cart that prevents any modification; shown as locked state in the UI                  |
| **Qualification**                      | The rules engine process that decides what offerings and promotions a customer can select               |
| **Flow Runner**                        | The rules execution engine in `pkg/flow` / `pkg/flow-v2` that evaluates policy rules                    |
| **Policy Rule**                        | A business rule stored in the Policy Rule Configurator API that the Flow Runner evaluates               |
| **Qualification Outcome**              | The result state (`Qualified`, `Unqualified`, `Recommended`) assigned to each cart item after rules run |
| **`setPromotionQualificationOutcome`** | Function in `apply_and_qualify.go` that translates flow runner results into cart item actions           |
| `LOCK_FUTURE_DATED_ORDERS`             | Environment variable that controls which cart-locking logic is used                                     |

---

## 4. Acceptance Criteria

> ⚠️ **No acceptance criteria have been entered in Jira yet.** This section is a proposed set based on the feature description and related codebase analysis. Must be confirmed with the Product Owner.

**Given** a customer's subscription profile where one or more offerings/products are in `ACTIVETERMINATING` state (pending cancellation or downgrade):

**When** an agent (or customer, TBC) views available options:

**Then** promotions that are applicable to the `ACTIVETERMINATING` offering must be returned as **Selectable/Qualified** in the qualification response.

**And When** the agent selects and applies a promotion:

**Then** the promotion is successfully added to the profile and processed in the order, with the appropriate state and billing impact.

### Proposed Sub-criteria

| #    | Scenario                                                         | Expected Behaviour                                                                        |
| ---- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| AC-1 | Profile with ACTIVETERMINATING offering, agent opens cart        | Cart is NOT locked; profile is accessible                                                 |
| AC-2 | Qualification is run for ACTIVETERMINATING profile               | Applicable promotions appear as Qualified/Selectable                                      |
| AC-3 | Agent adds promotion to ACTIVETERMINATING offering               | Promotion accepted; cart shows Add action on promo                                        |
| AC-4 | Agent submits order with promotion on ACTIVETERMINATING offering | Order processed; promo applied; billing updated                                           |
| AC-5 | Promotion effective period                                       | Promo is active for the remaining period before anniversary; terminated with the offering |
| AC-6 | Regression — ACTIVE profile                                      | No change to existing promo selection behaviour for fully active offerings                |

---

## 5. Current Flow (Blocked Path)

```
Agent opens cart for customer with ACTIVETERMINATING offering
        │
        ▼
initialize_cart_mapper.go → determineIfCartIsLockedLegacy()
        │
        │  ACTIVETERMINATING found in offerings/promotions/products
        ▼
Cart State = LOCKED  ◄── BLOCKER 1: no actions possible
        │
        (even without lock)
        ▼
Qualification → Flow Runner → Policy Rules
        │
        │  Offering state = ACTIVETERMINATING → Promo = Unqualified
        ▼
Promotions NOT returned as Selectable  ◄── BLOCKER 2
        │
        (even if promo is returned)
        ▼
setPromotionQualificationOutcome()
        │
        │  Unqualified → Delete or Drop
        ▼
Promo removed from cart  ◄── BLOCKER 3
```

---

## 6. Desired Flow (After Fix)

```
Agent opens cart for customer with ACTIVETERMINATING offering
        │
        ▼
initialize_cart_mapper.go → determineIfCartIsLocked()  [new function]
        │
        │  ACTIVETERMINATING NOT in lock conditions
        ▼
Cart State = ACTIVE  (accessible)
        │
        ▼
Qualification → Flow Runner → Policy Rules
        │
        │  [CHANGE] New rule: ACTIVETERMINATING offering + eligible promo → Qualified
        ▼
Promotions returned as Selectable/Qualified
        │
        ▼
Agent selects promotion → Apply & Qualify
        │
        ▼
setPromotionQualificationOutcome()
        │
        │  [CHANGE] Qualified on ACTIVETERMINATING target → Add promo
        ▼
Promo added to cart with correct state
        │
        ▼
Convert to Order → Submit
        │
        ▼
NM1 Billing + Subscriber Manager
  - Promo applied for remaining period
  - Promo terminated with offering on anniversary date
```

---

## 7. Implementation Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 1: Remove Cart Lock for ACTIVETERMINATING                        │
│                                                                        │
│  initialize_cart_mapper.go                                             │
│    determineIfCartIsLocked() — NEW function (already exists)           │
│      Does NOT lock on activeTerminating                                │
│    determineIfCartIsLockedLegacy() — OLD function                      │
│      Locks on activeTerminating (current behaviour)                    │
│                                                                        │
│  [CHANGE] Ensure LOCK_FUTURE_DATED_ORDERS=false in all environments    │
│  OR: remove the env var gate and promote new function as default       │
│  OR: add a feature toggle to control lock behaviour independently      │
│                                                                        │
│  Also in determineIfCartIsLockedLegacy used for promo lock check:      │
│    Line ~1080: locks when promo.State == activeTerminating             │
│    [CHANGE] Remove activeTerminating from this promo lock condition    │
└──────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 2: Qualification Rules — Allow Promos for ACTIVETERMINATING     │
│                                                                        │
│  pkg/flow (or flow-v2) + services/policy-rule-configurator-api        │
│    Policy rules determine Qualified/Unqualified for each item          │
│                                                                        │
│  [CHANGE] Add / update policy rule:                                    │
│    IF offering.state == ACTIVETERMINATING                              │
│    AND promotion matches offering's product type                       │
│    AND promotion is a retention-type promotion                         │
│    THEN return Qualified for that promotion                            │
│                                                                        │
│  get_qualification.go (subscription-configurator-api)                 │
│    Passes offerings + promotions to flow runner                        │
│    [CHANGE] Ensure ACTIVETERMINATING offerings are included in the     │
│    qualification context (not filtered out before flow runner runs)    │
└──────────────────────────────────────────────────────────────────────┘
         │
         ▼ Promotions returned as Qualified
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 3: Apply & Qualify — Cart Item Action for ACTIVETERMINATING     │
│                                                                        │
│  apply_and_qualify.go                                                  │
│    setPromotionQualificationOutcome() [line ~1894]                     │
│      Current: Qualified → Add; Unqualified → Delete/Drop              │
│                                                                        │
│    buildCartItemRelationships()                                        │
│      Promo-offering relationship matching:                             │
│        Currently checks state parity for promo ↔ offering match       │
│      [CHANGE] Allow Add-promo ↔ ACTIVETERMINATING offering link        │
│                                                                        │
│    ApplyCartItems()                                                    │
│      When a new promo is added to an ACTIVETERMINATING offering:       │
│      [CHANGE] Ensure the promo is linked to the ACTIVETERMINATING      │
│      offering and carries through to the order (not dropped as New)    │
└──────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 4: Order Conversion + Billing                                   │
│                                                                        │
│  convert_to_order.go (subscription-configurator-api)                  │
│    [VERIFY] Promotion Add on ACTIVETERMINATING offering passes through │
│    subscriptionToOrder/mapping.go (subscription-manager)              │
│    [VERIFY] Session total calculation includes promo discount          │
│             when offering is ACTIVETERMINATING                         │
│                                                                        │
│  serverless/billing-process                                            │
│    [VERIFY] Promo billing event correctly uses ACTIVETERMINATING       │
│             multiplier (see UndoMultiplierPromotion in event_mapper)   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 8. Code-Level Change Guide

### 8.1 Remove Cart Lock for ACTIVETERMINATING

**File:** `services/subscription-configurator-api/internal/service/configurator/initialize_cart_mapper.go`

Two places to update:

**A. `determineIfCartIsLockedLegacy()`** — legacy function still locks on `activeTerminating`:

```go
// REMOVE these checks from determineIfCartIsLockedLegacy (lines ~1068-1084):
strings.EqualFold(offer.State, activeTerminating)   // offering lock
strings.EqualFold(promo.State, activeTerminating)   // promo lock
strings.EqualFold(product.State, activeTerminating) // product lock
```

**B. `mapCartItems()` / environment gate** — ensure new `determineIfCartIsLocked()` is default:

```go
// Current gating:
if os.Getenv("LOCK_FUTURE_DATED_ORDERS") == "" || strings.EqualFold(os.Getenv("LOCK_FUTURE_DATED_ORDERS"), "false") {
    isCartLocked = determineIfCartIsLocked(sub, aggrStatusCode)  // new (no AT lock)
} else {
    isCartLocked = determineIfCartIsLockedLegacy(sub, aggrStatusCode)  // old (locks AT)
}

// [CHANGE] Either remove the env var gate (default to new function),
// OR replace with feature toggle for controlled rollout
```

---

### 8.2 Qualification Rules — Qualify Promos on ACTIVETERMINATING

**Files:**

- Policy rules: `services/policy-rule-configurator-api/` (or the rule definitions consumed by the flow runner)
- Flow runner input: `services/subscription-configurator-api/internal/service/configurator/get_qualification.go`

The Flow Runner evaluates `QualificationOutcome` for each `PromotionSpec` item. The current rule likely requires `offering.state == ACTIVE`. A new rule branch is needed:

```
// Pseudocode — policy rule addition
IF targetOffering.state IN [ACTIVE, ACTIVETERMINATING]
AND promo.type IN [retention, discount]   // TBC: which promo types qualify
THEN QualificationOutcome = Qualified
```

---

### 8.3 Cart Management — Link Promo to ACTIVETERMINATING Offering

**File:** `services/subscription-configurator-api/internal/service/configurator/apply_and_qualify.go`

In `buildCartItemRelationships()`, the promotion→offering child matching currently requires state parity:

```go
// Current (simplified, ~line 510):
strings.EqualFold(cartItemList[cartItemId].Promotion.State, cartItemInner.Offering.State)

// [CHANGE] Also allow: New promo linked to ACTIVETERMINATING offering
|| (strings.EqualFold(cartItemList[cartItemId].Promotion.State, string(models.New)) &&
    strings.EqualFold(cartItemInner.Offering.State, ACTIVETERMINATING))
```

In `setPromotionQualificationOutcome()` (~line 1894), ensure `Qualified` result on an `ACTIVETERMINATING` offering results in `Add` action, not `Delete`:

```go
func (m *ApplyAndQualifyMapper) setPromotionQualificationOutcome(cartItem *dynamodbModels.CartItem, qualificationState string) {
    // [CHANGE] Do not delete promo if its target offering is ACTIVETERMINATING and promo is newly qualified
    if strings.Contains(qualificationState, string(models.Qualified)) {
        cartItem.Action = string(models.Add)
        return
    }
    // existing Unqualified handling...
}
```

---

### 8.4 Feature Toggle

Gate all changes under a feature toggle using the existing `pkg/featureflag/` infrastructure:

```go
const PROMO_ACTIVE_TERMINATING = "APOART-2516"

if configmanager.IsFeatureEnabledWithDefault(client, PROMO_ACTIVE_TERMINATING, appName, false) {
    // new ACTIVETERMINATING promo selection path
}
```

---

## 9. Relationship to APOART-2515

These two features are sister stories under APOART-2046:

| Feature                      | Scope                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| **APOART-2516 (this story)** | **Qualification** — Can a promo be shown and selected when the offering is ACTIVETERMINATING? |
| **APOART-2515**              | **Transaction** — Can an Undo AND a new promo be submitted in the same order transaction?     |

APOART-2516 is a **prerequisite** for APOART-2515 in the scenario where the agent adds a promo to an `ACTIVETERMINATING` profile without first undoing the cancellation. Both features share the cart lock fix in `initialize_cart_mapper.go`.

---

## 10. Implementation Checklist

### Admin

- [ ] Confirm acceptance criteria with Product Owner (currently none entered)
- [ ] Confirm which promotion types are selectable on ACTIVETERMINATING offerings
- [ ] Confirm agent-only vs. customer-facing scope
- [ ] Create feature toggle `APOART-2516`
- [ ] Create Test Plan
- [ ] Execute Test Plan

### Functional

- [ ] `initialize_cart_mapper.go`: Remove `activeTerminating` from `determineIfCartIsLockedLegacy()` lock conditions
- [ ] `initialize_cart_mapper.go`: Remove env var gate or replace with feature toggle to use new `determineIfCartIsLocked()` by default
- [ ] Policy rule / Flow runner: Add qualification rule for promo eligibility on ACTIVETERMINATING offerings
- [ ] `get_qualification.go`: Ensure ACTIVETERMINATING offerings are included in flow runner qualification context
- [ ] `apply_and_qualify.go` (`buildCartItemRelationships`): Allow promo→ACTIVETERMINATING offering relationship
- [ ] `apply_and_qualify.go` (`setPromotionQualificationOutcome`): Ensure Qualified result on ACTIVETERMINATING target sets Add action
- [ ] `apply_and_qualify.go` (`ApplyCartItems`): Ensure new promo on ACTIVETERMINATING offering is not dropped
- [ ] `convert_to_order.go`: Verify promo Add on ACTIVETERMINATING offering passes through to order
- [ ] `subscriptionToOrder/mapping.go`: Verify session total includes promo discount on ACTIVETERMINATING offering
- [ ] Unit tests: Cart locking — ACTIVETERMINATING no longer locks cart
- [ ] Unit tests: Qualification — promo returned as Qualified for ACTIVETERMINATING offering
- [ ] Unit tests: Cart management — promo Add linked to ACTIVETERMINATING offering
- [ ] Integration tests: End-to-end promo selection and submission on ACTIVETERMINATING profile

---

## 11. Risk & Edge Cases

| Risk                                                                                    | Mitigation                                                                                                                        |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Billing customer for a promo on an offering that terminates at anniversary              | Promo effective period must be capped at the offering's expiry date; verify in `createVasRenewalSettings` / billing process       |
| Cart lock removal causes other pending-change scenarios to become editable unexpectedly | Use feature toggle to gate; regression test all existing ACTIVETERMINATING cart scenarios                                         |
| Promotion remains active after offering is terminated at anniversary                    | Anniversary Batch must include promo termination alongside offering termination                                                   |
| Qualifying wrong promo types (e.g., upgrade promos on a terminating offering)           | Policy rule must restrict to retention/discount promo types only (TBC with PO)                                                    |
| Double discount: existing promo already on profile + new promo added                    | Incompatibility rules in `buildCartItemRelationships` should block duplicate promos; add test cases                               |
| `skipPromotionMapping` skips ACTIVETERMINATING promos during cart init                  | Current code only skips `terminating`/`terminated` promos — `activeTerminating` promos already pass through; verify no regression |

---

## 12. References

- **Jira Feature:** [APOART-2516](https://jira.bell.corp.bce.ca/browse/APOART-2516)
- **Parent Epic:** [APOART-2046](https://jira.bell.corp.bce.ca/browse/APOART-2046) — Promotion Enhancements
- **Sister feature:** [APOART-2515.md](./APOART-2515.md) — Undo + Add Promo in single transaction
- **ART:** [Acquisition, Pricing and Offers ART](https://jira.bell.corp.bce.ca/browse/APOART)
- **Key source files:**
  - [services/subscription-configurator-api/internal/service/configurator/initialize_cart_mapper.go](services/subscription-configurator-api/internal/service/configurator/initialize_cart_mapper.go) — cart lock logic
  - [services/subscription-configurator-api/internal/service/configurator/apply_and_qualify.go](services/subscription-configurator-api/internal/service/configurator/apply_and_qualify.go) — cart management & qualification outcome
  - [services/subscription-configurator-api/internal/service/configurator/get_qualification.go](services/subscription-configurator-api/internal/service/configurator/get_qualification.go) — qualification flow runner input
  - [services/subscription-configurator-api/internal/service/configurator/convert_to_order.go](services/subscription-configurator-api/internal/service/configurator/convert_to_order.go) — order conversion
  - [serverless/subscription-manager/app/cmd/subscriptionToOrder/service/mapping.go](serverless/subscription-manager/app/cmd/subscriptionToOrder/service/mapping.go) — session total calculation
  - [pkg/featureflag/](pkg/featureflag/) — feature toggle infrastructure

---

# APOART-2568: ANNIVERSARY — Change VAS When Pending Future-Dated Activity Exists (Cancel Pending Order Enhancement)

**Parent Epic:** [APOART-1834](https://jira.bell.corp.bce.ca/browse/APOART-1834) — Katsumi Future Enhancements (bucket)  
**Story:** [APOART-2568](https://jira.bell.corp.bce.ca/browse/APOART-2568)  
**Sprint:** APOART PI-26.3 | **Team:** BANANABYTE | **Priority:** Medium | **Points:** 20  
**Benefit Hypothesis:** Enable customer to change their Netflix VAS even if they are pending cancellation or downgrade

---

## 1. Relationship to APOART-2199

This story is a **companion to** [APOART-2199](./APOART-2199.md). They share the same high-level goal — allow VAS changes on profiles with pending future-dated activity — but cover **different channels and operations**:

| Story                        | Channel                   | Operations                    | Outcome Logic                                                                              |
| ---------------------------- | ------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------ |
| **APOART-2199**              | Netflix Portal            | Add VAS, Delete VAS, Swap VAS | Anniversary-aware: VAS fate depends on whether Netflix Basic will survive post-anniversary |
| **APOART-2568 (this story)** | OrderMax, MyBell, OneView | **Delete VAS only**           | Immediate: VAS removed now; Netflix Basic subscription stays pending as-is                 |

The billing-side implementation of APOART-2199 is covered in [BANANABYTE-833](./BANANABYTE-833.md).

---

## 2. The Business Idea (Plain Language)

A customer has a Netflix upgrade add-on (VAS — e.g., Netflix Standard or Premium). They have also requested a future plan change — either a full cancellation or a bundle downgrade — scheduled to take effect on their next anniversary date.

Now the customer (via self-serve in MyBell) or an agent (via OrderMax or OneView) wants to **remove the Netflix VAS upgrade immediately** — for example, they want to drop back to the included Netflix Basic tier right now, without waiting for the anniversary.

**Today's problem:**  
The Order API's `changePlan` endpoint has a blanket **"Decline" rule** that rejects any plan change request when a future-dated activity exists on the profile. This means the customer and agent cannot delete the VAS upgrade at all — they are blocked.

**What this feature enables:**  
Allow the Delete VAS request to go through immediately, regardless of the pending future-dated activity:

- The VAS upgrade is **terminated now** (fulfillment + billing updated immediately).
- The Netflix Basic subscription (which is part of the bundle) **remains on the profile** in its current pending state, still scheduled to be processed either by the Anniversary Batch or a separate cancel of the future-dated activity.

---

## 3. The Technical Idea (Plain Language)

Think of the profile as having two separate timelines running in parallel:

```
NOW ──────────────────────────── ANNIVERSARY DATE
│                                       │
│  VAS (Netflix Premium)                │  VAS terminated here (by anniversary)
│  [ACTIVETERMINATING]                  │
│                                       │
│  Bundle (e.g. TrioBasic)              │  Bundle cancelled/changed here
│  [ACTIVETERMINATING]                  │
│                                       │
│  Netflix Basic (bundled item)         │  Netflix terminates/changes here
│  [ACTIVETERMINATING]                  │
```

The customer wants to remove the VAS upgrade **today**, not at the anniversary. The result should be:

```
NOW ──────────────────────────── ANNIVERSARY DATE
│                                       │
│  VAS: TERMINATED ← immediately        │  (gone)
│                                       │
│  Bundle [ACTIVETERMINATING] ────────► │  → cancelled/changed at anniversary
│                                       │
│  Netflix Basic [ACTIVETERMINATING] ── │  → cancelled/changed at anniversary
```

The Order API currently blocks this with a "Decline" rule because it sees the future-dated activity and refuses all changes. The fix is to **relax that rule specifically for Delete VAS** requests coming from OrderMax, MyBell, and OneView, and then process the deletion immediately through fulfillment and billing without touching the pending bundle/Netflix activity.

---

## 4. Glossary

| Term                      | Meaning                                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **VAS**                   | Value Added Service — a Netflix tier upgrade add-on (e.g., Netflix Standard, Premium)                                                  |
| **Pending Cancellation**  | A future-dated order that will fully cancel the bundle at anniversary date                                                             |
| **Pending Bundle Change** | A future-dated order that changes the customer's plan at anniversary date                                                              |
| **Anniversary Batch**     | Nightly batch (`serverless/subscription-cancel-downgrade-batch-process`) that processes `ACTIVETERMINATING` items on their expiry date |
| **changePlan**            | The Order API endpoint that processes plan changes (Add/Delete/Swap of offerings)                                                      |
| **Decline rule**          | A guard in `changePlan` that rejects requests when the profile has pending future-dated activity                                       |
| **OrderMax**              | Bell's internal agent ordering system                                                                                                  |
| **MyBell**                | Bell's customer self-serve portal                                                                                                      |
| **OneView**               | Bell's internal agent CRM tool                                                                                                         |
| **Fulfillment**           | The process that cancels or activates entitlements with the streaming partner (Netflix)                                                |
| **NM1**                   | Bell's external billing platform                                                                                                       |

---

## 5. Scope of Pending Activity

### Pending Cancellation

The entire subscription is scheduled to be fully cancelled at anniversary.

### Pending Bundle Change — Sub-types

| Sub-type                             | Example                                      | VAS Before Delete                                                                           |
| ------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Dropping non-Netflix subscription(s) | TrioBasic → CraveNetflix DuoBasic            | Without VAS / With VAS (also cancelling at anniversary) / With VAS (retained in new bundle) |
| Dropping Netflix subscription        | CraveNetflix DuoBasic → CraveDisney DuoBasic | Without VAS / With VAS (also cancelling at anniversary)                                     |
| Changing Netflix tier                | TrioBasic → CraveNetflix DuoPremium          | Without VAS / With VAS (also cancelling at anniversary)                                     |

---

## 6. Acceptance Criteria

**Given** existing BPP profiles with pending future-dated activity (as per the sub-types above):

**When** via **OrderMax, MyBell, or OneView** the customer/agent requests **Delete VAS** (where an active VAS exists on the profile):

- Where existing VAS is **also to be cancelled at anniversary** (ACTIVETERMINATING state, same expiry as bundle)
- Where existing VAS is **to be retained** with the new bundle (ACTIVETERMINATING on the old VAS, but new plan keeps Netflix)

**Then** the system shall:

| #   | Outcome                                                               | Mechanism                                                                     |
| --- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | VAS is **removed immediately** from profile                           | Fulfillment cancellation                                                      |
| 2   | VAS billing is **updated immediately**                                | NM1 billing event                                                             |
| 3   | Netflix Basic subscription **remains on profile** pending anniversary | Unchanged — Anniversary Batch or cancel future-dated activity will process it |

---

## 7. Current Flow (Blocked)

```
Customer/Agent (OrderMax / MyBell / OneView)
  │  Delete VAS Request
  ▼
Order API — changePlan endpoint
  │
  │  Guard: hasFutureDatedActivity(profile) == true
  ▼
DECLINE — request rejected  ◄── CURRENT BLOCKER
```

---

## 8. Desired Flow (After Fix)

```
Customer/Agent (OrderMax / MyBell / OneView)
  │  Delete VAS Request
  ▼
Order API — changePlan endpoint
  │
  │  [CHANGE] Relax "Decline" rule:
  │    IF action == DeleteVAS
  │    AND channel IN [OrderMax, MyBell, OneView]
  │    AND profile has future-dated activity
  │    THEN allow → proceed with immediate VAS deletion
  │
  ▼
Session Created (Delete VAS only — bundle/Netflix untouched)
  │
  ▼
Subscription Configurator API (Apply & Qualify)
  │  Cart: [ { action: Delete, type: VAS offering } ]
  │  [NOTE] Bundle + Netflix offering items: NoChange
  │
  ▼
Order Submitted
  │
  ├──► Fulfillment Process (serverless/fulfillment-process)
  │      CancelFulfillment for VAS
  │      → VAS entitlement terminated with streaming partner
  │
  └──► Billing Process (serverless/billing-process)
         VAS offering: state → TERMINATED
         Netflix Basic offering: state unchanged (ACTIVETERMINATING)
         Bundle offering: state unchanged (ACTIVETERMINATING)
  │
  ▼
Profile State After:
  Bundle:          ACTIVETERMINATING (unchanged)
  Netflix Basic:   ACTIVETERMINATING (unchanged)
  VAS Upgrade:     TERMINATED (removed immediately)
  │
  ▼
Anniversary Batch (on anniversary date)
  Processes ACTIVETERMINATING items with matching expiry date:
  → Bundle and Netflix Basic are terminated/changed per pending activity
  → VAS is already gone (nothing to do)
```

---

## 9. Implementation Flow Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│  1. ORDER API — Relax Decline Rule for Delete VAS                    │
│                                                                      │
│  services/ (Order API / changePlan)                                  │
│                                                                      │
│  Current:                                                            │
│    if profile.hasFutureDatedActivity() {                             │
│        return Decline  ← blanket reject                             │
│    }                                                                 │
│                                                                      │
│  [CHANGE] Relaxed:                                                   │
│    if profile.hasFutureDatedActivity() {                             │
│        if isDeleteVASRequest(request) &&                             │
│           channel IN [OrderMax, MyBell, OneView] &&                  │
│           featureflag.IsEnabled("APOART-2568") {                     │
│            return processImmediateVASDeletion(request)               │
│        }                                                             │
│        return Decline  ← still decline for other actions            │
│    }                                                                 │
└────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────────┐
│  2. SESSION CREATION — Delete VAS Only                               │
│                                                                      │
│  The session created must:                                           │
│    - Include Delete action for VAS offering only                     │
│    - Include NoChange for all other items (bundle, Netflix Basic,    │
│      any existing promotions)                                        │
│    - NOT include any items related to the pending future activity    │
│                                                                      │
│  services/subscription-configurator-api                              │
│    initialize_cart.go: session initialized with VAS Delete only      │
│    apply_and_qualify.go: qualification runs; VAS delete allowed      │
│      isActionAllowed("Delete", "ACTIVETERMINATING", channel) → true  │
│      [VERIFY] ValidStatesOnAction map permits Delete on AT state     │
└────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────────┐
│  3. FULFILLMENT — Cancel VAS Entitlement Immediately                 │
│                                                                      │
│  serverless/fulfillment-process                                      │
│    evaluateFulfillmentType():                                        │
│      VAS item: Action=Delete, no TierChangeOf relationship           │
│      → FulfillmentType = CancelFulfillment                           │
│                                                                      │
│  cancelMapping():                                                    │
│    → Sends cancellation event to streaming partner (Netflix)         │
│    → VAS entitlement cancelled immediately                           │
│                                                                      │
│  [VERIFY] RequiredDate on VAS Delete session item is set to today    │
│  (immediate = "true" in fulfillment payload)                         │
└────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────────┐
│  4. BILLING — Update NM1 Immediately for VAS                         │
│                                                                      │
│  serverless/billing-process                                          │
│    VAS offering sent to NM1 with state = TERMINATED                  │
│    expiry = today                                                    │
│                                                                      │
│  serverless/billing-process → subscriber_manager.go                  │
│    determineOfferingStateAndEffectivity():                           │
│      VAS item: action = Delete → state = TERMINATED, expiry = today  │
│                                                                      │
│    Subscriber Manager API updated:                                   │
│      VAS Offering: TERMINATED                                        │
│      VAS Product: TERMINATED                                         │
│      Netflix Basic Offering: unchanged (ACTIVETERMINATING)           │
│      Netflix Bundled Product: unchanged (remains ACTIVETERMINATING   │
│        or SUPPRESSEDTERMINATING — see BANANABYTE-833)                │
└────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────────┐
│  5. ANNIVERSARY BATCH — Processes Remaining Pending Activity         │
│                                                                      │
│  serverless/subscription-cancel-downgrade-batch-process              │
│    session_item_generator.go:                                        │
│      Queries DB for offerings with state=ACTIVETERMINATING           │
│      and expiry_time = run_date - 1                                  │
│                                                                      │
│    On anniversary date:                                              │
│      Bundle offering: ACTIVETERMINATING → Delete → TERMINATED        │
│      Netflix Basic: ACTIVETERMINATING → Delete → TERMINATED          │
│      VAS: already TERMINATED → NOT included in batch query           │
│                                                                      │
│    [VERIFY] DB query for ACTIVETERMINATING offerings does NOT pick   │
│    up already-TERMINATED VAS                                         │
└────────────────────────────────────────────────────────────────────┘
```

---

## 10. Code-Level Change Guide

### 10.1 Order API — Relax Decline Rule for Delete VAS

This is the **primary change** for this story. The existing "Decline" guard in `changePlan` must be updated to allow Delete VAS through when:

1. The request action is a VAS deletion (offering with `AddsOnTo` relationship)
2. The originating channel is OrderMax, MyBell, or OneView
3. The feature toggle `APOART-2568` is enabled

```go
// Pseudocode — Order API changePlan guard
if profile.HasFutureDatedActivity() {
    if featureflag.IsEnabled("APOART-2568") &&
       isDeleteVASAction(request) &&
       isAllowedChannel(request.OriginatingFrom, []string{"OrderMax", "MyBell", "OneView"}) {
        // Allow: process immediate VAS deletion
        return processOrder(request)
    }
    // Still decline for all other actions on future-dated profiles
    return ErrDeclined
}
```

Compare with APOART-2199 which relaxed the same rule for Netflix Portal Add/Delete/Swap.

---

### 10.2 Subscription Configurator API — Verify Delete Allowed on ACTIVETERMINATING

**File:** `services/subscription-configurator-api/internal/service/configurator/apply_and_qualify.go`

The `isActionAllowed()` function checks `ValidStatesOnAction` to determine if a Delete is permitted when the offering is in `ACTIVETERMINATING` state:

```go
func isActionAllowed(action string, state string, interaction string) (bool, bool) {
    allowedStates, ok := model.ValidStatesOnAction[strings.ToUpper(action)]
    // ...
}
```

**Verify** (and fix if needed) that `ValidStatesOnAction["DELETE"]` includes `"ACTIVETERMINATING"` as a permitted state. If it does not, add it under the feature toggle.

---

### 10.3 Fulfillment Process — Immediate Cancellation

**File:** `serverless/fulfillment-process/` (or `serverless/subscription-cancel-downgrade-batch-process/app/service/fulfillment/fulfillment.go`)

The `evaluateFulfillmentType()` function identifies a VAS Delete (action=Delete, no TierChangeOf relationship) as `CancelFulfillment`. The `cancelMapping()` path handles sending the cancellation to the streaming partner.

**Verify** the `RequiredDate` on the VAS delete session item is set to today so `isDateBeforeOrEqual(*item.RequiredDate, now())` returns `true`, ensuring `Immediate = "true"` in the fulfillment payload.

---

### 10.4 Billing Process — Subscriber Profile Update

**File:** `serverless/billing-process/app/service/internal/subscriber_manager.go`

`determineOfferingStateAndEffectivity()` already handles `ItemActionDelete`:

```go
case model.ItemActionDelete:
    state = model.StateTERMINATED
    effectivity.EndDateTime = today
```

**Verify** that only the VAS offering and VAS product state transitions to `TERMINATED`. The Netflix Basic offering, Netflix Bundled product, and Bundle offering must **not** be included in this billing update (they should not appear in the session with any state change).

Also cross-reference with [BANANABYTE-833](./BANANABYTE-833.md): when VAS was added to a pending-cancel profile, the Netflix Bundled Product was set to `SUPPRESSEDTERMINATING`. If this VAS Delete happens on a profile where the VAS was previously added in that way:

- Netflix Bundled Product should revert: `SUPPRESSEDTERMINATING` → `ACTIVETERMINATING` (as described in BANANABYTE-833 Scenario B)

---

### 10.5 Anniversary Batch — No Changes Expected

**File:** `serverless/subscription-cancel-downgrade-batch-process/app/service/internal/session_item_generator.go`

The batch already queries for offerings in `ACTIVETERMINATING` or `SUPPRESSEDTERMINATING` state with matching expiry dates:

```go
if (offeringState == STATE_ACTIVETERMINATING || offeringState == STATE_SUPPRESSEDTERMINATING) &&
   isSameDate(expiryDate, expiryTime) {
    action = STATE_DELETE
}
```

Once the VAS is in `TERMINATED` state (after the immediate deletion), it will **not** match this query. The batch will correctly process only the remaining `ACTIVETERMINATING` items (bundle, Netflix Basic).

**Verify:** DB query does not return TERMINATED offerings. No batch code changes expected.

---

### 10.6 Feature Toggle

```go
const VAS_DELETE_PENDING_PROFILE = "APOART-2568"

if utils.IsFeatureEnabledWithDefault(client, VAS_DELETE_PENDING_PROFILE, "order-api", false) {
    // Allow Delete VAS on pending profile
}
```

---

## 11. Comparison: APOART-2568 vs APOART-2199 (Delete VAS)

Both stories handle "Delete VAS when future-dated activity exists" but through different channels with different outcomes:

| Aspect                | APOART-2199 (Netflix Portal)                 | APOART-2568 (OrderMax/MyBell/OneView)                           |
| --------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| Channel               | Netflix Portal                               | OrderMax, MyBell, OneView                                       |
| Operations            | Add, Delete, Swap VAS                        | Delete VAS only                                                 |
| VAS removal timing    | Immediate                                    | Immediate                                                       |
| VAS removal mechanism | Cancel-the-Cancel or direct delete           | Direct delete                                                   |
| Netflix Basic fate    | Determined by post-anniversary profile check | Unchanged — remains ACTIVETERMINATING                           |
| Order complexity      | Anniversary-aware (complex decision tree)    | Straightforward immediate deletion                              |
| Billing state change  | Aligned with parent Netflix offering state   | VAS → TERMINATED; rest unchanged                                |
| Bundled Product state | May set/unset SUPPRESSEDTERMINATING          | Reverts SUPPRESSEDTERMINATING → ACTIVETERMINATING if applicable |

---

## 12. Implementation Checklist

### Admin

- [ ] Create feature toggle `APOART-2568`
- [ ] Create Test Plan
- [ ] Execute Test Plan

### Functional

- [ ] **Order API (`changePlan`):** Relax "Decline" rule for Delete VAS from OrderMax/MyBell/OneView channels when future-dated activity exists
- [ ] **Subscription Configurator API:** Verify `ValidStatesOnAction["DELETE"]` permits `ACTIVETERMINATING` state
- [ ] **Fulfillment Process:** Verify VAS Delete session item has `RequiredDate = today` for immediate cancellation
- [ ] **Billing Process:** Verify only VAS offering+product transitions to TERMINATED; bundle and Netflix Basic unchanged
- [ ] **Billing Process:** If VAS was previously added under BANANABYTE-833 flow (Bundled Product in SUPPRESSEDTERMINATING), revert Bundled Product to ACTIVETERMINATING on VAS Delete
- [ ] **Anniversary Batch:** Verify TERMINATED VAS is not included in batch query (no code change expected, but regression test required)
- [ ] Unit tests for relaxed Decline rule (Delete VAS allowed; Add/Swap VAS still declined)
- [ ] Unit tests for channel gating (only OrderMax/MyBell/OneView allowed; Netflix Portal still uses APOART-2199 path)
- [ ] Integration tests for all pending activity sub-types × both VAS-at-anniversary scenarios (retained vs. cancelling)

---

## 13. Risk & Edge Cases

| Risk                                                                                             | Mitigation                                                                                                                                                |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VAS Delete succeeds but Anniversary Batch also tries to delete it                                | Batch queries by `ACTIVETERMINATING`/`SUPPRESSEDTERMINATING` state only — TERMINATED VAS is excluded. Verify with DB query test                           |
| VAS Delete partially succeeds (billing done, fulfillment fails)                                  | Ensure fallout/retry process handles this; VAS state may be inconsistent — test with fulfillment failure injection                                        |
| Netflix Bundled Product stuck in `SUPPRESSEDTERMINATING` after VAS delete                        | Billing process must revert to `ACTIVETERMINATING` (linked to BANANABYTE-833 Scenario B)                                                                  |
| Agent deletes VAS via OrderMax on a profile where VAS was added via Netflix Portal (APOART-2199) | Both paths must be compatible; verify end state with cross-story integration test                                                                         |
| Feature toggle gap: APOART-2199 enabled, APOART-2568 not enabled                                 | Netflix Portal can Add VAS on pending profile, but agent cannot Delete it — partially inconsistent state. Define release order                            |
| Same-day Delete VAS and Anniversary run                                                          | If Delete VAS happens on anniversary day, batch may also process the bundle/Netflix. Ensure ordering is correct (VAS terminates, batch terminates bundle) |

---

## 14. References

- **Jira Feature:** [APOART-2568](https://jira.bell.corp.bce.ca/browse/APOART-2568)
- **Parent Epic:** [APOART-1834](https://jira.bell.corp.bce.ca/browse/APOART-1834) — Katsumi Future Enhancements
- **Companion story (Netflix Portal):** [APOART-2199.md](./APOART-2199.md)
- **Billing implementation:** [BANANABYTE-833.md](./BANANABYTE-833.md)
- **ART:** [Acquisition, Pricing and Offers ART](https://jira.bell.corp.bce.ca/browse/APOART)
- **Anniversary Batch Confluence:** https://confluence.bell.corp.bce.ca/spaces/HOORENOP/pages/1303362213/Cancels+and+Downgrades+-+Anniversary+Date+Solution
- **Key source files:**
  - [serverless/subscription-cancel-downgrade-batch-process/app/service/internal/session_item_generator.go](serverless/subscription-cancel-downgrade-batch-process/app/service/internal/session_item_generator.go)
  - [serverless/subscription-cancel-downgrade-batch-process/app/service/fulfillment/fulfillment.go](serverless/subscription-cancel-downgrade-batch-process/app/service/fulfillment/fulfillment.go)
  - [serverless/billing-process/app/service/internal/subscriber_manager.go](serverless/billing-process/app/service/internal/subscriber_manager.go)
  - [services/subscription-configurator-api/internal/service/configurator/apply_and_qualify.go](services/subscription-configurator-api/internal/service/configurator/apply_and_qualify.go)
  - [pkg/featureflag/](pkg/featureflag/)

---

# APOART-2467: TECH DEBT — NM1 Disconnect Lambdas

**Parent Epic:** [APOART-1912](https://jira.bell.corp.bce.ca/browse/APOART-1912) — Technical Debt - Subscriptions  
**Story:** [APOART-2467](https://jira.bell.corp.bce.ca/browse/APOART-2467)  
**Sprint:** APOART PI-26.3 | **Team:** BANANABYTE | **Priority:** High | **Points:** 15  
**Requirement Status:** UNCOVERED

---

## 1. The Business Idea (Plain Language)

When Bell's billing system (NM1) cancels a customer's account — for fraud, collections, or other agent-initiated reasons — it processes the disconnect directly in NM1 without going through BPP's subscription platform. This means the BPP subscription record (entitlements, subscriber profile, streaming access) is **not automatically cleaned up**.

Today, the cleanup for these cases is done **manually**: someone runs a SQL/script against EDW (Bell's data warehouse), extracts a list of affected subscribers, and then manually triggers a process to revoke their entitlements and update their billing records.

**What this feature does:**  
Automate that manual workflow for **each of the three NM1 disconnect categories** using a pair of Lambda functions per category:

1. **Lambda 1 (EDW Extractor):** Runs the EDW query automatically → writes the list of affected subscribers to an S3 file
2. **Lambda 2 (Processor):** Picks up the S3 file → runs **revoke** (cancel entitlement with streaming partner) and **terminate** (update NM1 billing) for each subscriber in the file

This brings Fraud, Collections, and agent-initiated disconnects up to the same automated standard — consistent, auditable, and no longer dependent on manual scripts.

---

## 2. The Technical Idea (Plain Language)

Think of it as two conveyor belts connected by an S3 file:

```
EDW (data warehouse)           S3 Bucket              BPP Systems
       │                           │                        │
  Lambda 1 runs                    │                        │
  SQL query for                    │                   Lambda 2 picks up
  reason code X      ─────────►  CSV file   ─────────► the file and for
  (Fraud / Collections             │         each subscriber:
   / Other)                        │           1. Revoke entitlement
       │                           │              (Reseller Service)
  Writes results to                │           2. Terminate billing
  S3 CSV                           │              (NM1 / AMSS)
                                   │           3. Update subscriber
                                   │              profile (Subscriber
                                   │              Manager API)
```

Lambda 2 is triggered **automatically** by an EventBridge S3 Object Created event the moment Lambda 1 drops the file.

---

## 3. Existing Infrastructure (Already Built — Reuse)

This story extends an established pattern already present in `serverless/bpp-data-clean-up/`. The existing Lambdas to reference are:

| Existing Lambda          | Handler                       | What it does                                                                                     |
| ------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `terminateFraudAccounts` | `cmd/terminateFraudAccounts/` | Reads S3 CSV → Revokes fulfillment (Reseller Service) → Updates subscriber profile to TERMINATED |
| `terminateNM1CleanUp`    | `cmd/terminateNM1/`           | Reads S3 CSV → Calls `billingCoreProcessor.TerminateSubscriberWithoutLogin` (AMSS/NM1 billing)   |

Both follow the same pattern:

- Input: EventBridge S3 Object Created event carrying `{ bucketName, objectKey, fileName, folderName }`
- Processing: concurrent goroutines (semaphore-limited) per subscriber record
- Error handling: failed records written back to S3 as `_errors.csv`
- Completion: source file moved to `_processed.csv` in folder

**The gap:** There is no Lambda 1 (EDW Extractor) that automatically generates the S3 CSV. Currently a manual script or support-team-run query fills that role.

---

## 4. Scope — Three Reason Code Categories

| Category        | Description                                             | Lambda Pair                                           |
| --------------- | ------------------------------------------------------- | ----------------------------------------------------- |
| **Fraud**       | NM1 disconnects with fraud reason codes                 | `edwFraudExtractor` → `fraudNM1Terminate`             |
| **Collections** | NM1 disconnects with collections reason codes           | `edwCollectionsExtractor` → `collectionsNM1Terminate` |
| **Other**       | Agent-initiated NM1 disconnects with other reason codes | `edwOtherDisconnectExtractor` → `otherNM1Terminate`   |

> Note from ticket: Support team (Ali or Hamza) will test before putting into production. Stories may be added per category if needed.

---

## 5. Required S3 CSV Format

Each Lambda 2 processor reads the same CSV format already established in `terminateNM1` and `terminateFraudAccounts`:

```
subscriber_id,ban
12345678,9001234567
87654321,9007654321
```

Lambda 1 must produce this exact format. The existing CSV parsing utility in `terminate_nm1_cleanup.go` (`ReadSubscriberIdAndBanFromCSV`) can be reused.

---

## 6. Architecture Flow (Per Category)

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAMBDA 1 — EDW Extractor (e.g. edwFraudExtractor)                  │
│                                                                      │
│  Trigger: EventBridge scheduled rule (cron) OR manual invocation     │
│                                                                      │
│  pkg/athenautil:                                                     │
│    AthenaQuery.GetQueryString()  → fetch named query from Athena     │
│    AthenaQuery.ExecuteQuery()    → run query against EDW             │
│      SQL: SELECT subscriber_id, ban FROM edw_table                   │
│           WHERE reason_code IN (fraud|collections|other codes)       │
│           AND disconnect_date BETWEEN <window>                       │
│           AND NOT EXISTS (already processed in BPP)                  │
│                                                                      │
│  pkg/s3util:                                                         │
│    S3Basics.UploadLargeObject()  → write CSV to S3 bucket            │
│      Key: fraud-terminations/YYYYMMDD_fraud.csv                      │
│           collections-terminations/YYYYMMDD_collections.csv          │
│           other-nm1-terminations/YYYYMMDD_other.csv                  │
└─────────────────────────────────────────────────────────────────────┘
         │  (S3 Object Created event fires automatically)
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAMBDA 2 — Processor (e.g. fraudNM1Terminate)                      │
│                                                                      │
│  Trigger: EventBridge S3 Object Created on prefix fraud-terminations/│
│                                                                      │
│  1. s3Util.GetFile() → read CSV                                      │
│  2. Parse CSV → list of { SubscriberId, BAN }                        │
│  3. Concurrent processing (semaphore, e.g. concurrency=5):           │
│                                                                      │
│     For each subscriber:                                             │
│       a. [Fraud / similar to terminateFraudAccounts]                 │
│          ResellerClient.GetSubscription()                            │
│          ResellerClient.RevokeSubscription() → reason code=Fraud/    │
│            Collections/Other                                         │
│          SubscriberClient.GetSubscriberProfile()                     │
│          SubscriberClient.UpdateSubscriberProfile() → TERMINATED     │
│                                                                      │
│       b. [Billing / similar to terminateNM1]                         │
│          billingCoreProcessor.TerminateSubscriberWithoutLogin()      │
│          → AMSS login ticket                                         │
│          → AMSS change subscriber status to disconnected             │
│                                                                      │
│  4. Error records → uploaded to S3 as _errors.csv                   │
│  5. Source file → moved to _processed.csv                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Code Structure

### New Lambda directories (under `serverless/bpp-data-clean-up/app/cmd/`)

```
cmd/
  terminateFraudAccounts/       ← exists, may need Lambda 1 companion
  terminateNM1/                 ← exists (generic NM1 terminator, reusable)

  [NEW] edwFraudExtractor/      ← Lambda 1 for Fraud category
    main.go
    model/
    service/

  [NEW] fraudNM1Terminate/      ← Lambda 2 for Fraud (revoke + terminate)
    main.go
    model/
    service/

  [NEW] edwCollectionsExtractor/   ← Lambda 1 for Collections
    main.go
    model/
    service/

  [NEW] collectionsNM1Terminate/   ← Lambda 2 for Collections
    main.go
    model/
    service/

  [NEW] edwOtherExtractor/      ← Lambda 1 for Other reason codes
    main.go
    model/
    service/

  [NEW] otherNM1Terminate/      ← Lambda 2 for Other
    main.go
    model/
    service/
```

> **Note:** Assess whether `terminateFraudAccounts` and `terminateNM1CleanUp` already cover Lambda 2 for Fraud/Other sufficiently. If so, new Lambda 2s may only be needed for **Collections**, and existing Lambdas updated for the others.

---

## 8. Code-Level Implementation Guide

### 8.1 Lambda 1 — EDW Extractor (All Three Categories)

**Model:**

```go
// model/edw_extractor.go
type EDWExtractorRequest struct {
    ReasonCodeCategory string    `json:"reasonCodeCategory"` // "fraud"|"collections"|"other"
    StartDate          string    `json:"startDate"`          // YYYY-MM-DD
    EndDate            string    `json:"endDate"`            // YYYY-MM-DD
    BucketName         string    `json:"bucketName"`
    OutputKeyPrefix    string    `json:"outputKeyPrefix"`    // e.g. "fraud-terminations/"
}

type SubscriberRecord struct {
    SubscriberId string `csv:"subscriber_id"`
    Ban          string `csv:"ban"`
}
```

**Service (reuses `pkg/athenautil`):**

```go
// service/edw_extractor.go
func (e *EDWExtractor) Extract(ctx context.Context, req model.EDWExtractorRequest) error {
    // 1. Get named query string from Athena (pre-configured in AWS)
    queryStr, err := e.athenaQuery.GetQueryString(ctx)

    // 2. Execute query against EDW
    queryResultKey, err := e.athenaQuery.ExecuteQuery(ctx, queryStr)

    // 3. Read Athena result from S3 output location
    resultFile, err := e.s3Util.GetFile(ctx, e.athenaOutputBucket, *queryResultKey)

    // 4. Parse into SubscriberRecord slice
    var records []model.SubscriberRecord
    gocsv.Unmarshal(resultFile.Body, &records)

    // 5. Write output CSV to trigger bucket
    csv, _ := gocsv.MarshalBytes(&records)
    outputKey := fmt.Sprintf("%s%s_%s.csv", req.OutputKeyPrefix, req.ReasonCodeCategory, time.Now().Format("20060102"))
    e.s3Util.UploadLargeObject(req.BucketName, outputKey, csv)
}
```

**Trigger:** Can be scheduled via EventBridge cron, or manually invoked for initial rollout (consistent with existing pattern — see `terminateFraudAccounts` which starts with `enabled: false`).

---

### 8.2 Lambda 2 — Processor (Per Category)

Each Lambda 2 follows the **exact same pattern** as `terminateFraudAccounts`. The difference is only the `reasonCode` constant and the S3 prefix it listens to.

**Reuse from `terminateFraudAccounts/service/accountCleanup.go`:**

- `concurrentProcess()` — goroutine pool with semaphore
- `cleanupAccountBySubscriber()` — revoke + profile update
- `mapUpdateProfilePayload()` — maps subscriber offerings to TERMINATED state
- `setTerminatedOfferChar()` — removes AutoRenew characteristic

**Reuse from `terminateNM1/service/terminate_nm1_cleanup.go`:**

- `HandleBilling()` — calls `billingCoreProcessor.TerminateSubscriberWithoutLogin`
- AMSS login ticket flow
- Error CSV upload + file move-to-processed pattern

**Per-category constants:**

```go
// Fraud:
reasonCode = "Fraud"
s3Prefix   = "fraud-terminations/"

// Collections:
reasonCode = "Collections"
s3Prefix   = "collections-terminations/"

// Other (agent NM1 disconnect):
reasonCode = "AgentDisconnect"
s3Prefix   = "other-nm1-terminations/"
```

---

### 8.3 `serverless.yaml` — Add Three Lambda Pairs

Each Lambda pair follows the existing function declaration pattern. Lambda 1 uses `schedule` or `enabled: false` trigger; Lambda 2 uses EventBridge S3 Object Created:

```yaml
# Lambda 2 example (Collections)
collectionsNM1Terminate:
  handler: cmd/collectionsNM1Terminate/main.go
  timeout: 900
  environment:
    RESELLER_SERVICE_URL: ${file(./config/${opt:stage}.yaml):function.envs.resellerServiceUrl}
    SUBSCRIBER_MANAGER_API_URL: ${file(./config/${opt:stage}.yaml):function.envs.subscriberManagerApiUrl}
    AMSS_LOGIN_URL: ${file(./config/${opt:stage}.yaml):function.envs.amssLoginUrl}
    AMSS_CHANGE_SUBSCRIBER_STATUS_URL: ${file(./config/${opt:stage}.yaml):function.envs.amssChangeSubUrl}
    CONCURRENT_LIMIT: ${file(./config/${opt:stage}.yaml):function.envs.terminateConcurrentLimit}
  events:
    - eventBridge:
        enabled: false # ← start disabled; enable after testing with Ali/Hamza
        pattern:
          source: [aws.s3]
          detail-type: [Object Created]
          detail:
            bucket:
              name:
                - ${file(./config/${opt:stage}.yaml):uploadBucketName}
            object:
              key:
                - prefix: collections-terminations/
```

---

### 8.4 Key Package Dependencies

| Package                     | Purpose                                                                         |
| --------------------------- | ------------------------------------------------------------------------------- |
| `pkg/athenautil`            | Query EDW via AWS Athena (`ExecuteQuery`, `GetQueryString`)                     |
| `pkg/s3util`                | Read/write S3 files (`GetFile`, `UploadLargeObject`, `MoveToFolder`)            |
| `pkg/restapiclient`         | HTTP client for Reseller Service + Subscriber Manager API calls                 |
| `pkg/coreprocessor/billing` | `BillingCoreProcesses` — handles AMSS login + `TerminateSubscriberWithoutLogin` |
| `model/reseller-service`    | `SubscriptionPatchRequest` for revoke action                                    |
| `model/subscriber-manager`  | `SubscriberProfilePayload` for profile update                                   |

---

## 9. EDW Query Design Notes

Each Lambda 1 needs a **named Athena query** pre-created in AWS. The query must:

1. Select `subscriber_id` and `ban` from the EDW disconnect table
2. Filter by the category's reason codes
3. Filter by disconnect date within the processing window
4. Exclude subscribers already cleaned up in BPP (left join / NOT EXISTS against BPP DB or a processed-log table)

Work with the EDW/data team to define:

- Table name and schema for NM1 disconnect events
- Exact reason code values per category
- Lookback window (e.g., last 7 days, last 30 days, or all unprocessed)
- Deduplication strategy (avoid re-processing a subscriber already cleaned up)

---

## 10. Testing Approach

As noted in the ticket: **Support team (Ali or Hamza) will test before production release.**

Recommended testing sequence:

1. Deploy all Lambdas with `enabled: false` in EventBridge triggers
2. Support team manually uploads a test CSV to each S3 prefix (sandbox/dev)
3. Support team manually invokes Lambda 2 via AWS Console with test event payload
4. Verify: entitlement revoked in Reseller Service, profile TERMINATED in Subscriber Manager
5. For Lambda 1: manually invoke in non-prod against EDW and verify S3 output CSV
6. Only enable EventBridge triggers (`enabled: true`) after sign-off

---

## 11. Implementation Checklist

### Lambda 1 — EDW Extractor (×3 categories)

- [ ] Define EDW named queries (Athena) for Fraud, Collections, Other with data team
- [ ] Create `cmd/edwFraudExtractor/` — main.go, model, service using `pkg/athenautil`
- [ ] Create `cmd/edwCollectionsExtractor/` — same pattern
- [ ] Create `cmd/edwOtherExtractor/` — same pattern
- [ ] Add Lambda 1 function declarations to `serverless.yaml` (start `enabled: false`)
- [ ] Unit tests for each extractor service

### Lambda 2 — Processor (×3 categories)

- [ ] Assess whether `terminateFraudAccounts` covers Fraud Lambda 2 (update if reusable)
- [ ] Create `cmd/fraudNM1Terminate/` if new Lambda needed (or extend existing)
- [ ] Create `cmd/collectionsNM1Terminate/` — revoke + terminate + profile update
- [ ] Create `cmd/otherNM1Terminate/` — same pattern with agent reason code
- [ ] Add Lambda 2 function declarations to `serverless.yaml` (start `enabled: false`)
- [ ] Unit tests for each processor service (mock Reseller, Subscriber Manager, billing clients)
- [ ] Verify error CSV upload and file-move-to-processed on partial failures

### Integration & Release

- [ ] Deploy to dev/sandbox with all triggers `enabled: false`
- [ ] Support team (Ali/Hamza) runs end-to-end test with sample CSV
- [ ] Verify no double-processing of already-cleaned-up subscribers
- [ ] Enable triggers (`enabled: true`) in production after sign-off
- [ ] Monitor CloudWatch logs for first production run

---

## 12. Risk & Edge Cases

| Risk                                                             | Mitigation                                                                                            |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Double-processing: subscriber appears in EDW again after cleanup | Lambda 1 query must exclude already-TERMINATED subscribers; add NOT EXISTS check or processed-log     |
| Partial failure mid-batch (revoke succeeds, billing fails)       | Error CSV captures failures; re-run from error file; note that revoke is not rolled back              |
| Lambda timeout (large batch, slow AMSS)                          | Use concurrent semaphore (limit 5–10), increase Lambda timeout to 900s; consider batching large files |
| EDW query returns stale data (propagation delay)                 | Document expected lag; Lambda 1 should use `disconnect_date < NOW() - 1 day` window                   |
| AMSS login ticket expires mid-batch                              | Refresh login ticket periodically; `terminateNM1` already handles this via `GetAMSSLoginTicket`       |
| Production S3 prefix collision if multiple runs same day         | Include timestamp in output filename: `YYYYMMDD_HHmmss_fraud.csv`                                     |

---

## 13. References

- **Jira Story:** [APOART-2467](https://jira.bell.corp.bce.ca/browse/APOART-2467)
- **Parent Epic:** [APOART-1912](https://jira.bell.corp.bce.ca/browse/APOART-1912) — Technical Debt - Subscriptions
- **Key source files (existing patterns to reuse):**
  - [serverless/bpp-data-clean-up/app/cmd/terminateFraudAccounts/service/accountCleanup.go](serverless/bpp-data-clean-up/app/cmd/terminateFraudAccounts/service/accountCleanup.go) — revoke + profile update pattern
  - [serverless/bpp-data-clean-up/app/cmd/terminateNM1/service/terminate_nm1_cleanup.go](serverless/bpp-data-clean-up/app/cmd/terminateNM1/service/terminate_nm1_cleanup.go) — NM1 billing termination pattern
  - [serverless/bpp-data-clean-up/app/serverless.yaml](serverless/bpp-data-clean-up/app/serverless.yaml) — Lambda function declarations and EventBridge triggers
  - [pkg/athenautil/](pkg/athenautil/) — EDW query via Athena
  - [pkg/s3util/](pkg/s3util/) — S3 read/write utilities
  - [pkg/coreprocessor/billing/](pkg/coreprocessor/billing/) — `BillingCoreProcesses`, `TerminateSubscriberWithoutLogin`

---

# APOART-2577: PROMO ENHANCE — Move Ranking Functionality from Flowrunner to Configurator

**Parent Epic:** [APOART-2046](https://jira.bell.corp.bce.ca/browse/APOART-2046) — Promotion Enhancements  
**Story:** [APOART-2577](https://jira.bell.corp.bce.ca/browse/APOART-2577)  
**Sprint:** APOART PI-26.3 | **Team:** BANANABYTE | **Priority:** High | **Points:** 25

---

## 1. The Business Idea (Plain Language)

When a customer qualifies for multiple promotions at the same time — such as two competing discount offers — but those promotions cannot be applied together (they are "non-stackable"), the system needs to decide which one to present as the automatic choice (Default/Mandatory/Recommended).

Today, this decision is made in the **Flowrunner** (the rules engine service). The Flowrunner evaluates whether a promotion's rules are satisfied, and if multiple competing promotions both qualify, it uses their **rank number** to pick the winner — the lower the rank, the higher the priority. The loser has its Default/Mandatory/Recommended tag removed before the result is sent back.

**The problem with the current approach:**  
The Flowrunner is supposed to be a pure rules evaluator — it should only tell the Configurator "this promotion qualified" or "this promotion didn't qualify". The ranking/conflict resolution is a _business rule about which promotion to apply_, not a _qualification rule_. Having this logic in the Flowrunner makes it harder to change, test, and reason about.

**What this story does:**  
Move the ranking conflict resolution from the Flowrunner into the **Configurator** (Subscription Configurator API). The Flowrunner continues to return both promotions as qualified (with their original Default/Mandatory/Recommended outcomes). The Configurator then decides which one wins based on rank and applies the correct final outcome to the cart.

The business rules remain exactly the same — customers see no difference. The improvement is purely architectural: better separation of concerns.

**Also covered by the acceptance criteria:**  
When a promotion is already selected (on the cart), incompatible promotions should not be auto-defaulted. This prevents confusing situations where a customer has already chosen a promotion but a competing one is still highlighted as the system's default choice.

---

## 2. The Technical Idea (Plain Language)

Think of the Flowrunner as a **referee** who decides if each player is eligible to play. Today the referee is also deciding which eligible player should start — that's the ranking decision. After this story, the referee only declares players eligible; the **Configurator (team manager)** decides which eligible player starts the game.

```
BEFORE (Flowrunner does everything):
  Promo A (rank=10): Flowrunner evaluates → Qualified, Default
  Promo B (rank=20): Flowrunner evaluates → Qualified, BUT removes Default
                     because rank(A) < rank(B) and they're incompatible
  Configurator receives: A=Qualified+Default, B=Qualified
  Configurator sets:     A cart item → Default=true, B cart item → (no Default)

AFTER (Configurator does ranking):
  Promo A (rank=10): Flowrunner evaluates → Qualified, Default  (unchanged)
  Promo B (rank=20): Flowrunner evaluates → Qualified, Default  (kept as-is)
  Configurator receives: A=Qualified+Default, B=Qualified+Default
  Configurator compares ranks (A=10, B=20):
    A wins → keeps Default=true
    B loses → removes Default from its ItemCharacteristics
  Configurator sets:     A cart item → Default=true, B cart item → (no Default)
```

The end result for the customer is identical. The change is that the ranking logic now lives in the Configurator, where it can be tested independently and changed without touching the Flowrunner.

---

## 3. Glossary

| Term                    | Meaning                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Flowrunner**          | Rules evaluation service in `pkg/flow/` and `pkg/flow-v2/`. Evaluates policy rules and returns outcome states (Qualified, Default, Mandatory, Recommended, Unqualified) per promotion |
| **Configurator**        | Subscription Configurator API (`services/subscription-configurator-api/`). Consumes Flowrunner output, manages the cart session, and auto-adds/removes promotions                     |
| **Rank**                | An integer stored on each `PromotionSpecification` in the catalog. Lower number = higher priority                                                                                     |
| **DMR outcomes**        | Default, Mandatory, Recommended — the three outcomes that control automatic promotion application                                                                                     |
| **Non-stackable**       | Two promotions that cannot be applied together; one must win if both qualify                                                                                                          |
| **Stackable**           | Two promotions that can both be applied simultaneously; both keep their outcomes regardless of rank                                                                                   |
| **IncompatibleWith**    | A relationship between two promotions indicating they cannot coexist                                                                                                                  |
| **rankDMRIncompatible** | Existing function in `pkg/flow/components/policyRulesValidatorWithToggleOutcome.go` that resolves rank conflicts (currently in Flowrunner)                                            |
| **GBB**                 | "Good, Better, Best" — the Recommended tier of promotion auto-selection                                                                                                               |
| **ItemCharacteristics** | Cart item characteristics like `{ Name: "Default", Value: "true" }` set on promotion cart items                                                                                       |

---

## 4. Acceptance Criteria

### AC1: Recommend (GBB) best ranked item

- **Given** promotions are ranked, non-stackable, and set to `Recommended`
- **When** a customer order qualifies for multiple `Recommended` promotions
- **Then** only the best-ranked (lowest rank number) promotion is `Recommended`

### AC2: Default best ranked item

- **Given** promotions are ranked, non-stackable, and set to `Default`
- **When** a customer order qualifies for multiple `Default` promotions
- **Then** only the best-ranked promotion is `Defaulted`

### AC3: Do not Default if incompatible with a selected item

- **Given** promotions are ranked, non-stackable, and set to `Default`
- **When** one promotion is already selected on the cart
- **Then** any incompatible promotion is **NOT** Defaulted

### Stackable carve-out (from description):

- **When** multiple stackable promotions are `Default` or `Mandatory`
- **Then** the DMR tags are **left as-is on both** promotions (rank does not matter)

---

## 5. Current Architecture (Flowrunner Handles Ranking)

```
Subscription Configurator API
  │
  │  1. Call Flowrunner with cart + promotion specs
  ▼
Flowrunner (pkg/flow/components/policyRulesValidatorWithToggleOutcome.go)
  │
  │  validatePromotions():
  │    For each promotion: evaluate rules → collect outcomes
  │
  │  rankDMRIncompatible():  ◄── CURRENT RANKING LOGIC
  │    buildRankByID(): map promoId → rank
  │    processResults():
  │      For each promo with DMR outcome:
  │        Find its IncompatibleWith promos
  │        If incompatible promo has better rank → remove DMR from current
  │        Find all promos targeting same offering → keep only best-ranked DMR
  │
  │  Return: A=Qualified+Default, B=Qualified (rank loser already stripped)
  ▼
Configurator (apply_and_qualify.go)
  │
  │  addParentPromotion():
  │    Reads Flowrunner result state
  │    If state has "Default" → add ItemCharacteristic { Default: true }
  │    If state has "Mandatory" → add ItemCharacteristic { Mandatory: true }
  │    (No rank logic needed — already resolved by Flowrunner)
  ▼
Cart: A cart item → Default=true, B cart item → (no Default)
```

---

## 6. Desired Architecture (Configurator Handles Ranking)

```
Subscription Configurator API
  │
  │  1. Call Flowrunner with cart + promotion specs
  ▼
Flowrunner (pkg/flow/components/policyRulesValidatorWithToggleOutcome.go)
  │
  │  validatePromotions():
  │    For each promotion: evaluate rules → collect outcomes
  │
  │  [CHANGE] rankDMRIncompatible() is skipped / feature-flagged off
  │
  │  Return: A=Qualified+Default, B=Qualified+Default (both kept as-is)
  ▼
Configurator (apply_and_qualify.go)
  │
  │  addParentPromotion():
  │    Reads Flowrunner result state
  │    Adds DMR ItemCharacteristics for all qualified promotions
  │    (Both A and B temporarily get Default=true)
  │
  │  [NEW] resolveRankConflicts():    ◄── NEW RANKING LOGIC
  │    For each promotion cart item with DMR characteristic:
  │      Look up its rank from PromotionSpecByIDMap
  │      Find its IncompatibleWith promotions (via ItemRelationshipLinks)
  │      If non-stackable conflict found: keep only best-ranked DMR
  │      If tie: neither gets DMR (same behavior as existing logic)
  │      If already selected (NoChange): skip — don't add Default to incompatible promos
  │      If stackable: leave both DMR tags
  ▼
Cart: A cart item → Default=true, B cart item → (no Default)
```

---

## 7. Code-Level Change Guide

### 7.1 Flowrunner — Gate `rankDMRIncompatible` (Remove or Feature-Flag)

**File:** `pkg/flow/components/policyRulesValidatorWithToggleOutcome.go`

**Current call site (in `validatePromotions` or its caller):**

```go
results = rankDMRIncompatible(results, offerings, log)
```

**Change:** Gate this behind a feature flag so that when the new Configurator-side logic is enabled, the Flowrunner stops performing rank resolution:

```go
// [FEATURE_START: APOART-2577]
// Ranking conflict resolution has moved to the Configurator.
// When this flag is enabled, return results as-is (all DMR outcomes preserved).
if !featureEnabled("APOART-2577") {
    results = rankDMRIncompatible(results, offerings, log)
}
// [FEATURE_END: APOART-2577]
```

> **Note:** The feature flags here are checked server-side in the Flowrunner. Coordinate the rollout: enable in Configurator first, then disable in Flowrunner, or use a single shared flag value.

**Function to understand:**

- `rankDMRIncompatible()` — lines ~410–530 in `policyRulesValidatorWithToggleOutcome.go`
- `processResults()` — the inner loop; this logic needs to be replicated in the Configurator

---

### 7.2 Configurator — New Function: `resolveRankConflicts`

**File:** `services/subscription-configurator-api/internal/service/configurator/apply_and_qualify.go`

Add a new function that runs **after** `addParentPromotion()` completes (i.e., after all promotions have been added to the cart with their initial DMR characteristics):

```go
// resolveRankConflicts implements the rank-based conflict resolution for non-stackable
// promotions that was previously handled by the Flowrunner's rankDMRIncompatible().
//
// For non-stackable promotions that are IncompatibleWith each other and both
// have DMR (Default/Mandatory/Recommended) ItemCharacteristics:
//   - Keep the best-ranked (lowest rank number) promotion's DMR tag
//   - Remove DMR tags from all lower-ranked incompatible promotions
//   - If two have the same rank: remove DMR from both (tie → no default)
//   - If a promotion is stackable: leave DMR on all
//   - If a promotion is already selected (NoChange + !New state): do not Default
//     any of its incompatible counterparts
func (m *ApplyAndQualifyMapper) resolveRankConflicts(cartItems []dynamodbModels.CartItem) []dynamodbModels.CartItem {
    if !m.FeatureToggles["APOART-2577"] {
        return cartItems // feature not enabled, Flowrunner still handles this
    }

    for i := range cartItems {
        if cartItems[i].Type != string(models.Promotion) {
            continue
        }
        if !hasAnyDMRCharacteristic(cartItems[i].ItemCharacteristics) {
            continue
        }

        promoId := cartItems[i].Promotion.PromotionSpecification.Id
        myRank := getPromoRank(m.PromotionSpecByIDMap, promoId)

        // Check AC3: if already selected (NoChange, non-new), do not default incompatible
        if cartItems[i].Action == string(models.NoChange) &&
           cartItems[i].Promotion.State != string(models.New) {
            // Mark incompatible promotions as should-not-be-defaulted
            // (handled by the inner loop's "selectedItem" check)
        }

        links, ok := m.ItemRelationshipLinks[promoId]
        if !ok {
            continue
        }

        // Skip if stackable (IncompatibleWithGroupId is empty for stackable groups)
        if len(links.IncompatibleWithGroupId) == 0 && len(links.IncompatibleWith) == 0 {
            continue
        }

        // Compare against IncompatibleWith promotions on the cart
        for j := range cartItems {
            if i == j || cartItems[j].Type != string(models.Promotion) {
                continue
            }
            otherId := cartItems[j].Promotion.PromotionSpecification.Id
            isIncompatible := slices.Contains(links.IncompatibleWith, otherId) ||
                              isIncompatibleViaGroup(m.ItemRelationshipLinks, promoId, otherId)
            if !isIncompatible {
                continue
            }
            if !hasAnyDMRCharacteristic(cartItems[j].ItemCharacteristics) {
                continue
            }
            otherRank := getPromoRank(m.PromotionSpecByIDMap, otherId)

            // Lower rank number = higher priority
            if myRank < otherRank {
                cartItems[j].ItemCharacteristics = removeDMRCharacteristics(cartItems[j].ItemCharacteristics)
            } else if myRank == otherRank {
                cartItems[i].ItemCharacteristics = removeDMRCharacteristics(cartItems[i].ItemCharacteristics)
                cartItems[j].ItemCharacteristics = removeDMRCharacteristics(cartItems[j].ItemCharacteristics)
            }
            // if myRank > otherRank: handled when j is outer and i is inner
        }
    }
    return cartItems
}
```

**Helper functions needed:**

```go
func hasAnyDMRCharacteristic(chars []dynamodbModels.Characteristic) bool {
    return slices.ContainsFunc(chars, func(c dynamodbModels.Characteristic) bool {
        return (strings.EqualFold(c.Name, string(models.Default)) ||
                strings.EqualFold(c.Name, string(models.Mandatory)) ||
                strings.EqualFold(c.Name, string(models.Recommended))) &&
               strings.EqualFold(c.Value, trueStr)
    })
}

func getPromoRank(promoSpecByIDMap map[string]*catalog.PromotionSpecifications, promoId string) int {
    spec, ok := promoSpecByIDMap[promoId]
    if !ok || spec == nil || spec.Rank == nil {
        return math.MaxInt // no rank = worst rank (same as worstRank in Flowrunner)
    }
    return *spec.Rank
}

func removeDMRCharacteristics(chars []dynamodbModels.Characteristic) []dynamodbModels.Characteristic {
    return slices.DeleteFunc(chars, func(c dynamodbModels.Characteristic) bool {
        return (strings.EqualFold(c.Name, string(models.Default)) ||
                strings.EqualFold(c.Name, string(models.Mandatory)) ||
                strings.EqualFold(c.Name, string(models.Recommended))) &&
               strings.EqualFold(c.Value, trueStr)
    })
}
```

---

### 7.3 Call Site — Invoke `resolveRankConflicts` After Cart Items Are Built

**File:** `services/subscription-configurator-api/internal/service/configurator/apply_and_qualify.go`

In `GetCartItemList()` or at the end of `ApplyCartItems()`, after all promotion cart items have been added and their DMR characteristics set:

```go
// After all promotions are added and characterized:
// [FEATURE_START: APOART-2577]
if m.FeatureToggles["APOART-2577"] {
    updatedCartList = m.resolveRankConflicts(updatedCartList)
}
// [FEATURE_END: APOART-2577]
```

---

### 7.4 AC3 — Do Not Default if Incompatible with a Selected Item

This is handled in `resolveRankConflicts`:

- When iterating, if a promotion cart item has `Action == NoChange` and its state is not `New` (i.e., it's already an active/existing promotion on the profile), mark all its `IncompatibleWith` promotions to have their DMR characteristics suppressed, regardless of rank.

```go
// AC3: if a promo is already selected (exists on profile, not new)
if cartItems[j].Action == string(models.NoChange) &&
   cartItems[j].Promotion.State != string(models.New) {
    // An incompatible promo that is already selected → don't default the current item
    cartItems[i].ItemCharacteristics = removeDMRCharacteristics(cartItems[i].ItemCharacteristics)
    continue
}
```

---

### 7.5 Stackable Promotions — No Change

Stackable promotions are identified by:

- `PromotionGroupsInfo.IsStackable == true`, OR
- No `IncompatibleWithGroupId` entries in `ItemRelationshipLinks`

In `resolveRankConflicts`, when `isIncompatible` returns false, the loop `continue`s — so stackable promotions are untouched. No special code needed.

---

### 7.6 Key Data Already Available in `ApplyAndQualifyMapper`

The `ApplyAndQualifyMapper` struct already contains everything needed:

| Field                                                              | Purpose                                                                                   |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `PromotionSpecByIDMap map[string]*catalog.PromotionSpecifications` | Provides `Rank *int` per promotion                                                        |
| `ItemRelationshipLinks map[string]*ItemRelationshipLinks`          | Provides `IncompatibleWith []string` and `IncompatibleWithGroupId []string` per promotion |
| `FeatureToggles map[string]bool`                                   | Gates new behavior behind `APOART-2577`                                                   |

The `PromotionSpecifications.Rank` field is at: `services/subscription-configurator-api/models/catalog/promotion_specification.go` line 62.

---

## 8. Flow Diagram

```
FlowRunner call returns
  Promo A: "Qualified, Default"
  Promo B: "Qualified, Default"
  Promo C: "Qualified, Recommended"
  Promo D: "Qualified, Recommended"
         │
         ▼
addParentPromotion() runs
  Cart: A(Default=true), B(Default=true), C(Recommended=true), D(Recommended=true)
         │
         ▼
resolveRankConflicts() runs   [NEW — gated by APOART-2577]
  │
  ├── A (rank=10) vs B (rank=20): A < B → remove Default from B
  │
  ├── C (rank=5) vs D (rank=15): C < D → remove Recommended from D
  │
  └── AC3: if B is already on cart (NoChange + !New) → also remove Default from A
         │
         ▼
Final Cart:
  A: Default=true  (winner, rank 10)
  B: (no Default)  (loser, rank 20)
  C: Recommended=true (winner, rank 5 — GBB)
  D: (no Recommended) (loser, rank 15)
```

---

## 9. Feature Toggle Coordination

Two services need coordinated feature flags:

| Service                                                  | Flag          | Behavior when enabled                                   |
| -------------------------------------------------------- | ------------- | ------------------------------------------------------- |
| Flowrunner (`pkg/flow/`)                                 | `APOART-2577` | Skip `rankDMRIncompatible()` — return full DMR outcomes |
| Configurator (`services/subscription-configurator-api/`) | `APOART-2577` | Run `resolveRankConflicts()` after cart is built        |

**Rollout order:**

1. Enable `APOART-2577` in **Configurator** first (resolveRankConflicts runs, but Flowrunner still strips ranks too — double application, but idempotent since the winner's DMR is preserved)
2. Enable `APOART-2577` in **Flowrunner** (stops stripping; Configurator takes over fully)
3. Once stable, remove the legacy `rankDMRIncompatible()` call entirely (cleanup ticket)

---

## 10. Existing Logic to Reference (Port from Flowrunner)

The `processResults()` function in `pkg/flow/components/policyRulesValidatorWithToggleOutcome.go` contains the exact algorithm to port:

```
For each promotion with DMR outcome:
  myRank = rankByID[id]
  incompatIDs = findIncompatibleWithByID(offerings, id)
  relatedIds = findAllPromotionsThatTargetThisPromosTarget(offerings, id)

  For each incompatible promo with DMR outcome:
    if otherRank <= myRank:
      remove DMR from current promo

  Find highest-ranked promo in relatedIds:
    if tie (same rank): remove DMR from all
    else: remove DMR from all except highest-ranked
```

The `relatedIds` (promotions targeting the same offering) concept maps to the `Configurator`'s `PromotionTargetEntityMap` — promotions that `Discounts` the same offering are already grouped via cart item relationships.

---

## 11. Test Strategy

### Unit tests (Configurator)

- `resolveRankConflicts`: two Default promos, A rank=10 / B rank=20 → B loses Default
- `resolveRankConflicts`: two Default promos, A rank=10 / B rank=10 (tie) → both lose Default
- `resolveRankConflicts`: two stackable promos → both keep Default
- `resolveRankConflicts`: AC3 — B is NoChange/existing → A does not get Default
- `resolveRankConflicts`: Recommended (GBB) — same logic as Default
- `resolveRankConflicts`: Mandatory — same logic; Mandatory wins over lower-ranked Default (as per existing Flowrunner comment: `PromoA Default 10, PromoB Mandatory 10 → Mandatory overrides`)

### Unit tests (Flowrunner)

- When `APOART-2577` enabled: `rankDMRIncompatible` is NOT called; both DMR outcomes are returned
- When `APOART-2577` disabled (default): legacy behavior unchanged

### Feature test files (Flowrunner — update existing)

Existing feature tests in `pkg/flow/toggleFeaturesOutcome/` that test ranking behavior must be updated to reflect the new flag:

- `promo_outcome_default_highest_rank_default.feature`
- `promo_outcome_default_same_rank_nomodifier.feature`
- `promo_outcome_default_over_mandatory.feature`
- `default_only_highest_rank_returned.feature`

---

## 12. Implementation Checklist

### Flowrunner (`pkg/flow/`)

- [ ] Add feature flag check around `rankDMRIncompatible()` call in `validatePromotions` or its post-processing step
- [ ] Update feature test files to assert full DMR outcomes when `APOART-2577` is enabled
- [ ] Unit tests for Flowrunner with flag enabled/disabled

### Configurator (`services/subscription-configurator-api/`)

- [ ] Add `resolveRankConflicts()` to `apply_and_qualify.go`
- [ ] Add helper functions: `hasAnyDMRCharacteristic`, `getPromoRank`, `removeDMRCharacteristics`, `isIncompatibleViaGroup`
- [ ] Call `resolveRankConflicts()` at the end of cart-building pipeline (after `addParentPromotion`)
- [ ] Gate the call with `m.FeatureToggles["APOART-2577"]`
- [ ] Unit tests for all three acceptance criteria
- [ ] Unit test for stackable carve-out
- [ ] Integration tests (via existing apply_and_qualify_test.go pattern with mock catalog data)

### Feature toggle setup

- [ ] Register `APOART-2577` in feature flag system
- [ ] Add `APOART-2577` to `FeatureToggles` loading in Configurator's `subscription_configurator_impl.go`

### Cleanup (post-rollout — separate ticket)

- [ ] Remove `rankDMRIncompatible()` from Flowrunner entirely
- [ ] Clean up feature flag checks once rollout is stable

---

## 13. Risk & Edge Cases

| Risk                                                                                 | Mitigation                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flag coordination gap: Flowrunner still strips + Configurator also strips            | Double application is idempotent (winner already has DMR; removing again is a no-op). Rollout is safe to proceed in any order                                                                                                                                    |
| Different `worstRank` values between Flowrunner and Configurator                     | Use `math.MaxInt` in Configurator; Flowrunner uses `int(^uint(0) >> 1)` — equivalent on most platforms. Use same constant                                                                                                                                        |
| Mandatory vs Default tie: Mandatory should win (existing behavior)                   | Replicate: `PromoA Default rank=10, PromoB Mandatory rank=10 → Mandatory wins`. The `removeDMRCharacteristics` only removes DMR tags; the Mandatory outcome on B is not `Default` so it is not removed. Default on A is removed. This naturally handles the case |
| Promotion targeting multiple offerings (shared promo)                                | `relatedIds` logic in Flowrunner — replicate using `PromotionTargetEntityMap` in the Configurator                                                                                                                                                                |
| AC3 edge case: newly added promo (State=New, Action=NoChange from old profile merge) | Check both `Action == NoChange` AND `State != New` to correctly identify "already selected"                                                                                                                                                                      |

---

## 14. References

- **Jira Story:** [APOART-2577](https://jira.bell.corp.bce.ca/browse/APOART-2577)
- **Parent Epic:** [APOART-2046](https://jira.bell.corp.bce.ca/browse/APOART-2046) — Promotion Enhancements
- **Key source files:**
  - [pkg/flow/components/policyRulesValidatorWithToggleOutcome.go](pkg/flow/components/policyRulesValidatorWithToggleOutcome.go) — `rankDMRIncompatible()`, `processResults()`, `buildRankByID()` (current Flowrunner logic to be ported)
  - [services/subscription-configurator-api/internal/service/configurator/apply_and_qualify.go](services/subscription-configurator-api/internal/service/configurator/apply_and_qualify.go) — `addParentPromotion()`, `setPromotionQualificationOutcome()` (target file for new ranking logic)
  - [services/subscription-configurator-api/models/catalog/promotion_specification.go](services/subscription-configurator-api/models/catalog/promotion_specification.go) — `PromotionSpecifications.Rank *int` (rank data source)
  - [services/subscription-configurator-api/internal/service/configurator/get_qualification.go](services/subscription-configurator-api/internal/service/configurator/get_qualification.go) — `ItemRelationshipLinks` struct, `IncompatibleWithGroupId`, `stackableTypeList`, `nonStackableTypeList`
  - [pkg/flow/toggleFeaturesOutcome/promo_outcome_default_highest_rank_default.feature](pkg/flow/toggleFeaturesOutcome/promo_outcome_default_highest_rank_default.feature) — existing Flowrunner rank test to update
  - [pkg/flow/toggleFeaturesOutcome/promo_outcome_default_same_rank_nomodifier.feature](pkg/flow/toggleFeaturesOutcome/promo_outcome_default_same_rank_nomodifier.feature) — same-rank tie test to update

---

# APOART-2514: MSP — Support Dynamic Messaging for TV Scenarios

**Ticket:** [APOART-2514](https://jira.bell.corp.bce.ca/browse/APOART-2514)  
**Parent:** [APOART-1777](https://jira.bell.corp.bce.ca/browse/APOART-1777) — Katsumi Multi-Service Promotions (Post MVP) - PCPO  
**Sprint:** APOART PI-26.3 | **Team:** BANANABYTE | **Priority:** High | **Points:** 35  
**Repo:** `node-mono/microfrontends/subscription-manager`

---

## 1. The Business Idea (Plain Language)

Bell offers subscription bundles (like Crave + Netflix + Disney+) at a discounted price when a customer also has a Bell TV service. The discount only holds as long as that TV service is active — so if an agent or customer tries to cancel a streaming subscription or a promotion linked to a TV service, the UI must warn them: _"You need your [Bell TV service] to keep this offer."_

Today, those warning messages are written with **"TV" hard-coded directly in the code**, regardless of which specific Bell service the customer actually has. The problem is Bell has multiple types of TV services:

- **Bell Fibe TV** (`FibeTV`)
- **Bell Satellite TV** (`SatelliteTelevision`)
- **Bell Fibe TV App** (`FibeTVApp`)
- **Bell Television** (legacy `Television`)

Each of these is a different product, but the UI currently says the same generic "TV" text for all of them. If a customer has Fibe TV, they should see "Bell Fibe TV". If they have Satellite TV, they should see "Bell Satellite TV".

**What this story does:** Replace hard-coded "TV" text with logic that reads the customer's actual service type and shows the correct, specific service name in:

1. The cancel subscription warning popup
2. The "already subscribed through your service" card
3. The service-included warning popup (agent view)
4. Any other places where TV-specific messages currently appear

---

## 2. The Technical Idea (Plain Language)

The subscription manager already knows what type of Bell service a customer has — this is tracked as `SubscriberType` (an enum with values like `TELEVISION`, `FIBE_TV`, `SATELLITE_TELEVISION`, `FIBE_TV_APP`, `MOBILITY`).

Some recent features (like BDU TV product support, gated by `enableTvBduProducts` flag) added new subscriber types to the logic that decides _whether_ to show a service warning. But the helper functions and translation keys that produce the actual _text_ of those warnings were never updated — they still only check for `TELEVISION` and return a generic TV label.

The fix is to:

1. Extend the `getIncludedServiceName()` function to handle all BDU TV types.
2. Pass the actual `subscriberType` down to `ServiceIncludedWarningPopUpContent` so it can use the correct translation key.
3. Update `AlreadySubscribedContent`'s `BduCard` component so it shows the specific service name per BDU TV type.
4. Add translation keys for `FIBE_TV`, `SATELLITE_TELEVISION`, and `FIBE_TV_APP` service names.

---

## 3. Glossary

| Term                                   | Meaning                                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **MSP**                                | Multi-Service Promotion — a promotion that requires holding a Bell TV or Mobility service to qualify                                |
| **BDU**                                | Broadcast Distribution Undertaking — Bell's TV distribution business (Fibe TV, Satellite TV, etc.)                                  |
| **LOB**                                | Line of Business — the service category required to maintain a promotion (TV, Mobility, Internet/Residential)                       |
| **SubscriberType**                     | Enum in `src/models/enums/subscriberType.ts` — the type of Bell service a subscriber has                                            |
| **enableTvBduProducts**                | Feature flag that enables handling of new BDU TV types (Fibe TV, Satellite TV, Fibe TV App)                                         |
| **includedByService**                  | A `SubInfo` property (`IncludedByServiceInfo`) that carries the `subscriberType` of the Bell service that includes the subscription |
| **getIncludedByServiceInfo**           | Helper in `subscriptionsHelperFunctions.ts` that determines which Bell service includes a given subscription                        |
| **ServiceIncludedWarningPopupContent** | Agent-only popup warning that a streaming subscription being cancelled is included through a Bell TV service                        |
| **IncludedByServiceBanner**            | Info banner inside `CancelSubscriptionPopUp` (agent view) showing which service the subscription is part of                         |
| **TVAddOnSubscription**                | Component on the customer page that shows a link to manage TV add-ons when `tvAccountNumber` is present                             |

---

## 4. Acceptance Criteria

The highlighted portions of text in UI components must be **dynamic** to reflect:

1. **The relevant service offer** — Instead of always showing "TV service", show the actual service name (e.g., "Bell Fibe TV", "Bell Satellite TV", "Bell TV")
2. **The required LOB to maintain the offer** — The warning message should name the correct service the customer must keep to maintain their promotion

Specifically, all BDU TV subscriber types must produce the correct service name in:

- Cancel subscription popup (`CancelSubscriptionPopUp.tsx`)
- Service included warning popup (`ServiceIncludedWarningPopUpContent.tsx`)
- Already-subscribed-through-service card (`AlreadySubscribedContent.tsx` → `BduCard`)
- TV LOB promo cancellation note (`NoteOnServicesAccordion.tsx` → `TvLobPromoCancellationNote`)

---

## 5. Where the Hard-Coded Text Currently Lives

### 5.1 `ServiceIncludedWarningPopUpContent.tsx` — Always "TV"

**File:** [src/components/subscriptions/cancel-subscription/ServiceIncludedWarningPopUpContent.tsx](../node-mono/microfrontends/subscription-manager/src/components/subscriptions/cancel-subscription/ServiceIncludedWarningPopUpContent.tsx)

```typescript
// CURRENT — hard-coded to TV regardless of actual subscriber type
const serviceName = t("SERVICE_INCLUDED_WARNING_SERVICE_TV");
```

This component doesn't receive `subscriberType` at all. The parent (`CancelSubscriptionPopUp`) knows the type via `includedByService?.subscriberType` but never passes it down.

---

### 5.2 `CancelSubscriptionPopUp.tsx` → `getIncludedServiceName` — Missing BDU Types

**File:** [src/components/subscriptions/cancel-subscription/CancelSubscriptionPopUp.tsx](../node-mono/microfrontends/subscription-manager/src/components/subscriptions/cancel-subscription/CancelSubscriptionPopUp.tsx)

```typescript
// CURRENT — only handles TELEVISION and MOBILITY; BDU types (FIBE_TV, SATELLITE_TV, etc.) return null
const getIncludedServiceName = (
    subscriberType: SubscriberType | undefined,
    t: ...,
): string | null => {
    if (subscriberType === SubscriberType.TELEVISION) {
        return t('CANCEL_SUBSCRIPTION_INCLUDED_SERVICE_TV');
    }
    if (subscriberType === SubscriberType.MOBILITY) {
        return t('CANCEL_SUBSCRIPTION_INCLUDED_SERVICE_MOBILITY');
    }
    return null; // BDU types fall through here → IncludedByServiceBanner is never shown
};
```

`getIncludedByServiceInfo()` (which populates `includedByService`) already maps `SATELLITE_TELEVISION`, `FIBE_TV`, and `FIBE_TV_APP` to `{ subscriberType: SubscriberType.TELEVISION }` — so currently they all get the same generic TV label. The story may require distinct labels per BDU type, or to normalise them all to a single "TV" key.

---

### 5.3 `AlreadySubscribedContent.tsx` (`BduCard`) — TV Catch-All

**File:** [src/components/subscriptions/add-subscription/selection-popup/AlreadySubscribedContent.tsx](../node-mono/microfrontends/subscription-manager/src/components/subscriptions/add-subscription/selection-popup/AlreadySubscribedContent.tsx)

```typescript
// CURRENT — any non-Mobility subscriber type → "LINKS_MANAGE_THROUGH_TV"
const manageThroughText =
    subscriber?.type === SubscriberType.MOBILITY.valueOf()
        ? t('LINKS_MANAGE_THROUGH_MOBILITY', { phoneNumber: ... })
        : t('LINKS_MANAGE_THROUGH_TV', { ban: formattedSubscriberId });
```

For `SATELLITE_TELEVISION` or `FIBE_TV`, the URL routing is already correct (`getTvServiceURL` handles each type), but the label always says "TV" regardless of the specific service.

---

### 5.4 `NoteOnServicesAccordion.tsx` → `TvLobPromoCancellationNote` — Static Copy

**File:** [src/components/subscriptions/review-subscription/NoteOnServicesAccordion.tsx](../node-mono/microfrontends/subscription-manager/src/components/subscriptions/review-subscription/NoteOnServicesAccordion.tsx)

```typescript
const TvLobPromoCancellationNote = (): JSX.Element => {
    const { t } = useSubscriptionsContext();
    return (
        <p>{t('MESSAGES_TV_LOB_PROMO_CANCELLATION_NOTE')}</p>  // static TV-specific message
    );
};
```

This note is only shown for agent flow when a TV LOB promo is being cancelled. The message is a static hard-coded string — if the required LOB is not specifically TV (e.g., Internet/Residential), a different message key would be needed.

---

## 6. Architecture Overview

```
Customer/Agent cancels a subscription
        │
        ▼
CancelSubscriptionPopUp.tsx
  │
  ├── includedByService?.subscriberType  ← comes from SubInfo
  │     (TELEVISION / FIBE_TV / SATELLITE_TELEVISION / FIBE_TV_APP / MOBILITY)
  │
  ├── getIncludedServiceName()           ← needs to cover all BDU TV types
  │     currently: TELEVISION → "Bell TV" | MOBILITY → "Bell Mobility" | rest → null
  │     should be: + FIBE_TV → "Bell Fibe TV" | SATELLITE_TELEVISION → "Bell Satellite TV" ...
  │
  ├── IncludedByServiceBanner            ← renders if includedServiceName is non-null
  │     shows: "{subscriptionName} is included with your {serviceName}"
  │
  └── ServiceIncludedWarningPopupContent ← agent-only; hard-coded to TV
        should receive subscriberType and derive serviceName dynamically
```

```
Data flow for includedByService:
  subscriptionsHelperFunctions.ts
    getIncludedByServiceInfo()
      → finds BDU subscriptions that overlap with the given subscription
      → maps subscriber type (TELEVISION, FIBE_TV, etc.) → IncludedByServiceInfo
      → currently collapses FIBE_TV/SATELLITE_TV/FIBE_TV_APP → { subscriberType: TELEVISION }
        (may need to be preserved individually for distinct messaging)
      → result stored in SubInfo.includedByService
```

---

## 7. Code-Level Change Guide

### 7.1 `getIncludedServiceName` — Add BDU TV Types

**File:** `src/components/subscriptions/cancel-subscription/CancelSubscriptionPopUp.tsx`

```typescript
const getIncludedServiceName = (
    subscriberType: SubscriberType | undefined,
    t: (key: string, ...) => string,
): string | null => {
    switch (subscriberType) {
        case SubscriberType.TELEVISION:
            return t('CANCEL_SUBSCRIPTION_INCLUDED_SERVICE_TV');
        case SubscriberType.FIBE_TV:
        case SubscriberType.FIBE_TV_APP:
            return t('CANCEL_SUBSCRIPTION_INCLUDED_SERVICE_FIBE_TV');      // new key
        case SubscriberType.SATELLITE_TELEVISION:
            return t('CANCEL_SUBSCRIPTION_INCLUDED_SERVICE_SATELLITE_TV'); // new key
        case SubscriberType.MOBILITY:
            return t('CANCEL_SUBSCRIPTION_INCLUDED_SERVICE_MOBILITY');
        default:
            return null;
    }
};
```

> **Note:** If `getIncludedByServiceInfo` collapses all BDU types to `SubscriberType.TELEVISION`, you may need to change it to preserve the original BDU type. Evaluate whether distinct labels are needed or a single "Bell TV" label is acceptable for all BDU types.

---

### 7.2 `ServiceIncludedWarningPopUpContent` — Accept `subscriberType` Prop

**File:** `src/components/subscriptions/cancel-subscription/ServiceIncludedWarningPopUpContent.tsx`

**Current:** `subscriberType` is not a prop; service name is always `t('SERVICE_INCLUDED_WARNING_SERVICE_TV')`.

**Change:**

```typescript
type Props = {
  onCheckboxChange: (checked: boolean) => void;
  isChecked: boolean;
  subscriptionName: string;
  subscriberType?: SubscriberType; // NEW
};

const ServiceIncludedWarningPopupContent = ({
  onCheckboxChange,
  isChecked,
  subscriptionName,
  subscriberType, // NEW
}: Props): JSX.Element => {
  const { t } = useSubscriptionsContext();

  // CHANGED: derive service name from subscriber type
  const serviceName = getServiceNameFromSubscriberType(subscriberType, t);
  // ...
};
```

Add a shared helper (or inline switch) for `getServiceNameFromSubscriberType`:

```typescript
const getServiceNameFromSubscriberType = (
    subscriberType: SubscriberType | undefined,
    t: ...,
): string => {
    switch (subscriberType) {
        case SubscriberType.FIBE_TV:
        case SubscriberType.FIBE_TV_APP:
            return t('SERVICE_INCLUDED_WARNING_SERVICE_FIBE_TV');       // new key
        case SubscriberType.SATELLITE_TELEVISION:
            return t('SERVICE_INCLUDED_WARNING_SERVICE_SATELLITE_TV'); // new key
        case SubscriberType.MOBILITY:
            return t('SERVICE_INCLUDED_WARNING_SERVICE_MOBILITY');
        default:
            return t('SERVICE_INCLUDED_WARNING_SERVICE_TV');  // existing fallback
    }
};
```

**Pass `subscriberType` from parent (`CancelSubscriptionPopUp.tsx`):**

```typescript
// In CancelSubscriptionPopUp — already has includedByService?.subscriberType:
<ServiceIncludedWarningPopupContent
    onCheckboxChange={setWarningAcknowledged}
    isChecked={warningAcknowledged}
    subscriptionName={title}
    subscriberType={includedByService?.subscriberType}  // NEW
/>
```

---

### 7.3 `AlreadySubscribedContent` — Per-Type Label in `BduCard`

**File:** `src/components/subscriptions/add-subscription/selection-popup/AlreadySubscribedContent.tsx`

```typescript
// CURRENT:
const manageThroughText =
    subscriber?.type === SubscriberType.MOBILITY.valueOf()
        ? t('LINKS_MANAGE_THROUGH_MOBILITY', { phoneNumber: ... })
        : t('LINKS_MANAGE_THROUGH_TV', { ban: formattedSubscriberId });

// CHANGE to:
const getManageThroughText = (subscriberType: string | undefined): string => {
    switch (subscriberType) {
        case SubscriberType.MOBILITY.valueOf():
            return t('LINKS_MANAGE_THROUGH_MOBILITY', { phoneNumber: formattedSubscriberId });
        case SubscriberType.FIBE_TV.valueOf():
        case SubscriberType.FIBE_TV_APP.valueOf():
            return t('LINKS_MANAGE_THROUGH_FIBE_TV', { ban: formattedSubscriberId }); // new key
        case SubscriberType.SATELLITE_TELEVISION.valueOf():
            return t('LINKS_MANAGE_THROUGH_SATELLITE_TV', { ban: formattedSubscriberId }); // new key
        default:
            return t('LINKS_MANAGE_THROUGH_TV', { ban: formattedSubscriberId }); // existing fallback
    }
};
const manageThroughText = getManageThroughText(subscriber?.type);
```

---

### 7.4 Translation Keys to Add (CMS)

New translation keys required in the CMS strings (Subscriptions widget XML):

| Key                                                 | English (suggested)                        | Notes                      |
| --------------------------------------------------- | ------------------------------------------ | -------------------------- |
| `CANCEL_SUBSCRIPTION_INCLUDED_SERVICE_FIBE_TV`      | `Bell Fibe TV`                             | Mirrors existing `_TV` key |
| `CANCEL_SUBSCRIPTION_INCLUDED_SERVICE_SATELLITE_TV` | `Bell Satellite TV`                        |                            |
| `SERVICE_INCLUDED_WARNING_SERVICE_FIBE_TV`          | `Bell Fibe TV`                             | Agent warning popup        |
| `SERVICE_INCLUDED_WARNING_SERVICE_SATELLITE_TV`     | `Bell Satellite TV`                        |                            |
| `SERVICE_INCLUDED_WARNING_SERVICE_MOBILITY`         | `Bell Mobility`                            | If not already present     |
| `LINKS_MANAGE_THROUGH_FIBE_TV`                      | `Manage through Bell Fibe TV ({ban})`      | AlreadySubscribed card     |
| `LINKS_MANAGE_THROUGH_SATELLITE_TV`                 | `Manage through Bell Satellite TV ({ban})` |                            |

> Translation keys are loaded from the CMS endpoint (`NEXT_PUBLIC_CMS_TRANSLATIONS_ENDPOINT`) and uploaded via the MYB repository `Subscriptions.xml`.

---

### 7.5 Preserve BDU Type in `getIncludedByServiceInfo` (if distinct labels needed)

**File:** `src/utils/subscriptionsHelperFunctions.ts`

Currently, `getIncludedByServiceInfo` maps all BDU TV types to `{ subscriberType: SubscriberType.TELEVISION }`:

```typescript
if (
    overlappingSubscriberTypes.includes(SubscriberType.TELEVISION) ||
    (enableTvBduProducts && (...SATELLITE_TELEVISION || FIBE_TV || FIBE_TV_APP))
) {
    return { subscriberType: SubscriberType.TELEVISION };  // collapses BDU to generic TV
}
```

If the design requires distinct service names per BDU type, this must be changed to preserve the specific type:

```typescript
// Prefer TV hierarchy: check specific BDU types first if enableTvBduProducts
if (enableTvBduProducts) {
  if (overlappingSubscriberTypes.includes(SubscriberType.FIBE_TV)) {
    return { subscriberType: SubscriberType.FIBE_TV };
  }
  if (overlappingSubscriberTypes.includes(SubscriberType.FIBE_TV_APP)) {
    return { subscriberType: SubscriberType.FIBE_TV_APP };
  }
  if (
    overlappingSubscriberTypes.includes(SubscriberType.SATELLITE_TELEVISION)
  ) {
    return { subscriberType: SubscriberType.SATELLITE_TELEVISION };
  }
}
if (overlappingSubscriberTypes.includes(SubscriberType.TELEVISION)) {
  return { subscriberType: SubscriberType.TELEVISION };
}
```

> **Confirm with design/product:** Is a single "Bell TV" label acceptable for all BDU TV types, or are distinct names required?

---

## 8. Component Tree for Affected Areas

```
Customer page (pages/customer/index.tsx)
  └── TVAddOnSubscription.tsx               ← shown when tvAccountNumber present
        └── "Looking for your TV add-ons / Manage TV Services"
            (currently TV-only, may need to handle BDU types)

Subscription detail (cancel flow)
  └── CancelSubscriptionPopUp.tsx
        ├── IncludedByServiceBanner          ← uses getIncludedServiceName()
        │     "{subscriptionName} is included with your {serviceName}"
        │     [NEEDS: handle FIBE_TV, SATELLITE_TV, FIBE_TV_APP]
        └── ServiceIncludedWarningPopupContent  ← agent-only
              "Are you sure you want to cancel {subscriptionName}?"
              "This service is included with {serviceName}"
              [NEEDS: dynamic serviceName from subscriberType]

Add subscription (already subscribed popup)
  └── AlreadySubscribedContent.tsx → BduCard
        "Manage through Bell [TV/Fibe TV/Satellite TV/Mobility] ({ban})"
        [NEEDS: per-type label]

Review subscription (order confirmation)
  └── NoteOnServicesAccordion.tsx → TvLobPromoCancellationNote
        "Note about TV LOB promo cancellation"
        [NEEDS: evaluate if Internet/Residential LOB requires different message]
```

---

## 9. Implementation Checklist

### Logic changes

- [ ] Update `getIncludedServiceName()` in `CancelSubscriptionPopUp.tsx` to handle `FIBE_TV`, `FIBE_TV_APP`, `SATELLITE_TELEVISION`
- [ ] Add `subscriberType` prop to `ServiceIncludedWarningPopupContent`; pass it from `CancelSubscriptionPopUp`
- [ ] Replace hard-coded `SERVICE_INCLUDED_WARNING_SERVICE_TV` with dynamic lookup in `ServiceIncludedWarningPopupContent`
- [ ] Update `BduCard` in `AlreadySubscribedContent.tsx` to show per-BDU-type label
- [ ] Evaluate whether `getIncludedByServiceInfo` needs to preserve specific BDU type vs collapsing to `TELEVISION`

### Translation

- [ ] Add new CMS translation keys for BDU TV service names (all needed locales: EN, FR)
- [ ] Upload updated `Subscriptions.xml` to MYB repository

### Tests

- [ ] Update `CancelSubscriptionPopUp.test.tsx` — add test cases for `FIBE_TV` and `SATELLITE_TELEVISION` subscriber types showing correct service name
- [ ] Update `ServiceIncludedWarningPopupContent` tests — verify correct service name rendered per subscriber type
- [ ] Update `AlreadySubscribedContent` / `BduCard` tests — verify correct label per BDU type
- [ ] Update `subscriptionHelperFunction.test.ts` — update `getIncludedByServiceInfo` tests if the function signature/return changes

---

## 10. Risks & Edge Cases

| Risk                                                                                                                                | Mitigation                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `getIncludedByServiceInfo` collapses BDU types → `TELEVISION`; distinct labels will never be reached                                | Confirm with design whether distinct labels are needed; if so, change `getIncludedByServiceInfo` to preserve the specific type        |
| New translation keys missing from CMS at deploy time                                                                                | Add fallback English strings as `defaultValue` in `t()` calls, same as existing pattern in the codebase                               |
| `ServiceIncludedWarningPopupContent` is only shown in agent view — BDU subscriber type might not be available in all agent contexts | Check that `includedByService` is always populated in the relevant agent flows                                                        |
| `TVAddOnSubscription` component (on customer index page) is still TV-specific                                                       | Evaluate scope — may need a `BduAddOnSubscription` variant or a generic one if Satellite TV / Fibe TV customers also see this section |

---

## 11. References

- **Jira Story:** [APOART-2514](https://jira.bell.corp.bce.ca/browse/APOART-2514)
- **Parent Epic:** [APOART-1777](https://jira.bell.corp.bce.ca/browse/APOART-1777) — Katsumi Multi-Service Promotions (Post MVP)
- **Key source files (node-mono):**
  - [src/components/subscriptions/cancel-subscription/CancelSubscriptionPopUp.tsx](../node-mono/microfrontends/subscription-manager/src/components/subscriptions/cancel-subscription/CancelSubscriptionPopUp.tsx) — `getIncludedServiceName()`, `IncludedByServiceBanner`
  - [src/components/subscriptions/cancel-subscription/ServiceIncludedWarningPopUpContent.tsx](../node-mono/microfrontends/subscription-manager/src/components/subscriptions/cancel-subscription/ServiceIncludedWarningPopUpContent.tsx) — hard-coded `SERVICE_INCLUDED_WARNING_SERVICE_TV`
  - [src/components/subscriptions/add-subscription/selection-popup/AlreadySubscribedContent.tsx](../node-mono/microfrontends/subscription-manager/src/components/subscriptions/add-subscription/selection-popup/AlreadySubscribedContent.tsx) — `BduCard` hard-coded `LINKS_MANAGE_THROUGH_TV`
  - [src/components/subscriptions/review-subscription/NoteOnServicesAccordion.tsx](../node-mono/microfrontends/subscription-manager/src/components/subscriptions/review-subscription/NoteOnServicesAccordion.tsx) — `TvLobPromoCancellationNote`
  - [src/utils/subscriptionsHelperFunctions.ts](../node-mono/microfrontends/subscription-manager/src/utils/subscriptionsHelperFunctions.ts) — `getIncludedByServiceInfo()`, `getTvServiceURL()`
  - [src/models/enums/subscriberType.ts](../node-mono/microfrontends/subscription-manager/src/models/enums/subscriberType.ts) — `SubscriberType` enum
  - [src/models/components/SubscriptionDetail.ts](../node-mono/microfrontends/subscription-manager/src/models/components/SubscriptionDetail.ts) — `IncludedByServiceInfo` type
  - [src/utils/constants.ts](../node-mono/microfrontends/subscription-manager/src/utils/constants.ts) — `TV_LOB_PROMO_ID = 'promo_8'`

---

# APOART-2419: MSP — SM UI: MyBell Add ALC on Change Bundle Page

**Ticket:** [APOART-2419](https://jira.bell.corp.bce.ca/browse/APOART-2419)  
**Parent:** [APOART-1777](https://jira.bell.corp.bce.ca/browse/APOART-1777) — Katsumi Multi-Service Promotions (Post MVP) - PCPO  
**Sprint:** APOART PI-26.3 | **Team:** BANANABYTE | **Priority:** High | **Points:** 20  
**Repo:** `node-mono/microfrontends/subscription-manager`  
**Scope:** MyBell (customer self-serve) only

---

## 1. The Business Idea (Plain Language)

Bell customers with a streaming bundle (e.g., Crave + Netflix + Disney+ Trio Bundle) currently visit the **"Change your Bundle"** page to switch between bundle tiers (e.g., Trio Basic → Trio Premium) or between bundle types (e.g., Trio → Duo).

Today, if a customer wants to **downgrade from a bundle to individual À la carte (ALC) subscriptions**, they cannot do it in one step. They have to:

1. Cancel the bundle (takes effect at their anniversary date)
2. Come back later and add the individual ALC subscriptions as a separate transaction

This two-step process is frustrating and confusing. The goal of this story is to let the customer **select ALC options directly on the Change your Bundle page** and complete the downgrade in a single transaction.

**Example from the ticket:**

- Customer has Trio Basic Bundle (net $15/mo = $28.97 − $11.99cr − $1.98cr)
- Customer wants just Crave Basic ALC
- Currently: must cancel bundle on one visit, then add Crave ALC on the next visit
- After this change: on the Change Bundle page, the customer selects Crave Basic ALC → bundle is removed and Crave ALC is added in one step
- The $11.99 promotion credit (which applies to both bundles AND Crave ALC) carries over automatically
- The $1.98 credit drops because it only applies to Basic Bundle — this is expected behaviour

The ALC options shown are scoped to the platforms in the customer's current bundle. If the customer has Trio (Crave + Netflix + Disney+), they see ALC options for all three. If they have Duo (Crave + Netflix), they only see ALC options for Crave and Netflix.

---

## 2. The Technical Idea (Plain Language)

The Change Bundle page (`ChangeProductTier.tsx`) already has two tabs:

- **"Change your plan"** — tier changes within the same bundle category (Basic ↔ Premium)
- **"Change your bundle"** — switch to a different bundle (Trio ↔ Duo)

This story adds a **third tab: "À la carte"** that shows individual ALC subscriptions derived from the products contained in the customer's current bundle.

The key data structure already exists: `bundleChildToALCQualificationItemsMap` (in `DataContext`) maps each bundle-product qualification item ID to its ALC equivalent. This is built in `DataProvider.tsx` by walking the bundle's `bundledQualificationItems` and following their `INCLUDES` relationships.

When a customer picks an ALC tier on the new tab:

1. The bundle is marked for deletion (`QualificationItemAction.DELETE`)
2. The chosen ALC subscription is added (`QualificationItemAction.ADD`)
3. Both actions are submitted together as a single qualification order

The `TierCarousel` component (already used for tiers and bundle switching) can be reused to render the ALC options. The ALC items that are currently filtered out in MyBell (because the platform is already on profile) must be **un-filtered** in this flow.

The ticket also mentions a **CTA popup redirect**: when a customer encounters a credit-loss warning (`CreditLossPopup`), a new button should let them switch to ALC instead of cancelling or proceeding anyway.

---

## 3. Glossary

| Term                                      | Meaning                                                                                                                           |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **ALC**                                   | À la carte — individual streaming subscriptions (Crave Basic, Crave Premium, Netflix Basic, etc.)                                 |
| **Bundle**                                | A multi-service subscription package (e.g., Crave + Netflix + Disney+ Trio Bundle)                                                |
| **Bundle tier**                           | A variant within a bundle (e.g., Trio Basic vs Trio Premium)                                                                      |
| **bundleChildToALCQualificationItemsMap** | `Map<string, string>` in `DataContext` — maps a bundle-child qualification item ID to its corresponding ALC qualification item ID |
| **`bundledQualificationItems`**           | The individual product slots within a bundle offering (e.g., the Crave slot in a Trio Bundle)                                     |
| **`INCLUDES` relationship**               | A `QualificationItemRelationship` type on a bundle-child item that points to its ALC equivalent                                   |
| **`TierCarousel`**                        | Existing component that renders a horizontally scrollable set of subscription tier cards                                          |
| **`CreditLossPopup`**                     | Popup warning the customer they will lose a promotion if they proceed with a tier change                                          |
| **`CMO`**                                 | Current Market Offer — the existing bundle offerings shown on the Change Bundle page                                              |
| **Anniversary date**                      | The date when downgrade/cancellation actions become effective                                                                     |

---

## 4. Acceptance Criteria

**Given** an existing MyBell customer has a bundle on their profile and navigates to the "Change your Bundle" page

**When** the customer wants to downgrade from their bundle to ALC

**Then:**

1. ALC rate cards (with applicable promotions) are shown on the Change your Bundle page alongside existing bundle options
2. The ALC options available are scoped to the platforms in the customer's current bundle:
   - Customer has Trio (Crave+Netflix+Disney+) → show Crave Basic/Premium, Netflix Basic/Premium, Disney Basic/Premium
   - Customer has Duo (Crave+Netflix) → show Crave Basic/Premium, Netflix Basic/Premium only
3. The customer can select ALC and switch from bundle to ALC in a **single transaction** (bundle removed + ALC added at same time)
4. No change to existing upgrade/downgrade anniversary rules
5. A CTA in the appropriate popup redirects the customer to select ALC as an alternative

---

## 5. Current Architecture of the Change Bundle Page

```
pages/customer/change-subscription/[id]/index.tsx
  └── ChangeProductTier.tsx
        ├── Tab 0: "Change your plan"    [existing]
        │     TierCarousel(qualificationItems)
        │     — tiers within the same bundle category (Basic ↔ Premium)
        │
        ├── Tab 1: "Change your bundle"  [existing]
        │     TierCarousel(bundleItems)
        │     — other bundles whose platforms overlap with current (Trio ↔ Duo)
        │
        └── [MISSING] Tab 2: "À la carte" / "Switch to individual"
              — ALC subscriptions derived from the current bundle's products
              — needs to be added
```

**The `bundleItems` computation (Tab 1)** in `ChangeProductTier.tsx`:

```typescript
// Iterates all categories in the catalog
categoriesMap.forEach((category) => {
  if (!category.isBundle) return; // only bundle categories
  if (category.id === subscriptionCategory.id) return; // skip current bundle
  if (isPlatformsOverlapping) {
    // adds valid bundle tiers to bundleToBundleChangeItems
  }
});
```

This logic is bundle-only. The new ALC tab requires a parallel `alcItems` computation.

---

## 6. Code-Level Change Guide

### 6.1 Add `SWITCH_TO_ALC` tab to `ChangeProductTier.tsx`

**File:** `src/components/subscriptions/change-subscription/ChangeProductTier.tsx`

**Step 1 — Extend `TabType` enum:**

```typescript
enum TabType {
  CHANGE_YOUR_TIER, // existing
  CHANGE_YOUR_BUNDLE, // existing
  SWITCH_TO_ALC, // NEW
}
```

**Step 2 — Compute ALC items for the current bundle:**

Pull `bundleChildToALCQualificationItemsMap` from `DataContext` and derive ALC subscriptions:

```typescript
const { bundleChildToALCQualificationItemsMap } = useDataContext();

const alcItems = useMemo<QualificationItem[]>(() => {
  if (!subscriptionCategory.isBundle) return [];

  const bundleChildRefs = (subscriptionCategory.qualificationItems ??
    []) as QualificationItemRef[];
  const alcIds = new Set<string>();

  bundleChildRefs.forEach((ref) => {
    const alcId = bundleChildToALCQualificationItemsMap.get(ref.id);
    if (alcId) alcIds.add(alcId);
  });

  // For each ALC item, also collect all sibling tiers in the same category
  const result: QualificationItem[] = [];
  alcIds.forEach((alcId) => {
    const alcItem = qualificationItemsMap.get(alcId);
    if (!alcItem || isSubscriptionHidden(alcItem)) return;

    const multiTierCategory = getMultiTierCategory(
      (alcItem.productOffering?.categories as CategoryRef[]) ?? [],
      categoriesMap,
    );

    if (multiTierCategory) {
      // Get all tiers (Basic, Premium, etc.) for this ALC category
      const categoryTiers = (multiTierCategory.qualificationItems ?? [])
        .map((ref) => qualificationItemsMap.get(ref.id)!)
        .filter((item) => item && !isSubscriptionHidden(item));

      categoryTiers.forEach((tier) => appendItemIfNotExists([tier], result));
    } else {
      appendItemIfNotExists([alcItem], result);
    }
  });

  return result.filter(Boolean);
}, [
  subscriptionCategory,
  bundleChildToALCQualificationItemsMap,
  qualificationItemsMap,
  categoriesMap,
]);
```

**Step 3 — Add tab button (only visible when `alcItems.length > 0`):**

```tsx
{
  subscriptionCategory.isBundle && alcItems.length > 0 && (
    <button
      className={`tab-change ... ${selectedTab === TabType.SWITCH_TO_ALC ? "active" : ""}`}
      onClick={() => setSelectedTab(TabType.SWITCH_TO_ALC)}
      data-testid="switch-to-alc-button"
      role="tab"
      aria-selected={selectedTab === TabType.SWITCH_TO_ALC}
    >
      {t("BUTTONS_SWITCH_TO_ALC")}
    </button>
  );
}
```

**Step 4 — Render ALC items when tab is selected:**

```tsx
const renderSwitchToALC = (): JSX.Element => {
  return (
    <div className="mt-10 flex flex-col">
      <h3 className="mb-5 font-bellSlim text-[22px] font-black leading-[24px] tracking-[-0.4px]">
        {t("CHANGE_TIER_AVAILABLE_ALC", { count: alcItems.length })}
      </h3>
      <TierCarousel
        qualificationItems={alcItems}
        currentTier={currentTier}
        selectionError={selectionError}
        selectedTier={selectedTier}
        onTierSelect={onTierSelect}
        disableCurrentTier={false} // ALC items are never the current tier
        isBundleChange={true} // flags that this is a bundle→ALC change
        isChangeFlow={true}
        deferApplyToOrder={true}
      />
    </div>
  );
};
```

Update the render switch:

```typescript
{
  selectedTab === TabType.CHANGE_YOUR_TIER
    ? renderChangeYourTier()
    : selectedTab === TabType.CHANGE_YOUR_BUNDLE
      ? renderChangeYourBundle()
      : renderSwitchToALC();
} // NEW
```

---

### 6.2 Fix ALC Platform Filter in `getCatalogSubscriptionsForCategory`

**File:** `src/utils/subscriptionsHelperFunctions.ts`

Currently, ALC items are hidden in MyBell when the platform is already on profile:

```typescript
// MyBell ONLY - Hide ALC item if the platform is already on profile
!(
  !isAgentView &&
  category.id !== "AllSubscriptions" &&
  isSubscriptionStreamingPlatformAlreadyOwned(sub, profileStreamingPlatformsSet)
);
```

This filter prevents ALC from appearing in any MyBell flow when the customer already owns a bundle for that platform — which is exactly the scenario we're in.

**Option A:** Pass a `skipPlatformFilter` flag:

```typescript
export const getCatalogSubscriptionsForCategory = (
    ...
    skipPlatformFilter = false,   // NEW parameter
): { singleTierSubs: ..., multiTierSubs: ... } => {
    // ...
    !(
        !isAgentView &&
        !skipPlatformFilter &&    // NEW check
        category.id !== 'AllSubscriptions' &&
        isSubscriptionStreamingPlatformAlreadyOwned(sub, profileStreamingPlatformsSet)
    )
```

**Option B (simpler):** Since `alcItems` in `ChangeProductTier.tsx` is built directly from `bundleChildToALCQualificationItemsMap` without calling `getCatalogSubscriptionsForCategory`, no filter change is needed — as long as `getMultiTierCategory` is used directly to get the tiers. The platform filter only affects the Add Subscription flow.

> **Confirm which approach to use** during implementation. Option B is lower risk.

---

### 6.3 Handle Selection Action for Bundle → ALC

**File:** `src/components/subscriptions/change-subscription/ChangeProductTier.tsx` (or the `onTierSelect` handler in `pages/customer/change-subscription/[id]/index.tsx`)

When the customer selects an ALC item on the new tab, the actions must be:

1. `DELETE` the current bundle subscription
2. `ADD` the selected ALC subscription

This mirrors the existing bundle-to-bundle change logic in `ChangePlanPopUp.tsx`:

```typescript
selectItem(selectedTier, QualificationItemAction.ADD, undefined, true); // add ALC
selectItem(qualificationItem, QualificationItemAction.DELETE, undefined, true); // remove bundle
```

The existing `onTierSelect` handler in the page already does this for bundle → bundle. Verify it works correctly for bundle → ALC (different category), and if not, add a dedicated handler passed to `renderSwitchToALC`.

---

### 6.4 Add CTA in `CreditLossPopup` to Redirect to ALC

**File:** `src/components/subscriptions/change-subscription/CreditLossPopup.tsx`

The ticket says: _"Add CTA in pop up and redirect customer back to add Crave ALC as per images attached."_

The `CreditLossPopup` currently has two buttons: **Proceed anyway** and **Cancel**. A third button (or a text link) needs to redirect the user to the ALC tab of the Change Bundle page.

```typescript
// New button/link in CreditLossPopup:
const handleSwitchToALC = () => {
  setOpenCreditLossPopup(false);
  // Scroll to or activate the ALC tab
  // Option A: pass a callback from parent
  onSwitchToALC?.();
  // Option B: navigate to the change page with ALC tab pre-selected
  router.push(`/customer/change-subscription/${categoryId}?tab=alc`);
};
```

The parent `ChangeProductTier.tsx` would need to expose `setSelectedTab(TabType.SWITCH_TO_ALC)` via a callback prop or URL param.

**New prop on `CreditLossPopup`:**

```typescript
type Props = {
  selectedTier: QualificationItem;
  setTierSelected: Dispatch<SetStateAction<string | null>>;
  promotions: QualificationItem[];
  setOpenCreditLossPopup: Dispatch<SetStateAction<boolean>>;
  onSwitchToALC?: () => void; // NEW optional prop
};
```

---

## 7. Data Flow Diagram

```
Customer on Change Bundle page (bundle currently on profile)
       │
       ▼
ChangeProductTier.tsx
  ├── Tab 0: "Change your plan"    [existing — tiers within same bundle]
  │
  ├── Tab 1: "Change your bundle"  [existing — switch to Duo/Trio/etc.]
  │
  └── Tab 2: "À la carte"          [NEW — derived from bundleChildToALCQualificationItemsMap]
                │
                │  bundleChildToALCMap (DataContext)
                │    maps: "bundle_crave_child_id" → "crave_basic_alc_id"
                │
                │  getMultiTierCategory()
                │    gets all ALC tiers (Basic/Premium) for each platform
                │
                ▼
             TierCarousel(alcItems)
                │
                │  Customer selects "Crave Basic ALC"
                │
                ▼
             onTierSelect(craveBasicALC)
                │
                ├── selectItem(craveBasicALC, ADD)
                └── selectItem(currentBundle, DELETE)
                │
                ▼
             Review page → Confirm → Order submitted
             (Single transaction: bundle removed + ALC added)
```

---

## 8. Key Rules and Edge Cases

| Scenario                                                | Expected Behaviour                                                                                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Customer has Trio Bundle → selects Crave Basic ALC      | Bundle removed, Crave Basic ALC added. Netflix and Disney+ promos associated only to the bundle are dropped. The $11.99cr (eligible for Crave ALC) continues. |
| Customer has Duo Bundle → opens ALC tab                 | Only shows Crave and Netflix ALC options (not Disney+)                                                                                                        |
| $11.99cr eligible for both bundle and ALC               | Promotion continues when switching to ALC (Configurator handles promo carry-over via existing apply-and-qualify logic)                                        |
| $1.98cr eligible for Basic Bundle only                  | Promotion drops when switching to ALC — expected, aligns with promo rules                                                                                     |
| No ALC options available (bundle has no ALC equivalent) | ALC tab is not shown                                                                                                                                          |
| Customer on Agent view                                  | This flow is **MyBell only** — ALC tab on Change Bundle page should not render in agent view                                                                  |
| Anniversary downgrade rules                             | No change — same effective date rules as bundle-to-bundle change                                                                                              |
| Customer selects ALC, then goes back to bundle tab      | Selection is cleared, standard deselect/reselect flow applies                                                                                                 |

---

## 9. Where `bundleChildToALCQualificationItemsMap` Is Built

**File:** `src/context/providers/DataProvider.tsx`

```typescript
const bundleChildToALCQualificationItemsMap = new Map<string, string>();

// For each bundle offering in the catalog:
//   For each bundled child qualification item:
//     If not already mapped, call findALCSubscriptionId(bundleChild)
//     findALCSubscriptionId() looks for a QualificationItemRelationship.INCLUDES relationship
//     and returns the entityId of the included ALC item
//     Store: bundleChildId → alcId
bundleChildToALCQualificationItemsMap.set(bundleChildId, ALCRef);
```

The map is already available in `DataContext.bundleChildToALCQualificationItemsMap` and can be consumed directly in `ChangeProductTier.tsx`.

---

## 10. Translation Keys to Add

| Key                                   | English (suggested)                    |
| ------------------------------------- | -------------------------------------- |
| `BUTTONS_SWITCH_TO_ALC`               | `À la carte` or `Individual`           |
| `CHANGE_TIER_AVAILABLE_ALC`           | `{count} individual options available` |
| `CREDIT_LOSS_POPUP_SWITCH_TO_ALC_CTA` | `Switch to À la carte instead`         |

---

## 11. Implementation Checklist

### `ChangeProductTier.tsx`

- [ ] Add `SWITCH_TO_ALC` to `TabType` enum
- [ ] Compute `alcItems` from `bundleChildToALCQualificationItemsMap` + `getMultiTierCategory`
- [ ] Add new tab button (hidden in agent view, hidden when `alcItems.length === 0`)
- [ ] Add `renderSwitchToALC()` function using `TierCarousel`
- [ ] Update render switch to handle new tab

### `CreditLossPopup.tsx`

- [ ] Add optional `onSwitchToALC` prop
- [ ] Add CTA button/link that calls `onSwitchToALC` and closes the popup

### `pages/customer/change-subscription/[id]/index.tsx`

- [ ] Verify `onTierSelect` correctly handles bundle → ALC (different category) action pair
- [ ] Pass `onSwitchToALC` callback down to `ChangeProductTier` → `CreditLossPopup`

### Helper / utility

- [ ] Confirm whether `getCatalogSubscriptionsForCategory` platform filter needs to be bypassed (assess Option A vs B)

### Tests

- [ ] `ChangeProductTier.test.tsx` — verify ALC tab renders when bundle has ALC equivalents
- [ ] `ChangeProductTier.test.tsx` — verify ALC tab absent when no ALC equivalents
- [ ] `ChangeProductTier.test.tsx` — verify ALC tab hidden in agent view
- [ ] `CreditLossPopup.test.tsx` — verify `onSwitchToALC` CTA renders and fires callback
- [ ] `DataProvider` — verify `bundleChildToALCQualificationItemsMap` contains expected mappings for test data

---

## 12. Files to Change

| File                                                                                                                                                                                              | Change                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [src/components/subscriptions/change-subscription/ChangeProductTier.tsx](../node-mono/microfrontends/subscription-manager/src/components/subscriptions/change-subscription/ChangeProductTier.tsx) | Add `SWITCH_TO_ALC` tab, `alcItems` computation, `renderSwitchToALC()` |
| [src/components/subscriptions/change-subscription/CreditLossPopup.tsx](../node-mono/microfrontends/subscription-manager/src/components/subscriptions/change-subscription/CreditLossPopup.tsx)     | Add `onSwitchToALC` prop + CTA button                                  |
| [src/pages/customer/change-subscription/[id]/index.tsx](../node-mono/microfrontends/subscription-manager/src/pages/customer/change-subscription/%5Bid%5D/index.tsx)                               | Wire `onSwitchToALC` callback; validate ALC selection handler          |
| [src/utils/subscriptionsHelperFunctions.ts](../node-mono/microfrontends/subscription-manager/src/utils/subscriptionsHelperFunctions.ts)                                                           | Potentially add `skipPlatformFilter` param (if Option A chosen)        |

---

## 13. References

- **Jira Story:** [APOART-2419](https://jira.bell.corp.bce.ca/browse/APOART-2419)
- **Parent Epic:** [APOART-1777](https://jira.bell.corp.bce.ca/browse/APOART-1777)
- **Key source files (node-mono):**
  - [src/components/subscriptions/change-subscription/ChangeProductTier.tsx](../node-mono/microfrontends/subscription-manager/src/components/subscriptions/change-subscription/ChangeProductTier.tsx) — current two-tab Change Bundle page; main target file
  - [src/components/subscriptions/change-subscription/CreditLossPopup.tsx](../node-mono/microfrontends/subscription-manager/src/components/subscriptions/change-subscription/CreditLossPopup.tsx) — credit-loss warning popup; needs new CTA
  - [src/context/providers/DataProvider.tsx](../node-mono/microfrontends/subscription-manager/src/context/providers/DataProvider.tsx) — builds `bundleChildToALCQualificationItemsMap`
  - [src/context/DataContext.tsx](../node-mono/microfrontends/subscription-manager/src/context/DataContext.tsx) — `bundleChildToALCQualificationItemsMap` type definition
  - [src/utils/subscriptionsHelperFunctions.ts](../node-mono/microfrontends/subscription-manager/src/utils/subscriptionsHelperFunctions.ts) — `getCatalogSubscriptionsForCategory`, `findALCSubscriptionId`, `getMultiTierCategory`
  - [src/components/common/tiers/TierCarousel.tsx](../node-mono/microfrontends/subscription-manager/src/components/common/tiers/TierCarousel.tsx) — existing carousel for rendering subscription tier cards (reused for ALC tab)
  - [src/components/subscriptions/change-subscription/ChangePlanPopUp.tsx](../node-mono/microfrontends/subscription-manager/src/components/subscriptions/change-subscription/ChangePlanPopUp.tsx) — embeds `ChangeProductTier`; review if ALC tab is also needed here

---

# APOART-2124: VAS APR + Anniversary — Exploration: Exceptions for Netflix VAS When Bundle Has Pending Change

**Ticket:** [APOART-2124](https://jira.bell.corp.bce.ca/browse/APOART-2124)  
**Parent:** [APOART-1834](https://jira.bell.corp.bce.ca/browse/APOART-1834) — Katsumi Future Enhancements (bucket)  
**Sprint:** APOART PI-26.3 | **Team:** BANANABYTE | **Priority:** Medium | **Points:** 10  
**Type:** Exploration Enabler | **Status:** Analysis Completed  
**Scope:** go-repo — `services/order-api`, `serverless/subscription-cancel-downgrade-batch-process`

---

## 1. The Business Problem (Plain Language)

Imagine a customer has Trio Bundle (Crave + Netflix + Disney+) that is **pending cancellation** (the customer asked to cancel it, but it won't actually be removed until their anniversary date).

While that bundle is in a "pending cancel" state, the customer or Netflix's systems decide to **upgrade their Netflix subscription to a VAS (premium tier)** — for example, going from Netflix Standard to Netflix Premium 4K via the Netflix portal or through MyBell.

This creates a **timing conflict**:

- The bundle is scheduled to be removed on the anniversary date
- The Netflix VAS add-on has now been placed on top of a Netflix subscription that is itself about to go away

If the VAS order then **fails** (either at fulfillment with Netflix's reseller API, or at billing), the profile can end up in an inconsistent or locked state, requiring manual intervention.

**This exploration identifies all the exception scenarios** that can arise in this situation and recommends how each should be handled — either with automated prevention/recovery or with manual contingency processes.

---

## 2. The Technical Problem (Plain Language)

When Bell's BPP backend processes an order, it goes through these steps:

1. **Subscription Configurator** locks the cart (state `"Locked"`) while processing
2. **Fulfillment** — calls the Netflix reseller API to action the change
3. **Billing** — publishes the billing event to the event hub
4. **Profile update** — updates subscriber manager with the new state

If BOTH fulfillment and billing fail for a VAS order, the profile remains in a `"Locked"` state. While locked, the upcoming **Anniversary Batch** (which processes the pending bundle cancellation) cannot run.

The same locked-profile situation also blocks:

- CTC (commit-to-change) orders from agents/MyBell
- Subsequent VAS changes via the Netflix portal
- Any other order activity (remove VAS, bundle change)

The core goal of this ticket is to **define what each entry point should do** when it detects that the profile is locked or that the bundle being changed is in `pendingCancellation` state.

---

## 3. Glossary

| Term                              | Meaning                                                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **VAS**                           | Value Added Service — a premium add-on to an existing subscription (e.g., Netflix Premium 4K added on top of a Netflix subscription that's in a bundle) |
| **VAS Product**                   | In the session, a product item with an `AddsOnTo` / `Suppresses` relationship pointing to its parent Netflix product                                    |
| **VAS Parent**                    | The bundled Netflix subscription that the VAS upgrades (e.g., "Netflix Standard in Trio Bundle")                                                        |
| **Pending Cancel**                | A bundle offering in `ActiveTerminating` state — the customer has cancelled but it hasn't taken effect yet (takes effect at anniversary date)           |
| **Bundle Change**                 | A bundle tier change (e.g., Trio Basic → Trio Premium) that hasn't fully completed yet                                                                  |
| **Profile Locked**                | Cart state `"Locked"` in Subscription Configurator — set when an order is in-flight; prevents new orders on the same profile                            |
| **Anniversary Batch**             | The `subscription-cancel-downgrade-batch-process` Lambda that runs on anniversary date to process pending cancellations and downgrades                  |
| **Kickout**                       | A fallout event sent when the batch process cannot complete; the profile is re-queued for retry                                                         |
| **CTC**                           | Commit-to-Change — the flow by which agents or customers submit order changes via order-api                                                             |
| **Fulfillment**                   | The call to the Netflix reseller API to activate/update/cancel the subscription at Netflix                                                              |
| **`SuppressedBy`**                | Item relationship type indicating that a parent product is suppressed (replaced) by a VAS product                                                       |
| **`Suppresses`**                  | Item relationship type on the VAS product — it suppresses (replaces) the parent product                                                                 |
| **`isVasChangeBlocked()`**        | Function in `post_order_helper.go` that checks whether VAS changes should be blocked                                                                    |
| **`handleLockedCartResponse()`**  | Function in `plan_change.go` handling the response path when a cart is in `"Locked"` state                                                              |
| **`OfferingPendingCancellation`** | Error constant in `model/order-api/error.go`: `"vas changes not allowed since corresponding offering is in pending cancellation"`                       |

---

## 4. Acceptance Criteria (From Ticket)

1. **Identify** all potential exception scenarios and resulting profile item states when a VAS request is submitted while a bundle has a pending cancel or bundle change
2. **Propose** exception handling options:
   - Additional development stories (automated handling), OR
   - Manual contingency processing

---

## 5. In-Scope Exception Scenarios

All three scenarios share the same precondition: a customer has a **bundle with Netflix in a pending cancel or bundle change state**, AND a VAS request arrives AND that VAS request fails.

### Scenario 10 — Add VAS to Bundled Netflix (Bundle Pending Termination), VAS Fails

**Sequence:**

```
[T0] Customer cancels Trio bundle → bundle moves to ActiveTerminating
[T1] VAS request arrives: Netflix Standard → Netflix Premium 4K
     (via Netflix Portal or OrderMax/OneView/MyBell)
[T2] VAS order: convertToOrder succeeds
[T3] VAS fulfillment FAILS (Netflix reseller API rejects)
[T4] Profile is left in locked state (billing/fulfillment incomplete)
[T5] Anniversary Batch tries to run the pending bundle cancellation → blocked by lock
```

**Resulting profile item states:**

- Bundle offering: `ActiveTerminating` (never resolved)
- Netflix product in bundle: `ActiveTerminating` or `SuppressedTerminating`
- VAS product: `NewActivating` (never completed)
- Cart: `Locked`

**Risk:** Anniversary Batch cannot complete the pending bundle cancellation because the cart is locked. The customer continues to be billed for the bundle indefinitely.

---

### Scenario 11 — Add VAS to Bundled Netflix, Billing Fails (Fulfillment Succeeds)

**Sequence:**

```
[T0] Bundle pending termination (same as Scenario 10)
[T1] VAS request arrives
[T2] VAS fulfillment SUCCEEDS (Netflix activates the VAS subscription at their end)
[T3] Billing event publish FAILS
[T4] Profile update left in inconsistent state — Netflix has VAS active but Bell's billing doesn't
[T5] Anniversary Batch blocked (if profile is locked)
```

**Risk:** Netflix activates VAS (customer has the benefit) but Bell doesn't bill for it. Manual reconciliation needed.

---

### Scenario 12 — Change VAS (Bundle Tier Change Pending), VAS Fails

**Sequence:**

```
[T0] Customer changes Trio Basic → Trio Premium (bundle tier change pending)
[T1] VAS request arrives: change Netflix Standard VAS → Netflix Premium 4K VAS
     (this hits the pending termination code path in order-api)
[T2] handleChangeVasPendingTermination() is called in order-api
[T3] VAS change fulfillment FAILS
[T4] Profile locked; Bundle tier change stuck
```

**Risk:** Both the bundle tier change and the VAS upgrade are stuck in an inconsistent state.

---

## 6. Existing Code Already Handling VAS Scenarios (Context)

The codebase already has significant VAS exception handling built during previous stories (APOART-2107, APOART-2199, APOART-2568). This exploration extends those to cover **failure cases**.

### 6.1 Profile Locking Check

**File:** [services/order-api/internal/helpers/cart_helper.go](../services/order-api/internal/helpers/cart_helper.go)

```go
LockedState = "Locked"
```

**File:** [services/order-api/internal/plan_change.go](../services/order-api/internal/plan_change.go)

```go
if cart.State == LockedState {
    // either return 202-Declined (if APOART-2398 flag and DeclineLocked param present)
    // or call handleLockedCartResponse() to handle legacy locked state
}
```

**File:** [services/subscription-configurator-api/internal/service/configurator/apply_and_qualify.go](../services/subscription-configurator-api/internal/service/configurator/apply_and_qualify.go)

```go
var InvalidCartStates = []string{"ConvToOrder", "Locked"}
```

### 6.2 VAS Change Blocked Check

**File:** [services/order-api/internal/post_order_helper.go](../services/order-api/internal/post_order_helper.go)

`isVasChangeBlocked()` already exists and is gated by the `VAS_BUNDLE_PENDING_CHANGE_ORDER_API` feature flag. It checks whether VAS changes should be blocked when the parent offering is in `pendingCancellation` state.

```go
// Controlled via feature flag VAS_BUNDLE_PENDING_CHANGE_ORDER_API.
```

### 6.3 Error Message Already Defined

**File:** [model/order-api/error.go](../model/order-api/error.go)

```go
OfferingPendingCancellation = "vas changes not allowed since corresponding offering is in pending cancellation"
```

### 6.4 VAS Pending Termination Handlers

**File:** [services/order-api/internal/post_order.go](../services/order-api/internal/post_order.go)

The `updateProductStateVAS()` function (gated by `APOART-2107` flag) already dispatches to:

- `handleAddVasPendingTermination()` — VAS Add when parent Netflix is `ActiveTerminating`
- `handleDeleteVasPendingTermination()` — VAS Delete when parent Netflix is `SuppressedTerminating`
- `handleChangeVasPendingTermination()` — VAS Change when parent Netflix has 2 `SuppressedBy` relationships

These handlers set the correct profile item states when VAS operations **succeed**. The gap is: **what happens when they fail**.

### 6.5 Batch Process VAS Handling

**File:** [serverless/subscription-cancel-downgrade-batch-process/app/service/fulfillment/fulfillment.go](../serverless/subscription-cancel-downgrade-batch-process/app/service/fulfillment/fulfillment.go)

The batch process uses `AddsOnToRelationship = "AddsOnTo"` to detect VAS-parent relationships during anniversary processing. It handles the VAS-present scenario for the normal (non-failure) path.

### 6.6 VAS Fallout Error Codes

**File:** [pkg/coreprocessor/fallout/model/falloutConst.go](../pkg/coreprocessor/fallout/model/falloutConst.go)

```go
VASRetryErrorCode_Fulfillment       = "BPPE7100"
VASRetryRevertErrorCode_Fulfillment = ...
```

**File:** [pkg/coreprocessor/fallout/internal/fallout_translate.go](../pkg/coreprocessor/fallout/internal/fallout_translate.go)

```go
// Manual resolution message for VAS fallout:
"Please check profile and Netflix subscription and fix Netflix subscription manually via Postman, as required."
```

---

## 7. Recommended Exception Handling (From Ticket)

The recommendation in the ticket, mapped to implementation approaches:

### 7.1 Anniversary Batch — Re-kickout on Lock

**Problem:** Anniversary Batch arrives to process a pending bundle cancellation but the profile is locked (due to a stuck VAS order).

**Recommendation:** Kickout the batch item again — put it back in the queue for retry.

**Where to implement:**

```
serverless/subscription-cancel-downgrade-batch-process/
    app/service/fulfillment/fulfillment.go
```

Check for `Locked` cart state at the start of batch item processing. If locked, treat as a transient error and re-queue (exponential backoff up to configured `BATCH_MAX_RETRIES`).

**Existing retry config** already in batch:

```go
MaxRetries:  getEnvAsIntOrDefault("BATCH_MAX_RETRIES", 3)
RetryDelay:  getEnvAsDurationOrDefault("BATCH_RETRY_DELAY", 5*time.Second)
```

---

### 7.2 CTC (Order API) — Block When Profile Locked

**Problem:** An agent or customer tries to submit a CTC order (e.g., via OrderMax or OneView) while the profile is locked.

**Recommendation:** Prevent the order from going through when profile is locked.

**Where this already exists:**

```
services/order-api/internal/plan_change.go → handleLockedCartResponse()
```

The `PlanChange` handler already checks for `LockedState` and returns a `202 Declined` when `APOART-2398` flag is on and `DeclineLocked` parameter is set. **This pattern needs to be extended** to cover the VAS + pending bundle scenario specifically (surface the `OfferingPendingCancellation` error).

---

### 7.3 VAS via Netflix Portal — Reject When Profile Locked

**Problem:** Netflix Portal submits a VAS change request to `services/merchant-api-netflix` which forwards it to order-api; the profile is locked.

**Recommendation:** Reject the VAS request when the profile is locked. Return an appropriate error to the Netflix Portal so it can retry later.

**Where to implement:**

```
services/merchant-api-netflix/services/merchant_utils.go
services/order-api/internal/post_order_helper.go  (isVasChangeBlocked)
```

The `isVasChangeBlocked()` function (gated by `VAS_BUNDLE_PENDING_CHANGE_ORDER_API`) should additionally check for `Locked` cart state and return the block.

---

### 7.4 VAS Removal / Other Orders via OrderMax, OneView, MyBell — Prevent When Locked

**Problem:** Any other order attempt (remove VAS, add VAS, bundle change) arrives via the order-api while the profile is locked due to a stuck VAS order.

**Recommendation:** Prevent the operation. Return `OfferingPendingCancellation` or a locked-state error.

**Existing mechanism:**

```
services/order-api/internal/post_order_helper.go
    plan_change.go → handleLockedCartResponse()
```

Ensure `isVasChangeBlocked()` covers this path and is called before `convertToOrder` for all VAS-related operations.

---

## 8. Exception Scenario Decision Table

| Source                  | Profile State                         | VAS Request Type | Recommended Action                                                                        |
| ----------------------- | ------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| Anniversary Batch       | `Locked` (VAS stuck)                  | N/A              | Re-kickout (retry)                                                                        |
| CTC (Agent/MyBell)      | `Locked`                              | Any              | Block — return 202 Declined or `GetCartStateLocked` error                                 |
| Netflix Portal          | Bundle in `pendingCancellation`       | VAS Add/Change   | Reject — return `OfferingPendingCancellation`                                             |
| Netflix Portal          | Cart `Locked`                         | VAS Add/Change   | Reject — return locked error                                                              |
| OrderMax/OneView/MyBell | Cart `Locked`                         | VAS Remove       | Block — prevent remove                                                                    |
| OrderMax/OneView/MyBell | Bundle in `pendingCancellation`       | VAS Add/Change   | Block via `isVasChangeBlocked()`                                                          |
| Any                     | Fulfillment failed, billing succeeded | VAS              | Manual: check Netflix subscription state, revert via Postman if needed (BPPE7100 fallout) |
| Any                     | Fulfillment succeeded, billing failed | VAS              | Manual: reconcile billing; Netflix has VAS active but Bell not billing                    |

---

## 9. Profile Item State Outcomes

| Scenario                       | Bundle Offering     | Netflix Product         | VAS Product             | Cart     |
| ------------------------------ | ------------------- | ----------------------- | ----------------------- | -------- |
| VAS Add fails (fulfillment)    | `ActiveTerminating` | `ActiveTerminating`     | `NewActivating` (stuck) | `Locked` |
| VAS Add fails (billing)        | `ActiveTerminating` | `SuppressedTerminating` | `ActiveTerminating`     | `Locked` |
| VAS Change fails (fulfillment) | `ActiveTerminating` | `SuppressedTerminating` | `NewActivating` (stuck) | `Locked` |
| Normal VAS Add (success)       | `ActiveTerminating` | `SuppressedTerminating` | `ActiveTerminating`     | Resolved |

---

## 10. Gaps Identified by This Exploration

| Gap                                                                                               | Where                                              | Proposed Resolution                                                    |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| Anniversary Batch does not check for `Locked` cart state before processing a kickout item         | `subscription-cancel-downgrade-batch-process`      | Add locked-state check + re-queue logic (new story)                    |
| `isVasChangeBlocked()` does not check for `Locked` cart state (only checks `pendingCancellation`) | `services/order-api/internal/post_order_helper.go` | Extend to also check cart state (new story)                            |
| Netflix Portal path (`merchant-api-netflix`) does not block VAS when cart is locked               | `services/merchant-api-netflix`                    | Add locked-state rejection before forwarding to order-api (new story)  |
| No automated recovery when billing succeeds + fulfillment fails for VAS-on-pending-termination    | `serverless/billing-process`, `services/order-api` | Manual contingency (Postman fix) — document in runbook; automate later |

---

## 11. Out of Scope

- VAS operations for profiles **without** a pending cancel or bundle change
- VAS requests for profiles with **downgrade** (not cancel)

---

## 12. Implementation Stories Implied

This exploration produces (at minimum) these follow-on stories:

| Story                                                                   | Scope   | Component                                                |
| ----------------------------------------------------------------------- | ------- | -------------------------------------------------------- |
| Batch process re-kickout when cart is locked                            | go-repo | `serverless/subscription-cancel-downgrade-batch-process` |
| Block CTC orders when profile locked due to VAS stuck order             | go-repo | `services/order-api`                                     |
| Netflix Portal VAS rejection when cart locked                           | go-repo | `services/merchant-api-netflix`, `services/order-api`    |
| Runbook: Manual recovery for VAS on pending-termination billing failure | N/A     | Operations runbook                                       |

---

## 13. Related Tickets and References

| Reference                                                                                                                                                                                         | Description                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [APOART-2199](https://jira.bell.corp.bce.ca/browse/APOART-2199)                                                                                                                                   | VAS via Netflix Portal (already documented)                                                                                                                             |
| [APOART-2568](https://jira.bell.corp.bce.ca/browse/APOART-2568)                                                                                                                                   | VAS via OrderMax/OneView/MyBell (already documented)                                                                                                                    |
| [APOART-2107](https://jira.bell.corp.bce.ca/browse/APOART-2107)                                                                                                                                   | VAS pending termination state handling (implemented via `APOART-2107` flag)                                                                                             |
| [APOART-2398](https://jira.bell.corp.bce.ca/browse/APOART-2398)                                                                                                                                   | Locked cart `DeclineLocked` parameter behaviour                                                                                                                         |
| Confluence Design                                                                                                                                                                                 | [2.16.4 Synchronous Price Change — Scenarios 10, 11, 12](https://confluence.bell.corp.bce.ca/spaces/HOORENOP/pages/1297199195/2.16.4+Synchronous+Price+Change+Solution) |
| Confluence Lifecycle                                                                                                                                                                              | [Item state lifecycle](https://confluence.bell.corp.bce.ca/spaces/HOORENOP/pages/1326401555/Lifecycle+of+sessionItem+Product+Offering+Subscription)                     |
| **Key source files (go-repo):**                                                                                                                                                                   |                                                                                                                                                                         |
| [services/order-api/internal/post_order.go](../services/order-api/internal/post_order.go)                                                                                                         | `updateProductStateVAS`, `handleChangeVasPendingTermination`, `isVasBundleCancellation`                                                                                 |
| [services/order-api/internal/post_order_helper.go](../services/order-api/internal/post_order_helper.go)                                                                                           | `isVasChangeBlocked`, feature flag `VAS_BUNDLE_PENDING_CHANGE_ORDER_API`                                                                                                |
| [services/order-api/internal/plan_change.go](../services/order-api/internal/plan_change.go)                                                                                                       | `handleLockedCartResponse`, `LockedState`, `LockedDescription`                                                                                                          |
| [model/order-api/error.go](../model/order-api/error.go)                                                                                                                                           | `OfferingPendingCancellation` error constant                                                                                                                            |
| [serverless/subscription-cancel-downgrade-batch-process/app/service/fulfillment/fulfillment.go](../serverless/subscription-cancel-downgrade-batch-process/app/service/fulfillment/fulfillment.go) | Batch VAS (`AddsOnTo`) handling                                                                                                                                         |
| [pkg/coreprocessor/fallout/model/falloutConst.go](../pkg/coreprocessor/fallout/model/falloutConst.go)                                                                                             | `VASRetryErrorCode_Fulfillment = "BPPE7100"`                                                                                                                            |
| [services/subscription-configurator-api/internal/service/configurator/apply_and_qualify.go](../services/subscription-configurator-api/internal/service/configurator/apply_and_qualify.go)         | `InvalidCartStates = ["ConvToOrder", "Locked"]`                                                                                                                         |

---

# APOART-2502: PROMO ENHANCE — Negative Pricing: Show "dash" for Negative Price on Rate Cards

**Ticket:** [APOART-2502](https://jira.bell.corp.bce.ca/browse/APOART-2502)  
**Parent:** [APOART-2046](https://jira.bell.corp.bce.ca/browse/APOART-2046) — Promotion Enhancements  
**Sprint:** APOART PI-26.3 | **Team:** BANANABYTE | **Priority:** Low | **Points:** 8  
**Repo:** `node-mono/microfrontends/subscription-manager`  
**Scope:** MyBell (customer) + Agent view — rate card price display only

---

## 1. The Business Idea (Plain Language)

When a customer has stacked promotions (e.g., a $12 credit applied to a $9.99/mo subscription), the mathematics can produce a **negative net price** — effectively the subscription costs $0 or even less than $0 after all credits are applied.

Today the UI silently clamps the displayed price to **$0.00** using `Math.max(0, price)` in several card components — the customer never sees anything unusual.

This ticket changes what is shown when the net price is negative:

- **Customer view (MyBell)**: Show a `—` (dash) instead of the price. This is cleaner for customers who don't need to understand the arithmetic — it just signals "this subscription costs you nothing right now."
- **Agent view**: Show the **actual negative amount** (e.g., `-$2.01/mo.`). Agents need the full picture to understand the promotion stacking and advise customers correctly.

---

## 2. The Technical Idea (Plain Language)

The qualification API returns a `netPrice` field (`PriceType = PriceWithLimitedAndOngoingCredits`) on each `QualificationItem`. This is the price after all promotion credits are applied. When promotions are very generous, this value can be a negative number.

Four card components currently all use `Math.max(0, price)` before calling `PriceDisplay` — this is the single guard that makes everything show as `$0.00` instead of showing negative. The ticket asks that guard to be replaced with context-aware logic:

1. **Still negative + customer view** → pass `"—"` to the price display area
2. **Still negative + agent view** → format as a proper negative price string (`-$2.01/mo.`)
3. **Zero or positive** → existing behavior unchanged

The `isAgentView(router.pathname)` utility is already used across the same card files, so detecting context is straightforward.

`PriceDisplay.tsx` currently always prepends `$`, which would render `-$2.01/mo.` as `$-2.01/mo.` — that needs to be fixed for the negative agent case, or the card components should bypass `PriceDisplay` entirely for negative prices and render a simple string/span.

---

## 3. Glossary

| Term                               | Meaning                                                                                                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Net price**                      | `PriceType.PRICE_WITH_LIMITED_AND_ONGOING_CREDITS` — the final price after all promotions (limited + ongoing credits) are subtracted from the base price                    |
| **Negative price**                 | A net price value `< 0` — promotions collectively exceed the base price of the subscription                                                                                 |
| **Rate card**                      | The subscription selection card shown to users in Add/Change flows — includes tier name, features, and a price section                                                      |
| **`Math.max(0, price)`**           | The current guard in four card components that prevents any negative value from being displayed — this is what gets replaced                                                |
| **`PriceDisplay.tsx`**             | The shared price rendering component that splits a formatted price string on `.` and wraps with `$` prefix                                                                  |
| **`formatPrice()`**                | Utility in `helperFunctions.ts` that converts a `number` to a locale-formatted price string (e.g. `$9.99/mo.`)                                                              |
| **`isAgentView(pathname)`**        | Utility that returns `true` when the current URL contains `/agent`                                                                                                          |
| **`enableNegativePricingWarning`** | Existing feature flag (`APOART-2003`) that controls the negative pricing **error popup** (different from this ticket — that's for qualification errors, not visual display) |
| **`enableMspDisplay`**             | Existing feature flag controlling whether `netPrice` is used for display instead of `discountedPrice`                                                                       |

---

## 4. Acceptance Criteria

**Customer View (MyBell):**

> _Given_ a user has promotions causing a negative pricing, _when_ they view the rate cards, _then_ show a **dash (—)** in place of the price for impacted rate cards instead of a price.

**Agent View:**

> _Given_ a customer has promotions causing a negative pricing, _when_ an agent views the rate cards, _then_ show the **negative amount** (e.g., `-$2.01/mo.`) for impacted rate cards.

---

## 5. Current Behaviour — Where Prices Are Clamped

There are **four component locations** that currently apply `Math.max(0, price)`:

### 5.1 `TierCard.tsx` (Change flow — tier cards)

**File:** [src/components/common/tiers/TierCard.tsx](../node-mono/microfrontends/subscription-manager/src/components/common/tiers/TierCard.tsx)

```typescript
const displayPriceSource = enableMspDisplay && netPrice ? netPrice : price;
const displayPrice =
    displayPriceSource?.price !== undefined ? Math.max(0, displayPriceSource.price) : undefined;
const formattedPrice = displayPrice?.toFixed(2).toString() ?? '';
const { dollars, cents } = getPriceDollarsAndCents(formattedPrice);
// ...
<PriceDisplay priceInfo={formattedPrice} ... />
```

Note: `TierCard.tsx` does **not** currently import `isAgentView` — needs to be added.

---

### 5.2 `TierCardBundle.tsx` (Change flow — bundle tier cards)

**File:** [src/components/common/bundles/TierCardBundle.tsx](../node-mono/microfrontends/subscription-manager/src/components/common/bundles/TierCardBundle.tsx)

```typescript
const getFormattedBundlePrice = (price, netPrice, enableMspDisplay) => {
  const displayPriceSource = enableMspDisplay && netPrice ? netPrice : price;
  const displayPrice =
    displayPriceSource?.price !== undefined
      ? Math.max(0, displayPriceSource.price)
      : undefined;
  return displayPrice?.toFixed(2).toString() ?? "";
};
```

`TierCardBundle.tsx` already imports `isAgentView` — can be used directly.

---

### 5.3 `AddSubscriptionCard.tsx` (Add flow — single/multi-tier cards)

**File:** [src/components/subscriptions/add-subscription/add-subscription-card/AddSubscriptionCard.tsx](../node-mono/microfrontends/subscription-manager/src/components/subscriptions/add-subscription/add-subscription-card/AddSubscriptionCard.tsx)

```typescript
const displayPrice =
  price?.price !== undefined ? Math.max(0, price.price) : undefined;
const formattedPrice = displayPrice?.toFixed(2).toString() ?? "";
```

`AddSubscriptionCard.tsx` already imports `isAgentView`.

---

### 5.4 `formatPrice()` note

**File:** [src/utils/helperFunctions.ts](../node-mono/microfrontends/subscription-manager/src/utils/helperFunctions.ts)

```typescript
export const formatPrice = (price, locale, chargePeriodType?, isRemovedPrice?): string => {
    if (!price) {
        return locale === Locale.FR ? '0,00$/mois' : '$0.00/mo.';
    }
    // pricePortion = `$${roundedPrice}/mo.`
    // If price = -2.01, roundedPrice = "-2.01", pricePortion = "$-2.01/mo." ← visually wrong
```

`formatPrice` does not clamp to 0, but it also doesn't handle negative values gracefully — it would produce `$-2.01/mo.` instead of `-$2.01/mo.`. If `formatPrice` is used for the agent negative display, it needs to be extended or a separate approach used (see section 6).

---

## 6. Code-Level Change Guide

### 6.1 Strategy Overview

```
if (rawPrice < 0) {
    if (customer view) → display "—"  (bypass PriceDisplay entirely or pass dash string)
    if (agent view)   → display "-$X.XX/mo."  (format correctly with minus before $)
} else {
    existing behavior (PriceDisplay with formattedPrice)
}
```

### 6.2 Changes to `TierCard.tsx`

**File:** [src/components/common/tiers/TierCard.tsx](../node-mono/microfrontends/subscription-manager/src/components/common/tiers/TierCard.tsx)

```typescript
// Add import
import { getPriceDollarsAndCents, isAgentView } from "~/utils/helperFunctions";
import { useRouter } from "next/router";

// Inside component:
const router = useRouter();
const displayPriceSource = enableMspDisplay && netPrice ? netPrice : price;
const rawPrice = displayPriceSource?.price;
const isNegative = rawPrice !== undefined && rawPrice < 0;
const isAgent = isAgentView(router.pathname);

let formattedPrice: string;
let isDashDisplay = false;

if (isNegative) {
  if (isAgent) {
    // Format as "-$2.01/mo." — use Math.abs + prefix
    const absPrice = Math.abs(rawPrice!).toFixed(2);
    formattedPrice =
      locale === Locale.FR ? `-${absPrice}$/mois` : `-$${absPrice}/mo.`;
    // Note: PriceDisplay doesn't handle this well — render as plain string (see note below)
  } else {
    isDashDisplay = true;
    formattedPrice = "";
  }
} else {
  const displayPrice =
    rawPrice !== undefined ? Math.max(0, rawPrice) : undefined;
  formattedPrice = displayPrice?.toFixed(2).toString() ?? "";
}
```

Then in JSX, replace the `<PriceDisplay>` section:

```tsx
{isDashDisplay ? (
    <span
        className="text-4xl font-bell text-primary"
        aria-label={t('ARIA_LABEL_PRICE_FREE')}
        data-testid="price-display-dash"
    >
        —
    </span>
) : isNegative && isAgent ? (
    <span
        className="text-4xl font-bell text-primary"
        aria-label={t('ARIA_LABEL_PRICE_NEGATIVE', { price: formattedPrice })}
        data-testid="price-display-negative"
    >
        {formattedPrice}
    </span>
) : (
    <PriceDisplay priceInfo={formattedPrice} ... />
)}
```

> **Note on `PriceDisplay`:** The component always prepends `$` and splits on `.`. Passing `-$2.01/mo.` to it would render `$-$2` + `.01/mo.` — so negative amounts should bypass `PriceDisplay` and render as a plain string/span instead.

---

### 6.3 Changes to `TierCardBundle.tsx`

**File:** [src/components/common/bundles/TierCardBundle.tsx](../node-mono/microfrontends/subscription-manager/src/components/common/bundles/TierCardBundle.tsx)

Replace `getFormattedBundlePrice()` helper with a function that accepts `isAgent`:

```typescript
const getFormattedBundlePrice = (
  price: Price | null | undefined,
  netPrice: Price | null | undefined,
  enableMspDisplay: boolean | undefined,
  isAgent: boolean,
  locale: Locale,
): { formattedPrice: string; isDash: boolean; isNegativeAgent: boolean } => {
  const displayPriceSource = enableMspDisplay && netPrice ? netPrice : price;
  const rawPrice = displayPriceSource?.price;
  const isNegative = rawPrice !== undefined && rawPrice < 0;

  if (isNegative && !isAgent) {
    return { formattedPrice: "", isDash: true, isNegativeAgent: false };
  }
  if (isNegative && isAgent) {
    const absPrice = Math.abs(rawPrice!).toFixed(2);
    const formattedNeg =
      locale === Locale.FR ? `-${absPrice}$/mois` : `-$${absPrice}/mo.`;
    return {
      formattedPrice: formattedNeg,
      isDash: false,
      isNegativeAgent: true,
    };
  }
  const displayPrice =
    rawPrice !== undefined ? Math.max(0, rawPrice) : undefined;
  return {
    formattedPrice: displayPrice?.toFixed(2).toString() ?? "",
    isDash: false,
    isNegativeAgent: false,
  };
};
```

Then use `isDash` / `isNegativeAgent` flags in the JSX render to bypass `PriceDisplay`.

---

### 6.4 Changes to `AddSubscriptionCard.tsx`

**File:** [src/components/subscriptions/add-subscription/add-subscription-card/AddSubscriptionCard.tsx](../node-mono/microfrontends/subscription-manager/src/components/subscriptions/add-subscription/add-subscription-card/AddSubscriptionCard.tsx)

```typescript
const rawPrice = price?.price;
const isNegative = rawPrice !== undefined && rawPrice < 0;
const isAgent = isAgentView(pathname);

let formattedPrice: string;
let isDashDisplay = false;
let isNegativeAgentDisplay = false;

if (isNegative) {
  if (isAgent) {
    const absPrice = Math.abs(rawPrice!).toFixed(2);
    formattedPrice =
      locale === Locale.FR ? `-${absPrice}$/mois` : `-$${absPrice}/mo.`;
    isNegativeAgentDisplay = true;
  } else {
    isDashDisplay = true;
    formattedPrice = "";
  }
} else {
  const displayPrice =
    rawPrice !== undefined ? Math.max(0, rawPrice) : undefined;
  formattedPrice = displayPrice?.toFixed(2).toString() ?? "";
}
```

Pass `isDashDisplay` and `isNegativeAgentDisplay` down to `AddSubscriptionCardFooter` so it knows what to render.

---

### 6.5 Changes to `AddSubscriptionCardFooter.tsx`

**File:** [src/components/subscriptions/add-subscription/add-subscription-card/AddSubscriptionCardFooter.tsx](../node-mono/microfrontends/subscription-manager/src/components/subscriptions/add-subscription/add-subscription-card/AddSubscriptionCardFooter.tsx)

Add optional props:

```typescript
type Props = {
  // ...existing props...
  isDashDisplay?: boolean;
  isNegativeAgentDisplay?: boolean;
};
```

In the JSX where `PriceDisplay` is rendered, add:

```tsx
{isDashDisplay ? (
    <span className="text-4xl font-bell text-primary" data-testid="price-display-dash">—</span>
) : isNegativeAgentDisplay ? (
    <span className="text-4xl font-bell text-primary" data-testid="price-display-negative">{price}</span>
) : (
    <PriceDisplay priceInfo={price} ... />
)}
```

---

### 6.6 Feature Flag

Following the pattern of other MSP display flags, gate the new behaviour behind a feature flag:

```typescript
// FlagContext.tsx — add:
enableNegativePriceDisplay: boolean;

// FlagProvider.tsx — add:
const { data: enableNegativePriceDisplay } = useOpenFeatureFlag("APOART-2502");
```

When `enableNegativePriceDisplay` is `false`, existing `Math.max(0, price)` behaviour is preserved. When `true`, the dash/negative logic activates.

> **Note:** The existing `enableNegativePricingWarning` (`APOART-2003`) flag is separate — it controls the qualification **error popup** when the API returns an error. This new flag controls visual display of negative values when the API returns them successfully.

---

## 7. Data Flow Diagram

```
QualificationItem.prices[]
  └── PriceType.PRICE_WITH_LIMITED_AND_ONGOING_CREDITS → netPrice = -2.01

TierCard / TierCardBundle / AddSubscriptionCard
  └── isNegative = (netPrice.price < 0)
       │
       ├── [Customer view, enableNegativePriceDisplay]
       │     → isDashDisplay = true
       │     → render: <span>—</span>  (bypass PriceDisplay)
       │
       ├── [Agent view, enableNegativePriceDisplay]
       │     → isNegativeAgentDisplay = true
       │     → formattedPrice = "-$2.01/mo."
       │     → render: <span>-$2.01/mo.</span>  (bypass PriceDisplay)
       │
       └── [enableNegativePriceDisplay = false, or price ≥ 0]
             → existing Math.max(0, price) path → PriceDisplay
```

---

## 8. Why `PriceDisplay.tsx` Should Not Handle Negative Values Directly

`PriceDisplay.tsx` always renders with this structure:

```tsx
<span>$</span>            // dollar sign (EN locale)
<span>{mainPrice}</span>  // left of decimal
<span>{frac}/mo.</span>   // right of decimal
```

For a raw string `"-2.01"`: `mainPrice = "-2"`, renders as `$-2.01/mo.` — dollar sign is in the wrong position.  
For the dash `"—"`: `mainPrice = "—"`, renders as `$—` — dollar sign is spurious.

The cleanest approach: **bypass `PriceDisplay` for both the dash and negative cases** and render a plain styled `<span>`. This avoids touching `PriceDisplay.tsx` at all (lower risk).

If a future iteration wants to centralize this in `PriceDisplay`, a `variant?: 'normal' | 'dash' | 'negative'` prop could be added then.

---

## 9. Edge Cases

| Scenario                                                      | Expected                                                                                                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Net price = exactly 0                                         | Show `$0.00/mo.` — existing behaviour (no dash, no negative)                                                        |
| Net price = -0.01 (just barely negative)                      | Customer: `—`, Agent: `-$0.01/mo.`                                                                                  |
| `enableMspDisplay = false` (MSP flag off)                     | Fall back to `discountedPrice` — if that's also negative, same dash/negative logic applies                          |
| `enableNegativePriceDisplay = false` (new flag off)           | Clamp to 0 as before — `$0.00/mo.`                                                                                  |
| French locale, negative price, agent                          | `-2,01$/mois`                                                                                                       |
| Rate card is disabled (e.g., subscription already on profile) | Dash/negative still shown — disabled state styling should not be overridden                                         |
| Multi-tier card footer (`AddSubscriptionCardFooter`)          | `isDashDisplay` or `isNegativeAgentDisplay` prop must flow from `AddSubscriptionCard` → `AddSubscriptionCardFooter` |

---

## 10. Translation Keys to Add

| Key                         | Suggested English value | When used                                                  |
| --------------------------- | ----------------------- | ---------------------------------------------------------- |
| `ARIA_LABEL_PRICE_FREE`     | `"No charge"`           | Screen reader label when dash is displayed (customer view) |
| `ARIA_LABEL_PRICE_NEGATIVE` | `"Price: {price}"`      | Screen reader label for negative price (agent view)        |

---

## 11. Implementation Checklist

### Core price display logic

- [ ] `TierCard.tsx` — replace `Math.max(0, ...)` with dash/negative logic; add `isAgentView` + `useRouter`
- [ ] `TierCardBundle.tsx` — update `getFormattedBundlePrice()` to accept `isAgent` + `locale`; add dash/negative rendering
- [ ] `AddSubscriptionCard.tsx` — replace `Math.max(0, ...)` with dash/negative logic; add `isDashDisplay`/`isNegativeAgentDisplay`
- [ ] `AddSubscriptionCardFooter.tsx` — add `isDashDisplay`/`isNegativeAgentDisplay` props; conditional render

### Feature flag

- [ ] `FlagContext.tsx` — add `enableNegativePriceDisplay: boolean`
- [ ] `FlagProvider.tsx` — add `useOpenFeatureFlag('APOART-2502')` call

### Accessibility + translation

- [ ] Add `ARIA_LABEL_PRICE_FREE` translation key to CMS
- [ ] Add `ARIA_LABEL_PRICE_NEGATIVE` translation key to CMS

### Tests

- [ ] `TierCard.test.tsx` — test dash render (customer, negative price) and negative amount render (agent, negative price)
- [ ] `TierCardBundle.test.tsx` — same two cases
- [ ] `AddSubscriptionCard.test.tsx` — same two cases
- [ ] `AddSubscriptionCardFooter.test.tsx` — verify `isDashDisplay` and `isNegativeAgentDisplay` prop behaviour

---

## 12. Files to Change

| File                                                                                                                                                                                                                                                    | Change                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [src/components/common/tiers/TierCard.tsx](../node-mono/microfrontends/subscription-manager/src/components/common/tiers/TierCard.tsx)                                                                                                                   | Replace `Math.max(0,...)`, add `isAgentView`, `useRouter`; dash/negative render |
| [src/components/common/bundles/TierCardBundle.tsx](../node-mono/microfrontends/subscription-manager/src/components/common/bundles/TierCardBundle.tsx)                                                                                                   | Update `getFormattedBundlePrice()`; add dash/negative render                    |
| [src/components/subscriptions/add-subscription/add-subscription-card/AddSubscriptionCard.tsx](../node-mono/microfrontends/subscription-manager/src/components/subscriptions/add-subscription/add-subscription-card/AddSubscriptionCard.tsx)             | Replace `Math.max(0,...)`, add dash/negative props                              |
| [src/components/subscriptions/add-subscription/add-subscription-card/AddSubscriptionCardFooter.tsx](../node-mono/microfrontends/subscription-manager/src/components/subscriptions/add-subscription/add-subscription-card/AddSubscriptionCardFooter.tsx) | Accept and render `isDashDisplay`/`isNegativeAgentDisplay`                      |
| [src/context/FlagContext.tsx](../node-mono/microfrontends/subscription-manager/src/context/FlagContext.tsx)                                                                                                                                             | Add `enableNegativePriceDisplay: boolean`                                       |
| [src/context/providers/FlagProvider.tsx](../node-mono/microfrontends/subscription-manager/src/context/providers/FlagProvider.tsx)                                                                                                                       | Register `APOART-2502` feature flag                                             |

### No changes needed

| File                                                                                                                                                                                                              | Reason                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [src/components/common/price/PriceDisplay.tsx](../node-mono/microfrontends/subscription-manager/src/components/common/price/PriceDisplay.tsx)                                                                     | Bypassed for dash/negative; existing behaviour unchanged for positive prices |
| [src/utils/helperFunctions.ts](../node-mono/microfrontends/subscription-manager/src/utils/helperFunctions.ts)                                                                                                     | `formatPrice()` not used for rate card prices — no change needed             |
| [src/components/subscriptions/add-subscription/NegativePriceOfferingHandler.tsx](../node-mono/microfrontends/subscription-manager/src/components/subscriptions/add-subscription/NegativePriceOfferingHandler.tsx) | Different feature (qualification errors) — unchanged                         |
| go-repo (any service)                                                                                                                                                                                             | Pure frontend display change — no backend changes needed                     |

---

## 13. Relationship to Existing Negative Pricing Work

This ticket is **distinct** from the existing `APOART-2003` negative pricing warning infrastructure:

| Feature                                        | Trigger                                                                                   | Purpose                                                                                             | Flag                               |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `NegativePriceOfferingHandler` (`APOART-2003`) | Qualification API returns an **error** because the order would result in negative pricing | Show a popup telling the customer to remove some items / telling agent which offerings are affected | `enableNegativePricingWarning`     |
| **This ticket (APOART-2502)**                  | Qualification API **succeeds** but returns a `netPrice < 0` on a subscription             | Show `—` (customer) or actual negative amount (agent) on the rate card                              | `enableNegativePriceDisplay` (new) |

Both can co-exist; they handle different stages of the flow.

---

## 14. References

- **Jira Story:** [APOART-2502](https://jira.bell.corp.bce.ca/browse/APOART-2502)
- **Parent Epic:** [APOART-2046](https://jira.bell.corp.bce.ca/browse/APOART-2046) — Promotion Enhancements
- **Related:** [APOART-2003](https://jira.bell.corp.bce.ca/browse/APOART-2003) — Negative pricing error popup (existing)

---

# APOART-2211: Contingency — Read Customer Name from CPM and Display in BPP UI

**Ticket:** [APOART-2211](https://jira.bell.corp.bce.ca/browse/APOART-2211)  
**Parent:** [APOART-2024](https://jira.bell.corp.bce.ca/browse/APOART-2024) — Contingency Tool  
**Sprint:** APOART PI-26.3 | **Team:** BANANABYTE | **Priority:** High | **Points:** 10  
**Repos:** `go-repo` (`services/customer-profile-api`) + `node-mono` (`microfrontends/contingency-management`)

---

## 1. The Business Idea (Plain Language)

Bell's back-office agents use the **BPP Contingency UI** to look up subscribers and orders when troubleshooting. Currently the UI shows: Subscriber ID, BAN, state, brand, dates — but **no customer name**. Agents must cross-reference another system to know whose account they are looking at, which is slow and error-prone.

The goal is simple: **show the customer's name** in the Contingency UI so agents immediately know which customer they're dealing with, without leaving the tool.

The customer's name comes from **CPM** (Customer Profile Management) — Bell's authoritative customer data system.

**Where the name should appear:**

1. **Subscriber Search results table** — as a new column alongside Subscriber ID and BAN
2. **Subscriber Details page** — in the Customer Information section (top panel)
3. **Order Search results table** — as a new column
4. **Order Details page** — in the Customer Information section

**Special consideration:** New orders from eShop or OrderMax may not have a customer name available in CPM yet. Those should show "N/A" gracefully.

---

## 2. The Technical Idea (Plain Language)

Customer names already flow into Bell's systems through CPM. A microservice (`customer-profile-api`) already exists in go-repo that wraps CPM and returns structured customer data including the person's name.

The problem is that the contingency UI's data pipeline never picks up the name:

- The subscriber data returned by the subscription-manager API doesn't include a name field
- The `Party` type in the shared TypeScript types has no `name` or `formattedName` field
- Both the Subscriber Details and Order Details customer info sections have the `name` field explicitly **commented out** with `// TODO: Map correct name field`

The fix has two parts:

1. **Backend**: Enrich the subscriber and order session data with the customer name — by calling `customer-profile-api` (which in turn calls CPM) using the customer's BAN, and including the name in the response
2. **Frontend**: Uncomment the name field in the UI and add a "Customer Name" column to the search results tables

---

## 3. Glossary

| Term                                | Meaning                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **CPM**                             | Customer Profile Management — Bell's master customer data system (TMF717 Customer360 v4.4.3)                                                |
| **BAN**                             | Billing Account Number — the unique Bell account identifier, used as the lookup key for CPM                                                 |
| **`customer-profile-api`**          | A Go microservice in go-repo (`services/customer-profile-api`) that wraps CPM and exposes `GET /customer-profile/account/{accountId}`       |
| **Contingency UI**                  | `microfrontends/contingency-management` — the Next.js back-office tool for agents                                                           |
| **`Party`**                         | A person linked to a subscription session — in the subscriber types, has language ability and contact media but currently **no name field** |
| **`SubscriberTableRow`**            | TypeScript type defining a row in the subscriber search results table — no `customerName` currently                                         |
| **`createCustomerInfoStructure()`** | Function in `helperFunctions.ts` that builds the Customer Information panel for Subscriber Details — name is commented out                  |
| **`customerInformationMapping()`**  | Function in `transformDataForOrderDetails.ts` that builds the Customer Information section for Order Details — name is commented out        |
| **FormattedName**                   | The full formatted name from CPM's `Party` → `Individual.FormattedName` or `Customer.RelatedParty[].Individual.FormattedName`               |

---

## 4. Acceptance Criteria

**Back Office Agents want to see the Customer name in the BPP UI:**

1. Customer name is visible on the **Subscriber Search results** table (search results section)
2. Customer name is visible on the **Subscriber Details** page — Customer Information section
3. Customer name is visible on the **Order Search results** table
4. Customer name is visible on the **Order Details** page — Customer Information section
5. For new customer orders from eShop / OrderMax where CPM does not yet have a name: display "N/A" (not an error)

---

## 5. Current State — What's Already in Place

### 5.1 `customer-profile-api` (go-repo) — already built

**File:** [services/customer-profile-api/openapi.yaml](../services/customer-profile-api/openapi.yaml)

```yaml
GET /customer-profile/account/{accountId}?source=BRS
```

Returns `CustomerProfile` containing:

- `customer[].name` — full customer name string from CPM
- `customer[].relatedParty[].individual.givenName` — first name
- `customer[].relatedParty[].individual.familyName` — last name
- `customer[].relatedParty[].individual.formattedName` — formatted full name
- `party[].givenName`, `party[].familyName`, `party[].formattedName` — party-level name

The API is already integrated with CPM via `pkg/cpm`. The `mapPartyInfo()` and `mapCustomerInfo()` functions in `services/customer-profile-api/services/cpm/mapper.go` already extract these fields.

**File:** [services/customer-profile-api/models/profile.go](../services/customer-profile-api/models/profile.go)

```go
type Individual struct {
    GivenName     string `json:"givenName,omitempty"`
    FamilyName    string `json:"familyName,omitempty"`
    FormattedName string `json:"formattedName,omitempty"`
}

type PartyInfo struct {
    GivenName     string `json:"givenName,omitempty"`
    FamilyName    string `json:"familyName,omitempty"`
    FormattedName string `json:"formattedName,omitempty"`
}
```

---

### 5.2 UI Stubs Already Commented Out

**`createCustomerInfoStructure()` — Subscriber Details:**

**File:** [src/utils/helperFunctions.ts](../node-mono/microfrontends/contingency-management/src/utils/helperFunctions.ts)

```typescript
return {
    // name: {
    //     title: t('customer-info.name'),
    //     value: 'Not Available',
    // }, // Will be enabled once we have customer name mapping available
    customerState: { ... },
    ...
```

**`customerInformationMapping()` — Order Details:**

**File:** [src/utils/orders/transformDataForOrderDetails.ts](../node-mono/microfrontends/contingency-management/src/utils/orders/transformDataForOrderDetails.ts)

```typescript
    // name: {
    //     title: t('customer-info.name'),
    //     value: t('labels.not-available'), // TODO: Map correct name field
    // },
    telephone: { ... },
```

Both stubs are identical in structure — they just need the correct value wired in.

---

### 5.3 `Party` Type — Missing Name Fields

**File:** [packages/types/contingencyManagement/subscribers/subscriberTypes.ts](../node-mono/packages/types/contingencyManagement/subscribers/subscriberTypes.ts)

```typescript
export interface Party {
  id: string;
  type: string;
  partyRoles: string[];
  contactMedia: ContactMedia[];
  languageAbility: LanguageAbility;
  // NO name fields here
}
```

---

### 5.4 `SubscriberTableRow` — No Customer Name Column

**File:** [packages/types/contingencyManagement/subscribers/subscriberTypes.ts](../node-mono/packages/types/contingencyManagement/subscribers/subscriberTypes.ts)

```typescript
export interface SubscriberTableRow {
  subscriberId: string;
  billingAccountNumber: string;
  state: string;
  type: string;
  brand: string;
  startDate?: string;
  endDate?: string;
  // No customerName here
}
```

---

## 6. Architecture and Data Flow

```
CPM (Bell Customer Profile System)
   └── GET Customer360 by BAN
           │
           ▼
customer-profile-api (go-repo)
GET /customer-profile/account/{accountId}?source=BRS
   Returns: { party: [{ formattedName, givenName, familyName }], customer: [{ name }] }
           │
           ▼
[Two integration paths depending on chosen approach]

Path A — Backend enrichment (preferred for Order lifecycle requirement):
   subscriptions-aggregator-api (subscriber query)
       └── includes party.formattedName in subscriber/subscription response
       └── contingency UI reads name from party data as-is

Path B — Frontend secondary fetch:
   contingency-management Next.js API route
   POST /api/customer-profile/[ban]
       └── proxies to customer-profile-api
       └── called after subscriber/order data is loaded
           │
           ▼
   Contingency UI components
       ├── SubscribersTable   → shows customerName column
       ├── OrdersTable        → shows customerName column
       ├── Subscriber Details → Customer Information section shows name
       └── Order Details      → Customer Information section shows name
```

---

## 7. Code-Level Change Guide

### 7.1 Option A — Backend Enrichment (Recommended)

This satisfies requirement 2 ("pass the customer name through the order lifecycle") because the name is included in the subscriber/session response, not looked up separately at display time.

**Step: Add `formattedName` to `Party` in the subscriber-manager response**

The contingency UI subscriber details fetch calls:

```
GET /api/subscriptions/{subscriberBanComb}
→ proxies to subscription-manager-api
→ returns subscriber + party
```

The party currently has no name. The `subscriptions-aggregator-api` query needs to be updated to include the party's name (which may need the subscriber-manager to call CPM or use CPM-sourced party data already in the session).

Alternatively: A new dedicated Next.js API route in contingency-management that calls `customer-profile-api` using the BAN.

---

### 7.2 Frontend: Add `customerName` to `Party` and `SubscriberTableRow` Types

**File:** [packages/types/contingencyManagement/subscribers/subscriberTypes.ts](../node-mono/packages/types/contingencyManagement/subscribers/subscriberTypes.ts)

```typescript
export interface Party {
  id: string;
  type: string;
  partyRoles: string[];
  contactMedia: ContactMedia[];
  languageAbility: LanguageAbility;
  formattedName?: string; // NEW — from CPM Individual.formattedName
  givenName?: string; // NEW — optional
  familyName?: string; // NEW — optional
}

export interface SubscriberTableRow {
  subscriberId: string;
  billingAccountNumber: string;
  state: string;
  type: string;
  brand: string;
  startDate?: string;
  endDate?: string;
  customerName?: string; // NEW
}
```

---

### 7.3 Frontend: Add New Next.js API Route for Customer Name (Option B)

**File:** `src/pages/api/customer-profile/[ban].ts` (new file)

```typescript
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const { ban } = req.query;
  const customerProfileApiUrl = process.env.CUSTOMER_PROFILE_API_URL;

  const response = await fetch(
    `${customerProfileApiUrl}/customer-profile/account/${ban}?source=BRS`,
    { headers: { "Content-Type": "application/json" } },
  );

  if (!response.ok) {
    return res.status(response.status).json({ customerName: null });
  }

  const profile = await response.json();

  // Prefer formattedName from party, fallback to customer name
  const partyName = profile?.party?.[0]?.formattedName;
  const customerName =
    partyName ||
    profile?.customer?.[0]?.relatedParty?.[0]?.individual?.formattedName ||
    profile?.customer?.[0]?.name ||
    null;

  return res.status(200).json({ customerName });
}
```

---

### 7.4 Frontend: Enrich Subscriber Search Results with Customer Name

**File:** [src/pages/api/subscribers/searchSubscribers.ts](../node-mono/microfrontends/contingency-management/src/pages/api/subscribers/searchSubscribers.ts)

After fetching the subscriber, make a secondary call to get the customer name:

```typescript
const subscriber: Subscriber = await response.json();

// Secondary fetch for customer name using BAN
let customerName: string | undefined;
try {
  const profileRes = await fetch(
    `${process.env.CUSTOMER_PROFILE_API_URL}/customer-profile/account/${subscriber.account.id}?source=BRS`,
  );
  if (profileRes.ok) {
    const profile = await profileRes.json();
    customerName =
      profile?.party?.[0]?.formattedName ||
      profile?.customer?.[0]?.relatedParty?.[0]?.individual?.formattedName ||
      profile?.customer?.[0]?.name;
  }
} catch {
  // Customer name is enrichment only — don't fail the subscriber lookup
}

return res.status(200).json({
  success: true,
  data: [{ ...transformSubscriberToTableRow(subscriber), customerName }],
});
```

---

### 7.5 Frontend: Add Customer Name Column to Subscriber Search Table

**File:** [src/components/Subscribers/SubscriberTable.tsx](../node-mono/microfrontends/contingency-management/src/components/Subscribers/SubscriberTable.tsx)

Add a new column before the state column:

```typescript
const columns: ColumnDefinition<SubscriberTableRow, keyof SubscriberTableRow>[] = [
    {
        key: 'subscriberId',
        header: t('subscriber-id'),
    },
    {
        key: 'billingAccountNumber',
        header: t('billing-account-number'),
    },
    {
        key: 'customerName',          // NEW
        header: t('customer-name'),   // NEW
        formatter: (row) => row.customerName ?? t('labels.not-available'),
    },
    {
        key: 'state',
        ...
    },
```

---

### 7.6 Frontend: Uncomment Customer Name in Subscriber Details

**File:** [src/utils/helperFunctions.ts](../node-mono/microfrontends/contingency-management/src/utils/helperFunctions.ts)

`createCustomerInfoStructure()` needs a `customerName` parameter:

```typescript
export const createCustomerInfoStructure = (
    subscriber: Subscriber,
    party: Party,
    t: (key: string) => string,
    customerName?: string,          // NEW optional param
): StructuredObject => {
    return {
        name: {                      // UNCOMMENT
            title: t('customer-info.name'),
            value: customerName ?? party.formattedName ?? t('labels.not-available'),
        },
        customerState: { ... },
        ...
    };
};
```

**Caller update** in [src/pages/subscribers/details/[id].tsx](../node-mono/microfrontends/contingency-management/src/pages/subscribers/details/%5Bid%5D.tsx):

```typescript
const customerName = party.formattedName ?? undefined;
// ...
createCustomerInfoStructure(subscriber, party, t, customerName);
```

If the name isn't in the party, make a secondary call to `customer-profile-api` using `subscriber.account.id` (BAN).

---

### 7.7 Frontend: Uncomment Customer Name in Order Details

**File:** [src/utils/orders/transformDataForOrderDetails.ts](../node-mono/microfrontends/contingency-management/src/utils/orders/transformDataForOrderDetails.ts)

```typescript
export const customerInformationMapping = (
    t: (key: string) => string,
    inputOrder?: Partial<Order>,
    customerName?: string,    // NEW optional parameter
) => {
    // ...
    return {
        name: {               // UNCOMMENT
            title: t('customer-info.name'),
            value: customerName ?? t('labels.not-available'),
        },
        telephone: { ... },
        ...
    };
};
```

**Caller in** [src/pages/orders/details/[id].tsx](../node-mono/microfrontends/contingency-management/src/pages/orders/details/%5Bid%5D.tsx) needs to fetch the customer name using the order's BAN:

```typescript
const ban = order?.session?.subscribers?.[0]?.account?.id;
const { data: customerProfile } = useQuery({
  queryKey: ["customerProfile", ban],
  queryFn: () => fetch(`/api/customer-profile/${ban}`).then((r) => r.json()),
  enabled: !!ban,
});

const customerInformationSection = customerInformationMapping(
  t,
  enhancedOrder,
  customerProfile?.customerName,
);
```

---

### 7.8 Frontend: Add Customer Name Column to Order Search Table

**File:** [src/components/Orders/OrdersTable.tsx](../node-mono/microfrontends/contingency-management/src/components/Orders/OrdersTable.tsx) _(inspect current structure)_

Similar pattern as subscriber table — add `customerName` to `OrderTableData` type and add a column. The order search API route would need to enrich results with customer name from CPM (using the subscriber's BAN).

---

## 8. eShop / OrderMax New Customer Orders (Requirement 5)

For orders placed through eShop or OrderMax, the customer may be new and not yet in CPM, or the CPM profile may not have a populated name. The enrichment calls to `customer-profile-api` should be resilient:

1. If `customer-profile-api` returns 404 → show "N/A"
2. If `customer-profile-api` returns a profile without a name → show "N/A"
3. If `customer-profile-api` call fails (timeout/error) → show "N/A", don't break the page
4. All failures are soft failures — the subscriber/order data still displays correctly

---

## 9. Where `name` Is Already Commented Out (Both Locations)

| File                                                                                                                                                        | Function                        | Comment Status                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------- |
| [src/utils/helperFunctions.ts](../node-mono/microfrontends/contingency-management/src/utils/helperFunctions.ts#L231)                                        | `createCustomerInfoStructure()` | `// Will be enabled once we have customer name mapping available` |
| [src/utils/orders/transformDataForOrderDetails.ts](../node-mono/microfrontends/contingency-management/src/utils/orders/transformDataForOrderDetails.ts#L51) | `customerInformationMapping()`  | `// TODO: Map correct name field`                                 |

Both already have the `customer-info.name` translation key referenced — the translation key just needs to be added to the translation files.

---

## 10. Implementation Checklist

### Backend (go-repo)

- [ ] Verify `customer-profile-api` `GET /customer-profile/account/{accountId}` is deployed and accessible from `contingency-management` network
- [ ] Confirm the `formattedName` / `givenName` / `familyName` fields are populated in the CPM response via `mapPartyInfo()` in `services/customer-profile-api/services/cpm/mapper.go`
- [ ] (If enriching at source) Add customer name to the party object returned by `subscriptions-aggregator-api` subscriber query

### Shared types (node-mono)

- [ ] `packages/types/contingencyManagement/subscribers/subscriberTypes.ts` — add `formattedName?`, `givenName?`, `familyName?` to `Party` interface
- [ ] `packages/types/contingencyManagement/subscribers/subscriberTypes.ts` — add `customerName?: string` to `SubscriberTableRow`

### contingency-management API routes (node-mono)

- [ ] Create `src/pages/api/customer-profile/[ban].ts` — proxy to `customer-profile-api`
- [ ] Update `src/pages/api/subscribers/searchSubscribers.ts` — enrich with customer name

### Subscriber Search & Details (node-mono)

- [ ] `src/components/Subscribers/SubscriberTable.tsx` — add `customerName` column
- [ ] `src/utils/helperFunctions.ts` `createCustomerInfoStructure()` — uncomment name, add `customerName` param
- [ ] `src/pages/subscribers/details/[id].tsx` — fetch + pass customer name

### Order Search & Details (node-mono)

- [ ] `src/components/Orders/OrdersTable.tsx` — add customer name column
- [ ] `src/utils/orders/transformDataForOrderDetails.ts` `customerInformationMapping()` — uncomment name, add `customerName` param
- [ ] `src/pages/orders/details/[id].tsx` — fetch customer name from `/api/customer-profile/[ban]` and pass to mapping

### Translations

- [ ] Add `customer-info.name` translation key to EN and FR translation files in `contingency-management`
- [ ] Add `customer-name` translation key (for table column header) to EN and FR translation files

### Tests

- [ ] `SubscriberTable.test.tsx` — verify customer name column renders
- [ ] `helperFunctions.test.ts` — test `createCustomerInfoStructure` with/without customer name
- [ ] `transformDataForOrderDetails.test.ts` — test `customerInformationMapping` with/without customer name
- [ ] `searchSubscribers.test.ts` — mock `customer-profile-api` call; verify graceful fallback on failure

---

## 11. Files to Change

| File                                                                                                                                                    | Change                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [packages/types/contingencyManagement/subscribers/subscriberTypes.ts](../node-mono/packages/types/contingencyManagement/subscribers/subscriberTypes.ts) | Add `formattedName?` to `Party`; add `customerName?` to `SubscriberTableRow`       |
| `src/pages/api/customer-profile/[ban].ts`                                                                                                               | New file — proxy route to `customer-profile-api`                                   |
| [src/pages/api/subscribers/searchSubscribers.ts](../node-mono/microfrontends/contingency-management/src/pages/api/subscribers/searchSubscribers.ts)     | Enrich response with `customerName` from `customer-profile-api`                    |
| [src/components/Subscribers/SubscriberTable.tsx](../node-mono/microfrontends/contingency-management/src/components/Subscribers/SubscriberTable.tsx)     | Add `customerName` column                                                          |
| [src/utils/helperFunctions.ts](../node-mono/microfrontends/contingency-management/src/utils/helperFunctions.ts)                                         | Uncomment `name` field in `createCustomerInfoStructure`; add `customerName?` param |
| [src/pages/subscribers/details/[id].tsx](../node-mono/microfrontends/contingency-management/src/pages/subscribers/details/%5Bid%5D.tsx)                 | Fetch customer name and pass to `createCustomerInfoStructure`                      |
| [src/utils/orders/transformDataForOrderDetails.ts](../node-mono/microfrontends/contingency-management/src/utils/orders/transformDataForOrderDetails.ts) | Uncomment `name` field in `customerInformationMapping`; add `customerName?` param  |
| [src/pages/orders/details/[id].tsx](../node-mono/microfrontends/contingency-management/src/pages/orders/details/%5Bid%5D.tsx)                           | Fetch customer name from `/api/customer-profile/[ban]`                             |
| `src/pages/api/orders/search.ts` or Orders API                                                                                                          | Enrich order search results with customer name                                     |
| `src/components/Orders/OrdersTable.tsx`                                                                                                                 | Add `customerName` column                                                          |

### No changes needed

| File                                                                    | Reason                                                                     |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [services/customer-profile-api/\*\*](../services/customer-profile-api/) | Already built and serving customer name from CPM — just needs to be called |
| [pkg/cpm/\*\*](../pkg/cpm/)                                             | CPM client already implemented                                             |

---

## 12. References

- **Jira Story:** [APOART-2211](https://jira.bell.corp.bce.ca/browse/APOART-2211)
- **Parent Epic:** [APOART-2024](https://jira.bell.corp.bce.ca/browse/APOART-2024) — Contingency Tool
- **Related:** [APOART-2210](https://jira.bell.corp.bce.ca/browse/APOART-2210) — Send customer name to DigiTek (covered separately)
- **Key source files:**
  - [services/customer-profile-api/openapi.yaml](../services/customer-profile-api/openapi.yaml) — `GET /customer-profile/account/{accountId}` API spec
  - [services/customer-profile-api/models/profile.go](../services/customer-profile-api/models/profile.go) — `CustomerProfile`, `Individual`, `PartyInfo` models
  - [services/customer-profile-api/services/cpm/mapper.go](../services/customer-profile-api/services/cpm/mapper.go) — CPM → CustomerProfile mapping
  - [pkg/cpm/models.go](../pkg/cpm/models.go) — `Customer360`, `Individual` CPM models
  - [pkg/cpm/service.go](../pkg/cpm/service.go) — `RetrieveCustomer360ByAccountId`
  - [src/utils/helperFunctions.ts](../node-mono/microfrontends/contingency-management/src/utils/helperFunctions.ts) — `createCustomerInfoStructure()` (name commented out)
  - [src/utils/orders/transformDataForOrderDetails.ts](../node-mono/microfrontends/contingency-management/src/utils/orders/transformDataForOrderDetails.ts) — `customerInformationMapping()` (name commented out)
  - [src/components/Subscribers/SubscriberTable.tsx](../node-mono/microfrontends/contingency-management/src/components/Subscribers/SubscriberTable.tsx) — subscriber search results table
  - [packages/types/contingencyManagement/subscribers/subscriberTypes.ts](../node-mono/packages/types/contingencyManagement/subscribers/subscriberTypes.ts) — `Party`, `SubscriberTableRow` types

---
