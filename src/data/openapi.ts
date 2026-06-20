// ─── OpenAPI 3.0 Data ─────────────────────────────────────────────────────────
// Senior BSA Interview Prep: OpenAPI 3.0 Specification & Production API Design
// Grounded in Bell Canada Subscription Management Platform (go-repo + subscription-manager MFE)

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OpenApiConceptQA {
  num: number;
  question: string;
  answer: string;
  yamlSnippet?: string;
}

export interface OpenApiDataType {
  type: string;
  format?: string;
  description: string;
  example: string;
}

export interface OpenApiSecurityScheme {
  name: string;
  type: string;
  description: string;
  productionUseCase: string;
  yamlSnippet: string;
}

export interface OpenApiEndpoint {
  service: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  summary: string;
  requestBody?: string;
  responseSchema: string;
  authScheme: string;
}

export interface OpenApiComparison {
  dimension: string;
  openapi30: string;
  openapi20: string;
  graphql: string;
  grpc: string;
}

export interface OpenApiBestPractice {
  category: string;
  title: string;
  description: string;
  yamlSnippet?: string;
}

export interface OpenApiTool {
  name: string;
  category: "Documentation" | "Code Generation" | "Validation" | "Testing" | "Design";
  description: string;
  url: string;
}

export interface OpenApiBsaQuestion {
  num: number;
  question: string;
  answer: string;
}

// ─── Overview ───────────────────────────────────────────────────────────────

export const openapiOverview = {
  what: "OpenAPI 3.0 (formerly Swagger) is the industry-standard specification for describing RESTful APIs. It provides a language-agnostic, machine-readable definition of your API's endpoints, request/response schemas, authentication methods, and more. OpenAPI specs drive automated documentation (Swagger UI, Redoc), client/server code generation, contract testing, and API gateway configuration.",
  benefits: [
    "Single source of truth — one YAML/JSON file describes the entire API contract, eliminating docs drift",
    "Code generation — auto-generate TypeScript clients, Go server stubs, and SDK libraries from the spec",
    "Interactive documentation — Swagger UI and Redoc render live, try-it-out documentation from the spec",
    "Contract testing — validate requests/responses against the spec in CI/CD pipelines",
    "Gateway integration — Apigee, Kong, and AWS API Gateway can import OpenAPI specs directly",
    "Design-first workflow — teams agree on the API contract before writing code, reducing rework",
  ],
  versionHistory: [
    { version: "Swagger 1.x", year: "2011", milestone: "Original Swagger spec by Tony Tam at Wordnik" },
    { version: "Swagger 2.0", year: "2014", milestone: "Formalized spec, adopted by SmartBear, widespread tooling" },
    { version: "OpenAPI 3.0", year: "2017", milestone: "Rebranded under Linux Foundation, major structural changes: components, links, callbacks" },
    { version: "OpenAPI 3.1", year: "2021", milestone: "Full JSON Schema compatibility, webhooks as top-level concept" },
  ],
};

// ─── Spec Structure ─────────────────────────────────────────────────────────

export const openapiSpecStructure = {
  description: "An OpenAPI 3.0 document has a well-defined top-level structure. Each field serves a specific purpose in describing your API.",
  fields: [
    { field: "openapi", required: true, description: "Spec version string (e.g. '3.0.3'). Tells parsers which schema to validate against." },
    { field: "info", required: true, description: "API metadata: title, version, description, contact, license, terms of service." },
    { field: "servers", required: false, description: "Array of server URLs with variables. Replaces Swagger 2.0's host + basePath + schemes." },
    { field: "paths", required: true, description: "Core of the spec — maps URL paths to operations (GET, POST, etc.) with parameters, request bodies, and responses." },
    { field: "components", required: false, description: "Reusable definitions: schemas, responses, parameters, request bodies, headers, security schemes, links, callbacks." },
    { field: "security", required: false, description: "Global security requirements applied to all operations (can be overridden per-operation)." },
    { field: "tags", required: false, description: "Logical grouping of operations for documentation organization (e.g. 'Subscriptions', 'Orders')." },
    { field: "externalDocs", required: false, description: "Link to external documentation (e.g. Confluence wiki, architecture diagrams)." },
  ],
  yamlSnippet: `openapi: "3.0.3"
info:
  title: Bell Subscription Management API
  version: "2.1.0"
  description: REST API for managing telecom subscriptions
  contact:
    name: Platform Team
    email: platform@bell.ca
servers:
  - url: https://api.bell.ca/v2
    description: Production
  - url: https://api-staging.bell.ca/v2
    description: Staging
paths:
  /subscriptions:
    get:
      summary: List subscriptions
      tags: [Subscriptions]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: OK
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
tags:
  - name: Subscriptions
    description: Subscription lifecycle management`,
};

// ─── Core Concept Q&A ───────────────────────────────────────────────────────

