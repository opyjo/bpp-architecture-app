# Contingency Management – Implementation Status Review

**Meeting Date:** April 14, 2026  
**Purpose:** Understand the current state of the following items and determine next steps.

---

## Agenda Items

| Ticket      | Title                 | Status                                                         |
| ----------- | --------------------- | -------------------------------------------------------------- |
| APOART-1598 | Address KO Resolution | Partially implemented                                          |
| APOART-1784 | Cancel the Cancel     | Mostly implemented – minor gaps remain                         |
| APOART-2015 | Search by SubId / BAN | Frontend done – backend integration pending (mock data in use) |

---

## APOART-1598 – Address KO Resolution

### What it is

Provides resolution CTAs (CåΩall-to-Action buttons) on the Order Details page when an offering is in a KO / stuck state (`PENDINGBILLING`), allowing agents to Retry or Edit-and-Retry the transaction.

---

### Frontend – What Was Completed

**Feature Flag:** `enable_resolution_ctas`

#### 1. CTA Visibility Logic

**File:** `microfrontends/contingency-management/src/utils/orders/orderDetailsHelpers.ts`

Function `shouldShowOfferingActions()` determines whether action buttons appear for an offering. Returns `true` only when all three conditions are met:

1. Feature flag `enable_resolution_ctas` is `true`
2. Offering status is `PENDINGBILLING` (or `PENDING BILLING`)
3. Offering has a `PendingTxnId` characteristic (extracted by `getOfferingPendingTxnId()`)

```typescript
// orderDetailsHelpers.ts
export const shouldShowOfferingActions = (
    offeringStatus: string | undefined,
    offeringCharacteristics: ItemCharacteristic[] | undefined,
    enableResolutionCtas: boolean,
): boolean => {
    if (!enableResolutionCtas) return false;
    const isPendingBilling = offeringStatus?.toUpperCase() === 'PENDINGBILLING' || ...;
    const hasPendingTxnId = offeringCharacteristics?.some(
        (char) => char.name === 'PendingTxnId' && char.value,
    );
    return isPendingBilling && !!hasPendingTxnId;
};
```

#### 2. Order Details Page – CTA Rendering

**File:** `microfrontends/contingency-management/src/pages/orders/details/[id].tsx`

- Reads the feature flag: `useFeatureFlag('enable_resolution_ctas')`
- Calls `shouldShowOfferingActions(offering?.offeringStatus, offering?.offeringCharacteristics, enableResolutionCtas)` per offering
- Renders an `<ActionCard>` with two buttons: **Retry** and **Edit & Retry**
- `handleOfferingEditAndRetry()` calls `navigateToEditRetry(pendingTxnId)` → pushes route to the edit-retry page
- `handleOfferingRetry()` is a **stub** — `console.log('retry')` only _(gap)_

```typescript
// [id].tsx – stub for direct Retry
const handleOfferingRetry = () => {
  // TODO: Implement retry functionality
  console.log("retry");
};

// [id].tsx – Edit & Retry navigates to dedicated form page
const handleOfferingEditAndRetry = () => {
  if (pendingTxnId) {
    navigateToEditRetry(pendingTxnId);
  }
};
```

#### 3. Edit & Retry Page

**File:** `microfrontends/contingency-management/src/pages/orders/[orderId]/edit-retry/[pendingTxnId].tsx`

Complete flow implemented via component `EditRetryPage`:

| Step                  | What happens                                                      | Hook / Function                                                                                |
| --------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Load                  | Fetch pending transaction by ID                                   | `useGetPendingTransaction(pendingTxnIdStr)`                                                    |
| Pre-populate          | Map transaction → form fields                                     | `mapTransactionToFormData(transaction)` in `utils/pendingTransactions/billingRequestMapper.ts` |
| Edit                  | Agent edits billing address in `<BillingRequestForm>`             | `components/BillingRequestForm/BillingRequestForm.tsx`                                         |
| Submit                | Form submit opens confirmation modal                              | `handleFormSubmit()` → `setShowRetryModal(true)`                                               |
| Confirm               | PATCH the pending transaction                                     | `useUpdatePendingTransaction().mutateAsync({ pendingTxnId, requestUpdates, updatedBy })`       |
| Publish (conditional) | If `transaction.Context === 'Nm1Failure'` → publish billing event | `usePublishBillingEvent().mutateAsync({ pendingTxnId })`                                       |
| Navigate back         | Invalidate orders cache & return to order details                 | `queryClient.invalidateQueries({ queryKey: ['orders'] })` → `router.push(...)`                 |

