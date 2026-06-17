// ── Types ───────────────────────────────────────────────────────────

export interface TestingConcept {
  title: string;
  color: "green" | "amber";
  tools: string[];
  description: string;
}

export interface PyramidLayer {
  name: string;
  color: string;
  percentage: string;
  speed: string;
  tools: string[];
  description: string;
}

export interface TestFileLocation {
  pattern: string;
  type: string;
  description: string;
}

export interface TestCodeExample {
  title: string;
  comment: string;
  code: string;
}

export interface TestCommand {
  command: string;
  description: string;
  whenToUse: string;
}

export interface CIPipelineStage {
  num: number;
  title: string;
  description: string;
  tools: string;
  badge: string;
}

export interface TestBestPractice {
  type: "do" | "avoid" | "tip";
  title: string;
  description: string;
}

export interface TestGlossaryTerm {
  goTool: string;
  jsEquivalent: string;
  whatItDoes: string;
}

// ── Testing Concepts ────────────────────────────────────────────────

export const testingConcepts: TestingConcept[] = [
  {
    title: "Unit Testing",
    color: "green",
    tools: ["testify", "mockery", "go test"],
    description:
      "Fast, isolated tests that validate individual functions, methods, and struct behavior. Uses testify for assertions and mockery for auto-generated mocks. These run on every commit and form ~80% of all tests.",
  },
  {
    title: "Integration & Load Testing",
    color: "amber",
    tools: ["Karate", "k6"],
    description:
      "Slower tests that validate API contracts, end-to-end flows, and performance under load. Karate uses Gherkin-style BDD for API tests (Java/Gherkin). k6 uses JavaScript scripts for load testing. Both run in CI after builds.",
  },
];

// ── Testing Pyramid ─────────────────────────────────────────────────

export const pyramidLayers: PyramidLayer[] = [
  {
    name: "Unit Tests",
    color: "green",
    percentage: "~80%",
    speed: "< 1s per test",
    tools: ["go test", "testify", "mockery"],
    description:
      "Fastest feedback loop. Test individual functions and methods in isolation using mocks for external dependencies. Run on every commit.",
  },
  {
    name: "Integration Tests",
    color: "amber",
    percentage: "~15%",
    speed: "seconds–minutes",
    tools: ["Karate", "httptest", "Docker"],
    description:
      "Validate API contracts and service interactions. Karate tests run against deployed services. httptest validates HTTP handlers with real request/response cycles.",
  },
  {
    name: "E2E Tests",
    color: "coral",
    percentage: "~5%",
    speed: "minutes",
    tools: ["Karate scenarios", "k6"],
    description:
      "Full system tests and load tests against staging environments. Expensive to run, so reserved for critical flows and performance validation.",
  },
];

// ── Test File Locations ─────────────────────────────────────────────

export const testFileLocations: TestFileLocation[] = [
  {
    pattern: "internal/service/*_test.go",
    type: "Unit",
    description: "Service layer unit tests — business logic",
  },
  {
    pattern: "internal/handler/*_test.go",
    type: "Unit",
    description: "HTTP handler tests — request/response validation",
  },
  {
    pattern: "internal/connector/*_test.go",
    type: "Unit",
    description: "External API connector tests — mock external calls",
  },
  {
    pattern: "mocks/",
    type: "Generated",
    description: "Auto-generated mocks from mockery — do not edit by hand",
  },
  {
    pattern: "tests/karate/**/*.feature",
    type: "Integration",
    description: "Karate BDD feature files — Gherkin syntax API tests",
  },
  {
    pattern: "tests/k6/*.js",
    type: "Load",
    description: "k6 load test scripts — JavaScript-based performance tests",
  },
];

// ── Unit Test Examples ──────────────────────────────────────────────

