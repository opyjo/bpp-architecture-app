import type { MerchantGroupData } from "./types";

export const merchantGroupData: MerchantGroupData = {
  sharedPattern: {
    purpose: "Merchant APIs are adapter services that translate the internal subscription provisioning contract into provider-specific API calls. Each merchant-api-* implements the same Go interface (MerchantProvider) but maps to a different external provider — Netflix, Disney+, Bell Media, Radio Canada, or Bango (aggregation platform).",
    architecture: "All merchant APIs follow the adapter pattern: reseller-service calls a standardized REST endpoint on the merchant-api, which internally translates the request into the provider's specific API format, authentication scheme, and callback flow. Each merchant-api is independently deployable and handles its own retry logic, circuit breaking, and error mapping.",
    interfaceContract: `// MerchantProvider defines the contract all merchant adapters implement
type MerchantProvider interface {
    // Provision activates a subscription with the external provider
    Provision(ctx context.Context, req ProvisionRequest) (*ProvisionResponse, error)

    // Deprovision cancels/suspends a subscription with the external provider
    Deprovision(ctx context.Context, req DeprovisionRequest) (*DeprovisionResponse, error)

    // CheckStatus queries the current provisioning status from the provider
    CheckStatus(ctx context.Context, subscriptionID string) (*StatusResponse, error)

    // HandleCallback processes async callbacks from the provider
    HandleCallback(ctx context.Context, payload json.RawMessage) (*CallbackResult, error)
}

type ProvisionRequest struct {
    SubscriptionID string
    AccountNumber  string
    ProductID      string
    PlanDetails    PlanInfo
    CustomerInfo   CustomerInfo
}

type ProvisionResponse struct {
    ExternalID    string
    ActivationURL string
    Status        ProvisionStatus
    ExpiresAt     *time.Time
}`,
    commonEndpoints: [
      { method: "POST", path: "/v1/provision", description: "Activate subscription with external provider — returns activationUrl and externalId" },
      { method: "POST", path: "/v1/deprovision", description: "Cancel or suspend subscription with external provider" },
      { method: "GET", path: "/v1/status/:subscriptionId", description: "Query current provisioning status from external provider" },
      { method: "POST", path: "/v1/callback", description: "Handle async callbacks from provider (webhook receiver)" },
      { method: "GET", path: "/health", description: "Health check — verifies connectivity to external provider" },
    ],
    errorHandling: "All merchant APIs use circuit breaker pattern (Go hystrix) with provider-specific thresholds. Failed provisions return a structured error to reseller-service which marks the provision as FAILED and triggers the fulfillment-process Lambda for retry. Callback timeouts are handled by the merchant-callback-lambda.",
    retryStrategy: "Exponential backoff with jitter. Max 3 retries for transient errors (5xx, timeouts). Non-retryable errors (4xx) are immediately escalated. Circuit opens after 5 consecutive failures (30s half-open window).",
  },
  merchants: [
    {
      id: "bango",
      name: "merchant-api-bango-v1",
      displayName: "Bango Merchant API",
      provider: "Bango",
      provisioningModel: "Aggregation platform — acts as intermediary between Bell and multiple downstream providers. Supports multi-provider bundling.",
      authMethod: "API key + HMAC signature on request body",
      callbackPattern: "Synchronous response with async status updates via webhook. Bango sends provisioning confirmation within 5 minutes.",
      specificEndpoints: [
        { method: "POST", path: "/v1/bango/activate", description: "Activates via Bango aggregation — supports multi-provider bundles" },
        { method: "POST", path: "/v1/bango/entitlement-check", description: "Verifies customer entitlement through Bango's platform" },
      ],
    },
    {
      id: "netflix",
      name: "merchant-api-netflix",
      displayName: "Netflix Merchant API",
      provider: "Netflix",
      provisioningModel: "Direct API integration — provisions Netflix subscriptions via Netflix Partner API. Supports plan tiers (Basic, Standard, Premium).",
      authMethod: "OAuth2 client_credentials with Netflix-issued client ID/secret",
      callbackPattern: "Async — Netflix sends provisioning status via webhook within 2 minutes. Activation URL redirects to netflix.com/signup.",
      specificEndpoints: [
        { method: "POST", path: "/v1/netflix/link", description: "Links Bell account to Netflix account for billing integration" },
        { method: "POST", path: "/v1/netflix/upgrade", description: "Handles Netflix plan tier upgrades (Basic → Standard → Premium)" },
      ],
    },
    {
      id: "disney",
      name: "merchant-api-disney",
      displayName: "Disney Merchant API",
      provider: "Disney+",
      provisioningModel: "Direct API integration — provisions Disney+ subscriptions. Uses disney-auth-api for Disney-specific authentication tokens.",
      authMethod: "Disney OAuth2 tokens issued via disney-auth-api service",
      callbackPattern: "Async — Disney sends provisioning confirmation via webhook. Activation URL redirects to disneyplus.com/begin.",
      specificEndpoints: [
        { method: "POST", path: "/v1/disney/activate", description: "Activates Disney+ subscription with Disney-specific auth flow" },
        { method: "GET", path: "/v1/disney/entitlement", description: "Checks current Disney+ entitlement status for an account" },
      ],
    },
    {
      id: "bellmedia",
      name: "merchant-api-bellmedia",
      displayName: "Bell Media Merchant API",
      provider: "Bell Media",
      provisioningModel: "Internal API — provisions Bell Media streaming products (Crave, TSN+, RDS). Uses internal Bell authentication.",
      authMethod: "Internal service-to-service JWT with Bell Media-issued signing key",
      callbackPattern: "Synchronous — Bell Media provisions immediately and returns status in the response.",
      specificEndpoints: [
        { method: "POST", path: "/v1/bellmedia/bundle", description: "Provisions Bell Media content bundles (Crave + TSN+)" },
        { method: "GET", path: "/v1/bellmedia/content-access", description: "Verifies content access rights for Bell Media products" },
      ],
    },
    {
      id: "radiocanada",
      name: "merchant-api-radiocanada",
      displayName: "Radio Canada Merchant API",
      provider: "Radio-Canada",
      provisioningModel: "Direct API integration — provisions Radio-Canada/CBC Gem premium content. Bilingual support (EN/FR).",
      authMethod: "API key with request signing (SHA-256 HMAC)",
      callbackPattern: "Async — Radio-Canada sends provisioning status via webhook within 3 minutes.",
      specificEndpoints: [
        { method: "POST", path: "/v1/radiocanada/provision", description: "Provisions Radio-Canada premium content access" },
        { method: "GET", path: "/v1/radiocanada/status", description: "Checks Radio-Canada subscription status" },
      ],
    },
  ],
  comparisonRows: [
    {
      dimension: "Provisioning model",
      values: { bango: "Aggregation platform", netflix: "Direct API", disney: "Direct API", bellmedia: "Internal API", radiocanada: "Direct API" },
    },
    {
      dimension: "Auth method",
      values: { bango: "API key + HMAC", netflix: "OAuth2 client_credentials", disney: "Disney OAuth2 (via disney-auth-api)", bellmedia: "Internal JWT", radiocanada: "API key + SHA-256" },
    },
    {
      dimension: "Callback pattern",
      values: { bango: "Sync + async webhook", netflix: "Async webhook", disney: "Async webhook", bellmedia: "Synchronous", radiocanada: "Async webhook" },
    },
    {
      dimension: "Callback SLA",
      values: { bango: "< 5 min", netflix: "< 2 min", disney: "< 3 min", bellmedia: "Immediate", radiocanada: "< 3 min" },
    },
    {
      dimension: "Plan tiers",
      values: { bango: "Varies by provider", netflix: "Basic / Standard / Premium", disney: "Standard / Premium", bellmedia: "Individual / Bundle", radiocanada: "Standard" },
    },
    {
      dimension: "Bundling support",
      values: { bango: "Yes (multi-provider)", netflix: "No", disney: "No", bellmedia: "Yes (Crave + TSN+)", radiocanada: "No" },
    },
    {
      dimension: "Grace period",
      values: { bango: "7 days", netflix: "3 days", disney: "5 days", bellmedia: "7 days", radiocanada: "5 days" },
    },
    {
      dimension: "Circuit breaker threshold",
      values: { bango: "5 failures / 30s", netflix: "5 failures / 30s", disney: "5 failures / 30s", bellmedia: "3 failures / 15s", radiocanada: "5 failures / 30s" },
    },
  ],
  flowParticipation: [
    { flowNum: "5", title: "Place Order", role: "reseller-service calls the appropriate merchant-api for provisioning based on providerId" },
    { flowNum: "6", title: "Activate Subscription", role: "Merchant-api returns activationUrl that redirects customer to provider signup" },
    { flowNum: "7", title: "Cancel Subscription", role: "Merchant-api deprovisions the subscription with the external provider" },
    { flowNum: "9", title: "Plan Change", role: "Merchant-api re-provisions with updated plan details" },
    { flowNum: "11", title: "Fulfillment", role: "fulfillment-process Lambda retries failed merchant provisions" },
    { flowNum: "13", title: "Undo / Reversal", role: "Merchant-api deprovisions on reversal of a previous order" },
    { flowNum: "14", title: "Grace Period", role: "Merchant-api suspends provisioning without full cancellation during grace window" },
    { flowNum: "15", title: "Account Recovery", role: "Merchant-api used to reconcile provisioning state during recovery" },
  ],
  infrastructure: [
    { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas per merchant service in production" },
    { aspect: "Networking", description: "Internal cluster DNS — only reachable from reseller-service. External provider APIs accessed via NAT Gateway" },
    { aspect: "Circuit breaker", description: "Go hystrix — per-provider thresholds, 30s half-open window" },
    { aspect: "Observability", description: "Structured JSON logging, Datadog APM with provider-specific dashboards, latency alerts per merchant" },
    { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD (independent pipelines per merchant)" },
    { aspect: "Secrets", description: "Provider API keys and secrets stored in AWS Secrets Manager, rotated via secret-rotator-lambda" },
  ],
};