```typescript
// [pendingTxnId].tsx – Nm1Failure branch
if (transaction?.Context === "Nm1Failure") {
  await publishMutation.mutateAsync({ pendingTxnId: pendingTxnIdStr });
}
```

**Hooks:**

- **File:** `microfrontends/contingency-management/src/hooks/usePendingTransaction.ts`
  - `useGetPendingTransaction(id)` – `GET {MFE_BASE}/api/pendingTransactions/getByPendingTxnId?id={id}` (line 75)
  - `useUpdatePendingTransaction()` – `PATCH {MFE_BASE}/api/pendingTransactions/{pendingTxnId}` (line 93)
  - `usePublishBillingEvent()` – `POST {MFE_BASE}/api/pendingTransactions/{pendingTxnId}/publish` (line 150)

**Address Mapper:**

- **File:** `microfrontends/contingency-management/src/utils/pendingTransactions/billingRequestMapper.ts`
  - `mapTransactionToFormData()` – extracts billing address from `Request.Session.Subscribers[0].ContactMedia`
  - `mapFormDataToRequestUpdates()` – converts edited form data back to the PATCH payload
  - Handles both object-based (`BillingMaintenance`) and array-based (`BillingKickout`) `ContactMedia` formats

---

### Backend – What Was Completed

#### Express API Routes

**File:** `backends/contingency-management-api/src/routes/pendingTransactions.routes.ts`

```
GET    /pendingTransactions                    → fetchPendingTransactions
PATCH  /pendingTransactions/:pendingTxnId      → updatePendingTransaction
POST   /pendingTransactions/:pendingTxnId/publish → publishPendingTransactionBillingEvent
```

#### Controller

**File:** `backends/contingency-management-api/src/controllers/pendingTransactions.controller.ts`

- `fetchPendingTransactions` – validates query params (Zod `QuerySchema`), calls `searchPendingTransactions()`, returns 404 if none found
- `updatePendingTransaction` – validates `pendingTxnId` param and request body (`PatchRequestSchema`), calls `patchPendingTransactionRequest()`, returns patched record via `toPendingTransactionPatchResponseDto()`
- `publishPendingTransactionBillingEvent` – validates that `Context === 'Nm1Failure'` before publishing; returns `200` even on publish failure (per requirement: navigation must continue regardless)

#### Service Layer

**File:** `backends/contingency-management-api/src/services/pendingTransaction.services.ts`

- `queryByPendingTxnId(id)` – DynamoDB `QueryCommand` on `PendingTxnId` key (line 11)
- `queryByOrderId(orderId)` – DynamoDB `QueryCommand` on `OrderIdIndex` GSI (line 30)
- `scanBySubscriberId(subscriberId)` – DynamoDB `ScanCommand` with filter on `SubscriberId` (line 52)
- `patchPendingTransactionRequest(pendingTxnId, updateData, updatedBy)` – context-aware update (line 148):
  - **`BillingMaintenance` / `BillingKickout` / `Nm1Failure`** → deep-merges `requestUpdates` into existing `Request` object via `buildBillingMaintenanceUpdate()`
  - **`FulfillmentKickout`** → full array replacement via `buildFulfillmentKickoutUpdate()`

#### Event Hub Service

**File:** `backends/contingency-management-api/src/services/eventHub.service.ts`

- `publishBillingEvent(payload, correlationId)` – `POST {EVENT_HUB_URL}/internal/topic/billing/message?source=submitSubscription&type=com.billing.create`
- Forwards `PendingTransaction.Request` as the event body
- Attaches `X-Correlation-Id` header when `CorrelationId` is present on the transaction

#### Input Validation

**File:** `backends/contingency-management-api/src/validators/pendingTransactions/query.schemas.ts`

```typescript
// QuerySchema – GET /pendingTransactions
const QuerySchema = z.object({
  pendingTxnId: z.string().trim().min(1).max(255).optional(),
  subscriberId: z.string().trim().min(1).max(255).optional(),
  orderId: z.string().trim().min(1).max(255).optional(),
});
// At least one of the above must be supplied (enforced in controller)
```

---

### Gaps / Outstanding Work

#### Direct Retry stub — clarification needed

`handleOfferingRetry()` in `pages/orders/details/[id].tsx` is a stub (`console.log('retry')`). No API call is made.