export const unitTestExamples: TestCodeExample[] = [
  {
    title: "Basic test function",
    comment: "// internal/service/subscription_test.go",
    code: `package service

import "testing"

func TestCalculateTotal(t *testing.T) {
    total := CalculateTotal(100, 0.13)
    if total != 113 {
        t.Errorf("expected 113, got %d", total)
    }
}`,
  },
  {
    title: "assert vs require (testify)",
    comment: "// assert continues on failure, require stops the test immediately",
    code: `import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestWithTestify(t *testing.T) {
    result, err := ProcessOrder(ctx, order)

    require.NoError(t, err)           // stops here if err != nil
    assert.Equal(t, "active", result.Status)  // continues even if wrong
    assert.NotEmpty(t, result.ID)
}`,
  },
  {
    title: "Suite-based test",
    comment: "// Group related tests with shared setup/teardown",
    code: `import (
    "testing"
    "github.com/stretchr/testify/suite"
)

type SubscriptionSuite struct {
    suite.Suite
    svc *SubscriptionService
}

func (s *SubscriptionSuite) SetupTest() {
    s.svc = NewSubscriptionService(mockRepo, mockClient)
}

func (s *SubscriptionSuite) TestActivation() {
    result, err := s.svc.Activate(ctx, req)
    s.NoError(err)
    s.Equal("active", result.Status)
}

func TestSubscriptionSuite(t *testing.T) {
    suite.Run(t, new(SubscriptionSuite))
}`,
  },
];

// ── Table-Driven Examples ───────────────────────────────────────────

export const tableDrivenExamples: TestCodeExample[] = [
  {
    title: "Standard table-driven test",
    comment: "// The Go-idiomatic way to test multiple inputs/outputs",
    code: `func TestValidatePhoneNumber(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        want    bool
    }{
        {"valid Canadian",    "+14165551234", true},
        {"valid US",          "+12125551234", true},
        {"missing plus",      "14165551234",  false},
        {"too short",         "+1416",        false},
        {"empty string",      "",             false},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got := ValidatePhoneNumber(tt.input)
            assert.Equal(t, tt.want, got)
        })
    }
}`,
  },
  {
    title: "Table-driven with error cases",
    comment: "// Test both success and error paths in one table",
    code: `func TestParseSubscriptionType(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        want    SubscriptionType
        wantErr bool
    }{
        {"internet",   "INTERNET",   TypeInternet,   false},
        {"tv",         "TV",         TypeTV,         false},
        {"mobile",     "MOBILE",     TypeMobile,     false},
        {"unknown",    "INVALID",    TypeUnknown,    true},
        {"empty",      "",           TypeUnknown,    true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := ParseSubscriptionType(tt.input)
            if tt.wantErr {
                require.Error(t, err)
                return
            }
            require.NoError(t, err)
            assert.Equal(t, tt.want, got)
        })
    }
}`,
  },
];

// ── httptest Examples ───────────────────────────────────────────────

export const httpTestExamples: TestCodeExample[] = [
  {
    title: "httptest.NewRecorder",
    comment: "// Test an HTTP handler without starting a server",
    code: `func TestGetSubscriptionHandler(t *testing.T) {
    req := httptest.NewRequest("GET", "/api/subscriptions/123", nil)
    rec := httptest.NewRecorder()

    handler := NewSubscriptionHandler(mockService)
    handler.GetSubscription(rec, req)

    assert.Equal(t, http.StatusOK, rec.Code)

    var resp SubscriptionResponse
    err := json.NewDecoder(rec.Body).Decode(&resp)
    require.NoError(t, err)
    assert.Equal(t, "123", resp.ID)
}`,
  },
  {
    title: "httptest.NewServer",
    comment: "// Spin up a real HTTP server for integration-style tests",
    code: `func TestClientIntegration(t *testing.T) {
    // Create a fake external API
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]string{
            "status": "active",
        })
    }))
    defer server.Close()

    // Point the connector at the fake server
    client := NewAPIClient(server.URL)
    result, err := client.GetStatus(ctx, "sub-123")

    require.NoError(t, err)
    assert.Equal(t, "active", result.Status)
}`,
  },
];

// ── Connector Pattern Examples ──────────────────────────────────────