export const openapiConceptQA: OpenApiConceptQA[] = [
  {
    num: 1,
    question: "What is a Path Item and how do operations map to HTTP methods?",
    answer: `A Path Item is an entry under the "paths" object keyed by the URL path (e.g. /subscriptions/{id}). Each path item can contain operations mapped to HTTP methods: get, post, put, patch, delete, options, head, trace.

Each operation defines:
• operationId — unique identifier used in code generation (e.g. getSubscriptionById)
• summary/description — human-readable documentation
• parameters — path, query, header, or cookie parameters
• requestBody — for POST/PUT/PATCH operations
• responses — map of HTTP status codes to response definitions
• security — operation-level auth override
• tags — grouping for documentation

At Bell Canada, each Go microservice endpoint maps to a path item. The reseller-service's POST /subscriptions becomes the "createSubscription" operation.`,
    yamlSnippet: `paths:
  /subscriptions/{id}:
    get:
      operationId: getSubscriptionById
      summary: Get a subscription by ID
      tags: [Subscriptions]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Subscription found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Subscription'
        '404':
          description: Subscription not found`,
  },
  {
    num: 2,
    question: "How do Parameters work in OpenAPI 3.0?",
    answer: `Parameters describe variable parts of the request. OpenAPI 3.0 supports four locations (the "in" field):

1. path — embedded in the URL path (e.g. /subscriptions/{id}). Always required.
2. query — appended after ? (e.g. ?status=active&page=2). Common for filtering, sorting, pagination.
3. header — sent as HTTP headers (e.g. X-Request-ID, X-Correlation-ID).
4. cookie — sent as cookie values.

Key properties:
• name — parameter name (must match the path template for path params)
• required — true/false (path params are always required)
• schema — data type definition (type, format, enum, default, etc.)
• style/explode — serialization style for arrays and objects
• deprecated — marks parameter as deprecated

At Bell Canada, the aggregator-api uses query params for filtering: ?householdId=xxx&status=active. The BFF injects correlation headers (X-Correlation-ID) for distributed tracing.`,
    yamlSnippet: `parameters:
  - name: status
    in: query
    description: Filter by subscription status
    required: false
    schema:
      type: string
      enum: [active, suspended, cancelled, pending]
      default: active
  - name: X-Correlation-ID
    in: header
    required: false
    schema:
      type: string
      format: uuid`,
  },
  {
    num: 3,
    question: "What is the difference between requestBody and parameters?",
    answer: `In OpenAPI 3.0, requestBody and parameters are separate concepts (unlike Swagger 2.0 where body was a parameter type):

requestBody:
• Used for POST, PUT, PATCH operations
• Supports multiple content types (application/json, multipart/form-data, etc.)
• Has its own required field
• Can reference $ref schemas from components
• Supports examples and encoding details

parameters:
• Used for path, query, header, and cookie values
• Simpler schema (no content type negotiation)
• Can be defined at the path level (shared across operations) or operation level

This separation was a major improvement in 3.0 — it allows the same operation to accept JSON or form data, each with different schemas. At Bell Canada, subscription mutations accept JSON request bodies while file uploads (e.g. bulk imports) use multipart/form-data.`,
    yamlSnippet: `post:
  operationId: createSubscription
  requestBody:
    required: true
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/CreateSubscriptionRequest'
        example:
          householdId: "hh-12345"
          planId: "plan-premium-100"
          startDate: "2024-01-15"
      multipart/form-data:
        schema:
          type: object
          properties:
            file:
              type: string
              format: binary
            metadata:
              type: string`,
  },
  {
    num: 4,
    question: "How do Response objects and status codes work?",
    answer: `The responses object maps HTTP status codes to response definitions. Each response includes:

• description (required) — human-readable explanation
• content — media type to schema mapping (application/json, text/csv, etc.)
• headers — response headers (e.g. X-RateLimit-Remaining, Location)
• links — follow-up operations (HATEOAS-style)

Status code patterns:
• Use specific codes: 200, 201, 204, 400, 401, 403, 404, 409, 422, 500
• "default" — catch-all for undocumented status codes
• Wildcard ranges (2XX, 4XX, 5XX) — for grouped handling

Best practices:
• Always document 200/201 (success), 400 (validation), 401 (auth), 404, and 500
• Use $ref to reuse error response schemas across operations
• Include examples for each response

At Bell Canada, all Go services return a standardized error envelope: { code, message, details[] } — this is defined once in components/schemas/ErrorResponse and referenced everywhere.`,
    yamlSnippet: `responses:
  '201':
    description: Subscription created successfully
    headers:
      Location:
        schema:
          type: string
        description: URL of the created resource
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Subscription'
  '400':
    description: Validation error
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
  '401':
    description: Authentication required
  '409':
    description: Subscription already exists for this household`,
  },
  {
    num: 5,
    question: "What are Schemas and how does $ref work for reusability?",
    answer: `Schemas define the structure of request/response bodies using JSON Schema (draft-07 subset in 3.0). They describe:

• type — string, number, integer, boolean, array, object
• properties — nested object fields with their own schemas
• required — list of required property names
• format — semantic format (date-time, email, uuid, uri, etc.)
• enum — allowed values
• pattern — regex validation
• minLength/maxLength, minimum/maximum — constraints

$ref (JSON Reference) enables reusability:
• Define schemas once in components/schemas
• Reference them anywhere: $ref: '#/components/schemas/Subscription'
• Works for schemas, parameters, responses, request bodies, headers, security schemes
• Supports external files: $ref: './models/subscription.yaml'

At Bell Canada, common schemas (Subscription, Household, Order, ErrorResponse, PaginatedResponse) are defined in components and referenced across 20+ operations. This ensures consistency and reduces spec size by ~60%.`,
    yamlSnippet: `components:
  schemas:
    Subscription:
      type: object
      required: [id, householdId, status, planId]
      properties:
        id:
          type: string
          format: uuid
        householdId:
          type: string
          format: uuid
        status:
          type: string
          enum: [active, suspended, cancelled, pending]
        planId:
          type: string
        startDate:
          type: string
          format: date
        endDate:
          type: string
          format: date
          nullable: true
        metadata:
          type: object
          additionalProperties:
            type: string

    PaginatedResponse:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/Subscription'
        pagination:
          $ref: '#/components/schemas/PaginationMeta'`,
  },
  {
    num: 6,
    question: "How do Components work as a reusable definition library?",
    answer: `The components object is a container for reusable definitions. It has these subsections:

• schemas — data models (JSON Schema objects)
• responses — reusable response objects (e.g. 401 Unauthorized, 500 Internal)
• parameters — shared parameters (e.g. pagination: page, limit)
• requestBodies — shared request body definitions
• headers — reusable response headers (e.g. rate limit headers)
• securitySchemes — authentication method definitions
• links — HATEOAS link definitions for response follow-ups
• callbacks — webhook/callback URL definitions

Key rules:
• Components are NOT applied automatically — they must be $ref'd from paths
• Names must be valid identifiers (letters, digits, underscores, hyphens)
• Components can $ref other components (nested references)

At Bell Canada, the API spec has ~15 shared schemas, 3 reusable error responses, a common pagination parameter set, and 2 security schemes (JWT + API Key). This makes the spec DRY and maintainable.`,
  },
  {
    num: 7,
    question: "What are Callbacks and how are they defined?",
    answer: `Callbacks define webhook-style notifications that your API sends to client-specified URLs when events occur. They are asynchronous, server-initiated requests.

Structure:
• Defined under an operation or in components/callbacks
• Use runtime expressions to reference request data: {$request.body#/callbackUrl}
• Each callback contains path items with operations (just like regular paths)

Use cases:
• Subscription status change notifications
• Order completion webhooks
• Payment processing results
• Async job completion alerts

At Bell Canada, when a subscription status changes (active → suspended), the system could notify partner systems via a callback URL provided during subscription creation. The callback POST delivers a SubscriptionEvent payload to the partner's webhook endpoint.`,
    yamlSnippet: `paths:
  /subscriptions:
    post:
      operationId: createSubscription
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                callbackUrl:
                  type: string
                  format: uri
                planId:
                  type: string
      callbacks:
        onStatusChange:
          '{$request.body#/callbackUrl}':
            post:
              summary: Subscription status changed
              requestBody:
                content:
                  application/json:
                    schema:
                      $ref: '#/components/schemas/SubscriptionEvent'
              responses:
                '200':
                  description: Callback acknowledged`,
  },
  {
    num: 8,
    question: "How does content negotiation work with multiple media types?",
    answer: `OpenAPI 3.0 supports content negotiation through the "content" field in request bodies and responses. Each media type maps to a Media Type Object with its own schema, examples, and encoding.

Common patterns:
• application/json — standard JSON API responses
• application/xml — legacy system integration
• multipart/form-data — file uploads with metadata
• application/octet-stream — binary file downloads
• text/csv — bulk export data
• application/pdf — document generation

The client uses Accept header to request a specific format; the server uses Content-Type to indicate the response format.

At Bell Canada, the aggregator-api primarily serves application/json, but bulk subscription exports return text/csv. The subscription-configurator-api accepts both JSON and CSV for bulk product catalog imports.`,
    yamlSnippet: `responses:
  '200':
    description: Subscription data
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Subscription'
        example:
          id: "sub-123"
          status: "active"
      text/csv:
        schema:
          type: string
        example: |
          id,status,planId,startDate
          sub-123,active,plan-100,2024-01-15`,
  },
  {
    num: 9,
    question: "What is the discriminator and when should you use it?",
    answer: `The discriminator is used with polymorphic schemas (oneOf, anyOf) to indicate which sub-schema applies based on a property value. It helps parsers, code generators, and documentation tools disambiguate between schema variants.

Structure:
• propertyName — the field used to determine the type (e.g. "type", "kind")
• mapping (optional) — explicit mapping from property values to schema $refs

When to use:
• API returns different object shapes based on a type field
• Event-driven systems with multiple event types sharing a base schema
• Product catalogs with variant-specific fields

At Bell Canada, subscription events have different payloads based on eventType: "created", "statusChanged", "cancelled". A discriminator on eventType maps each value to its specific schema.`,
    yamlSnippet: `components:
  schemas:
    SubscriptionEvent:
      oneOf:
        - $ref: '#/components/schemas/SubscriptionCreated'
        - $ref: '#/components/schemas/SubscriptionStatusChanged'
        - $ref: '#/components/schemas/SubscriptionCancelled'
      discriminator:
        propertyName: eventType
        mapping:
          created: '#/components/schemas/SubscriptionCreated'
          statusChanged: '#/components/schemas/SubscriptionStatusChanged'
          cancelled: '#/components/schemas/SubscriptionCancelled'

    SubscriptionCreated:
      type: object
      properties:
        eventType:
          type: string
          enum: [created]
        subscriptionId:
          type: string
        planId:
          type: string`,
  },
  {
    num: 10,
    question: "How do Links work for HATEOAS-style API navigation?",
    answer: `Links define relationships between operations, enabling HATEOAS-style navigation. They describe how values from one response can be used as input to another operation.

Structure:
• operationId — the target operation to call
• parameters — mapping response values to target parameters using runtime expressions
• description — explains the relationship

Runtime expressions:
• $response.body#/id — value from the response body
• $request.path.id — value from the request path
• $url — the full request URL

Links are descriptive (not prescriptive) — they tell clients what operations are available next, but clients decide whether to follow them.

At Bell Canada, after creating a subscription (POST /subscriptions), links point to: getSubscriptionById (view it), getHouseholdSubscriptions (view sibling subscriptions), and cancelSubscription (cancel it).`,
    yamlSnippet: `responses:
  '201':
    description: Subscription created
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Subscription'
    links:
      GetSubscription:
        operationId: getSubscriptionById
        parameters:
          id: '$response.body#/id'
        description: Retrieve the created subscription
      GetHouseholdSubs:
        operationId: getHouseholdSubscriptions
        parameters:
          householdId: '$response.body#/householdId'
        description: List all subscriptions for this household
      CancelSubscription:
        operationId: cancelSubscription
        parameters:
          id: '$response.body#/id'`,
  },
  {
    num: 11,
    question: "What is the servers object and how does it replace Swagger 2.0's host/basePath?",
    answer: `The servers array replaces Swagger 2.0's host, basePath, and schemes fields with a more flexible model:

Key improvements:
• Multiple servers — list dev, staging, production URLs
• Server variables — parameterize URLs with defaults and enums (e.g. region, version)
• Per-path/operation override — different servers for different endpoints
• No protocol restriction — supports https, http, wss, etc.

Server variables use {} syntax in the URL and are defined with default values and optional enum constraints.

At Bell Canada, the API has different base URLs per environment (dev, staging, prod) and uses a region variable for multi-region deployment. The servers array makes this explicit in the spec.`,
    yamlSnippet: `servers:
  - url: https://api.bell.ca/{version}
    description: Production
    variables:
      version:
        default: v2
        enum: [v1, v2]
  - url: https://api-staging.bell.ca/{version}
    description: Staging
    variables:
      version:
        default: v2
  - url: http://localhost:8080/{version}
    description: Local development
    variables:
      version:
        default: v2`,
  },
  {
    num: 12,
    question: "How should you document error responses consistently?",
    answer: `Consistent error responses are critical for API consumers. Best practice is to define a standard error envelope in components and reference it across all operations.

Standard error envelope:
• code — machine-readable error code (e.g. "VALIDATION_ERROR", "NOT_FOUND")
• message — human-readable description
• details — array of specific field-level errors
• traceId — correlation ID for debugging

Status code guidelines:
• 400 — request validation failed (missing fields, wrong types, business rule violations)
• 401 — missing or invalid authentication credentials
• 403 — authenticated but not authorized for this resource
• 404 — resource not found
• 409 — conflict (duplicate, concurrent modification)
• 422 — semantically invalid (valid JSON but logically wrong)
• 429 — rate limit exceeded
• 500 — unexpected server error

At Bell Canada, all Go services use a shared error middleware that produces this envelope. The ErrorResponse schema is $ref'd in every operation's error responses, ensuring consistent client error handling.`,
    yamlSnippet: `components:
  schemas:
    ErrorResponse:
      type: object
      required: [code, message]
      properties:
        code:
          type: string
          example: "VALIDATION_ERROR"
        message:
          type: string
          example: "Request validation failed"
        details:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
              message:
                type: string
        traceId:
          type: string
          format: uuid
  responses:
    BadRequest:
      description: Validation error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    Unauthorized:
      description: Authentication required
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'`,
  },
];