> **Important nuance:** For `Nm1Failure` context, the Event Hub publish step **is** the retry mechanism. The Edit & Retry flow already does this:
>
> 1. PATCH the pending transaction with updated billing data
> 2. `POST /pendingTransactions/:pendingTxnId/publish` → forwards `PendingTransaction.Request` to Event Hub topic `billing/message?source=submitSubscription&type=com.billing.create`
>
> The Event Hub publish re-submits the billing event to the downstream queue, effectively triggering the retry.
>
> However, the `/publish` endpoint **enforces `Context === 'Nm1Failure'` exclusively** (returns `400` for any other context). So the question for the direct Retry button is:
>
> - For **`Nm1Failure`**: it could simply call `POST /publish` directly — skipping the edit form — to re-queue the existing unmodified `Request`. The backend supports this today.
> - For **`BillingMaintenance` / `BillingKickout` / `FulfillmentKickout`**: there is no equivalent publish endpoint. A different retry mechanism (or a separate API call) would need to be defined. This is the real unknown.

#### No success/error toast

After a successful Edit & Retry the user is silently redirected back to Order Details. No notification is shown to confirm the billing event was published or the transaction was updated.

#### Feature flag

`enable_resolution_ctas` must be enabled in production before CTAs are visible to any agent.

### Next Steps to Discuss

- [ ] **Confirm the direct Retry scope per context:** For `Nm1Failure` the backend publish endpoint already handles it — just need to wire up the button. For other contexts (`BillingMaintenance`, `BillingKickout`, `FulfillmentKickout`) is a direct retry in scope and if so, what mechanism triggers it?
- [ ] Define the toast/notification standard for success (publish confirmed) and failure (publish attempted but failed) feedback
- [ ] Confirm graduation timeline for `enable_resolution_ctas`

---

## APOART-1784 – Cancel the Cancel

### What it is

Allows an agent to undo a pending cancellation on a subscription. When a subscriber's offering is in `ACTIVETERMINATING` state, an agent can reverse the cancellation by triggering "Cancel the Cancel."

---

### Frontend – What Was Completed

**Feature Flag:** `cancel_the_cancel`  
**Access Gate:** Requires full read/write access (`hasRWAccess` from `usePermission()`)

#### 1. Eligibility Check

**File:** `microfrontends/contingency-management/src/utils/helperFunctions.ts`  
Function: `shouldEnableCancelPendingOrder(offering)` (line 511)

```typescript
export const shouldEnableCancelPendingOrder = (offering): boolean => {
  const isActiveTerminating = offering.state === "ACTIVETERMINATING";
  const isVas = isVasOffering(offering); // true if relatedEntities has 'AddsOnTo' relationship
  return isActiveTerminating && !isVas;
};
```

Button renders only when: flag on **AND** RW access **AND** `shouldEnableCancelPendingOrder()` returns `true`.

#### 2. Subscriber Details Page – Full Flow

**File:** `microfrontends/contingency-management/src/pages/subscribers/details/[id].tsx`

| Step     | What happens                                               | Code reference                                                                                                                                 |
| -------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Click    | Agent clicks "Cancel the Cancel" button on offering        | `handleCancelTheCancelClick(offeringId, offeringName)`                                                                                         |
| Modal    | Sets selected offering, opens `<ConfirmationModal>`        | `setSelectedOffering()` / `setIsCancelModalOpen(true)`                                                                                         |
| Confirm  | Builds request, calls Next.js API route                    | `handleConfirmCancelTheCancel()`                                                                                                               |
| API call | `POST /api/orders/cancelPendingOrder`                      | `fetch(MFE_ASSET_BASE_URL/api/orders/cancelPendingOrder, { method: 'POST', body: { billingAccountNumber, productOfferingId, subscriberId } })` |
| Success  | Sets confirmation message to state, refetches subscription | `setMessage(...)` / `refetch()`                                                                                                                |
| **Gap**  | Message only console.log'd — no toast displayed            | `console.log(message)` with TODO comment                                                                                                       |
| Close    | Clears selected offering, closes modal                     | `handleCancelModal()`                                                                                                                          |

```typescript
// subscribers/details/[id].tsx – gap: success message not shown in UI
if (result.cancelledOrder) {
  setMessage(
    `${t("messages.confirmation-cancellation")}: ${result.cancelledOrder.subscriberId}`,
  );
}
console.log(message); // need to display the related success message as part of toast component.
```

#### 3. Next.js API Route Handler

**File:** `microfrontends/contingency-management/src/pages/api/orders/cancelPendingOrder.ts`

- Validates required body fields: `billingAccountNumber`, `productOfferingId`, `subscriberId`
- Proxies `POST {ORDERING_API}/ordering/undo` with those fields as body
- Returns `200 { cancelledOrder }` on success, `502` on upstream failure