export const connectorPatternExamples: TestCodeExample[] = [
  {
    title: "Production wiring (real dependencies)",
    comment: "// cmd/main.go — production setup with real connectors",
    code: `func main() {
    // Real external API clients
    merchantClient := merchant.NewClient(cfg.MerchantAPIURL)
    billingClient := billing.NewClient(cfg.BillingAPIURL)

    // Wire real dependencies into the service
    svc := service.NewSubscriptionService(
        merchantClient,   // implements MerchantConnector interface
        billingClient,    // implements BillingConnector interface
    )
    handler := handler.NewSubscriptionHandler(svc)
}`,
  },
  {
    title: "Test wiring (mock dependencies)",
    comment: "// internal/service/subscription_test.go — swap in mocks",
    code: `func TestSubscriptionService(t *testing.T) {
    // Generated mocks that implement the same interfaces
    mockMerchant := mocks.NewMockMerchantConnector(t)
    mockBilling := mocks.NewMockBillingConnector(t)

    // Same service struct, mock dependencies
    svc := NewSubscriptionService(mockMerchant, mockBilling)

    // Set up mock expectations
    mockMerchant.EXPECT().
        GetMerchant(mock.Anything, "m-123").
        Return(&Merchant{ID: "m-123", Name: "Netflix"}, nil)

    result, err := svc.GetSubscriptionDetails(ctx, "sub-456")
    require.NoError(t, err)
    assert.Equal(t, "Netflix", result.MerchantName)
}`,
  },
  {
    title: "PostOrderInner pattern",
    comment: "// Separate testable logic from external wiring",
    code: `// PostOrder handles the HTTP request and external calls
func (h *Handler) PostOrder(w http.ResponseWriter, r *http.Request) {
    order := decodeRequest(r)
    externalData := h.externalClient.Fetch(order.ID)
    result := h.PostOrderInner(order, externalData)
    json.NewEncoder(w).Encode(result)
}

// PostOrderInner contains pure business logic — easy to unit test
func (h *Handler) PostOrderInner(order Order, data ExternalData) OrderResult {
    // Pure logic: no HTTP, no external calls
    if data.Status == "eligible" {
        return OrderResult{Approved: true, Reason: "eligible"}
    }
    return OrderResult{Approved: false, Reason: "not eligible"}
}`,
  },
];

// ── Mockery Examples ────────────────────────────────────────────────

export const mockeryExamples: TestCodeExample[] = [
  {
    title: "1. Define an interface",
    comment: "// internal/connector/merchant.go — the contract",
    code: `type MerchantConnector interface {
    GetMerchant(ctx context.Context, id string) (*Merchant, error)
    ListMerchants(ctx context.Context, filter Filter) ([]Merchant, error)
    CreateOrder(ctx context.Context, req OrderRequest) (*Order, error)
}`,
  },
  {
    title: "2. Generate the mock",
    comment: "// Run mockery to auto-generate a mock implementation",
    code: `# .mockery.yaml (project root)
with-expecter: true
dir: mocks
packages:
  github.com/your-org/your-service/internal/connector:
    interfaces:
      MerchantConnector:

# Generate mocks:
$ mockery`,
  },
  {
    title: "3. Use mock in test",
    comment: "// The generated mock provides .EXPECT() for type-safe setup",
    code: `func TestCreateSubscription(t *testing.T) {
    mockMerchant := mocks.NewMockMerchantConnector(t)

    // Type-safe expectation setup
    mockMerchant.EXPECT().
        GetMerchant(mock.Anything, "m-123").
        Return(&Merchant{ID: "m-123", Name: "Netflix"}, nil).
        Times(1)

    svc := NewSubscriptionService(mockMerchant)
    result, err := svc.Create(ctx, CreateReq{MerchantID: "m-123"})

    require.NoError(t, err)
    assert.Equal(t, "Netflix", result.MerchantName)
    mockMerchant.AssertExpectations(t) // verify all expected calls were made
}`,
  },
];

// ── Full Mock Example ───────────────────────────────────────────────

export const fullMockExample: TestCodeExample = {
  title: "Complete realistic test: ActivateSubscription",
  comment: "// internal/service/subscription_test.go — full mock setup → call → assert",
  code: `func TestActivateSubscription(t *testing.T) {
    // ── Arrange: create mocks ──────────────────────────────
    mockMerchant := mocks.NewMockMerchantConnector(t)
    mockBilling := mocks.NewMockBillingConnector(t)
    mockNotifier := mocks.NewMockNotificationConnector(t)

    svc := NewSubscriptionService(mockMerchant, mockBilling, mockNotifier)

    // ── Set expectations ───────────────────────────────────
    mockMerchant.EXPECT().
        GetMerchant(mock.Anything, "m-netflix").
        Return(&Merchant{ID: "m-netflix", Name: "Netflix", Active: true}, nil)

    mockBilling.EXPECT().
        CreateCharge(mock.Anything, mock.MatchedBy(func(c ChargeReq) bool {
            return c.Amount == 1599 && c.Currency == "CAD"
        })).
        Return(&Charge{ID: "chg-001", Status: "success"}, nil)

    mockNotifier.EXPECT().
        SendActivationEmail(mock.Anything, "user@bell.ca", mock.Anything).
        Return(nil)

    // ── Act ────────────────────────────────────────────────
    result, err := svc.Activate(ctx, ActivateReq{
        UserID:     "u-42",
        MerchantID: "m-netflix",
        PlanID:     "plan-standard",
        Email:      "user@bell.ca",
    })

    // ── Assert ─────────────────────────────────────────────
    require.NoError(t, err)
    assert.Equal(t, "active", result.Status)
    assert.Equal(t, "chg-001", result.ChargeID)
    assert.Equal(t, "Netflix", result.MerchantName)

    // Verify all mocks were called as expected
    mockMerchant.AssertExpectations(t)
    mockBilling.AssertExpectations(t)
    mockNotifier.AssertExpectations(t)
}`,
};