// ─── Data Types ─────────────────────────────────────────────────────────────

export const openapiDataTypes: OpenApiDataType[] = [
  { type: "string", description: "Text values. Supports format, pattern, minLength, maxLength, enum.", example: '"hello world"' },
  { type: "string", format: "date-time", description: "ISO 8601 date-time (RFC 3339).", example: '"2024-01-15T09:30:00Z"' },
  { type: "string", format: "date", description: "ISO 8601 date only.", example: '"2024-01-15"' },
  { type: "string", format: "email", description: "Email address (RFC 5322).", example: '"user@bell.ca"' },
  { type: "string", format: "uuid", description: "RFC 4122 UUID.", example: '"550e8400-e29b-41d4-a716-446655440000"' },
  { type: "string", format: "uri", description: "Full URI (RFC 3986).", example: '"https://api.bell.ca/v2/subscriptions"' },
  { type: "string", format: "binary", description: "Binary file content (used with multipart/form-data).", example: "(file bytes)" },
  { type: "number", description: "Floating-point number. Supports minimum, maximum, multipleOf.", example: "99.99" },
  { type: "number", format: "double", description: "64-bit floating-point (IEEE 754).", example: "3.141592653589793" },
  { type: "number", format: "float", description: "32-bit floating-point.", example: "3.14" },
  { type: "integer", description: "Whole numbers. Supports minimum, maximum, multipleOf.", example: "42" },
  { type: "integer", format: "int32", description: "Signed 32-bit integer.", example: "2147483647" },
  { type: "integer", format: "int64", description: "Signed 64-bit integer.", example: "9223372036854775807" },
  { type: "boolean", description: "True/false value.", example: "true" },
  { type: "array", description: "Ordered list of items. Requires 'items' schema. Supports minItems, maxItems, uniqueItems.", example: '["a", "b", "c"]' },
  { type: "object", description: "Key-value structure. Supports properties, required, additionalProperties.", example: '{ "key": "value" }' },
];

