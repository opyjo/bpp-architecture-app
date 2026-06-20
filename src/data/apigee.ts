// ─── Apigee Data ────────────────────────────────────────────────────────────
// Senior BSA Interview Prep: Google Apigee API Management Platform
// Grounded in Bell Canada Subscription Management Platform (go-repo + subscription-manager MFE)

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ApigeeConceptQA {
  num: number;
  question: string;
  answer: string;
}

export interface ApigeePolicy {
  name: string;
  category: "Traffic" | "Security" | "Mediation" | "Extension";
  description: string;
  bellUseCase: string;
  xmlSnippet?: string;
}

export interface ApigeeComparison {
  dimension: string;
  apigee: string;
  kong: string;
  awsApiGateway: string;
  azureApim: string;
}

export interface ApigeeSetupStep {
  step: number;
  title: string;
  description: string;
  code?: string;
  codeLanguage?: string;
}

export interface ApigeeBsaQuestion {
  num: number;
  question: string;
  answer: string;
}

// ─── Overview ───────────────────────────────────────────────────────────────

export const apigeeOverview = {
  what: "Google Apigee is an enterprise API management platform that sits between client applications and backend services. It provides a unified layer for API design, security, traffic management, analytics, and developer engagement. Apigee acts as a reverse proxy — every API call flows through it, enabling centralized policy enforcement without modifying backend code.",
  why: [
    "Centralized security — OAuth2, API keys, JWT validation applied at the gateway instead of per-service",
    "Traffic management — rate limiting, spike arrest, and quotas protect backends from overload",
    "Analytics & monitoring — real-time dashboards on API usage, latency, error rates, and developer adoption",
    "Developer portal — self-service API catalog, documentation, and key provisioning for partners",
    "Mediation — request/response transformation, protocol translation (SOAP↔REST, XML↔JSON)",
    "Monetization — charge per API call, tiered pricing, usage-based billing for API products",
    "Decoupled from backends — change backend URLs, versions, or providers without breaking API consumers",
  ],
  editions: [
    { name: "Apigee X", desc: "Fully managed on Google Cloud. Best for greenfield. Uses Envoy-based runtime, Cloud CDN, and GCP networking." },
    { name: "Apigee hybrid", desc: "Management plane on GCP, runtime on-prem or any Kubernetes. Best for Bell Canada where Go services run in EKS/on-prem." },
    { name: "Apigee Edge (legacy)", desc: "Original SaaS/on-prem version. Still in use at many enterprises but being sunset in favor of Apigee X." },
  ],
};

// ─── Architecture Components ────────────────────────────────────────────────

export const apigeeArchitectureComponents = [
  {
    component: "Router (Envoy)",
    role: "Front-door load balancer and TLS termination. Routes inbound API calls to the correct Message Processor.",
    bellParallel: "Replaces ALB/CloudFront in front of AppSync. Single entry point for all API traffic.",
  },
  {
    component: "Message Processor",
    role: "Executes API proxy logic — policy evaluation (auth, rate limit, transform), routing to target backends.",
    bellParallel: "Replaces AppSync resolvers + VTL templates. Each proxy is equivalent to a resolver pipeline.",
  },
  {
    component: "Management Server",
    role: "Admin API and UI for deploying proxies, managing environments, configuring products.",
    bellParallel: "Replaces AWS Console + CDK for AppSync config. Provides API-driven deployment (CI/CD friendly).",
  },
  {
    component: "Analytics (Looker / BigQuery)",
    role: "Collects and aggregates API metrics: calls, latency, errors, developer adoption, geo distribution.",
    bellParallel: "Replaces CloudWatch + custom Datadog dashboards. Built-in API-specific analytics without setup.",
  },
  {
    component: "Developer Portal (Drupal-based)",
    role: "Self-service portal for external developers to discover APIs, read docs, register apps, and get API keys.",
    bellParallel: "New capability — Bell has no developer portal today. Enables partner onboarding (reseller, merchant APIs).",
  },
  {
    component: "Key-Value Maps (KVM)",
    role: "Encrypted key-value store for runtime config: credentials, feature flags, per-environment settings.",
    bellParallel: "Replaces AWS Secrets Manager / SSM Parameter Store for API-layer secrets.",
  },
  {
    component: "Target Server",
    role: "Named backend endpoint configuration with load balancing, health checks, and TLS settings.",
    bellParallel: "Points to Go microservices (reseller-service, order-api, etc.) via internal DNS or service mesh.",
  },
];

// ─── Core Concept Q&A ───────────────────────────────────────────────────────