// ── Karate Examples ─────────────────────────────────────────────────

export const karateExamples: TestCodeExample[] = [
  {
    title: "Karate .feature file",
    comment: "// tests/karate/subscriptions/activate.feature",
    code: `Feature: Subscription Activation API

  Background:
    * url baseUrl
    * header Content-Type = 'application/json'
    * header Authorization = 'Bearer ' + authToken

  Scenario: Activate a new subscription
    Given path '/api/v1/subscriptions/activate'
    And request { merchantId: 'm-netflix', planId: 'plan-standard', userId: 'u-42' }
    When method POST
    Then status 200
    And match response.status == 'active'
    And match response.chargeId == '#notnull'

  Scenario: Reject activation for invalid merchant
    Given path '/api/v1/subscriptions/activate'
    And request { merchantId: 'invalid', planId: 'plan-standard', userId: 'u-42' }
    When method POST
    Then status 400
    And match response.error == 'merchant not found'`,
  },
  {
    title: "karate-config.js",
    comment: "// tests/karate/karate-config.js — environment setup",
    code: `function fn() {
  var env = karate.env || 'dev';
  var config = {
    baseUrl: 'http://localhost:8080',
    authToken: 'test-token-dev'
  };

  if (env === 'staging') {
    config.baseUrl = 'https://api-staging.example.com';
    config.authToken = karate.properties['auth.token'];
  }

  karate.log('Running against:', config.baseUrl);
  return config;
}`,
  },
];

// ── k6 Examples ─────────────────────────────────────────────────────

export const k6Examples: TestCodeExample[] = [
  {
    title: "Basic k6 load test",
    comment: "// tests/k6/subscription-load.js",
    code: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // ramp up to 20 VUs
    { duration: '1m',  target: 20 },   // hold at 20 VUs
    { duration: '10s', target: 0 },    // ramp down
  ],
};

export default function () {
  const res = http.get('http://localhost:8080/api/v1/subscriptions');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}`,
  },
  {
    title: "k6 with thresholds",
    comment: "// tests/k6/subscription-thresholds.js — CI will fail if thresholds are breached",
    code: `import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 50,
  duration: '2m',
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<500'],  // 95th < 300ms
    http_req_failed: ['rate<0.01'],                   // <1% error rate
    checks: ['rate>0.99'],                            // 99% of checks pass
  },
};