// ─── Schema Composition ─────────────────────────────────────────────────────

export const openapiSchemaComposition = [
  {
    keyword: "allOf",
    description: "Combines multiple schemas — the data must satisfy ALL listed schemas. Used for inheritance/composition (e.g. base model + extensions).",
    useCase: "A Subscription inherits from BaseEntity (id, createdAt, updatedAt) and adds subscription-specific fields.",
    yamlSnippet: `# allOf — Composition/Inheritance
Subscription:
  allOf:
    - $ref: '#/components/schemas/BaseEntity'
    - type: object
      required: [householdId, planId, status]
      properties:
        householdId:
          type: string
          format: uuid
        planId:
          type: string
        status:
          type: string
          enum: [active, suspended, cancelled]

BaseEntity:
  type: object
  properties:
    id:
      type: string
      format: uuid
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time`,
  },
  {
    keyword: "oneOf",
    description: "The data must match exactly ONE of the listed schemas. Used for polymorphism where variants are mutually exclusive.",
    useCase: "A payment method is either a CreditCard, BankAccount, or DigitalWallet — never multiple at once.",
    yamlSnippet: `# oneOf — Exactly one match (polymorphism)
PaymentMethod:
  oneOf:
    - $ref: '#/components/schemas/CreditCard'
    - $ref: '#/components/schemas/BankAccount'
    - $ref: '#/components/schemas/DigitalWallet'
  discriminator:
    propertyName: type

CreditCard:
  type: object
  properties:
    type:
      type: string
      enum: [credit_card]
    last4:
      type: string
    expiryMonth:
      type: integer
    expiryYear:
      type: integer

BankAccount:
  type: object
  properties:
    type:
      type: string
      enum: [bank_account]
    routingNumber:
      type: string
    accountLast4:
      type: string`,
  },
  {
    keyword: "anyOf",
    description: "The data must match AT LEAST ONE of the listed schemas (can match multiple). Used when types overlap or are non-exclusive.",
    useCase: "A notification target can be an email, SMS, or both.",
    yamlSnippet: `# anyOf — At least one match (non-exclusive)
NotificationTarget:
  anyOf:
    - $ref: '#/components/schemas/EmailTarget'
    - $ref: '#/components/schemas/SmsTarget'

EmailTarget:
  type: object
  required: [email]
  properties:
    email:
      type: string
      format: email

SmsTarget:
  type: object
  required: [phoneNumber]
  properties:
    phoneNumber:
      type: string
      pattern: '^\\+[1-9]\\d{1,14}$'`,
  },
  {
    keyword: "not",
    description: "The data must NOT match the given schema. Used for exclusion constraints.",
    useCase: "Ensure a field is never an empty string.",
    yamlSnippet: `# not — Exclusion constraint
NonEmptyString:
  type: string
  not:
    maxLength: 0

# Practical: status must not be "deleted"
ActiveSubscriptionStatus:
  type: string
  enum: [active, suspended, cancelled, pending]
  not:
    enum: [deleted]`,
  },
  {
    keyword: "discriminator",
    description: "Used with oneOf/anyOf to identify which sub-schema applies based on a property value. Enables efficient polymorphic deserialization.",
    useCase: "Event payloads have different shapes based on eventType — the discriminator tells parsers which schema to use without trying all variants.",
    yamlSnippet: `# discriminator — Polymorphic type resolution
SubscriptionEvent:
  oneOf:
    - $ref: '#/components/schemas/CreatedEvent'
    - $ref: '#/components/schemas/CancelledEvent'
  discriminator:
    propertyName: eventType
    mapping:
      subscription.created: '#/components/schemas/CreatedEvent'
      subscription.cancelled: '#/components/schemas/CancelledEvent'`,
  },
];

// ─── Security Schemes ───────────────────────────────────────────────────────

export const openapiSecuritySchemes: OpenApiSecurityScheme[] = [
  {
    name: "API Key",
    type: "apiKey",
    description: "A simple token passed in a header, query parameter, or cookie. Easy to implement but less secure than OAuth2. Best for server-to-server calls or internal APIs.",
    productionUseCase: "At Bell Canada, internal microservice-to-microservice calls use API keys passed in the X-API-Key header. Apigee validates these keys via the VerifyAPIKey policy before forwarding to Go backends.",
    yamlSnippet: `securitySchemes:
  apiKeyAuth:
    type: apiKey
    in: header
    name: X-API-Key
    description: API key for service-to-service auth

# Apply globally
security:
  - apiKeyAuth: []`,
  },
  {
    name: "Bearer / JWT",
    type: "http",
    description: "JWT (JSON Web Token) sent in the Authorization header as 'Bearer <token>'. The token is self-contained — includes claims (user ID, roles, expiry) and is cryptographically signed. Stateless authentication.",
    productionUseCase: "At Bell Canada, the BFF (Next.js) obtains a JWT from Auth0/Cognito after user login. This JWT is forwarded to Go services via the Authorization header. Each Go service validates the JWT signature, checks expiry, and extracts claims (userId, roles) for authorization decisions.",
    yamlSnippet: `securitySchemes:
  bearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
    description: Auth0/Cognito issued JWT token

# Apply to specific operation
paths:
  /subscriptions:
    get:
      security:
        - bearerAuth: []`,
  },
  {
    name: "OAuth 2.0",
    type: "oauth2",
    description: "Industry-standard delegated authorization framework. Supports multiple flows: Authorization Code (web apps), Client Credentials (server-to-server), Implicit (deprecated), and PKCE (SPAs, mobile). Provides scoped access control.",
    productionUseCase: "At Bell Canada, external partner APIs use OAuth2 Client Credentials flow. Partners register in the developer portal, receive client_id/client_secret, and exchange them for an access token with specific scopes (subscriptions:read, orders:write). Apigee's OAuthV2 policy handles token issuance, validation, and refresh.",
    yamlSnippet: `securitySchemes:
  oauth2:
    type: oauth2
    description: OAuth 2.0 authorization
    flows:
      clientCredentials:
        tokenUrl: https://auth.bell.ca/oauth/token
        scopes:
          subscriptions:read: Read subscription data
          subscriptions:write: Create/modify subscriptions
          orders:read: Read order data
          orders:write: Create/modify orders
      authorizationCode:
        authorizationUrl: https://auth.bell.ca/authorize
        tokenUrl: https://auth.bell.ca/oauth/token
        scopes:
          profile: User profile access
          subscriptions:read: Read subscription data`,
  },
  {
    name: "OpenID Connect",
    type: "openIdConnect",
    description: "Identity layer built on top of OAuth 2.0. Adds ID tokens (who is the user) on top of access tokens (what can they do). Supports discovery via .well-known/openid-configuration endpoint.",
    productionUseCase: "At Bell Canada, customer-facing applications use OpenID Connect via Auth0. The MFE (subscription-manager) uses OIDC Authorization Code + PKCE to authenticate users, receiving both an ID token (user identity) and an access token (API authorization).",
    yamlSnippet: `securitySchemes:
  oidc:
    type: openIdConnect
    openIdConnectUrl: https://auth.bell.ca/.well-known/openid-configuration
    description: OpenID Connect via Auth0

# Scopes still specified at usage
security:
  - oidc:
      - openid
      - profile
      - subscriptions:read`,
  },
];