export const apigeeConceptQA: ApigeeConceptQA[] = [
  {
    num: 1,
    question: "What is an API Proxy in Apigee?",
    answer: "An API Proxy is the fundamental unit in Apigee. It's a facade that decouples the API interface (what consumers see) from the backend service implementation. A proxy has two endpoints:\n\n• ProxyEndpoint — the public-facing URL, base path, and request/response policies\n• TargetEndpoint — the backend service URL and connection settings\n\nPolicies (security, traffic, mediation) attach to either endpoint's PreFlow, PostFlow, or conditional flows. In Bell Canada context, each Go microservice (reseller-service, order-api, household-api) would have its own API proxy.",
  },
  {
    num: 2,
    question: "What are Flows in Apigee and how do they execute?",
    answer: "Flows define the sequence of policy execution within a proxy. There are 4 flow types:\n\n1. PreFlow — always executes first (e.g., authentication, spike arrest)\n2. Conditional Flows — execute only when conditions match (e.g., different logic for GET vs POST)\n3. PostFlow — always executes last (e.g., logging, response transformation)\n4. PostClientFlow — executes after response is sent to client (e.g., async logging)\n\nExecution order: Request PreFlow → Conditional → PostFlow → Target → Response PostFlow → Conditional → PreFlow → Client. Fault rules handle errors at any stage.",
  },
  {
    num: 3,
    question: "What are API Products in Apigee?",
    answer: "An API Product bundles one or more API proxies into a consumable package with access controls. It defines:\n\n• Which proxies and resource paths are included\n• Quota limits (e.g., 1000 calls/hour)\n• OAuth scopes required\n• Environments where it's available (test, prod)\n• Custom attributes for billing tiers\n\nFor Bell: a 'Subscription Management' product could bundle reseller-service + order-api proxies with a 500 req/min quota. A 'Partner Integration' product could expose merchant webhook endpoints with higher limits.",
  },
  {
    num: 4,
    question: "How does Apigee handle authentication and authorization?",
    answer: "Apigee supports multiple auth mechanisms via policies:\n\n• OAuthV2 — full OAuth2 flows (client credentials, auth code, implicit). Apigee can be the OAuth server or validate external tokens.\n• VerifyAPIKey — simple API key validation against registered apps\n• JWT (GenerateJWT / VerifyJWT) — create or validate JSON Web Tokens\n• SAML — validate SAML assertions\n• BasicAuthentication — encode/decode Basic auth headers\n\nFor Bell: Replace AppSync's Cognito/Auth0 integration with Apigee OAuthV2 policy. API keys for merchant partners (Netflix, Disney+) instead of per-service auth.",
  },
  {
    num: 5,
    question: "What is the difference between an Environment and an Organization?",
    answer: "Organization (Org) is the top-level account in Apigee — it contains all proxies, products, developers, and environments. Typically one per company.\n\nEnvironment is a runtime context within an org — typically 'test', 'staging', and 'prod'. Each environment has:\n• Its own set of deployed proxies\n• Separate KVMs (different credentials per env)\n• Separate target server configs (dev vs prod backends)\n• Independent analytics data\n\nFor Bell: org = 'bell-canada', environments = 'dev' (EKS dev cluster), 'staging' (pre-prod), 'prod' (production EKS).",
  },
  {
    num: 6,
    question: "What are Developer Apps in Apigee?",
    answer: "A Developer App represents a client application that consumes APIs. When a developer registers an app, Apigee generates:\n\n• Consumer Key (API Key) — identifies the app\n• Consumer Secret — used for OAuth2 client credentials flow\n\nThe app is associated with one or more API Products, which determine what APIs it can access and at what quota. Apps can be approved automatically or require manual admin approval.\n\nFor Bell: Each merchant partner (Netflix, Disney+, Bango) would have a Developer App with keys scoped to their specific API Products.",
  },
  {
    num: 7,
    question: "How does Apigee handle versioning?",
    answer: "Apigee supports API versioning through:\n\n1. Base path versioning — /v1/subscriptions, /v2/subscriptions (different proxy per version)\n2. Revision system — each proxy save creates a new revision. You can deploy different revisions to different environments.\n3. Shared Flows — extract common logic into reusable flows, reducing duplication across versions.\n4. API Products — bundle v1 and v2 proxies in the same product, or create separate products for controlled migration.\n\nKey: Apigee keeps all revisions. You can roll back by redeploying a previous revision — no code change needed.",
  },
  {
    num: 8,
    question: "What are Shared Flows and Flow Hooks?",
    answer: "Shared Flows are reusable policy sequences that can be called from any proxy via the FlowCallout policy. Use cases: common auth logic, standard logging, CORS headers.\n\nFlow Hooks attach Shared Flows to execute automatically at specific points in ALL proxies in an environment:\n• Pre-proxy — before any proxy flow (e.g., global rate limiting)\n• Pre-target — before calling backend\n• Post-target — after backend response\n• Post-proxy — before sending response to client\n\nFor Bell: A Shared Flow for correlation ID injection (X-Correlation-ID) that runs on every request via Pre-proxy Flow Hook.",
  },
  {
    num: 9,
    question: "How does Apigee integrate with CI/CD pipelines?",
    answer: "Apigee proxies are XML + JavaScript bundles that can be stored in Git and deployed via CI/CD:\n\n1. apigeecli / apigeetool — CLI tools for deploying proxies, managing products\n2. Maven plugin — apigee-deploy-maven-plugin for Java-based pipelines\n3. Terraform provider — google_apigee_* resources for infrastructure-as-code\n4. Management API — REST API for all admin operations\n\nFor Bell: GitLab CI pipeline deploys proxy bundles alongside Go service deployments. Same ArgoCD workflow — proxy config in Git, deployed via pipeline.",
  },
  {
    num: 10,
    question: "What is Apigee's approach to fault handling?",
    answer: "Apigee uses FaultRules and a DefaultFaultRule to handle errors:\n\n• FaultRules — conditional error handlers (e.g., if quota exceeded, return custom 429 response)\n• DefaultFaultRule — catch-all for unhandled errors\n• RaiseFault policy — explicitly trigger errors from any flow\n• Error flow variables — error.status.code, error.message, fault.name for conditional logic\n\nBest practice: Use AssignMessage in FaultRules to return consistent error response format (JSON with errorCode, message, correlationId). For Bell: map Go service error codes to standardized API error responses.",
  },
  {
    num: 11,
    question: "What is the Virtual Host in Apigee?",
    answer: "A Virtual Host defines the public-facing domain name and port that API proxies listen on. It specifies:\n\n• Host alias (e.g., api.bell.ca)\n• Port (443 for HTTPS)\n• TLS/SSL certificate configuration\n• Base URL that clients use to access proxies\n\nMultiple virtual hosts can exist per environment (e.g., api.bell.ca for production, api-sandbox.bell.ca for partner testing). In Apigee X, this maps to Environment Groups.",
  },
  {
    num: 12,
    question: "How does Apigee handle caching?",
    answer: "Apigee provides built-in caching policies:\n\n• ResponseCache — caches backend responses to reduce load (configurable TTL, cache keys)\n• PopulateCache / LookupCache / InvalidateCache — fine-grained cache control for arbitrary data\n• Uses in-memory L1 cache on each Message Processor + shared L2 cache\n\nFor Bell: Cache product catalog responses from subscription-configurator-api (TTL: 24h like current Redis cache). Cache household-api lookups (TTL: 5min) to reduce CPM hits.",
  },
];

// ─── Policies ───────────────────────────────────────────────────────────────

