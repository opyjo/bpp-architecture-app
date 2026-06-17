import type { ServiceDeepDive } from "./types";

export const flowRunnerApi: ServiceDeepDive = {
  id: "flow-runner",
  name: "flow-runner-api",
  displayName: "Flow Runner API",
  status: "active",
  accentColor: "purple",

  business: {
    purpose: "Orchestrates multi-step business flows across the subscription platform. Manages flow state in DynamoDB, coordinates step execution order, handles step failures with configurable retry and rollback strategies. Used for complex workflows that span multiple services.",
    domainContext: "Some subscription operations require coordinating multiple services in a specific order (e.g., validate account → check eligibility → provision merchant → log audit). flow-runner-api provides a generic orchestration engine that executes these multi-step flows with state tracking, retry, and compensation logic.",
    flows: [
      { flowNum: "5", title: "Place Order", role: "Orchestrates the multi-step order submission flow (qualify → submit → provision → audit)" },
      { flowNum: "6", title: "Activate Subscription", role: "Orchestrates activation steps (validate → provision → update status → notify)" },
      { flowNum: "15", title: "Account Recovery", role: "Orchestrates recovery workflows with multiple reconciliation steps" },
    ],
    stakeholders: [
      "reseller-service (triggers flow execution)",
      "All downstream services (participate as flow steps)",
      "Operations team (monitors flow execution and failures)",
    ],
    consumers: [
      "reseller-service → flow-runner-api (REST — triggers flow execution)",
    ],
    businessRules: [
      {
        rule: "Idempotent flow execution",
        description: "Flows can be safely retried — each step checks if it has already been executed before proceeding. DynamoDB conditional writes enforce this.",
        severity: "critical",
      },
      {
        rule: "Compensation on failure",
        description: "When a step fails after previous steps have succeeded, flow-runner executes compensation steps (rollback) in reverse order.",
        severity: "critical",
      },
      {
        rule: "Step timeout",
        description: "Each step has a configurable timeout. Steps that exceed their timeout are marked as FAILED and trigger the compensation flow.",
        severity: "important",
      },
      {
        rule: "Flow state persistence",
        description: "Flow state is persisted to DynamoDB after every step. Flows can be resumed after service restarts without losing progress.",
        severity: "important",
      },
    ],
    sla: {
      availability: "99.95%",
      latencyP99: "< 100ms (step coordination overhead)",
      notes: "flow-runner adds coordination overhead but doesn't include downstream step execution time. Total flow time depends on participant services.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Database", name: "DynamoDB", color: "amber" },
      { category: "API", name: "REST", color: "blue" },
    ],
    endpoints: [
      {
        method: "POST",
        path: "/v1/flows",
        description: "Start a new flow execution — returns flow ID for status tracking",
        request: `{
  "flowType": "ORDER_SUBMISSION | ACTIVATION | RECOVERY",
  "input": { ... },
  "correlationId": "string"
}`,
        response: `{
  "flowId": "flow_abc123",
  "status": "RUNNING",
  "currentStep": 1,
  "totalSteps": 4
}`,
      },
      {
        method: "GET",
        path: "/v1/flows/:flowId",
        description: "Get flow execution status and step details",
      },
      {
        method: "POST",
        path: "/v1/flows/:flowId/retry",
        description: "Retry a failed flow from the last failed step",
      },
    ],
    dataModel: [
      {
        entity: "flows (DynamoDB)",
        description: "Flow execution state with step-level tracking",
        fields: [
          { name: "PK", type: "STRING", note: "FLOW#<flowId>" },
          { name: "SK", type: "STRING", note: "FLOW#<flowId>" },
          { name: "flowId", type: "STRING" },
          { name: "flowType", type: "STRING", note: "ORDER_SUBMISSION | ACTIVATION | RECOVERY" },
          { name: "status", type: "STRING", note: "RUNNING | COMPLETED | FAILED | COMPENSATING" },
          { name: "currentStep", type: "NUMBER" },
          { name: "steps", type: "LIST", note: "Array of step definitions with status" },
          { name: "input", type: "MAP", note: "Flow input parameters" },
          { name: "correlationId", type: "STRING" },
          { name: "createdAt", type: "STRING" },
          { name: "updatedAt", type: "STRING" },
          { name: "ttl", type: "NUMBER", note: "Auto-cleanup after 30 days" },
        ],
      },
    ],
    dependencies: [
      { service: "reseller-service", direction: "upstream", protocol: "REST", description: "Triggers flow execution" },
      { service: "DynamoDB", direction: "downstream", protocol: "AWS SDK", description: "Flow state persistence with conditional writes" },
      { service: "Various services", direction: "downstream", protocol: "REST", description: "Calls participant services as flow steps" },
    ],
    kafkaEvents: [
      { topic: "flow.completed", event: "FlowCompleted", direction: "publishes", description: "Published when a flow successfully completes all steps" },
      { topic: "flow.failed", event: "FlowFailed", direction: "publishes", description: "Published when a flow fails and compensation completes" },
    ],
    errorPatterns: [
      { scenario: "Step timeout", handling: "Marks step as FAILED, triggers compensation flow", retry: "Configurable per step (1-3 retries before compensation)" },
      { scenario: "Compensation failure", handling: "Marks flow as COMPENSATION_FAILED, alerts ops team", retry: "Manual retry via admin API" },
      { scenario: "DynamoDB throttling", handling: "SDK auto-retry with exponential backoff", retry: "3 retries via AWS SDK" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas in production" },
      { aspect: "Database", description: "Amazon DynamoDB — on-demand capacity, conditional writes for idempotency" },
      { aspect: "Observability", description: "Flow execution dashboards, step latency metrics, failure rate alerts" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [
      {
        title: "Flow step executor with compensation",
        description: "Executes flow steps in order and triggers compensation on failure",
        code: `func (e *FlowExecutor) Execute(ctx context.Context, flow *Flow) error {
    for i, step := range flow.Steps {
        flow.CurrentStep = i
        if err := e.saveState(ctx, flow); err != nil {
            return fmt.Errorf("save state: %w", err)
        }

        if err := step.Execute(ctx); err != nil {
            flow.Status = StatusFailed
            e.saveState(ctx, flow)
            return e.compensate(ctx, flow, i)
        }

        step.Status = StepCompleted
    }

    flow.Status = StatusCompleted
    return e.saveState(ctx, flow)
}

func (e *FlowExecutor) compensate(ctx context.Context, flow *Flow, failedAt int) error {
    flow.Status = StatusCompensating
    for i := failedAt - 1; i >= 0; i-- {
        if flow.Steps[i].Compensate != nil {
            if err := flow.Steps[i].Compensate(ctx); err != nil {
                flow.Status = StatusCompensationFailed
                return fmt.Errorf("compensate step %d: %w", i, err)
            }
        }
    }
    return nil
}`,
        language: "go",
      },
    ],
  },
};

export const householdApi: ServiceDeepDive = {
  id: "household",
  name: "household-api",
  displayName: "Household API",
  status: "active",
  accentColor: "purple",

  business: {
    purpose: "Wraps CPM (Common Provisioning Management) — Bell's internal provisioning system. Returns equipment history, account-level data, and household information. Used during session generation to validate that the customer's account exists and is in good standing.",
    domainContext: "CPM is a legacy system with a complex SOAP/REST API. household-api provides a clean GraphQL interface over CPM, translating the internal data model into the subscription platform's domain language. It's the only service that directly communicates with CPM.",
    flows: [
      { flowNum: "3", title: "Start Session", role: "Validates account in CPM during generateSession — rejects invalid accounts" },
      { flowNum: "2", title: "Load Subscriptions", role: "subscriptions-aggregator-api calls household-api for CPM data to merge with PostgreSQL" },
    ],
    stakeholders: [
      "session-api (calls during generateSession for CPM validation)",
      "subscriptions-aggregator-api (calls for CPM subscription data)",
      "CPM (external system — Bell's provisioning platform)",
    ],
    consumers: [
      "AppSync → household-api (GraphQL resolver)",
      "subscriptions-aggregator-api → household-api (GraphQL — CPM data for merge)",
    ],
    businessRules: [
      {
        rule: "CPM is source of truth for equipment",
        description: "Equipment history and account-level data always comes from CPM. household-api never caches this data — every call goes to CPM.",
        severity: "critical",
      },
      {
        rule: "Account validation",
        description: "During session generation, household-api validates that the householdAccountNumber exists in CPM and the account is in ACTIVE status.",
        severity: "critical",
      },
      {
        rule: "Graceful CPM degradation",
        description: "If CPM is unavailable, household-api returns a degraded response with a flag indicating CPM was unreachable. Upstream services decide how to handle.",
        severity: "important",
      },
    ],
    sla: {
      availability: "99.9%",
      latencyP99: "< 500ms (depends on CPM response time)",
      notes: "Latency is dominated by CPM — household-api adds < 20ms overhead. CPM itself can be slow during peak hours.",
    },
  },

  technical: {
    techStack: [
      { category: "Framework", name: "gqlgen", color: "purple" },
      { category: "API", name: "GraphQL", color: "purple" },
      { category: "Integration", name: "CPM (SOAP/REST)", color: "amber" },
      { category: "Language", name: "Go", color: "teal" },
      { category: "Gateway", name: "AppSync", color: "blue" },
    ],
    endpoints: [
      {
        method: "POST",
        path: "/query (GraphQL)",
        description: "Query household account data from CPM",
        request: `query {
  household(accountNumber: "HH789") {
    accountNumber
    status
    accountType
    equipment {
      id
      type
      serialNumber
      status
    }
    services {
      id
      name
      status
      activatedAt
    }
  }
}`,
        response: `{
  "data": {
    "household": {
      "accountNumber": "HH789",
      "status": "ACTIVE",
      "accountType": "RESIDENTIAL",
      "equipment": [
        {
          "id": "eq_123",
          "type": "STB",
          "serialNumber": "SN-ABC",
          "status": "ACTIVE"
        }
      ],
      "services": [...]
    }
  }
}`,
      },
      {
        method: "POST",
        path: "/query (GraphQL)",
        description: "Validate account exists and is active in CPM",
        request: `query {
  validateAccount(householdAccountNumber: "HH789") {
    valid
    accountType
    reason
  }
}`,
      },
    ],
    dataModel: [],
    dependencies: [
      { service: "AppSync", direction: "upstream", protocol: "GraphQL", description: "GraphQL resolver via AppSync" },
      { service: "session-api", direction: "upstream", protocol: "GraphQL", description: "Account validation during session creation" },
      { service: "subscriptions-aggregator-api", direction: "upstream", protocol: "GraphQL", description: "CPM data for subscription merge" },
      { service: "CPM", direction: "downstream", protocol: "REST/SOAP", description: "Bell's internal provisioning system — source of truth for equipment and accounts" },
    ],
    kafkaEvents: [],
    errorPatterns: [
      { scenario: "CPM unavailable", handling: "Returns degraded response with cpmAvailable: false flag", retry: "Caller decides — session-api rejects, aggregator-api returns partial data" },
      { scenario: "Account not found in CPM", handling: "Returns valid: false with reason 'ACCOUNT_NOT_FOUND'", retry: "None — invalid account" },
      { scenario: "CPM timeout", handling: "Returns 504 Gateway Timeout after 10s", retry: "Caller retries (typically 1 retry)" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas in production" },
      { aspect: "Integration", description: "CPM accessed via internal network — no internet egress required" },
      { aspect: "Observability", description: "CPM response time tracking, degraded response rate alerts, account validation metrics" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [
      {
        title: "CPM client with graceful degradation",
        description: "Wraps CPM calls with timeout and degradation handling",
        code: `func (c *CPMClient) GetHousehold(ctx context.Context, accountNum string) (*Household, error) {
    ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
    defer cancel()

    resp, err := c.httpClient.Do(req.WithContext(ctx))
    if err != nil {
        if errors.Is(err, context.DeadlineExceeded) {
            return &Household{
                AccountNumber: accountNum,
                CPMAvailable:  false,
                DegradedReason: "CPM_TIMEOUT",
            }, nil
        }
        return nil, fmt.Errorf("cpm request: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode >= 500 {
        return &Household{
            AccountNumber:  accountNum,
            CPMAvailable:   false,
            DegradedReason: "CPM_ERROR",
        }, nil
    }

    return parseHouseholdResponse(resp)
}`,
        language: "go",
      },
    ],
  },
};

export const accountRecoveryApi: ServiceDeepDive = {
  id: "account-recovery",
  name: "account-recovery-api",
  displayName: "Account Recovery API",
  status: "active",
  accentColor: "purple",

  business: {
    purpose: "Handles account recovery workflows when subscription state becomes inconsistent. Provides APIs for operations teams to initiate recovery, view inconsistency reports, and track recovery progress. Uses core-processor-api for the actual reconciliation logic.",
    domainContext: "Subscription state can become inconsistent due to failed merchant callbacks, network issues, or partial failures during multi-step flows. account-recovery-api provides the user-facing API for the operations team to detect and fix these inconsistencies.",
    flows: [
      { flowNum: "15", title: "Account Recovery", role: "Provides recovery workflow management — initiates, tracks, and reports on recovery operations" },
    ],
    stakeholders: [
      "Operations team (primary user — initiates and monitors recovery)",
      "core-processor-api (performs the actual reconciliation)",
      "reseller-service (receives reconciliation results)",
    ],
    consumers: [
      "Admin portal → account-recovery-api (REST — recovery management)",
      "Scheduled Lambda → account-recovery-api (REST — automated inconsistency detection)",
    ],
    businessRules: [
      {
        rule: "Detection before recovery",
        description: "All recoveries must be preceded by an inconsistency detection scan. Blind recovery attempts are rejected.",
        severity: "critical",
      },
      {
        rule: "Approval for bulk recovery",
        description: "Bulk recovery operations (> 10 subscriptions) require manager approval before execution.",
        severity: "important",
      },
      {
        rule: "Recovery audit trail",
        description: "All recovery operations are logged to audit-api with full before/after state.",
        severity: "critical",
      },
    ],
    sla: {
      availability: "99.9%",
      latencyP99: "< 5s (recovery operations involve multiple service calls)",
      notes: "Recovery is a background operation — not on the customer-facing path. Latency is acceptable as operations teams expect longer processing times.",
    },
  },

  technical: {
    techStack: [
      { category: "Language", name: "Go", color: "teal" },
      { category: "Database", name: "PostgreSQL", color: "blue" },
      { category: "API", name: "REST", color: "blue" },
    ],
    endpoints: [
      {
        method: "POST",
        path: "/v1/recovery/scan",
        description: "Scan for state inconsistencies between PostgreSQL and merchant systems",
        request: `{
  "scope": "ALL | ACCOUNT | SUBSCRIPTION",
  "accountNumber": "string (optional)",
  "subscriptionId": "string (optional)"
}`,
      },
      {
        method: "POST",
        path: "/v1/recovery/execute",
        description: "Execute recovery for detected inconsistencies",
        request: `{
  "scanId": "string",
  "subscriptionIds": ["string"],
  "dryRun": false
}`,
      },
      {
        method: "GET",
        path: "/v1/recovery/:scanId",
        description: "Get scan results and recovery status",
      },
    ],
    dataModel: [
      {
        entity: "recovery_scans",
        description: "Records of inconsistency detection scans",
        fields: [
          { name: "id", type: "UUID", note: "Primary key" },
          { name: "scope", type: "VARCHAR(32)" },
          { name: "status", type: "VARCHAR(32)", note: "RUNNING | COMPLETED | FAILED" },
          { name: "inconsistencies_found", type: "INT" },
          { name: "recovered", type: "INT" },
          { name: "failed", type: "INT" },
          { name: "initiated_by", type: "VARCHAR(64)" },
          { name: "created_at", type: "TIMESTAMP" },
          { name: "completed_at", type: "TIMESTAMP" },
        ],
      },
    ],
    dependencies: [
      { service: "core-processor-api", direction: "downstream", protocol: "REST", description: "Performs the actual state reconciliation" },
      { service: "audit-api", direction: "downstream", protocol: "REST", description: "Logs all recovery operations" },
      { service: "PostgreSQL", direction: "downstream", protocol: "SQL", description: "Stores scan results and recovery history" },
    ],
    kafkaEvents: [],
    errorPatterns: [
      { scenario: "Scan timeout", handling: "Marks scan as PARTIAL — returns results collected so far", retry: "Re-scan with narrower scope" },
      { scenario: "Recovery failure", handling: "Marks individual subscription as RECOVERY_FAILED, continues with others", retry: "Manual retry via admin API" },
    ],
    infrastructure: [
      { aspect: "Runtime", description: "EKS (Kubernetes) — 2 replicas in production" },
      { aspect: "Database", description: "Amazon RDS PostgreSQL" },
      { aspect: "Observability", description: "Recovery success rate, scan duration, inconsistency detection metrics" },
      { aspect: "CI/CD", description: "GitLab CI → Docker → ECR → ArgoCD" },
    ],
    codePatterns: [],
  },
};

export const flowOrchestrationServices: ServiceDeepDive[] = [flowRunnerApi, householdApi, accountRecoveryApi];