export default function () {
  const payload = JSON.stringify({
    merchantId: 'm-netflix',
    planId: 'plan-standard',
  });

  const res = http.post('http://localhost:8080/api/v1/subscriptions/activate', payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has chargeId': (r) => JSON.parse(r.body).chargeId !== undefined,
  });
}`,
  },
];

// ── Test Commands ───────────────────────────────────────────────────

export const testCommands: TestCommand[] = [
  {
    command: "go test ./...",
    description: "Run all tests in the project recursively",
    whenToUse: "Every time before pushing code",
  },
  {
    command: "go test -race ./...",
    description: "Run all tests with the race condition detector",
    whenToUse: "When working with goroutines or shared state",
  },
  {
    command: "go test -v ./internal/service/...",
    description: "Run tests in a specific package with verbose output",
    whenToUse: "Debugging a failing test — shows each t.Run name",
  },
  {
    command: "go test -cover ./...",
    description: "Run tests and show coverage percentage per package",
    whenToUse: "Before submitting a merge request to check coverage",
  },
  {
    command: "task run-unit-tests",
    description: "Run unit tests via Taskfile (project-standard wrapper)",
    whenToUse: "Team convention — uses same flags as CI pipeline",
  },
  {
    command: "gotestsum --format=testname ./...",
    description: "Prettier test output with pass/fail indicators per test",
    whenToUse: "Local development — better DX than raw go test output",
  },
];

// ── CI Pipeline Stages ──────────────────────────────────────────────

export const ciPipelineStages: CIPipelineStage[] = [
  {
    num: 1,
    title: "Lint",
    description: "golangci-lint runs static analysis to catch bugs, style issues, and potential errors before tests even run.",
    tools: "golangci-lint",
    badge: "quality",
  },
  {
    num: 2,
    title: "Unit Tests",
    description: "go test -race ./... runs all unit tests with the race detector enabled. Fastest feedback on code correctness.",
    tools: "go test, testify",
    badge: "test",
  },
  {
    num: 3,
    title: "Coverage Gate",
    description: "Coverage must meet the minimum threshold (typically 70-80%). The pipeline fails if new code drops coverage below the gate.",
    tools: "go test -cover",
    badge: "quality",
  },
  {
    num: 4,
    title: "Build",
    description: "Compile the Go binary and build the Docker image. Catches compilation errors and dependency issues.",
    tools: "go build, Docker",
    badge: "build",
  },
  {
    num: 5,
    title: "Integration Tests",
    description: "Karate BDD tests run against the deployed staging service. Validates API contracts and end-to-end flows.",
    tools: "Karate, staging env",
    badge: "test",
  },
  {
    num: 6,
    title: "Deploy",
    description: "If all checks pass, the service is deployed to the target environment. Feature flags control which new code paths are active.",
    tools: "GitLab CI, ArgoCD",
    badge: "deploy",
  },
];

// ── Best Practices ──────────────────────────────────────────────────

export const testBestPractices: TestBestPractice[] = [
  {
    type: "do",
    title: "Use table-driven tests for multiple inputs",
    description: "Define test cases as a slice of structs with name, input, and expected output. Loop with t.Run(tt.name, ...) so each sub-test is named and can be run individually.",
  },
  {
    type: "do",
    title: "Use require for preconditions, assert for checks",
    description: "require.NoError stops the test immediately if err != nil — use it for setup steps. assert.Equal continues on failure — use it for the actual assertions you want to report.",
  },
  {
    type: "do",
    title: "Keep _test.go files next to the code they test",
    description: "Go convention: subscription.go and subscription_test.go live in the same package. This gives tests access to unexported functions and keeps related code together.",
  },
  {
    type: "do",
    title: "Run tests with -race in CI",
    description: "The Go race detector catches data races at runtime. Always enable it in CI with go test -race ./... to catch concurrency bugs before they reach production.",
  },
  {
    type: "avoid",
    title: "Don't test private implementation details",
    description: "Test the public API of your package, not internal helpers. If you refactor internals, tests should still pass. Testing private functions makes refactoring painful.",
  },
  {
    type: "avoid",
    title: "Don't use time.Sleep in tests",
    description: "Sleeping makes tests slow and flaky. Use channels, sync.WaitGroup, or testify's Eventually() to wait for async operations to complete deterministically.",
  },
  {
    type: "tip",
    title: "Use t.Parallel() for independent tests",
    description: "Mark tests with t.Parallel() to run them concurrently, reducing total test time. Only use this when tests don't share mutable state.",
  },
  {
    type: "tip",
    title: "Use t.Helper() in test utilities",
    description: "Call t.Helper() at the top of helper functions so that failure messages point to the calling test, not to the helper function line number.",
  },
];

// ── Testing Glossary (Go → JS) ─────────────────────────────────────

export const testGlossary: TestGlossaryTerm[] = [
  {
    goTool: "testify (assert/require)",
    jsEquivalent: "Jest (expect)",
    whatItDoes: "Assertion library — assert.Equal(t, want, got) vs expect(got).toBe(want)",
  },
  {
    goTool: "mockery",
    jsEquivalent: "jest.mock()",
    whatItDoes: "Auto-generates mock implementations from interfaces. Run mockery to regenerate.",
  },
  {
    goTool: "go test ./...",
    jsEquivalent: "npm test / jest",
    whatItDoes: "Built-in test runner. Finds *_test.go files automatically.",
  },
  {
    goTool: "httptest",
    jsEquivalent: "supertest",
    whatItDoes: "Stdlib package for testing HTTP handlers without starting a real server.",
  },
  {
    goTool: "t.Run(name, func)",
    jsEquivalent: "describe/it blocks",
    whatItDoes: "Creates named sub-tests. Enables running individual test cases.",
  },
  {
    goTool: "testing.T",
    jsEquivalent: "test context",
    whatItDoes: "Test context passed to every test function. Used for assertions, logging, and parallel control.",
  },
  {
    goTool: "Karate (.feature files)",
    jsEquivalent: "Cypress / Playwright",
    whatItDoes: "BDD-style API integration tests using Gherkin syntax (Given/When/Then).",
  },
  {
    goTool: "k6",
    jsEquivalent: "Artillery / Lighthouse CI",
    whatItDoes: "Load testing tool. Writes test scripts in JavaScript, runs from CLI.",
  },
];

// ── Mermaid Diagrams ────────────────────────────────────────────────

export const testingPyramidMermaid = `flowchart TD
  E2E["🔺 E2E & Load Tests<br/><i>~5% — minutes — Karate scenarios, k6</i>"]
  INT["🔶 Integration Tests<br/><i>~15% — seconds — Karate, httptest, Docker</i>"]
  UNIT["🟢 Unit Tests<br/><i>~80% — milliseconds — go test, testify, mockery</i>"]

  E2E --> INT --> UNIT

  style E2E fill:#1a1a2e,stroke:#e8705a,color:#f0c4bb,stroke-width:2px
  style INT fill:#1a1a2e,stroke:#e8a83a,color:#f0ddb0,stroke-width:2px
  style UNIT fill:#1a1a2e,stroke:#58b87a,color:#b8f0cb,stroke-width:3px`;