export const apigeePolicies: ApigeePolicy[] = [
  // Traffic Management
  {
    name: "SpikeArrest",
    category: "Traffic",
    description: "Smooths traffic bursts by converting a rate limit into smaller intervals. 30/min = 1 request per 2 seconds. Protects against sudden spikes.",
    bellUseCase: "Protect reseller-service during flash sales (e.g., Disney+ promo launch). Set 100/sec to prevent backend overload.",
    xmlSnippet: `<SpikeArrest name="SA-ProtectReseller">
  <Rate>100ps</Rate>
  <Identifier ref="request.header.X-Partner-ID"/>
</SpikeArrest>`,
  },
  {
    name: "Quota",
    category: "Traffic",
    description: "Counts API calls over a time window and rejects when exceeded. Configurable per API Product, developer, or app. Supports distributed counting.",
    bellUseCase: "Limit partner API calls per billing period. Netflix integration: 10,000 calls/day. Bango: 5,000 calls/day based on contract SLAs.",
    xmlSnippet: `<Quota name="Q-PartnerQuota">
  <Allow countRef="apiproduct.developer.quota.limit" count="10000"/>
  <Interval ref="apiproduct.developer.quota.interval">1</Interval>
  <TimeUnit ref="apiproduct.developer.quota.timeunit">day</TimeUnit>
  <Identifier ref="developer.app.name"/>
</Quota>`,
  },
  {
    name: "ResponseCache",
    category: "Traffic",
    description: "Caches backend responses in Apigee's built-in cache. Reduces backend load and latency for repeated requests.",
    bellUseCase: "Cache product catalog responses from subscription-configurator-api with 24h TTL (matches current Redis TTL). Reduces CPM load.",
    xmlSnippet: `<ResponseCache name="RC-ProductCatalog">
  <CacheKey>
    <KeyFragment ref="request.queryparam.productId"/>
  </CacheKey>
  <ExpirySettings>
    <TimeoutInSec>86400</TimeoutInSec>
  </ExpirySettings>
</ResponseCache>`,
  },
  // Security
  {
    name: "OAuthV2",
    category: "Security",
    description: "Full OAuth 2.0 implementation. Generates and validates access tokens. Supports client_credentials, authorization_code, and refresh token flows.",
    bellUseCase: "Replace AppSync's Cognito/Auth0 auth. Client credentials flow for service-to-service (BFF → Apigee). Auth code flow for partner portal access.",
    xmlSnippet: `<OAuthV2 name="OA-ValidateToken">
  <Operation>VerifyAccessToken</Operation>
  <Scope>subscription-manager/query</Scope>
</OAuthV2>`,
  },
  {
    name: "VerifyAPIKey",
    category: "Security",
    description: "Validates the API key sent in a header or query parameter against registered Developer Apps.",
    bellUseCase: "Simple auth for internal tools and monitoring endpoints. Verify x-api-key header before routing to health-check or admin APIs.",
    xmlSnippet: `<VerifyAPIKey name="VAK-CheckKey">
  <APIKey ref="request.header.x-api-key"/>
</VerifyAPIKey>`,
  },
  {
    name: "VerifyJWT",
    category: "Security",
    description: "Validates JWT tokens — checks signature, expiry, issuer, audience, and custom claims.",
    bellUseCase: "Validate JWTs from BoxyHQ SAML SSO. Check audience claim matches customer vs agent flow. Extract householdAccountNumber from token claims.",
    xmlSnippet: `<VerifyJWT name="VJWT-ValidateSAML">
  <Algorithm>RS256</Algorithm>
  <Source>request.header.Authorization</Source>
  <Issuer>https://sso.bell.ca</Issuer>
  <Audience>subscription-manager</Audience>
</VerifyJWT>`,
  },
  {
    name: "XMLThreatProtection",
    category: "Security",
    description: "Protects against XML-based attacks: entity expansion, DTD attacks, oversized payloads.",
    bellUseCase: "Protect SOAP/XML integrations with legacy CPM (Core Processing Module) system.",
  },
  {
    name: "JSONThreatProtection",
    category: "Security",
    description: "Protects against malicious JSON: oversized arrays, deep nesting, long strings.",
    bellUseCase: "Validate incoming subscription payloads. Reject JSON with >10 nesting levels or arrays >1000 elements to prevent DoS.",
    xmlSnippet: `<JSONThreatProtection name="JTP-PayloadGuard">
  <ArrayElementCount>1000</ArrayElementCount>
  <ContainerDepth>10</ContainerDepth>
  <StringValueLength>5000</StringValueLength>
</JSONThreatProtection>`,
  },
  {
    name: "CORS",
    category: "Security",
    description: "Adds Cross-Origin Resource Sharing headers. Handles preflight OPTIONS requests.",
    bellUseCase: "Allow subscription-manager MFE (Next.js) to call Apigee endpoints from browser. Whitelist *.bell.ca origins.",
  },
  // Mediation
  {
    name: "AssignMessage",
    category: "Mediation",
    description: "Construct or modify request/response messages. Add/remove headers, query params, or rewrite the entire payload.",
    bellUseCase: "Transform payloads for legacy CPM integration. Map modern JSON subscription format to CPM's expected field names. Add correlation ID headers.",
    xmlSnippet: `<AssignMessage name="AM-AddCorrelationId">
  <Set>
    <Headers>
      <Header name="X-Correlation-ID">{messageid}</Header>
    </Headers>
  </Set>
  <AssignTo createNew="false" transport="http" type="request"/>
</AssignMessage>`,
  },
  {
    name: "ExtractVariables",
    category: "Mediation",
    description: "Extract data from requests/responses into flow variables using JSONPath, XPath, or regex patterns.",
    bellUseCase: "Extract householdAccountNumber from request body for routing. Extract subscriptionId from URL path for per-subscription rate limiting.",
    xmlSnippet: `<ExtractVariables name="EV-ExtractHouseholdId">
  <JSONPayload>
    <Variable name="householdId">
      <JSONPath>$.customerInfo.householdAccountNumber</JSONPath>
    </Variable>
  </JSONPayload>
</ExtractVariables>`,
  },
  {
    name: "JSONToXML / XMLToJSON",
    category: "Mediation",
    description: "Convert between JSON and XML formats. Useful for bridging modern REST APIs with legacy SOAP services.",
    bellUseCase: "Convert JSON subscription payloads to XML for CPM (Oracle) legacy system calls. Convert XML responses back to JSON for modern consumers.",
  },
  {
    name: "MessageLogging",
    category: "Mediation",
    description: "Log messages to syslog, file, or cloud logging. Runs in PostClientFlow (non-blocking after response sent).",
    bellUseCase: "Send API access logs to Splunk/Datadog for compliance. Log subscription mutations for audit trail alongside audit-api.",
    xmlSnippet: `<MessageLogging name="ML-AuditLog">
  <CloudLogging>
    <LogName>projects/bell-canada/logs/apigee-audit</LogName>
    <Message>{request.verb} {proxy.pathsuffix} → {response.status.code}</Message>
  </CloudLogging>
</MessageLogging>`,
  },
  // Extension
  {
    name: "ServiceCallout",
    category: "Extension",
    description: "Make an HTTP call to an external service from within a proxy flow. The response is stored in a variable for use by subsequent policies.",
    bellUseCase: "Validate customer account against household-api before routing to reseller-service. Call subscription-configurator-api to check product eligibility.",
    xmlSnippet: `<ServiceCallout name="SC-ValidateHousehold">
  <Request>
    <Set>
      <Verb>GET</Verb>
      <Path>/v1/households/{householdId}</Path>
    </Set>
  </Request>
  <Response>householdResponse</Response>
  <HTTPTargetConnection>
    <URL>https://household-api.internal.bell.ca</URL>
  </HTTPTargetConnection>
</ServiceCallout>`,
  },
  {
    name: "JavaScript",
    category: "Extension",
    description: "Execute custom JavaScript code within the proxy flow. Access flow variables, manipulate headers, and implement custom logic.",
    bellUseCase: "Custom routing logic: inspect subscription payload and route to correct merchant adapter based on providerId mapping.",
  },
  {
    name: "KeyValueMapOperations",
    category: "Extension",
    description: "Read/write encrypted key-value data stored in Apigee KVMs. Used for runtime config, credentials, and per-environment settings.",
    bellUseCase: "Store merchant API credentials (Netflix OAuth client_id, Bango HMAC key) encrypted in KVMs per environment.",
    xmlSnippet: `<KeyValueMapOperations name="KVM-MerchantCreds" mapIdentifier="merchant-credentials">
  <Scope>environment</Scope>
  <Get assignTo="private.merchant.apiKey">
    <Key><Parameter ref="merchant.providerId"/></Key>
  </Get>
</KeyValueMapOperations>`,
  },
  {
    name: "FlowCallout",
    category: "Extension",
    description: "Invoke a Shared Flow from within a proxy. Enables reusable policy sequences across multiple proxies.",
    bellUseCase: "Call a shared 'bell-standard-auth' flow that handles SAML validation, token extraction, and role-based routing for all subscription proxies.",
  },
];

// ─── Gateway Comparison ─────────────────────────────────────────────────────

