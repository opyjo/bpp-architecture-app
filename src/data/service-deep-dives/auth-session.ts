import type { ServiceDeepDive } from "./types";

export const authApi: ServiceDeepDive = {
  id: "auth",
  name: "auth-api",
  displayName: "Auth API",
  status: "active",
  accentColor: "coral",

  business: {
    purpose: "OAuth2 token issuance service for the subscription management platform. Integrates with AWS Cognito for production and Auth0 for development/DIT environments. Issues scoped access tokens used by the BFF to authenticate with downstream Go services.",
    domainContext: "auth-api is the entry point for all authenticated flows. The BFF calls auth-api to obtain client_credentials tokens with specific scopes (subscription-manager/query, subscriptions-aggregator-api/read). Supports SAML SSO for customers via BoxyHQ and agent authentication via SAML agent audience.",
    flows: [
      { flowNum: "1", title: "Login & Auth", role: "Issues OAuth2 tokens after customer/agent authentication via SAML SSO or Auth0" },
    ],
    stakeholders: [
      "Next.js BFF (primary consumer — requests OAuth2 tokens)",
      "All downstream services (validate tokens issued by auth-api)",
      "Customer portal (dit02-auth.bell.ca)",
      "Agent portal (SAML agent audience)",
    ],
    consumers: [
      "Next.js BFF → auth-api (OAuth2 client_credentials grant)",
    ],
    businessRules: [
      {
        rule: "Scope-based access control",
        description: "Tokens are issued with specific scopes: subscription-manager/query for mutations, subscriptions-aggregator-api/read for read operations. Services validate scopes before processing requests.",
        severity: "critical",
      },
      {
        rule: "Environment-specific IdP",
        description: "Production uses AWS Cognito with SAML SSO (BoxyHQ). DIT/development uses Auth0 for simplified testing. The token format is identical regardless of IdP.",
        severity: "important",
      },
      {
        rule: "Token expiration",
        description: "Access tokens expire after 1 hour. The BFF caches tokens and refreshes proactively before expiry to avoid request failures.",
        severity: "important",
      },
      {
        rule: "Server-side only",
        description: "OAuth2 tokens are never sent to the browser. The BFF holds tokens in memory and attaches them as Bearer headers to outbound service calls.",
        severity: "critical",
      },
    ],
    sla: {
      availability: "99.99%",
      latencyP99: "< 100ms (cached), < 500ms (Cognito round-trip)",
      notes: "Auth failures block all downstream flows. Token caching in the BFF reduces the number of actual auth-api calls.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Auth", name: "AWS Cognito", color: "amber" },
      { category: "Auth (dev)", name: "Auth0", color: "purple" },
      { category: "SSO", name: "BoxyHQ SAML", color: "blue" },
      { category: "API", name: "REST", color: "blue" },
    ],
    endpoints: [
      {
        method: "POST",
        path: "/oauth2/token",
        description: "OAuth2 client_credentials grant — returns scoped access token",
        request: `{
  "grant_type": "client_credentials",
  "client_id": "string",
  "client_secret": "string",
  "scope": "subscription-manager/query subscriptions-aggregator-api/read"
}`,
        response: `{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "subscription-manager/query subscriptions-aggregator-api/read"
}`,
      },
      {
        method: "GET",
        path: "/oauth2/userinfo",
        description: "Returns user info from the access token — used for audit trail context",
        response: `{
  "sub": "user-uuid",
  "email": "user@bell.ca",
  "groups": ["customer"],
  "accountNumber": "BAN123"
}`,
      },
      {
        method: "GET",
        path: "/.well-known/jwks.json",
        description: "JSON Web Key Set — downstream services use this to validate token signatures",
      },
    ],
    dataModel: [],
    dependencies: [
      { service: "Next.js BFF", direction: "upstream", protocol: "REST", description: "BFF requests OAuth2 tokens for downstream service calls" },
      { service: "AWS Cognito", direction: "downstream", protocol: "OAuth2", description: "Production identity provider — validates credentials, issues tokens" },
      { service: "Auth0", direction: "downstream", protocol: "OAuth2", description: "Development/DIT identity provider" },
    ],
    kafkaEvents: [],
    errorPatterns: [
      { scenario: "Invalid credentials", handling: "Returns 401 Unauthorized", retry: "None — client error" },
      { scenario: "Cognito unavailable", handling: "Returns 503 — blocks all authenticated flows", retry: "BFF retries with exponential backoff (100ms, 200ms, 400ms)" },
      { scenario: "Invalid scope requested", handling: "Returns 400 — scope must be one of the predefined values", retry: "None — client error" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 3 replicas in production (critical path)" },
      { aspect: "Auth provider", description: "AWS Cognito User Pool — multi-AZ, managed by AWS" },
      { aspect: "Observability", description: "Structured JSON logging, token issuance rate metrics, auth failure alerts" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [
      {
        title: "Token issuance with Cognito",
        description: "Client credentials grant via AWS Cognito SDK",
        code: `func (s *AuthService) IssueToken(ctx context.Context, req TokenRequest) (*TokenResponse, error) {
    input := &cognitoidentityprovider.InitiateAuthInput{
        AuthFlow: aws.String("CLIENT_CREDENTIALS"),
        ClientId: aws.String(req.ClientID),
        AuthParameters: map[string]*string{
            "SECRET_HASH": aws.String(computeSecretHash(req.ClientID, req.ClientSecret)),
        },
    }

    result, err := s.cognito.InitiateAuth(ctx, input)
    if err != nil {
        return nil, fmt.Errorf("cognito auth: %w", err)
    }

    return &TokenResponse{
        AccessToken: *result.AuthenticationResult.AccessToken,
        ExpiresIn:   int(*result.AuthenticationResult.ExpiresIn),
        TokenType:   "Bearer",
        Scope:       req.Scope,
    }, nil
}`,
        language: "go",
      },
    ],
  },
};

export const sessionApi: ServiceDeepDive = {
  id: "session",
  name: "session-api",
  displayName: "Session API",
  status: "active",
  accentColor: "coral",

  business: {
    purpose: "Manages session lifecycle for the subscription management platform. Sessions are stored in DynamoDB with TTL-based expiration. Supports two creation modes: generateSession for customers (creates new session from account data) and cloneSession for agents (clones an existing customer session and links agent ID).",
    domainContext: "Every subscription flow begins with a session. The session tracks the customer's account context, selected plans, and flow state. Agent flows use cloneSession to link the agent's actions to an existing order in the audit trail. Sessions are consumed on order submission — preventing replay attacks.",
    flows: [
      { flowNum: "3", title: "Start Session", role: "generateSession creates a new session from customerInfo + BAN; stores in DynamoDB" },
      { flowNum: "8", title: "Agent-Assisted", role: "cloneSession clones existing session and links agent ID to audit trail" },
      { flowNum: "9", title: "Plan Change", role: "Tracks session context during plan change operations" },
      { flowNum: "13", title: "Undo / Reversal", role: "Provides session context for reversal — references original session" },
    ],
    stakeholders: [
      "Subscription Management UI (via AppSync — generateSession)",
      "Agent Portal (via AppSync — cloneSession)",
      "reseller-service (validates session before order submission)",
      "audit-api (session context included in audit log entries)",
    ],
    consumers: [
      "AppSync → session-api (GraphQL resolvers for session mutations)",
      "reseller-service (session validation during order submission)",
    ],
    businessRules: [
      {
        rule: "Session TTL",
        description: "Sessions expire after 30 minutes of inactivity. DynamoDB TTL handles automatic cleanup. Expired sessions return 404.",
        severity: "critical",
      },
      {
        rule: "Session consumption",
        description: "Sessions are marked as consumed after order submission. A consumed session cannot be reused — prevents duplicate orders.",
        severity: "critical",
      },
      {
        rule: "Clone vs generate",
        description: "Customers use generateSession (creates fresh session from account data + CPM validation). Agents use cloneSession (copies existing session + links agent ID).",
        severity: "important",
      },
      {
        rule: "CPM validation on create",
        description: "generateSession calls household-api to validate the account exists in CPM before creating the session. Invalid accounts are rejected.",
        severity: "important",
      },
    ],
    sla: {
      availability: "99.95%",
      latencyP99: "< 100ms (read), < 300ms (create with CPM validation)",
      notes: "Session reads are fast (DynamoDB single-key lookup). Session creation includes a CPM validation call via household-api.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Database", name: "DynamoDB", color: "amber" },
      { category: "Gateway", name: "AppSync (GraphQL)", color: "blue" },
      { category: "API", name: "GraphQL resolver", color: "purple" },
    ],
    endpoints: [
      {
        method: "POST",
        path: "/query (GraphQL)",
        description: "generateSession — creates new session from customer info",
        request: `mutation {
  generateSession(input: {
    customerInfo: { accountNumber: "BAN123", tvAccountNumber: "TV456" }
    householdAccountNumber: "HH789"
  }) {
    sessionId
    expiresAt
  }
}`,
        response: `{
  "data": {
    "generateSession": {
      "sessionId": "sess_abc123",
      "expiresAt": "2024-01-15T15:30:00Z"
    }
  }
}`,
      },
      {
        method: "POST",
        path: "/query (GraphQL)",
        description: "cloneSession — clones existing session for agent flow",
        request: `mutation {
  cloneSession(input: {
    orderNumber: "ORD-12345"
    agentId: "agent_007"
  }) {
    sessionId
    originalSessionId
    expiresAt
  }
}`,
      },
    ],
    dataModel: [
      {
        entity: "sessions (DynamoDB)",
        description: "Session records with TTL-based expiration",
        fields: [
          { name: "PK", type: "STRING", note: "SESSION#<sessionId>" },
          { name: "SK", type: "STRING", note: "SESSION#<sessionId>" },
          { name: "sessionId", type: "STRING", note: "Unique session identifier" },
          { name: "accountNumber", type: "STRING", note: "Customer BAN" },
          { name: "tvAccountNumber", type: "STRING", note: "TV account" },
          { name: "agentId", type: "STRING", note: "NULL for customer sessions; agent ID for cloned sessions" },
          { name: "originalSessionId", type: "STRING", note: "NULL for customer sessions; references original for agent clones" },
          { name: "consumed", type: "BOOLEAN", note: "True after order submission — prevents reuse" },
          { name: "flowState", type: "MAP", note: "Current flow step and selected plans" },
          { name: "ttl", type: "NUMBER", note: "Unix timestamp — auto-deleted by DynamoDB TTL" },
          { name: "createdAt", type: "STRING", note: "ISO-8601" },
        ],
      },
    ],
    dependencies: [
      { service: "AppSync", direction: "upstream", protocol: "GraphQL", description: "Session mutations via AppSync resolvers" },
      { service: "household-api", direction: "downstream", protocol: "GraphQL", description: "CPM validation during generateSession" },
      { service: "DynamoDB", direction: "downstream", protocol: "AWS SDK", description: "Primary data store for sessions with TTL" },
    ],
    kafkaEvents: [],
    errorPatterns: [
      { scenario: "Session not found / expired", handling: "Returns 404 — session either never existed or TTL expired", retry: "None — caller must create a new session" },
      { scenario: "Session already consumed", handling: "Returns 409 Conflict — session has been used for an order", retry: "None — caller must create a new session" },
      { scenario: "CPM validation failure", handling: "Returns 400 — account not found in CPM", retry: "None — invalid account" },
      { scenario: "DynamoDB throttling", handling: "Returns 503, auto-retries with exponential backoff", retry: "SDK auto-retry (3 attempts)" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas in production" },
      { aspect: "Database", description: "Amazon DynamoDB — on-demand capacity, automatic TTL cleanup" },
      { aspect: "Observability", description: "Structured JSON logging, session creation/consumption rates, TTL expiration metrics" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [
      {
        title: "Session creation with DynamoDB TTL",
        description: "Creates a session with automatic TTL-based expiration",
        code: `func (r *SessionRepo) Create(ctx context.Context, session *Session) error {
    ttl := time.Now().Add(30 * time.Minute).Unix()

    item, err := attributevalue.MarshalMap(map[string]interface{}{
        "PK":               "SESSION#" + session.ID,
        "SK":               "SESSION#" + session.ID,
        "sessionId":        session.ID,
        "accountNumber":    session.AccountNumber,
        "tvAccountNumber":  session.TVAccountNumber,
        "consumed":         false,
        "flowState":        session.FlowState,
        "ttl":              ttl,
        "createdAt":        time.Now().UTC().Format(time.RFC3339),
    })
    if err != nil {
        return fmt.Errorf("marshal session: %w", err)
    }

    _, err = r.client.PutItem(ctx, &dynamodb.PutItemInput{
        TableName: aws.String(r.table),
        Item:      item,
    })
    return err
}`,
        language: "go",
      },
    ],
  },
};

export const tokenApi: ServiceDeepDive = {
  id: "token",
  name: "token-api",
  displayName: "Token API",
  status: "active",
  accentColor: "teal",

  business: {
    purpose:
      "Securely tokenizes sensitive JSON payloads in Redis with a 24-hour TTL. Used mid-flow to pass data between flow steps without exposing it in the URL or client-side state. The /review screen uses token-api to hydrate previously submitted data.",
    domainContext:
      "During subscription flows, sensitive data (account details, pricing, plan selections) needs to be passed between steps. Rather than encoding this data in URLs or storing it in browser state (where it could be tampered with), token-api provides a server-side token that the BFF can exchange for the original payload.",
    flows: [
      { flowNum: "5–6", title: "Place Order → Activate", role: "Tokenizes order details between submission and activation steps" },
      { flowNum: "Review screen", title: "Review Page Hydration", role: "BFF stores review data as a token; /review page fetches it back via the token" },
    ],
    stakeholders: [
      "Next.js BFF (primary consumer — stores and retrieves tokens)",
      "Subscription Management UI (uses token IDs in navigation between flow steps)",
    ],
    consumers: [
      "Next.js BFF → token-api (direct REST — does not go through AppSync)",
    ],
    businessRules: [
      {
        rule: "24-hour TTL",
        description: "All tokens expire after 24 hours. This ensures sensitive data is not stored indefinitely. Expired tokens return 404.",
        severity: "critical",
      },
      {
        rule: "Single-use optional",
        description: "Tokens can be read multiple times within their TTL. The /review page may re-fetch the same token if the user navigates back.",
        severity: "standard",
      },
      {
        rule: "Server-side only",
        description: "Token payloads are never sent to the browser. The BFF stores and retrieves them; the UI only sees the token ID.",
        severity: "critical",
      },
      {
        rule: "JSON-only payloads",
        description: "Only JSON payloads are accepted. Binary data is not supported. Max payload size: 1MB.",
        severity: "standard",
      },
    ],
    sla: {
      availability: "99.99%",
      latencyP99: "< 15ms (read), < 25ms (write)",
      notes: "Extremely low latency due to Redis-only storage. No database writes. Availability is tied to Redis cluster health.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Storage", name: "Redis", color: "coral" },
      { category: "API", name: "REST", color: "blue" },
    ],
    endpoints: [
      {
        method: "PUT",
        path: "/tokens",
        description: "Store a JSON payload and receive a token ID",
        request: `{
  "payload": {
    "sessionId": "string",
    "selectedPlan": { ... },
    "accountInfo": { ... }
  },
  "ttl": 86400
}`,
        response: `{
  "tokenId": "tok_a1b2c3d4e5f6",
  "expiresAt": "ISO-8601"
}`,
      },
      {
        method: "GET",
        path: "/tokens/:id",
        description: "Retrieve the JSON payload for a token ID",
        response: `{
  "tokenId": "tok_a1b2c3d4e5f6",
  "payload": {
    "sessionId": "string",
    "selectedPlan": { ... },
    "accountInfo": { ... }
  },
  "expiresAt": "ISO-8601"
}`,
      },
    ],
    dataModel: [
      {
        entity: "tokens (Redis keys)",
        description: "Key-value store with JSON payloads and TTL-based expiration",
        fields: [
          { name: "key", type: "STRING", note: "token:<tokenId> — prefixed for namespace isolation" },
          { name: "value", type: "JSON", note: "Serialized JSON payload (max 1MB)" },
          { name: "ttl", type: "INT", note: "24 hours (86400 seconds) default" },
        ],
      },
    ],
    dependencies: [
      { service: "Next.js BFF", direction: "upstream", protocol: "REST", description: "BFF stores and retrieves tokens — does not go through AppSync" },
      { service: "Redis", direction: "downstream", protocol: "Redis protocol", description: "Primary and only data store — SET/GET with TTL" },
    ],
    kafkaEvents: [],
    errorPatterns: [
      { scenario: "Token not found / expired", handling: "Returns 404 — token either never existed or TTL expired", retry: "None — caller should re-create the token" },
      { scenario: "Payload too large", handling: "Returns 413 — max 1MB payload", retry: "None — client error" },
      { scenario: "Redis unavailable", handling: "Returns 503 — all operations fail", retry: "BFF retries with short backoff (100ms, 200ms, 400ms)" },
      { scenario: "Invalid JSON payload", handling: "Returns 400 — payload must be valid JSON", retry: "None — client error" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas in production" },
      { aspect: "Storage", description: "Amazon ElastiCache Redis — cluster mode with automatic failover" },
      { aspect: "Networking", description: "Internal cluster DNS — only reachable from BFF. Not exposed via AppSync" },
      { aspect: "Observability", description: "Structured JSON logging, Redis memory usage alerts, TTL expiration metrics" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [
      {
        title: "Token store and retrieve",
        description: "Simple SET/GET with TTL — the core of token-api",
        code: `func (s *TokenService) Store(ctx context.Context, payload json.RawMessage) (string, error) {
    tokenID := "tok_" + generateID()
    key := "token:" + tokenID

    data, err := json.Marshal(tokenEntry{
        Payload:   payload,
        CreatedAt: time.Now().UTC(),
    })
    if err != nil {
        return "", fmt.Errorf("marshal: %w", err)
    }

    if err := s.redis.Set(ctx, key, data, 24*time.Hour).Err(); err != nil {
        return "", fmt.Errorf("redis set: %w", err)
    }

    return tokenID, nil
}

func (s *TokenService) Retrieve(ctx context.Context, tokenID string) (json.RawMessage, error) {
    key := "token:" + tokenID

    data, err := s.redis.Get(ctx, key).Bytes()
    if errors.Is(err, redis.Nil) {
        return nil, ErrTokenNotFound
    }
    if err != nil {
        return nil, fmt.Errorf("redis get: %w", err)
    }

    var entry tokenEntry
    if err := json.Unmarshal(data, &entry); err != nil {
        return nil, fmt.Errorf("unmarshal: %w", err)
    }

    return entry.Payload, nil
}`,
        language: "go",
      },
    ],
  },
};

export const disneyAuthApi: ServiceDeepDive = {
  id: "disney-auth",
  name: "disney-auth-api",
  displayName: "Disney Auth API",
  status: "active",
  accentColor: "coral",

  business: {
    purpose: "Disney-specific authentication integration service. Issues Disney OAuth2 tokens required by merchant-api-disney for provisioning operations. Translates internal Bell authentication context into Disney's expected token format.",
    domainContext: "merchant-api-disney cannot use standard Bell auth tokens to call Disney's API. disney-auth-api bridges this gap by obtaining Disney-specific OAuth2 tokens using pre-registered client credentials with Disney's identity platform.",
    flows: [],
    stakeholders: [
      "merchant-api-disney (primary consumer — requests Disney auth tokens)",
    ],
    consumers: [
      "merchant-api-disney → disney-auth-api (REST — token exchange)",
    ],
    businessRules: [
      {
        rule: "Token caching",
        description: "Disney tokens are cached in-memory with TTL slightly shorter than the token's actual expiry to prevent using expired tokens.",
        severity: "important",
      },
      {
        rule: "Credential rotation",
        description: "Disney client credentials are stored in AWS Secrets Manager and rotated quarterly via secret-rotator-lambda.",
        severity: "critical",
      },
    ],
    sla: {
      availability: "99.95%",
      latencyP99: "< 200ms (cached), < 800ms (Disney round-trip)",
      notes: "Availability tied to Disney's OAuth2 endpoint. Token caching minimizes external calls.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "API", name: "REST", color: "blue" },
      { category: "Auth", name: "Disney OAuth2", color: "purple" },
    ],
    endpoints: [
      { method: "POST", path: "/disney/token", description: "Exchange internal credentials for Disney OAuth2 token" },
      { method: "GET", path: "/health", description: "Health check — verifies Disney OAuth2 endpoint connectivity" },
    ],
    dataModel: [],
    dependencies: [
      { service: "merchant-api-disney", direction: "upstream", protocol: "REST", description: "Requests Disney auth tokens for provisioning" },
      { service: "Disney OAuth2", direction: "downstream", protocol: "OAuth2", description: "External Disney identity platform" },
      { service: "AWS Secrets Manager", direction: "downstream", protocol: "AWS SDK", description: "Disney client credentials storage" },
    ],
    kafkaEvents: [],
    errorPatterns: [
      { scenario: "Disney OAuth2 unavailable", handling: "Returns 503 — blocks Disney provisioning", retry: "merchant-api-disney retries via circuit breaker" },
      { scenario: "Invalid credentials", handling: "Returns 401 — triggers alert for credential rotation check", retry: "None — requires manual credential update" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas in production" },
      { aspect: "Secrets", description: "AWS Secrets Manager — Disney client credentials" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [],
  },
};

export const authSessionServices: ServiceDeepDive[] = [authApi, sessionApi, tokenApi, disneyAuthApi];