// ─── Production Endpoints ───────────────────────────────────────────────────

export const openapiProductionEndpoints: OpenApiEndpoint[] = [
  // reseller-service (Go)
  { service: "reseller-service", method: "POST", path: "/v2/subscriptions", summary: "Create a new subscription", requestBody: "CreateSubscriptionRequest", responseSchema: "Subscription", authScheme: "Bearer JWT" },
  { service: "reseller-service", method: "PUT", path: "/v2/subscriptions/{id}", summary: "Update subscription details", requestBody: "UpdateSubscriptionRequest", responseSchema: "Subscription", authScheme: "Bearer JWT" },
  { service: "reseller-service", method: "PATCH", path: "/v2/subscriptions/{id}/status", summary: "Change subscription status", requestBody: "StatusChangeRequest", responseSchema: "Subscription", authScheme: "Bearer JWT" },
  { service: "reseller-service", method: "DELETE", path: "/v2/subscriptions/{id}", summary: "Cancel a subscription", responseSchema: "204 No Content", authScheme: "Bearer JWT" },
  // order-api (Go)
  { service: "order-api", method: "GET", path: "/v2/orders", summary: "List orders with pagination and filters", responseSchema: "PaginatedResponse<Order>", authScheme: "API Key" },
  { service: "order-api", method: "GET", path: "/v2/orders/{id}", summary: "Get order by ID", responseSchema: "Order", authScheme: "API Key" },
  { service: "order-api", method: "POST", path: "/v2/orders", summary: "Create a new order", requestBody: "CreateOrderRequest", responseSchema: "Order", authScheme: "Bearer JWT" },
  // household-api (Go)
  { service: "household-api", method: "GET", path: "/v2/households/{id}", summary: "Get household details", responseSchema: "Household", authScheme: "Bearer JWT" },
  { service: "household-api", method: "GET", path: "/v2/households/{id}/subscriptions", summary: "List subscriptions for a household", responseSchema: "PaginatedResponse<Subscription>", authScheme: "Bearer JWT" },
  { service: "household-api", method: "GET", path: "/v2/households/{id}/members", summary: "List household members", responseSchema: "HouseholdMember[]", authScheme: "Bearer JWT" },
  // aggregator-api (Go)
  { service: "aggregator-api", method: "GET", path: "/v2/subscriptions", summary: "Aggregated subscription listing with joins", responseSchema: "EnrichedSubscription[]", authScheme: "Bearer JWT" },
  { service: "aggregator-api", method: "GET", path: "/v2/dashboard/summary", summary: "Dashboard metrics aggregation", responseSchema: "DashboardSummary", authScheme: "Bearer JWT" },
  // subscription-configurator-api (Go)
  { service: "subscription-configurator-api", method: "GET", path: "/v2/products", summary: "List available products/plans", responseSchema: "PaginatedResponse<Product>", authScheme: "API Key" },
  { service: "subscription-configurator-api", method: "GET", path: "/v2/products/{id}", summary: "Get product details with pricing", responseSchema: "Product", authScheme: "API Key" },
  { service: "subscription-configurator-api", method: "GET", path: "/v2/products/{id}/features", summary: "List features for a product", responseSchema: "Feature[]", authScheme: "API Key" },
  // auth-api (Lambda)
  { service: "auth-api (Lambda)", method: "POST", path: "/v2/auth/token", summary: "Exchange credentials for JWT token", requestBody: "TokenRequest", responseSchema: "TokenResponse", authScheme: "None (public)" },
  { service: "auth-api (Lambda)", method: "POST", path: "/v2/auth/refresh", summary: "Refresh an expired JWT token", requestBody: "RefreshTokenRequest", responseSchema: "TokenResponse", authScheme: "None (public)" },
  { service: "auth-api (Lambda)", method: "POST", path: "/v2/auth/revoke", summary: "Revoke a refresh token", requestBody: "RevokeTokenRequest", responseSchema: "204 No Content", authScheme: "Bearer JWT" },
  // audit-api (Go)
  { service: "audit-api", method: "GET", path: "/v2/audit/events", summary: "Query audit trail events", responseSchema: "PaginatedResponse<AuditEvent>", authScheme: "Bearer JWT (admin)" },
  { service: "audit-api", method: "GET", path: "/v2/audit/events/{id}", summary: "Get audit event details", responseSchema: "AuditEvent", authScheme: "Bearer JWT (admin)" },
];

// ─── Comparison Matrix ──────────────────────────────────────────────────────

export const openapiComparison: OpenApiComparison[] = [
  { dimension: "Spec Format", openapi30: "YAML/JSON document", openapi20: "YAML/JSON (Swagger)", graphql: "SDL (.graphql files)", grpc: "Protocol Buffers (.proto)" },
  { dimension: "Protocol", openapi30: "HTTP/REST", openapi20: "HTTP/REST", graphql: "HTTP (typically POST)", grpc: "HTTP/2 (binary framing)" },
  { dimension: "Data Format", openapi30: "JSON, XML, form-data, binary", openapi20: "JSON, XML", graphql: "JSON only", grpc: "Protocol Buffers (binary)" },
  { dimension: "Schema System", openapi30: "JSON Schema (draft-07 subset)", openapi20: "JSON Schema (draft-04 subset)", graphql: "GraphQL type system", grpc: "Protobuf message definitions" },
  { dimension: "Polymorphism", openapi30: "oneOf/anyOf/allOf + discriminator", openapi20: "Limited (no oneOf/anyOf)", graphql: "Unions + Interfaces", grpc: "oneof keyword" },
  { dimension: "Auth Specs", openapi30: "OAuth2, JWT, API Key, OIDC built-in", openapi20: "Basic, API Key, OAuth2", graphql: "Not specified (custom)", grpc: "Channel/call credentials" },
  { dimension: "Code Gen", openapi30: "Mature: 40+ languages via openapi-generator", openapi20: "Mature: swagger-codegen", graphql: "Good: graphql-codegen, Apollo", grpc: "Excellent: protoc compiler" },
  { dimension: "Streaming", openapi30: "Not native (webhooks via callbacks)", openapi20: "Not supported", graphql: "Subscriptions (WebSocket)", grpc: "Bidirectional streaming native" },
  { dimension: "Performance", openapi30: "Text-based, HTTP/1.1 or 2", openapi20: "Text-based, HTTP/1.1", graphql: "Flexible queries, potential over-fetching prevention", grpc: "Binary, HTTP/2, very fast" },
  { dimension: "Documentation", openapi30: "Swagger UI, Redoc, Stoplight", openapi20: "Swagger UI", graphql: "GraphiQL, GraphQL Playground", grpc: "Limited (gRPC-gateway for REST docs)" },
  { dimension: "Versioning", openapi30: "URL path, header, or query param", openapi20: "URL path or header", graphql: "Schema evolution (no versions)", grpc: "Package versioning in .proto" },
  { dimension: "Learning Curve", openapi30: "Moderate — YAML/JSON spec syntax", openapi20: "Moderate", graphql: "Moderate-High — new paradigm", grpc: "High — Protobuf, HTTP/2, tooling" },
  { dimension: "Best For", openapi30: "Public REST APIs, enterprise integration", openapi20: "Legacy REST APIs", graphql: "Flexible frontends, BFF pattern", grpc: "Internal microservices, high-performance" },
];