export const apigeeComparison: ApigeeComparison[] = [
  {
    dimension: "Deployment Model",
    apigee: "SaaS (X), Hybrid (runtime on-prem), Edge (legacy)",
    kong: "Self-hosted (OSS), SaaS (Konnect), Kubernetes-native",
    awsApiGateway: "Fully managed AWS service (REST & HTTP APIs)",
    azureApim: "SaaS, self-hosted gateway, hybrid",
  },
  {
    dimension: "API Proxy Model",
    apigee: "XML-based proxy bundles with visual editor. Rich policy framework.",
    kong: "Plugin-based (Lua/Go). Routes + Services + Plugins model.",
    awsApiGateway: "OpenAPI import, console-based. Lambda or HTTP integration.",
    azureApim: "Policy XML similar to Apigee. OpenAPI import.",
  },
  {
    dimension: "Authentication",
    apigee: "OAuth2, API Key, JWT, SAML, LDAP — built-in policies",
    kong: "OAuth2, API Key, JWT, LDAP — via plugins",
    awsApiGateway: "Cognito, Lambda authorizers, IAM, API keys",
    azureApim: "Azure AD, OAuth2, certificates, API keys",
  },
  {
    dimension: "Rate Limiting",
    apigee: "SpikeArrest + Quota — distributed, per-product/app/developer",
    kong: "Rate Limiting plugin — local or Redis-backed distributed",
    awsApiGateway: "Usage plans with API keys. Burst + steady-state limits.",
    azureApim: "rate-limit + quota policies, per-subscription",
  },
  {
    dimension: "Analytics",
    apigee: "Built-in dashboards + BigQuery export. Developer engagement metrics.",
    kong: "Vitals (enterprise). Basic in OSS. Prometheus integration.",
    awsApiGateway: "CloudWatch metrics + X-Ray tracing",
    azureApim: "Application Insights integration, built-in analytics",
  },
  {
    dimension: "Developer Portal",
    apigee: "Built-in Drupal-based portal. Self-service key provisioning.",
    kong: "Kong Developer Portal (enterprise). No OSS portal.",
    awsApiGateway: "No built-in portal. Use third-party (Readme, Swagger).",
    azureApim: "Built-in developer portal with customization",
  },
  {
    dimension: "Mediation / Transform",
    apigee: "AssignMessage, XSLT, JSONToXML, JavaScript — rich transformation",
    kong: "Request/Response transformer plugins. Less rich than Apigee.",
    awsApiGateway: "VTL mapping templates (limited). Lambda for complex transforms.",
    azureApim: "Liquid templates, XSLT, set-body policy",
  },
  {
    dimension: "GraphQL Support",
    apigee: "GraphQL proxy type (Apigee X). Schema validation, depth limiting.",
    kong: "GraphQL plugin (enterprise) — rate limit by query complexity.",
    awsApiGateway: "AppSync is AWS's GraphQL service (separate product).",
    azureApim: "GraphQL passthrough + synthetic GraphQL APIs",
  },
  {
    dimension: "Monetization",
    apigee: "Built-in monetization engine — charge per call, freemium, tiered.",
    kong: "No built-in monetization.",
    awsApiGateway: "No built-in monetization. Use AWS Marketplace.",
    azureApim: "No built-in monetization. Use Azure integrations.",
  },
  {
    dimension: "Multi-Cloud / Hybrid",
    apigee: "Apigee hybrid runs on any Kubernetes. Management stays on GCP.",
    kong: "Runs anywhere — Kubernetes, VM, bare metal. Cloud-agnostic.",
    awsApiGateway: "AWS only. No hybrid option.",
    azureApim: "Self-hosted gateway runs on Kubernetes. Management on Azure.",
  },
  {
    dimension: "CI/CD Integration",
    apigee: "apigeecli, Maven plugin, Terraform provider, Management API",
    kong: "decK (declarative config), Terraform provider, Admin API",
    awsApiGateway: "CloudFormation, CDK, SAM, Terraform",
    azureApim: "ARM templates, Terraform, Azure DevOps pipelines",
  },
  {
    dimension: "Bell Canada Fit",
    apigee: "Strong — hybrid model for EKS, developer portal for partners, monetization for reseller APIs",
    kong: "Good — K8s-native fits EKS, but no built-in portal or monetization",
    awsApiGateway: "Limited — already using AppSync for GraphQL. HTTP API lacks mediation depth.",
    azureApim: "Poor fit — Bell is AWS/GCP, not Azure. Would add cloud sprawl.",
  },
];

// ─── Setup Steps ────────────────────────────────────────────────────────────

