export type ServiceStatus = "active" | "decommissioned";

export interface ServiceDeepDive {
  id: string;
  name: string;
  displayName: string;
  status: ServiceStatus;
  statusNote?: string;
  accentColor: string;

  business: {
    purpose: string;
    domainContext: string;
    flows: { flowNum: string; title: string; role: string }[];
    stakeholders: string[];
    consumers: string[];
    businessRules: { rule: string; description: string; severity: "critical" | "important" | "standard" }[];
    sla: { availability: string; latencyP99: string; notes: string };
  };

  technical: {
    techStack: { category: string; name: string; color: string }[];
    endpoints: { method: string; path: string; description: string; request?: string; response?: string }[];
    dataModel: { entity: string; description: string; fields: { name: string; type: string; note?: string }[] }[];
    databaseSchema?: string;
    dependencies: { service: string; direction: "upstream" | "downstream"; protocol: string; description: string }[];
    kafkaEvents: { topic: string; event: string; direction: "publishes" | "consumes"; description: string }[];
    errorPatterns: { scenario: string; handling: string; retry?: string }[];
    infrastructure: { aspect: string; description: string }[];
    codePatterns: { title: string; description: string; code: string; language?: string }[];
  };

  migration?: {
    reason: string;
    replacedBy: string[];
    timeline: string;
    keyChanges: { before: string; after: string; rationale: string }[];
  };
}

// Merchant group (5 merchant-api-* as one section)
export interface MerchantApiInfo {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  provisioningModel: string;
  authMethod: string;
  callbackPattern: string;
  specificEndpoints: { method: string; path: string; description: string }[];
}

export interface MerchantGroupData {
  sharedPattern: {
    purpose: string;
    architecture: string;
    interfaceContract: string;
    commonEndpoints: { method: string; path: string; description: string }[];
    errorHandling: string;
    retryStrategy: string;
  };
  merchants: MerchantApiInfo[];
  comparisonRows: { dimension: string; values: Record<string, string> }[];
  flowParticipation: { flowNum: string; title: string; role: string }[];
  infrastructure: { aspect: string; description: string }[];
}

// Lambda overview (categorized, not individual deep dives)
export interface LambdaCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  lambdas: { name: string; purpose: string; trigger: string; targets: string[] }[];
}

export interface LambdaOverviewData {
  summary: string;
  totalCount: number;
  categories: LambdaCategory[];
  commonPatterns: { pattern: string; description: string; usedBy: string[] }[];
  infrastructure: { aspect: string; description: string }[];
}
