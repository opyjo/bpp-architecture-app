export const uiEnvironments = [
  { env: "Dev", url: "subscription-manager.app.hts-dev.cac1.aws.int.bell.ca" },
  { env: "UAT / Staging", url: "subscription-manager.app.hts-stg.cac1.aws.int.bell.ca" },
  { env: "Production EN", url: "subscription.bell.ca" },
  { env: "Production FR", url: "abonnement.bell.ca" },
];

export const goServicePatterns = [
  { env: "Dev", pattern: "<service-name>.app.hts-dev.cac1.aws.int.bell.ca" },
  { env: "Staging", pattern: "<service-name>.app.hts-stg.cac1.aws.int.bell.ca" },
  { env: "Production", pattern: "Internal cluster DNS (Kubernetes / EKS)" },
];

export const bilingualRouting = [
  { lang: "English", path: "/customer/*", notes: "Default locale" },
  { lang: "French", path: "/client/*", notes: "locale=fr-ca · all flows identical" },
];

export const authContexts = [
  { context: "Customer self-serve", method: "SAML SSO (BoxyHQ) via dit02-auth.bell.ca", who: "Customers on bell.ca" },
  { context: "Agent-assisted", method: "SAML SSO — agent audience", who: "Internal Bell agents" },
  { context: "DIT / Dev", method: "Auth0 (dit-identification.bell.ca)", who: "Dev & test flows" },
];

export const tokenFlow = `1. User logs in → next-auth creates session (JWT / session cookie)
2. BFF (/api/protected/*) checks session validity
3. BFF requests OAuth2 token:
   POST https://auth.app.hts-dev.cac1.aws.int.bell.ca/oauth2/token
   grant_type=client_credentials
   scope=subscription-manager/query subscriptions-aggregator-api/read
4. BFF attaches Bearer token to outbound API calls
5. Go services validate Bearer token before processing request`;

export const accountIsolation = `The BFF verifies that the householdAccountNumber in every request matches one of the accounts associated with the logged-in user's session. This prevents customers from querying each other's data.`;

export const featureFlags = [
  { system: "Unleash", endpoint: "https://...gitlab.../feature_flags/unleash/46450", evaluatedBy: "Client (browser)", usedFor: "Show/hide UI features" },
  { system: "Go Feature Flags", endpoint: "feature-flag.app-gateway.hts-dev...", evaluatedBy: "Server (OpenFeature SDK)", usedFor: "Business logic gating" },
];

export const featureFlagUseCases = [
  "Show / hide new subscription types before full rollout",
  "Enable new provider integrations (new merchant-api-*) for a subset of users",
  "A/B test UI flows (e.g. different review screen layouts)",
  "Gate features by account type, region, or user cohort",
  "Flags default to OFF when flag service is unreachable (safe default)",
];

export const designDecisions = [
  { badge: "AppSync as GraphQL gateway", color: "blue" as const, body: "Single entry point for all mutations. Handles auth, routing, and real-time capability without the UI knowing about individual services. Adding a new Go service requires only a new AppSync resolver — no UI change." },
  { badge: "BFF pattern", color: "teal" as const, body: "Next.js API routes protect OAuth2 tokens — the UI never holds a client secret. The BFF also enforces account isolation by verifying householdAccountNumber matches the logged-in user's session." },
  { badge: "subscription-manager-api decommissioned", color: "amber" as const, body: "Replaced by reseller-service (CRUD) + subscriptions-aggregator-api (reads) for single-responsibility. Reads and writes now scale and deploy independently." },
  { badge: "Redis caching in catalog-api", color: "amber" as const, body: "Product catalog is read far more often than it changes. Redis keeps the UI snappy during qualification (re-called on every plan selection). catalog-manager keeps the cache fresh via Kafka product events." },
  { badge: "Module Federation", color: "purple" as const, body: "The subscription-manager widget can be embedded in any shell app (e.g. My Bell portal) without a full page reload. Teams deploy the MFE independently without coordinating with the host shell." },
  { badge: "Bilingual routing", color: "purple" as const, body: "/customer/ vs /client/ gives clean distinct URLs for both locales — important for SEO and direct linking. All flows and mutations are identical across locales." },
];