export const mockGenerationFlowMermaid = `sequenceDiagram
  participant DEV as Developer
  participant IFACE as Interface Definition
  participant MOCKERY as mockery CLI
  participant MOCKS as mocks/ directory
  participant TEST as Test File
  participant SVC as Service Under Test

  DEV->>IFACE: 1. Define interface (e.g., MerchantConnector)
  DEV->>MOCKERY: 2. Run 'mockery' command
  MOCKERY->>IFACE: Reads interface signatures
  MOCKERY->>MOCKS: 3. Generates MockMerchantConnector
  DEV->>TEST: 4. Write test using mock
  TEST->>MOCKS: Import MockMerchantConnector
  TEST->>SVC: Pass mock as dependency
  SVC-->>TEST: Returns result
  TEST->>TEST: 5. Assert expectations`;

export const connectorPatternMermaid = `flowchart LR
  subgraph Production["Production Path"]
    MAIN["main.go"] --> REAL_DEPS["Real Connectors<br/><i>merchant.NewClient()</i><br/><i>billing.NewClient()</i>"]
    REAL_DEPS --> SVC1["SubscriptionService"]
  end

  subgraph Testing["Test Path"]
    TEST["_test.go"] --> MOCK_DEPS["Mock Connectors<br/><i>mocks.NewMock...(t)</i>"]
    MOCK_DEPS --> SVC2["SubscriptionService"]
  end

  SVC1 -.- SAME["Same struct<br/>Same interface<br/>Different deps"]
  SVC2 -.- SAME

  style Production fill:#1a1a2e,stroke:#58b87a,color:#e8e8f0
  style Testing fill:#1a1a2e,stroke:#e8a83a,color:#e8e8f0
  style SAME fill:#1a1a2e,stroke:#4a8fe8,color:#b8d4f0`;

export const ciPipelineMermaid = `flowchart LR
  MR["Merge Request"] --> LINT["1. Lint<br/><i>golangci-lint</i>"]
  LINT --> UNIT["2. Unit Tests<br/><i>go test -race</i>"]
  UNIT --> COV["3. Coverage<br/><i>≥ 70% gate</i>"]
  COV --> BUILD["4. Build<br/><i>Go binary + Docker</i>"]
  BUILD --> INT["5. Integration<br/><i>Karate BDD</i>"]
  INT --> DEPLOY["6. Deploy<br/><i>ArgoCD</i>"]

  style MR fill:#1a1a2e,stroke:#6b7590,color:#e8e8f0
  style LINT fill:#1a1a2e,stroke:#7c6fcd,color:#c4bfef
  style UNIT fill:#1a1a2e,stroke:#58b87a,color:#b8f0cb
  style COV fill:#1a1a2e,stroke:#58b87a,color:#b8f0cb
  style BUILD fill:#1a1a2e,stroke:#4a8fe8,color:#b8d4f0
  style INT fill:#1a1a2e,stroke:#e8a83a,color:#f0ddb0
  style DEPLOY fill:#1a1a2e,stroke:#e8705a,color:#f0c4bb`;