// ─── Best Practices ─────────────────────────────────────────────────────────

export const openapiBestPractices: OpenApiBestPractice[] = [
  {
    category: "Naming",
    title: "Use consistent resource naming conventions",
    description: "Use plural nouns for collections (/subscriptions, /orders), kebab-case for multi-word paths (/subscription-configs), camelCase for JSON properties. Avoid verbs in URLs — let HTTP methods convey the action.",
    yamlSnippet: `# Good
/subscriptions          # GET (list), POST (create)
/subscriptions/{id}     # GET (read), PUT (update), DELETE (remove)
/subscriptions/{id}/status  # PATCH (partial update)

# Bad
/getSubscription        # verb in URL
/subscription           # singular for collection
/Subscriptions          # PascalCase`,
  },
  {
    category: "Versioning",
    title: "Use URL path versioning with semver for the spec",
    description: "Include the major version in the URL path (/v2/subscriptions). Use semantic versioning in the info.version field for the spec itself. Never break existing clients within a major version.",
    yamlSnippet: `info:
  version: "2.3.1"  # semver for spec changes
servers:
  - url: https://api.bell.ca/v2  # major version in path

# Version lifecycle
# v1 — deprecated, sunset date announced
# v2 — current, stable
# v3 — beta, opt-in via header`,
  },
  {
    category: "Error Responses",
    title: "Standardize error response structure",
    description: "Define a single ErrorResponse schema used across all error status codes. Include machine-readable code, human-readable message, field-level details array, and traceId for debugging.",
  },
  {
    category: "Pagination",
    title: "Use cursor-based or offset pagination consistently",
    description: "For list endpoints, support limit and offset (or cursor) query parameters. Return pagination metadata in the response (totalCount, hasMore, nextCursor). Define reusable PaginationMeta and PaginatedResponse schemas.",
    yamlSnippet: `# Pagination parameters (reusable)
components:
  parameters:
    Limit:
      name: limit
      in: query
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 20
    Offset:
      name: offset
      in: query
      schema:
        type: integer
        minimum: 0
        default: 0

  schemas:
    PaginationMeta:
      type: object
      properties:
        totalCount:
          type: integer
        limit:
          type: integer
        offset:
          type: integer
        hasMore:
          type: boolean`,
  },
  {
    category: "Deprecation",
    title: "Mark deprecated operations and fields with migration guidance",
    description: "Use the 'deprecated: true' flag on operations, parameters, and schema properties. Add x-sunset-date extension to communicate removal timelines. Document the migration path in the description.",
    yamlSnippet: `paths:
  /v1/subscriptions:
    get:
      deprecated: true
      summary: "[DEPRECATED] Use /v2/subscriptions"
      description: |
        Sunset date: 2024-06-01
        Migration: Use GET /v2/subscriptions with
        the same query parameters.
      x-sunset-date: "2024-06-01"

# Schema property deprecation
properties:
  legacyPlanCode:
    type: string
    deprecated: true
    description: "Use planId instead"`,
  },
  {
    category: "Security",
    title: "Apply security at the right level",
    description: "Define security schemes in components/securitySchemes. Apply common auth globally via top-level security. Override per-operation for public endpoints (security: []) or stricter requirements.",
  },
  {
    category: "Documentation",
    title: "Write descriptive summaries and use examples",
    description: "Every operation should have a summary (short, one-line) and description (detailed, with business context). Include examples for request bodies, responses, and enum values. Use tags to group related operations.",
  },
  {
    category: "Spec Organization",
    title: "Split large specs into multiple files",
    description: "For large APIs, use $ref with external files: split schemas, paths, and parameters into separate YAML files. Tools like Redocly CLI can bundle them into a single file for distribution.",
    yamlSnippet: `# Main spec references external files
paths:
  /subscriptions:
    $ref: './paths/subscriptions.yaml'
  /orders:
    $ref: './paths/orders.yaml'

components:
  schemas:
    Subscription:
      $ref: './schemas/subscription.yaml'
    Order:
      $ref: './schemas/order.yaml'`,
  },
];

// ─── Tools & Ecosystem ──────────────────────────────────────────────────────

export const openapiTools: OpenApiTool[] = [
  { name: "Swagger UI", category: "Documentation", description: "Interactive API documentation that lets developers try API calls directly in the browser. Auto-generated from OpenAPI spec.", url: "https://swagger.io/tools/swagger-ui/" },
  { name: "Redoc", category: "Documentation", description: "Clean, responsive three-panel API documentation with excellent navigation. Supports nested schemas and code samples.", url: "https://redocly.com/redoc" },
  { name: "Stoplight Studio", category: "Design", description: "Visual OpenAPI editor with form-based and code editing. Supports design-first workflow with mock servers.", url: "https://stoplight.io/studio" },
  { name: "openapi-generator", category: "Code Generation", description: "Generate client SDKs (TypeScript, Go, Java, Python, etc.) and server stubs from OpenAPI specs. Supports 40+ languages.", url: "https://openapi-generator.tech" },
  { name: "Redocly CLI", category: "Validation", description: "Lint, bundle, and validate OpenAPI specs. Enforces custom rules for consistency. CI/CD integration.", url: "https://redocly.com/docs/cli/" },
  { name: "Spectral", category: "Validation", description: "Flexible OpenAPI linter by Stoplight. Custom rulesets for enforcing API design standards. Popular in CI pipelines.", url: "https://stoplight.io/open-source/spectral" },
  { name: "Prism", category: "Testing", description: "Mock server and validation proxy. Generates realistic mock responses from OpenAPI specs for frontend development.", url: "https://stoplight.io/open-source/prism" },
  { name: "Schemathesis", category: "Testing", description: "Property-based testing tool that auto-generates test cases from OpenAPI specs to find edge cases and crashes.", url: "https://schemathesis.readthedocs.io" },
  { name: "oapi-codegen", category: "Code Generation", description: "Go-specific OpenAPI code generator. Creates Go server interfaces and client code with chi/echo/gin support.", url: "https://github.com/deepmap/oapi-codegen" },
  { name: "TypeSpec", category: "Design", description: "Microsoft's API description language that compiles to OpenAPI, JSON Schema, and Protobuf. Alternative to writing YAML directly.", url: "https://typespec.io" },
];

// ─── BSA Interview Questions ────────────────────────────────────────────────