export const apigeeSetupSteps: ApigeeSetupStep[] = [
  {
    step: 1,
    title: "Provision Apigee X on GCP",
    description: "Create an Apigee organization linked to your GCP project. Enable the Apigee API and provision a runtime instance in your preferred region.",
    code: `# Enable Apigee API
gcloud services enable apigee.googleapis.com

# Create Apigee organization (one-time setup)
gcloud alpha apigee organizations provision \\
  --project=bell-canada-sub-mgmt \\
  --authorized-network=default \\
  --runtime-location=northamerica-northeast1 \\
  --analytics-region=northamerica-northeast1

# Create environments
gcloud alpha apigee environments create \\
  --organization=bell-canada-sub-mgmt \\
  --environment=dev

gcloud alpha apigee environments create \\
  --organization=bell-canada-sub-mgmt \\
  --environment=prod`,
    codeLanguage: "bash",
  },
  {
    step: 2,
    title: "Create Your First API Proxy",
    description: "Create a reverse proxy for the reseller-service. The proxy defines the public API path and routes requests to your Go backend.",
    code: `# Using apigeecli to create a proxy from OpenAPI spec
apigeecli apis create openapi \\
  --name reseller-service-proxy \\
  --oas-file ./services/reseller-service/doc/openapi.yaml \\
  --target-url https://reseller-service.internal.bell.ca \\
  --org bell-canada-sub-mgmt \\
  --token $(gcloud auth print-access-token)

# Deploy to dev environment
apigeecli apis deploy \\
  --name reseller-service-proxy \\
  --env dev \\
  --rev 1 \\
  --org bell-canada-sub-mgmt \\
  --token $(gcloud auth print-access-token)`,
    codeLanguage: "bash",
  },
  {
    step: 3,
    title: "Apply Security Policies",
    description: "Add OAuth2 token validation and JSON threat protection to your proxy. Policies are defined in XML and attached to the PreFlow.",
    code: `<!-- apiproxy/policies/OA-ValidateToken.xml -->
<OAuthV2 name="OA-ValidateToken">
  <Operation>VerifyAccessToken</Operation>
</OAuthV2>

<!-- apiproxy/policies/JTP-PayloadGuard.xml -->
<JSONThreatProtection name="JTP-PayloadGuard">
  <Source>request</Source>
  <ArrayElementCount>100</ArrayElementCount>
  <ContainerDepth>10</ContainerDepth>
  <ObjectEntryCount>50</ObjectEntryCount>
  <StringValueLength>5000</StringValueLength>
</JSONThreatProtection>

<!-- apiproxy/proxies/default.xml — attach to PreFlow -->
<ProxyEndpoint name="default">
  <PreFlow>
    <Request>
      <Step><Name>OA-ValidateToken</Name></Step>
      <Step><Name>JTP-PayloadGuard</Name></Step>
    </Request>
  </PreFlow>
  <HTTPProxyConnection>
    <BasePath>/v1/subscriptions</BasePath>
    <VirtualHost>secure</VirtualHost>
  </HTTPProxyConnection>
  <RouteRule name="default">
    <TargetEndpoint>default</TargetEndpoint>
  </RouteRule>
</ProxyEndpoint>`,
    codeLanguage: "xml",
  },
  {
    step: 4,
    title: "Add Traffic Management",
    description: "Apply SpikeArrest and Quota policies to protect your Go services from traffic bursts and enforce usage limits per partner.",
    code: `<!-- apiproxy/policies/SA-ProtectBackend.xml -->
<SpikeArrest name="SA-ProtectBackend">
  <Rate>100ps</Rate>
  <Identifier ref="request.header.X-Partner-ID"/>
</SpikeArrest>

<!-- apiproxy/policies/Q-PartnerQuota.xml -->
<Quota name="Q-PartnerQuota">
  <Allow countRef="apiproduct.developer.quota.limit"
         count="10000"/>
  <Interval ref="apiproduct.developer.quota.interval">1</Interval>
  <TimeUnit ref="apiproduct.developer.quota.timeunit">day</TimeUnit>
  <Identifier ref="developer.app.name"/>
  <Distributed>true</Distributed>
  <Synchronous>true</Synchronous>
</Quota>`,
    codeLanguage: "xml",
  },
  {
    step: 5,
    title: "Create API Product & Developer App",
    description: "Bundle your proxies into an API Product and create a Developer App to generate API keys for consumers.",
    code: `# Create an API Product
apigeecli products create \\
  --name "Bell-Subscription-Management" \\
  --display-name "Bell Subscription Management API" \\
  --proxies "reseller-service-proxy,order-api-proxy" \\
  --envs "dev,prod" \\
  --quota 10000 --quota-interval 1 --quota-unit day \\
  --scopes "subscription-manager/query,subscription-manager/mutate" \\
  --org bell-canada-sub-mgmt \\
  --token $(gcloud auth print-access-token)

# Register a developer
apigeecli developers create \\
  --email netflix-integration@bell.ca \\
  --first Netflix --last Integration \\
  --user netflix-partner \\
  --org bell-canada-sub-mgmt \\
  --token $(gcloud auth print-access-token)

# Create a Developer App (generates API key + secret)
apigeecli apps create \\
  --name "Netflix-Merchant-App" \\
  --email netflix-integration@bell.ca \\
  --prods "Bell-Subscription-Management" \\
  --org bell-canada-sub-mgmt \\
  --token $(gcloud auth print-access-token)`,
    codeLanguage: "bash",
  },
  {
    step: 6,
    title: "Connect Your Go Microservices",
    description: "Configure Target Servers in Apigee to point to your Go services. Use named targets for easy environment-specific routing.",
    code: `# Create target servers for each Go service
apigeecli targetservers create \\
  --name reseller-service \\
  --host reseller-service.internal.bell.ca \\
  --port 8080 --tls true \\
  --env dev \\
  --org bell-canada-sub-mgmt \\
  --token $(gcloud auth print-access-token)

apigeecli targetservers create \\
  --name order-api \\
  --host order-api.internal.bell.ca \\
  --port 8080 --tls true \\
  --env dev \\
  --org bell-canada-sub-mgmt \\
  --token $(gcloud auth print-access-token)

apigeecli targetservers create \\
  --name household-api \\
  --host household-api.internal.bell.ca \\
  --port 8080 --tls true \\
  --env dev \\
  --org bell-canada-sub-mgmt \\
  --token $(gcloud auth print-access-token)`,
    codeLanguage: "bash",
  },
  {
    step: 7,
    title: "Test End-to-End",
    description: "Verify the full flow: authenticate, call the proxy endpoint, and confirm the request reaches your Go backend.",
    code: `# 1. Get an OAuth2 token (client credentials flow)
TOKEN=$(curl -s -X POST \\
  https://api.bell.ca/oauth/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=client_credentials" \\
  -d "client_id=YOUR_CONSUMER_KEY" \\
  -d "client_secret=YOUR_CONSUMER_SECRET" | jq -r '.access_token')

# 2. Call the proxied reseller-service
curl -v https://api.bell.ca/v1/subscriptions/generate-session \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "X-Correlation-ID: $(uuidgen)" \\
  -d '{
    "customerInfo": {
      "householdAccountNumber": "HH-12345",
      "billingAccountNumber": "BA-67890",
      "tvAccountNumber": "TV-11111"
    }
  }'

# 3. Check Apigee Analytics for the request
gcloud alpha apigee operations list \\
  --organization=bell-canada-sub-mgmt \\
  --environment=dev`,
    codeLanguage: "bash",
  },
];

// ─── BSA Interview Questions ────────────────────────────────────────────────