```typescript
const requestUrl = `${env.NEXT_PUBLIC_ORDERING_API}/ordering/undo`;
```

---

### Backend – What Was Completed

The Cancel the Cancel action **does not go through `contingency-management-api`**. It calls the external Ordering API (`NEXT_PUBLIC_ORDERING_API`) directly from the Next.js BFF layer.

The `contingency-management-api` backend has:

- A `CANCEL_PENDING_ORDER` action code defined in the Drizzle schema (`src/drizzle/schema.ts` line 16) for audit logging purposes
- Seed data representing cancelled orders (`src/db/seeds/seed.ts` lines 92–133)

These indicate the audit trail infrastructure is in place, but the cancel action itself is owned by the external Ordering API.

---

### Gaps / Outstanding Work

- **No success toast/notification** — `console.log(message)` is the current "display." Code comment explicitly flags this as a TODO.
- **No error feedback to agent** — the `catch` block logs to `console.error` and silently closes the modal.
- Feature flag `cancel_the_cancel` must be enabled in production.

### Next Steps to Discuss

- [ ] Implement success / failure toast notifications (align on component standard)
- [ ] Confirm error UX: inline modal error vs. toast
- [ ] Confirm graduation timeline for `cancel_the_cancel`

---

## APOART-2015 – Search by SubId / BAN

### What it is

Extends the Orders search page to allow searching by **Subscriber ID (SubId)** and/or **Billing Account Number (BAN)** in addition to the existing Order ID search.

**Feature Flag:** `enhanced_order_search`  
**Dependency:** Backend ticket **HHOREO-5113** (not yet stable in production)

---

### Frontend – What Was Completed

#### 1. Search UI Component

**File:** `microfrontends/contingency-management/src/components/Orders/OrdersSearch.tsx`

- Renders the base **Order ID** field always
- Conditionally spreads two extra fields when `enableEnhancedSearch === true`:
  - `subscriberId` (label: `labels.subscriber-id`)
  - `billingAccountNumber` (label: `labels.billing-account-number`)

```typescript
const searchFields: SearchField[] = [
    { key: 'id', ... },
    ...(enableEnhancedSearch ? [
        { key: 'subscriberId', ... },
        { key: 'billingAccountNumber', ... },
    ] : []),
];
```

#### 2. Orders Page – Flag Reading & Orchestration

**File:** `microfrontends/contingency-management/src/pages/orders/index.tsx`

- Reads flag: `useFeatureFlag('enhanced_order_search')` (with TODO comment to remove after HHOREO-5113 is stable)
- Passes `enableEnhancedSearch` down to `<OrderSearch>` and `useGetOrderById(searchState, enableEnhancedOrderSearch)`
- `handleSearch()` guards against empty params — requires at least one of `id`, `subscriberId`, or `billingAccountNumber` when enhanced mode is on
- Session storage persistence (`utils/sessionStorageHelpers.ts`) already stores and restores all three fields across navigation

#### 3. Search Utilities

**File:** `microfrontends/contingency-management/src/utils/orders/orderSearchUtils.ts`

| Function                                                       | Purpose                                                          |
| -------------------------------------------------------------- | ---------------------------------------------------------------- |
| `buildOrderSearchParams(searchState, isEnhancedSearchEnabled)` | Builds `URLSearchParams`; only appends SubId/BAN when flag is on |
| `hasValidSearchParams(searchState, isEnhancedSearchEnabled)`   | Returns `true` if at least one valid field is populated          |
| `extractSearchParamsFromQuery(query)`                          | Parses Next.js query object into typed `OrderSearchQueryParams`  |

#### 4. Data Fetching Hook

**File:** `microfrontends/contingency-management/src/hooks/useGetOrderById.ts`

- `fetchOrders(searchParams, enableEnhancedSearch)` calls `GET {MFE_BASE}/api/orders/search?{queryParams}`
- `orderDataById(order)` maps each order to `OrderTableData` (extracts `subscriberId`, `ban` from `session.subscribers[0]`)

---

### Next.js BFF API Route – Partially Implemented

**File:** `microfrontends/contingency-management/src/pages/api/orders/search.ts`

```
GET /api/orders/search?id=...
GET /api/orders/search?subscriberId=...      ← enhanced only
GET /api/orders/search?billingAccountNumber=... ← enhanced only
```

**Current routing logic:**