export const glossary = [
  { term: "BFF", full: "Backend-for-Frontend", meaning: "The Next.js /api/protected/* layer that holds secrets and proxies to Go services" },
  { term: "MFE", full: "Microfrontend", meaning: "A standalone UI module loaded via Module Federation (e.g. subscription-manager)" },
  { term: "BAN", full: "Billing Account Number", meaning: "Bell's primary customer billing identifier, passed as billingAccountNumber" },
  { term: "CPM", full: "Common Provisioning Mgmt", meaning: "Bell's internal system of record for account and equipment data" },
  { term: "CIAM", full: "Customer Identity & Access Mgmt", meaning: "The auth platform managing customer SSO (BoxyHQ / SAML)" },
  { term: "DIT", full: "Dev Integration Test", meaning: "Bell's internal dev/test environment tier (hts-dev). Auth0 used here." },
  { term: "AppSync", full: "AWS AppSync", meaning: "AWS managed GraphQL gateway; routes mutations to Go services via resolvers" },
  { term: "DynamoDB", full: "Amazon DynamoDB", meaning: "AWS managed NoSQL store; used by session-api for session state with TTL" },
  { term: "Redis", full: "Redis", meaning: "In-memory cache; catalog-api for fast lookups; token-api for 24h payload storage" },
  { term: "Kafka", full: "Apache Kafka", meaning: "Distributed event streaming; carries domain events (OrderCreated, StatusChanged, etc.)" },
  { term: "Dapr", full: "Distributed App Runtime", meaning: "Sidecar runtime used by some Go services for pub/sub and state management" },
  { term: "SSO", full: "Single Sign-On", meaning: "One login for multiple Bell services via SAML federation" },
  { term: "SAML", full: "Security Assertion Markup Lang.", meaning: "Protocol used for Bell customer and agent SSO" },
  { term: "OAuth2", full: "OAuth 2.0", meaning: "Token-based auth; BFF uses client_credentials grant to get Bearer tokens" },
  { term: "BoxyHQ", full: "BoxyHQ", meaning: "Open-source SAML/SSO middleware bridging Bell's identity provider to next-auth" },
  { term: "gqlgen", full: "gqlgen", meaning: "Go code-generator for GraphQL servers; used by catalog-api and household-api" },
  { term: "Gin", full: "Gin", meaning: "Lightweight Go HTTP framework; used by reseller-service and subscriptions-aggregator-api" },
  { term: "OpenAPI", full: "OpenAPI (Swagger)", meaning: "API contract spec; Go services generate server stubs from .yaml files" },
  { term: "OpenFeature", full: "OpenFeature", meaning: "Vendor-neutral feature flag SDK; wraps Go Feature Flags in the UI" },
  { term: "Unleash", full: "Unleash", meaning: "Open-source feature flag server; used for frontend-evaluated toggles" },
  { term: "DLQ", full: "Dead-Letter Queue", meaning: "Kafka fallback queue for messages that fail all retries" },
  { term: "EKS", full: "Elastic Kubernetes Service", meaning: "AWS managed Kubernetes; where all Go services run in production" },
  { term: "TTL", full: "Time To Live", meaning: "Expiry — sessions expire after 30 min; token-api payloads after 24 h" },
  { term: "ADR", full: "Architecture Decision Record", meaning: "Short doc capturing a significant design choice and its rationale" },
  { term: "Module Fed.", full: "Webpack Module Federation", meaning: "Mechanism allowing subscription-manager to be embedded in a host shell at runtime" },
];

export const changelog = [
  { date: "TBD", change: "Initial architecture document created", reason: "Baseline for new team members" },
  { date: "TBD", change: "subscription-manager-api decommissioned → replaced by reseller-service + subscriptions-aggregator-api", reason: "Single-responsibility principle" },
  { date: "TBD", change: "Agent flow added — /agent, /agent/review, cloneSession mutation", reason: "Internal agents needed to submit orders on behalf of customers" },
  { date: "TBD", change: "Bilingual routing — /customer/* (EN) and /client/* (FR)", reason: "Regulatory requirement for French language support" },
  { date: "TBD", change: "Module Federation adopted", reason: "Allow embedding in My Bell portal without full page reload" },
  { date: "TBD", change: "Redis caching added to catalog-api", reason: "subscriptionQualification re-called on every plan selection — needed sub-100ms reads" },
  { date: "TBD", change: "Undo flows added — reverse-cancellation, reverse-downgrade, reverse-bundle-change", reason: "Customer service requirement to reverse recent changes" },
  { date: "TBD", change: "Mutation payloads, error states, Kafka schemas, glossary documented", reason: "Newcomer onboarding — end-to-end traceability" },
];