export const apigeeBsaInterviewQuestions: ApigeeBsaQuestion[] = [
  {
    num: 1,
    question: "What is API management beyond a simple gateway, and why would Bell Canada need it?",
    answer: `API management goes beyond routing requests to backends. It encompasses the full API lifecycle:

1. **Design** — API-first approach with OpenAPI specs before coding
2. **Secure** — OAuth2, rate limiting, threat protection at the gateway layer
3. **Publish** — Developer portal for partner onboarding and self-service
4. **Analyze** — Usage analytics, error rates, developer engagement metrics
5. **Monetize** — Usage-based billing, tiered access, freemium models

For Bell Canada specifically:
• Current state: AppSync handles GraphQL routing but provides no developer portal, no monetization, and limited analytics
• With Apigee: Bell could expose subscription APIs to reseller partners through a developer portal, enforce SLA-based quotas per partner, and gain API-level analytics that AppSync + CloudWatch don't provide
• Business value: Faster partner onboarding (self-service keys), revenue from API access (monetization), and compliance visibility (who accessed what, when)`,
  },
  {
    num: 2,
    question: "How would you document migration requirements from AppSync to Apigee?",
    answer: `I would create a Migration Requirements Document (MRD) with these sections:

**1. Current State Analysis**
• Inventory all AppSync resolvers (5 mutations, REST reads via aggregator-api)
• Map VTL templates to equivalent Apigee policies
• Document current auth flow: Cognito/Auth0 → AppSync → Go services

**2. Gap Analysis Table**
| Capability | AppSync (Current) | Apigee (Target) | Gap |
|---|---|---|---|
| Auth | Cognito authorizer | OAuthV2 policy | Token format migration |
| Rate limiting | None | SpikeArrest + Quota | New capability |
| Transform | VTL templates | AssignMessage + JS | Logic rewrite |
| Monitoring | CloudWatch | Apigee Analytics | Dashboard rebuild |

**3. Migration Phases**
• Phase 1: Deploy Apigee in parallel (shadow mode — route traffic to both)
• Phase 2: Migrate read APIs (lower risk, aggregator-api is REST)
• Phase 3: Migrate mutation APIs (higher risk, test with canary traffic)
• Phase 4: Decommission AppSync resolvers

**4. Acceptance Criteria per Phase**
• Latency P99 within 10% of AppSync baseline
• Zero auth failures during cutover
• All 14 Kafka events still published correctly
• Rollback plan: DNS switch back to AppSync within 5 minutes`,
  },
  {
    num: 3,
    question: "What BSA artifacts would you produce for an Apigee-proxied microservice?",
    answer: `For each Go microservice behind Apigee, I would produce:

**1. API Specification** — OpenAPI 3.0 spec defining endpoints, schemas, error codes (already exists in go-repo for each service)

**2. Data Flow Diagram** — Visual showing: Client → Apigee (policies) → Go service → Database, with data transformations at each hop

**3. Policy Requirements Matrix**
| Policy | Config | Justification |
|---|---|---|
| OAuthV2 | Verify access token | Enforce auth at gateway |
| SpikeArrest | 100/sec per partner | Protect from traffic bursts |
| Quota | 10K/day per app | SLA enforcement |
| AssignMessage | Add X-Correlation-ID | Distributed tracing |

**4. Error Mapping Document** — Maps Go service error codes to standardized Apigee error responses (HTTP status, error body format)

**5. Integration Test Scenarios** — Test cases for: valid auth, expired token, quota exceeded, backend timeout, malformed payload

**6. Deployment Runbook** — Steps to deploy proxy + Go service together, rollback procedures, health check verification`,
  },
  {
    num: 4,
    question: "How does Apigee's API Product model map to business requirements?",
    answer: `Apigee's API Product model directly maps to business concepts:

**API Product = Business Service Offering**
• "Bell Subscription Management" product = access to subscription CRUD APIs
• "Bell Partner Integration" product = access to merchant webhook + status APIs
• "Bell Analytics Read" product = read-only access to aggregator-api

**Product Configuration = Business Rules**
• Quota limits → SLA commitments in partner contracts
• OAuth scopes → role-based access (read-only vs read-write)
• Environment access → sandbox for testing, prod for live traffic
• Custom attributes → billing tier, partner level, contract expiry

**Developer App = Partner Agreement**
• Each partner (Netflix, Disney+, Bango) gets a Developer App
• App credentials = contractual API access
• Product association = what APIs they can call
• Approval workflow = business sign-off before API access

**BSA Responsibility**: Translate partner contract terms into API Product configurations. Example: "Netflix can make 10,000 provisioning calls/day" → Quota policy on the Partner Integration product.`,
  },
  {
    num: 5,
    question: "How do rate limiting policies translate to SLA commitments?",
    answer: `Rate limiting policies are the technical enforcement of business SLAs:

**SpikeArrest → Availability SLA**
• Config: 100 requests/second per partner
• Business meaning: "We guarantee our APIs remain available even during traffic spikes"
• BSA artifact: Non-functional requirement — "System shall handle burst traffic of 100 req/s without degradation"

**Quota → Usage SLA**
• Config: 10,000 calls/day per Developer App
• Business meaning: "Your contract includes 10,000 API calls per day"
• BSA artifact: Acceptance criteria — "System shall return HTTP 429 with rate_limit_exceeded error when daily quota is exceeded"

**How I'd document this for Bell Canada:**

| Partner | SLA Tier | Spike Arrest | Daily Quota | Overage Policy |
|---|---|---|---|---|
| Netflix | Premium | 200/sec | 50,000 | Notify + allow 10% buffer |
| Bango | Standard | 50/sec | 10,000 | Hard reject at limit |
| Bell Media | Internal | 500/sec | Unlimited | Monitor only |

Key BSA consideration: Rate limit responses must include Retry-After header and remaining quota in response headers so partners can implement client-side backoff.`,
  },
  {
    num: 6,
    question: "How would you approach API versioning from a BSA perspective?",
    answer: `API versioning requires balancing backward compatibility with evolution:

**Versioning Strategy Document (BSA artifact):**

1. **Version Scheme**: URL path versioning (/v1/, /v2/) — most explicit, easiest for partners to understand
2. **Breaking Change Policy**:
   • v1 supported for 12 months after v2 launch
   • Deprecation notice 6 months before sunset
   • Email + developer portal banner + Sunset header in responses

3. **What Constitutes a Breaking Change** (BSA must define):
   • Removing a field → BREAKING
   • Adding an optional field → NON-BREAKING
   • Changing field type → BREAKING
   • Adding new endpoint → NON-BREAKING
   • Changing error response format → BREAKING

4. **Apigee Implementation**:
   • Separate proxy per major version (reseller-v1-proxy, reseller-v2-proxy)
   • Shared Flow for common logic (auth, logging)
   • API Product includes both v1 and v2 proxies during transition
   • Analytics dashboard comparing v1 vs v2 adoption

5. **Migration Acceptance Criteria**:
   • All active partners acknowledged deprecation notice
   • v1 traffic < 5% of total before sunset
   • Zero unresolved compatibility issues in partner support queue`,
  },
  {
    num: 7,
    question: "How would you use Apigee transformation policies for data mapping?",
    answer: `Apigee transformation policies handle data mapping between API consumers and backends:

**Real Bell Canada Example — CPM Legacy Integration:**

Current state: CPM (Oracle) expects XML with specific field names. Go services return modern JSON.

**AssignMessage Policy for Request Transform:**
Client sends: { "householdAccountNumber": "HH-123" }
Apigee transforms to: <AccountLookup><HouseholdId>HH-123</HouseholdId></AccountLookup>

**BSA Data Mapping Artifact:**
| Consumer Field | Apigee Variable | Backend Field | Transform |
|---|---|---|---|
| householdAccountNumber | extracted.householdId | HouseholdId (Go struct) | Direct map |
| billingCycle: "MONTHLY" | extracted.cycle | billing_cycle_code | Map: MONTHLY→M, ANNUAL→A |
| selectedPlan.price | extracted.price | PriceInCents | Multiply by 100 |

**Policy Chain for Transform:**
1. ExtractVariables — pull fields from request JSON
2. AssignMessage — construct backend request with mapped fields
3. ServiceCallout — call Go service
4. AssignMessage — transform response back to consumer format

**BSA Responsibility**: Define the field mapping rules. Developers implement in Apigee policies. BSA validates with integration test scenarios.`,
  },
  {
    num: 8,
    question: "What acceptance criteria would you write for an API proxy deployment?",
    answer: `Acceptance criteria for deploying a new Apigee API proxy (e.g., reseller-service-proxy):

**Functional ACs:**
• AC1: GET /v1/subscriptions returns 200 with valid OAuth token and subscription list in JSON format
• AC2: POST /v1/subscriptions/generate-session creates a session and returns sessionId within 500ms P99
• AC3: Request without Authorization header returns 401 with { "error": "invalid_token", "message": "Access token is missing" }
• AC4: Request with expired token returns 401 with { "error": "token_expired", "message": "Access token has expired" }
• AC5: Malformed JSON payload returns 400 with { "error": "invalid_payload", "details": [...] }

**Non-Functional ACs:**
• AC6: SpikeArrest rejects traffic beyond 100 req/sec with 429 status and Retry-After header
• AC7: Quota returns X-Quota-Remaining and X-Quota-Reset headers on every response
• AC8: All requests include X-Correlation-ID header (generated if not provided by client)
• AC9: API proxy latency adds < 20ms overhead vs direct backend call at P99
• AC10: Failed requests to backend trigger FaultRule returning standardized error response (not raw backend error)

**Operational ACs:**
• AC11: Proxy deployment completes in < 60 seconds via CI/CD pipeline
• AC12: Rollback to previous revision completes in < 30 seconds
• AC13: Analytics dashboard shows request count, latency P50/P99, and error rate within 5 minutes of first call`,
  },
  {
    num: 9,
    question: "How would you evaluate API-first vs code-first approaches for Bell's subscription APIs?",
    answer: `**API-First (Recommended for Bell):**
Design the OpenAPI spec → get stakeholder approval → then implement in Go + configure Apigee proxy.

Pros:
• Partners can start building integrations against mock APIs immediately
• BSA can review API contract before any code is written (cheaper to change)
• Apigee proxy auto-generated from OpenAPI spec (apigeecli apis create openapi)
• Go server stubs auto-generated from spec (oapi-codegen, already used in go-repo)

Cons:
• Upfront design time (but saves rework later)
• Requires BSA + architect + developer alignment before Sprint 1

**Code-First (Current Bell State):**
Go services have OpenAPI specs generated from code annotations. AppSync schema defined in CDK.

Pros:
• Faster initial development
• Single source of truth in code

Cons:
• API contract can drift from business requirements
• Partners can't start integration until code is deployed
• Breaking changes discovered late

**BSA Recommendation for Apigee Migration:**
1. Extract current API contracts from Go service OpenAPI specs
2. Review with product owner — any fields to add/remove/rename?
3. Publish finalized spec to Apigee developer portal
4. Generate Apigee proxy from spec
5. Validate: Apigee proxy matches spec, Go service matches spec`,
  },
  {
    num: 10,
    question: "How would you use Apigee Analytics to support business decisions?",
    answer: `Apigee Analytics provides API-level metrics that drive business decisions:

**1. Partner Adoption Dashboard**
• Metrics: API calls per partner, unique endpoints used, error rates
• Business question: "Which partners are actively integrating? Who needs support?"
• Action: Partner with < 100 calls/week after onboarding → trigger partner success outreach

**2. API Usage Trends**
• Metrics: Calls per endpoint over time, peak hours, geographic distribution
• Business question: "Which subscription operations are most popular?"
• Action: If cancel API calls spike 40% month-over-month → alert product team to investigate churn

**3. Performance SLA Compliance**
• Metrics: P50/P99 latency per proxy, error rate, availability
• Business question: "Are we meeting partner SLA commitments?"
• Action: If P99 > 500ms for Netflix integration → escalate to platform team

**4. Monetization & Revenue**
• Metrics: Calls per billing tier, quota utilization per partner
• Business question: "Should we adjust pricing tiers?"
• Action: If top partner consistently uses 95%+ quota → propose upgrade tier

**5. API Product Health**
• Metrics: Deprecated endpoint usage, version adoption rates
• Business question: "Is it safe to sunset v1?"
• Action: v1 traffic < 2% of total for 30 days → proceed with sunset plan

**BSA Role**: Define which KPIs matter, configure custom reports in Apigee, and present monthly API health reviews to stakeholders.`,
  },
];