export const openapiBsaQuestions: OpenApiBsaQuestion[] = [
  {
    num: 1,
    question: "How would you approach designing an API specification for a new microservice?",
    answer: `I follow a design-first approach with these steps:

1. Gather requirements — Work with product owners and consumers to define resources, operations, and business rules. Identify who will call the API (MFE, mobile app, partner system, internal service).

2. Define the domain model — Map business entities to API resources. At Bell Canada, subscription management has clear resources: Subscriptions, Households, Orders, Products.

3. Draft the OpenAPI spec — Start with paths and schemas. Define the resource URLs (plural nouns), HTTP methods, request/response schemas, and error responses. I write the YAML collaboratively with developers.

4. Review with stakeholders — Share the spec via Swagger UI or Redoc for visual review. Product owners validate business rules, developers validate technical feasibility, QA validates testability.

5. Iterate and validate — Use Spectral or Redocly CLI to lint the spec. Generate mock servers with Prism for frontend teams to start integration before the backend is built.

6. Versioning strategy — Agree on URL path versioning (/v2/subscriptions) and semantic versioning for the spec document itself.

7. Handoff — Developers use the spec to generate server stubs (oapi-codegen for Go) and client SDKs (openapi-generator for TypeScript).`,
  },
  {
    num: 2,
    question: "What is the difference between OpenAPI 3.0 and Swagger 2.0?",
    answer: `Major differences BSAs should know:

1. Naming — "Swagger" was renamed to "OpenAPI" when donated to the Linux Foundation. Swagger 2.0 → OpenAPI 3.0 (not 2.1).

2. Structure — 3.0 introduced 'components' to replace 'definitions', 'parameters', and 'responses' scattered across the spec. Everything reusable lives under components.

3. Request body — In 2.0, body was a parameter type (in: body). In 3.0, requestBody is a separate concept with content negotiation (multiple media types).

4. Servers — 2.0 had host + basePath + schemes. 3.0 has a servers array with variables, supporting multiple environments natively.

5. Schema improvements — 3.0 added oneOf, anyOf (2.0 only had allOf), nullable keyword, and discriminator for polymorphism.

6. Callbacks — 3.0 introduced callbacks for webhook definitions (not available in 2.0).

7. Links — 3.0 added links for HATEOAS-style operation chaining.

8. Security — 3.0 added OpenID Connect support and improved OAuth2 flow definitions.

From a BSA perspective, 3.0 is more expressive and better suited for modern microservice architectures. The improved schema composition (oneOf/anyOf) is critical for modeling real-world APIs.`,
  },
  {
    num: 3,
    question: "How do you ensure API consistency across multiple microservices?",
    answer: `Consistency across services requires governance at multiple levels:

1. Shared OpenAPI components — Create a shared schema library ($ref'd via external files). At Bell Canada, ErrorResponse, PaginationMeta, and common headers are defined once and imported by each service's spec.

2. API style guide — Document naming conventions (camelCase properties, plural resource names, /v{n} versioning), pagination patterns (limit/offset), and error response format. Enforce with Spectral custom rulesets.

3. Linting in CI/CD — Run Spectral or Redocly CLI in the build pipeline. Fail the build if the spec violates style rules. Rules cover: required description fields, consistent error responses, required security definitions, no inline schemas (must use $ref).

4. Design review process — BSAs review spec changes as part of the PR process, just like code review. Check for business rule correctness, naming consistency, and backward compatibility.

5. Centralized API catalog — Use a developer portal (Backstage, Swagger Hub, or Apigee) to publish all specs in one place. Makes it easy to see patterns and catch inconsistencies.

6. Code generation — Generate server interfaces from the spec. If the spec says "POST returns 201", the generated code enforces that. This shifts consistency from manual discipline to tooling.`,
  },
  {
    num: 4,
    question: "How do you handle API versioning and backward compatibility?",
    answer: `Versioning strategy depends on the API's consumer base:

URL path versioning (/v1, /v2) — Preferred for Bell Canada's APIs:
• Clear and explicit — consumers know which version they're using
• Easy to route at the gateway (Apigee proxy routing)
• Multiple versions can run simultaneously

Backward-compatible changes (no version bump):
• Adding optional fields to responses
• Adding new endpoints
• Adding optional query parameters
• Adding new enum values (if clients handle unknown values)

Breaking changes (require new version):
• Removing or renaming fields
• Changing field types
• Removing endpoints
• Making optional parameters required
• Changing authentication requirements

My approach as a BSA:
1. Document the change in the OpenAPI spec first
2. Assess impact — query API consumers (MFE teams, partner integrations)
3. If breaking: create /v{n+1} with the new contract, keep /v{n} running
4. Set a sunset date for the old version (6-12 months for external APIs)
5. Communicate via the developer portal and deprecation headers
6. Monitor v{n} traffic in Apigee analytics to know when it's safe to decommission`,
  },
  {
    num: 5,
    question: "How does OpenAPI integrate with API gateways like Apigee?",
    answer: `OpenAPI specs serve as the contract that bridges API design and gateway configuration:

1. Import spec into Apigee — Upload the OpenAPI YAML to create an API proxy automatically. Apigee generates the proxy skeleton with paths, operations, and basic validation.

2. Policy attachment — After import, attach Apigee policies to each operation:
   • SpikeArrest and Quota based on the security scheme (rate limits per API key or OAuth scope)
   • Input validation using the request body schema from the spec
   • Response transformation using the response schema

3. Developer portal — Apigee's developer portal renders the OpenAPI spec as interactive documentation. Partners browse, try APIs, and register apps — all driven by the spec.

4. API products — Apigee API Products group paths/operations from the spec. A "Basic" product might include GET operations only, while "Premium" includes POST/PUT/DELETE.

5. Mock responses — During development, Apigee can return mock responses based on the spec's examples before the backend is ready.

6. Contract validation — Apigee can validate incoming requests against the OpenAPI schema, rejecting malformed requests before they reach the backend.

At Bell Canada, the flow is: BSA drafts spec → dev review → import into Apigee → attach policies → publish to developer portal → generate Go server stubs → implement.`,
  },
  {
    num: 6,
    question: "What are common pitfalls when writing OpenAPI specifications?",
    answer: `Common pitfalls I've seen as a BSA:

1. Missing error responses — Only documenting 200 OK. Every operation should document 400, 401, 403, 404, and 500 at minimum.

2. Inline schemas everywhere — Defining schemas inline instead of using $ref. Makes the spec massive, inconsistent, and unmaintainable. Rule: if a schema is used more than once, extract it to components.

3. Vague descriptions — "Gets the data" instead of "Returns a paginated list of active subscriptions for the specified household, including plan details and billing status." BSAs should write descriptions, not developers.

4. Ignoring nullable — In 3.0, fields are non-nullable by default. If a field can be null (e.g. endDate on an active subscription), you must add nullable: true.

5. Overly generic schemas — Using 'type: object' with additionalProperties everywhere instead of defining specific properties. Loses the contract value of OpenAPI.

6. Not using examples — Examples drive documentation quality and mock server behavior. Include realistic examples for every request body and response.

7. Security afterthought — Adding security schemes last instead of designing auth upfront. Auth affects every path and should be part of the initial design.

8. No pagination — List endpoints without limit/offset or cursor parameters. Every collection endpoint should support pagination.

9. Misusing HTTP methods — POST for everything, or using DELETE with a request body. Follow REST semantics.

10. Spec drift — The spec is written once and never updated. Enforce spec-first development: the spec is the source of truth, code is generated from it.`,
  },
  {
    num: 7,
    question: "How would you use OpenAPI specs in CI/CD pipelines?",
    answer: `OpenAPI specs should be integral to the CI/CD pipeline at multiple stages:

1. Pre-commit / PR validation:
   • Lint the spec with Spectral (custom ruleset: consistent naming, required fields, no inline schemas)
   • Validate spec syntax with Redocly CLI (bundle and validate)
   • Check backward compatibility (detect breaking changes with oasdiff or openapi-diff)

2. Build stage:
   • Generate server code from spec (oapi-codegen for Go services)
   • Generate TypeScript client SDK (openapi-generator)
   • Run contract tests (Schemathesis) — auto-generate test cases from the spec
   • Build documentation (Redoc static HTML) for deployment

3. Integration testing:
   • Start Prism mock server from spec
   • Run consumer-driven contract tests (Pact) against the mock
   • Validate actual API responses against the spec schema

4. Deploy stage:
   • Upload spec to Apigee to create/update API proxy
   • Publish documentation to the developer portal
   • Update API catalog (Backstage)

5. Post-deploy:
   • Run smoke tests against the deployed API
   • Validate responses match the spec schemas
   • Monitor for spec violations in production logs

At Bell Canada, this pipeline ensures the Go services always match the published spec and the MFE's TypeScript client is always in sync.`,
  },
  {
    num: 8,
    question: "How do you document webhooks and event-driven APIs with OpenAPI?",
    answer: `OpenAPI handles asynchronous patterns through callbacks (3.0) and webhooks (3.1):

Callbacks (OpenAPI 3.0):
• Defined within the operation that accepts the callback URL
• The client provides a callbackUrl in the request body
• The callback defines what the server will POST to that URL
• Used when the callback URL is specific to each request

Webhooks (OpenAPI 3.1):
• Top-level webhooks object (alongside paths)
• Not tied to specific operations
• Describes events the API can fire to registered endpoints
• Used for global event subscriptions (configured out-of-band)

For Bell Canada's Kafka-driven architecture:
• The Kafka events themselves aren't described by OpenAPI (use AsyncAPI for that)
• But the webhook delivery endpoints ARE — when subscription events trigger HTTP callbacks to partner systems
• The OpenAPI spec documents the webhook payload schema and expected response
• Partners know exactly what events they'll receive and what format

BSA approach: Use OpenAPI for the synchronous REST contract and AsyncAPI for the Kafka/event-driven contract. Link them via shared schema definitions. This gives each team a complete contract for their integration pattern.`,
  },
];