```typescript
const isEnhancedSearchEnabled = await isFeatureEnabled("enhanced_order_search");
const isSearchingByEnhancedFields = !!(subscriberId || billingAccountNumber);
const USE_MOCK_DATA = isEnhancedSearchEnabled && isSearchingByEnhancedFields;

if (USE_MOCK_DATA) {
  // TODO: Remove once HHOREO-5113 backend is stable in production
  return res.status(200).json({ orders: generateMockOrders(searchParams) });
}

// Real path – only reached when searching by Order ID
const requestUrl = `${env.NEXT_PUBLIC_GET_ORDER_API}/api/orders?${queryParams}`;
```

`generateMockOrders()` (lines 19–228) generates synthetic order objects for SubId and BAN searches so that the UI flow can be tested end-to-end, but this data is **not real**.

---

### Backend Service (`contingency-management-api`) – Not Implemented for Orders

**File:** `backends/contingency-management-api/src/routes/orders.routes.ts`

```
GET /orders?id={orderId}    ← only supported query
```

**File:** `backends/contingency-management-api/src/controllers/orders.controller.ts`

- `QuerySchema` (Zod) only accepts `id` — no `subscriberId` or `billingAccountNumber` field
- `fetchOrders()` returns `400` if no `id` provided
- Calls `searchOrders({ id }, signal)` → `queryOrdersById(id)` → DynamoDB `KeyConditionExpression` on `Id` key only

**File:** `backends/contingency-management-api/src/services/order.services.ts`

- `queryOrdersById(id)` – DynamoDB `QueryCommand` on partition key `Id`
- No GSI or scan for `SubscriberId` or `BAN` exists in the orders table

> **Note:** The pending transactions service (`pendingTransaction.services.ts`) **does** support `subscriberId` via `scanBySubscriberId()` (a DynamoDB `ScanCommand`), but that is the `PendingTransactions` table — not the `Orders` table.

---

### Gaps / Outstanding Work

- Backend (HHOREO-5113) — the real `GET /orders?subscriberId=` / `?billingAccountNumber=` endpoint does not exist
- `generateMockOrders()` in `search.ts` must be removed once HHOREO-5113 ships
- `orders.controller.ts` `QuerySchema` will need `subscriberId` and `billingAccountNumber` fields added
- `orders.model.ts` / `order.services.ts` will need a new DynamoDB access pattern (GSI or scan) for SubId/BAN

### Next Steps to Discuss

- [ ] What is the current status of HHOREO-5113? Is there a target date?
- [ ] Confirm the real backend endpoint contract (URL, query params, pagination)
- [ ] Plan the cleanup: remove `generateMockOrders()`, remove `USE_MOCK_DATA` branch, update `orders.controller.ts` validator
- [ ] Decide if SubId/BAN lookup stays in the ordering API or if `contingency-management-api` needs a new endpoint

---

## Summary Table

| Item                              | Frontend UI                 | Backend API                                                     | Feature Flag             | Production Ready         |
| --------------------------------- | --------------------------- | --------------------------------------------------------------- | ------------------------ | ------------------------ |
| APOART-1598 – Edit & Retry (KO)   | ✅ Complete                 | ✅ Complete                                                     | `enable_resolution_ctas` | Pending flag graduation  |
| APOART-1598 – Direct Retry (KO)   | ❌ Stub only                | ✅ `/publish` exists for `Nm1Failure`; other contexts undefined | `enable_resolution_ctas` | No                       |
| APOART-1784 – Cancel the Cancel   | ⚠️ Done (no toast/error UX) | ✅ Via external Ordering API                                    | `cancel_the_cancel`      | Pending flag + toast fix |
| APOART-2015 – Search by SubId/BAN | ✅ Complete                 | ⚠️ Mock data only                                               | `enhanced_order_search`  | Blocked on HHOREO-5113   |

---

## Open Questions

1. For the direct **Retry** button (APOART-1598): for `Nm1Failure` context the backend `POST /publish` endpoint already exists and could be called without editing — is that the intended behaviour? For other contexts (`BillingMaintenance`, `BillingKickout`, `FulfillmentKickout`) the publish endpoint returns `400` — is a direct retry in scope for those, and if so what API would it call?
2. What is the **toast/notification component standard** to use across all three features for success/error feedback?
3. What is the current **HHOREO-5113 delivery timeline**? This is blocking production readiness for APOART-2015.
4. Are the three feature flags (`enable_resolution_ctas`, `cancel_the_cancel`, `enhanced_order_search`) being managed together or independently?
5. Are there **acceptance criteria or QA sign-off** steps needed before any flag can be graduated to production?