// ─── Mermaid Diagrams ───────────────────────────────────────────────────────

export const bellArchitectureWithApigeeDiagram = `graph TB
  subgraph Clients
    MFE["Subscription Manager MFE<br/>(Next.js)"]
    PARTNER["Partner Systems<br/>(Netflix, Disney+, Bango)"]
    PORTAL["Developer Portal<br/>(Apigee Drupal)"]
  end

  subgraph Apigee["Apigee API Gateway"]
    ROUTER["Router / Envoy<br/>TLS Termination"]
    MP["Message Processor<br/>Policy Execution"]
    ANALYTICS["Analytics Engine<br/>BigQuery Export"]

    subgraph Policies
      AUTH["OAuthV2 / VerifyJWT"]
      RATE["SpikeArrest + Quota"]
      TRANSFORM["AssignMessage<br/>ExtractVariables"]
      LOG["MessageLogging"]
    end
  end

  subgraph Backend["Go Microservices (EKS)"]
    BFF["Next.js BFF"]
    RS["reseller-service"]
    OA["order-api"]
    HH["household-api"]
    SC["subscription-configurator-api"]
    AGG["subscriptions-aggregator-api"]
    MERCH["Merchant Adapters<br/>(Netflix, Disney+, Bango,<br/>Bell Media, Radio-Canada)"]
  end

  subgraph Data
    PG["PostgreSQL"]
    DDB["DynamoDB"]
    REDIS["Redis Cache"]
    KAFKA["Apache Kafka"]
  end

  MFE --> BFF
  BFF --> ROUTER
  PARTNER --> ROUTER
  PORTAL -.->|"Self-service<br/>API Keys"| PARTNER

  ROUTER --> MP
  MP --> AUTH --> RATE --> TRANSFORM --> LOG

  MP --> RS
  MP --> OA
  MP --> HH
  MP --> SC
  MP --> AGG

  RS --> MERCH
  RS --> PG
  RS --> KAFKA
  OA --> PG
  HH --> DDB
  SC --> REDIS
  AGG --> PG

  ANALYTICS -.->|"Usage metrics"| PORTAL

  classDef apigeeNode fill:#4285f4,stroke:#1a73e8,color:#fff
  classDef policyNode fill:#34a853,stroke:#1e8e3e,color:#fff
  classDef backendNode fill:#7c6fcd,stroke:#5a4ab5,color:#fff
  classDef dataNode fill:#e8a83a,stroke:#c68a2e,color:#fff
  classDef clientNode fill:#3eb89a,stroke:#2d9a7e,color:#fff

  class ROUTER,MP,ANALYTICS apigeeNode
  class AUTH,RATE,TRANSFORM,LOG policyNode
  class BFF,RS,OA,HH,SC,AGG,MERCH backendNode
  class PG,DDB,REDIS,KAFKA dataNode
  class MFE,PARTNER,PORTAL clientNode`;

export const requestFlowSequenceDiagram = `sequenceDiagram
  participant Client as MFE / Partner
  participant Apigee as Apigee Gateway
  participant Auth as OAuthV2 Policy
  participant Rate as SpikeArrest + Quota
  participant Transform as AssignMessage
  participant Backend as Go Service<br/>(reseller-service)
  participant DB as PostgreSQL
  participant Kafka as Kafka

  Client->>Apigee: POST /v1/subscriptions/submit<br/>Authorization: Bearer token

  Apigee->>Auth: Verify access token
  Auth-->>Apigee: Token valid, scopes: [mutate]

  Apigee->>Rate: Check SpikeArrest (100/sec)
  Rate-->>Apigee: Within limit
  Apigee->>Rate: Check Quota (10K/day)
  Rate-->>Apigee: 4,231 / 10,000 remaining

  Apigee->>Transform: Add X-Correlation-ID header<br/>Extract householdAccountNumber
  Transform-->>Apigee: Request enriched

  Apigee->>Backend: Forward request + headers
  Backend->>DB: Insert order + subscription
  DB-->>Backend: orderId, subscriptionId
  Backend->>Kafka: Publish OrderCreated event
  Backend-->>Apigee: 201 Created { orderId, status }

  Apigee->>Transform: Add X-Quota-Remaining header
  Apigee->>Apigee: Log to Analytics
  Apigee-->>Client: 201 Created + quota headers`;