// ─── Mermaid Diagrams ───────────────────────────────────────────────────────

export const openapiSpecStructureDiagram = `graph TD
  subgraph "OpenAPI 3.0 Document Structure"
    ROOT["openapi: 3.0.3"] --> INFO["info<br/>title, version, description"]
    ROOT --> SERVERS["servers[]<br/>url, variables"]
    ROOT --> PATHS["paths<br/>/resource/{id}"]
    ROOT --> COMPONENTS["components"]
    ROOT --> SECURITY["security[]<br/>global auth"]
    ROOT --> TAGS["tags[]<br/>grouping"]

    PATHS --> OP_GET["GET"]
    PATHS --> OP_POST["POST"]
    PATHS --> OP_PUT["PUT/PATCH"]
    PATHS --> OP_DEL["DELETE"]

    OP_GET --> PARAMS["parameters[]<br/>path, query, header"]
    OP_POST --> REQBODY["requestBody<br/>content, schema"]
    OP_GET --> RESPONSES["responses<br/>200, 400, 401, 404, 500"]
    OP_POST --> RESPONSES

    COMPONENTS --> SCHEMAS["schemas<br/>data models"]
    COMPONENTS --> SEC_SCHEMES["securitySchemes<br/>JWT, OAuth2, API Key"]
    COMPONENTS --> COMP_RESP["responses<br/>reusable errors"]
    COMPONENTS --> COMP_PARAMS["parameters<br/>pagination, headers"]
    COMPONENTS --> CALLBACKS["callbacks<br/>webhooks"]
    COMPONENTS --> LINKS["links<br/>HATEOAS"]
  end

  style ROOT fill:#4a8fe8,stroke:#3a7fd8,color:white
  style PATHS fill:#7c6fcd,stroke:#6c5fbd,color:white
  style COMPONENTS fill:#3eb89a,stroke:#2ea88a,color:white
  style SCHEMAS fill:#e8a83a,stroke:#d8982a,color:white
  style SEC_SCHEMES fill:#e8705a,stroke:#d8604a,color:white`;

export const openapiRequestLifecycleDiagram = `sequenceDiagram
  participant Client as MFE / Partner
  participant Gateway as Apigee Gateway
  participant Spec as OpenAPI Spec
  participant Service as Go Service
  participant DB as PostgreSQL

  Client->>Gateway: POST /v2/subscriptions
  Note over Gateway: Validate against OpenAPI spec
  Gateway->>Gateway: Check security scheme (JWT)
  Gateway->>Gateway: Validate request body schema

  alt Schema validation fails
    Gateway-->>Client: 400 Bad Request (ErrorResponse)
  end

  Gateway->>Service: Forward validated request
  Service->>Service: Business logic validation
  Service->>DB: INSERT subscription
  DB-->>Service: Created record
  Service-->>Gateway: 201 Created + Subscription

  Note over Gateway: Validate response schema
  Gateway-->>Client: 201 Created + Subscription

  Note over Client: Follow Link to GET /subscriptions/{id}`;

export const openapiAuthFlowDiagram = `graph LR
  subgraph "OpenAPI Security Flows"
    subgraph "API Key (Simple)"
      AK_CLIENT[Client] -->|X-API-Key header| AK_GW[Gateway]
      AK_GW -->|Verify key| AK_SVC[Service]
    end

    subgraph "Bearer JWT (Stateless)"
      JWT_AUTH[Auth Provider] -->|Issue JWT| JWT_CLIENT[Client]
      JWT_CLIENT -->|Authorization: Bearer token| JWT_GW[Gateway]
      JWT_GW -->|Verify signature + claims| JWT_SVC[Service]
    end

    subgraph "OAuth2 Client Credentials (M2M)"
      O2_CLIENT[Partner App] -->|client_id + secret| O2_AUTH[Token Endpoint]
      O2_AUTH -->|access_token + scopes| O2_CLIENT
      O2_CLIENT -->|Bearer token| O2_GW[Gateway]
      O2_GW -->|Validate token + scopes| O2_SVC[Service]
    end
  end

  style AK_GW fill:#4a8fe8,stroke:#3a7fd8,color:white
  style JWT_GW fill:#3eb89a,stroke:#2ea88a,color:white
  style O2_GW fill:#7c6fcd,stroke:#6c5fbd,color:white
  style JWT_AUTH fill:#e8a83a,stroke:#d8982a,color:white
  style O2_AUTH fill:#e8a83a,stroke:#d8982a,color:white`;