export const proxyInternalsDiagram = `graph LR
  subgraph ProxyEndpoint
    direction TB
    PE_PRE["PreFlow<br/>① OAuthV2<br/>② SpikeArrest<br/>③ JSONThreatProtection"]
    PE_COND["Conditional Flows<br/>④ POST /submit → ExtractVariables<br/>⑤ GET /list → ResponseCache lookup"]
    PE_POST["PostFlow<br/>⑥ AssignMessage (add headers)"]
  end

  subgraph TargetEndpoint
    direction TB
    TE_PRE["PreFlow<br/>⑦ ServiceCallout (household-api)<br/>⑧ AssignMessage (transform)"]
    TE_POST["PostFlow<br/>⑨ MessageLogging"]
  end

  subgraph Backend
    GO["Go Service<br/>(reseller-service)"]
  end

  PE_PRE --> PE_COND --> PE_POST
  PE_POST -->|"Route Rule"| TE_PRE
  TE_PRE --> GO
  GO --> TE_POST
  TE_POST -->|"Response"| PE_POST

  classDef preflow fill:#4285f4,stroke:#1a73e8,color:#fff
  classDef condflow fill:#34a853,stroke:#1e8e3e,color:#fff
  classDef postflow fill:#e8a83a,stroke:#c68a2e,color:#fff
  classDef backend fill:#7c6fcd,stroke:#5a4ab5,color:#fff

  class PE_PRE,TE_PRE preflow
  class PE_COND condflow
  class PE_POST,TE_POST postflow
  class GO backend`;

export const policyExecutionFlowDiagram = `graph TB
  START["Client Request"] --> PE_PRE

  subgraph Request Pipeline
    PE_PRE["ProxyEndpoint PreFlow<br/>• OAuthV2 (verify token)<br/>• SpikeArrest (rate limit)<br/>• Quota (usage limit)"]
    PE_COND["Conditional Flows<br/>• POST? → ExtractVariables<br/>• GET? → ResponseCache"]
    PE_POST["ProxyEndpoint PostFlow<br/>• AssignMessage (add headers)"]
    TE_PRE["TargetEndpoint PreFlow<br/>• ServiceCallout (validate)<br/>• AssignMessage (transform)"]
  end

  subgraph Target
    BACKEND["Go Microservice"]
  end

  subgraph Response Pipeline
    TE_POST_R["TargetEndpoint PostFlow<br/>• ExtractVariables (response)"]
    PE_POST_R["ProxyEndpoint PostFlow<br/>• AssignMessage (format response)<br/>• Add quota headers"]
    PE_PRE_R["ProxyEndpoint PreFlow<br/>• (response direction)"]
    PC_FLOW["PostClientFlow<br/>• MessageLogging (async)"]
  end

  subgraph Error Handling
    FAULT["FaultRules<br/>• InvalidToken → 401 JSON<br/>• QuotaExceeded → 429 JSON<br/>• BackendError → 502 JSON"]
    DEFAULT["DefaultFaultRule<br/>• Catch-all → 500 JSON"]
  end

  PE_PRE --> PE_COND --> PE_POST --> TE_PRE --> BACKEND
  BACKEND --> TE_POST_R --> PE_POST_R --> PE_PRE_R --> PC_FLOW
  PC_FLOW --> CLIENT["Client Response"]

  PE_PRE -.->|"Auth fail"| FAULT
  PE_COND -.->|"Rate exceeded"| FAULT
  BACKEND -.->|"5xx error"| FAULT
  FAULT --> DEFAULT
  FAULT --> CLIENT
  DEFAULT --> CLIENT

  classDef requestNode fill:#4285f4,stroke:#1a73e8,color:#fff
  classDef responseNode fill:#34a853,stroke:#1e8e3e,color:#fff
  classDef targetNode fill:#7c6fcd,stroke:#5a4ab5,color:#fff
  classDef errorNode fill:#e8705a,stroke:#c4503e,color:#fff

  class PE_PRE,PE_COND,PE_POST,TE_PRE requestNode
  class TE_POST_R,PE_POST_R,PE_PRE_R,PC_FLOW responseNode
  class BACKEND targetNode
  class FAULT,DEFAULT errorNode`;

export const goServicesIntegrationDiagram = `graph TB
  subgraph Apigee["Apigee API Gateway"]
    P1["reseller-service-proxy<br/>POST /v1/subscriptions/*<br/>━━━━━━━━━━━━━━<br/>OAuthV2 + SpikeArrest<br/>Quota: 10K/day"]
    P2["order-api-proxy<br/>GET /v1/orders/*<br/>━━━━━━━━━━━━━━<br/>VerifyAPIKey<br/>ResponseCache: 5min"]
    P3["household-api-proxy<br/>GET /v1/households/*<br/>━━━━━━━━━━━━━━<br/>OAuthV2<br/>ResponseCache: 30min"]
    P4["configurator-proxy<br/>GET /v1/products/*<br/>━━━━━━━━━━━━━━<br/>VerifyAPIKey<br/>ResponseCache: 24h"]
    P5["aggregator-proxy<br/>GET /v1/subscriptions<br/>━━━━━━━━━━━━━━<br/>OAuthV2<br/>ResponseCache: 1min"]
  end

  subgraph Services["Go Microservices (EKS)"]
    S1["reseller-service<br/>:8080<br/>Core write orchestrator"]
    S2["order-api<br/>:8080<br/>Order management"]
    S3["household-api<br/>:8080<br/>CPM account lookup"]
    S4["subscription-configurator-api<br/>:8080<br/>Product catalog"]
    S5["subscriptions-aggregator-api<br/>:8080<br/>Read model (CQRS)"]
  end

  subgraph Merchants["Merchant Adapters"]
    M1["merchant-api-netflix"]
    M2["merchant-api-disney"]
    M3["merchant-api-bango"]
    M4["merchant-api-bellmedia"]
    M5["merchant-api-radiocanada"]
  end

  P1 --> S1
  P2 --> S2
  P3 --> S3
  P4 --> S4
  P5 --> S5
  S1 --> M1 & M2 & M3 & M4 & M5

  classDef proxyNode fill:#4285f4,stroke:#1a73e8,color:#fff
  classDef serviceNode fill:#7c6fcd,stroke:#5a4ab5,color:#fff
  classDef merchantNode fill:#3eb89a,stroke:#2d9a7e,color:#fff

  class P1,P2,P3,P4,P5 proxyNode
  class S1,S2,S3,S4,S5 serviceNode
  class M1,M2,M3,M4,M5 merchantNode`;
