"use client";

import SectionLayout from "@/components/ui/SectionLayout";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import CodeBlock from "@/components/ui/CodeBlock";
import {
  apigeeOverview,
  apigeeArchitectureComponents,
  apigeeConceptQA,
  apigeePolicies,
  apigeeComparison,
  apigeeSetupSteps,
  apigeeBsaInterviewQuestions,
  bellArchitectureWithApigeeDiagram,
  requestFlowSequenceDiagram,
  proxyInternalsDiagram,
  policyExecutionFlowDiagram,
  goServicesIntegrationDiagram,
} from "@/data/apigee";

// ─── Sidebar Definition ──────────────────────────────────────────────────────

const sidebarItems = [
  { id: "apigee-overview", label: "Overview & Why Apigee" },
  { id: "apigee-arch", label: "Architecture Components" },
];

const sidebarGroups = [
  {
    label: "Core Concepts",
    items: [
      { id: "apigee-concept-1", label: "API Proxies" },
      { id: "apigee-concept-2", label: "Flows & Execution" },
      { id: "apigee-concept-3", label: "API Products & Apps" },
      { id: "apigee-concept-4", label: "Auth & Security" },
      { id: "apigee-concept-5", label: "Environments & Orgs" },
      { id: "apigee-concept-6", label: "Developer Apps" },
      { id: "apigee-concept-7", label: "API Versioning" },
      { id: "apigee-concept-8", label: "Shared Flows & Hooks" },
      { id: "apigee-concept-9", label: "CI/CD Integration" },
      { id: "apigee-concept-10", label: "Fault Handling" },
      { id: "apigee-concept-11", label: "Virtual Hosts" },
      { id: "apigee-concept-12", label: "Caching" },
    ],
  },
  {
    label: "Bell Canada Integration",
    items: [
      { id: "apigee-bell-arch", label: "Apigee in Bell Architecture" },
      { id: "apigee-bell-appsync", label: "Apigee vs AppSync" },
      { id: "apigee-bell-services", label: "Proxying Go Microservices" },
    ],
  },
  {
    label: "Policies (15+)",
    items: [
      { id: "apigee-policies-traffic", label: "Traffic Management" },
      { id: "apigee-policies-security", label: "Security" },
      { id: "apigee-policies-mediation", label: "Mediation" },
      { id: "apigee-policies-extension", label: "Extension" },
    ],
  },
  {
    label: "Diagrams",
    items: [
      { id: "apigee-diag-bell", label: "Bell + Apigee Architecture" },
      { id: "apigee-diag-request", label: "Request Flow Sequence" },
      { id: "apigee-diag-proxy", label: "Proxy Internals" },
      { id: "apigee-diag-policy", label: "Policy Execution Flow" },
      { id: "apigee-diag-services", label: "Go Services Integration" },
    ],
  },
  {
    label: "Hands-On Setup",
    items: apigeeSetupSteps.map((s) => ({
      id: `apigee-setup-${s.step}`,
      label: `${s.step}. ${s.title}`,
    })),
  },
  {
    label: "Gateway Comparison",
    items: [{ id: "apigee-comparison", label: "Apigee vs Kong vs AWS vs Azure" }],
  },
  {
    label: "BSA Interview Questions",
    items: apigeeBsaInterviewQuestions.map((q) => ({
      id: `apigee-bsa-${q.num}`,
      label: `Q${q.num}: ${q.question.slice(0, 32)}…`,
    })),
  },
];

// ─── Shared Styles ───────────────────────────────────────────────────────────

const badgeColors: Record<string, string> = {
  purple: "bg-[rgba(124,111,205,0.12)] text-arch-purple border-[rgba(124,111,205,0.22)]",
  teal: "bg-[rgba(62,184,154,0.12)] text-arch-teal border-[rgba(62,184,154,0.22)]",
  blue: "bg-[rgba(74,143,232,0.12)] text-arch-blue border-[rgba(74,143,232,0.22)]",
  amber: "bg-[rgba(232,168,58,0.12)] text-arch-amber border-[rgba(232,168,58,0.22)]",
  green: "bg-[rgba(88,184,122,0.12)] text-[#58b87a] border-[rgba(88,184,122,0.22)]",
  coral: "bg-[rgba(232,112,90,0.12)] text-[#e8705a] border-[rgba(232,112,90,0.22)]",
};

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${badgeColors[color] ?? badgeColors.blue}`}>
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-semibold text-arch-text mb-1">{children}</div>;
}

function SectionDesc({ children }: { children: React.ReactNode }) {
  return <div className="text-[11.5px] text-arch-text2 mb-4 leading-relaxed">{children}</div>;
}

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full border-collapse text-[11px] mb-3.5">
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-2.5 py-2 border-b border-arch-border text-arch-text2 align-top ${className}`}>
      {children}
    </td>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <div className="text-[12px] font-semibold text-arch-text mt-5 mb-2">{children}</div>;
}

const categoryColors: Record<string, string> = {
  Traffic: "blue",
  Security: "coral",
  Mediation: "teal",
  Extension: "purple",
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ApigeeTab() {
  return (
    <SectionLayout label="Overview" items={sidebarItems} groups={sidebarGroups}>
      {(activeId) => {
        // ── Overview ──────────────────────────────────────────────
        if (activeId === "apigee-overview") {
          return (
            <div>
              <SectionTitle>Apigee — Google&apos;s Enterprise API Management Platform</SectionTitle>
              <SectionDesc>{apigeeOverview.what}</SectionDesc>

              <SubHeading>Why Enterprises Use Apigee</SubHeading>
              <div className="space-y-2 mb-5">
                {apigeeOverview.why.map((reason, i) => (
                  <div key={i} className="flex items-start gap-2.5 bg-arch-bg2 border border-arch-border rounded-lg p-3">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-arch-blue/15 text-arch-blue text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="text-[11px] text-arch-text2 leading-relaxed">{reason}</div>
                  </div>
                ))}
              </div>

              <SubHeading>Apigee Editions</SubHeading>
              <div className="grid grid-cols-1 gap-2">
                {apigeeOverview.editions.map((ed) => (
                  <div key={ed.name} className="bg-arch-bg2 border border-arch-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge color={ed.name.includes("X") ? "blue" : ed.name.includes("hybrid") ? "teal" : "amber"}>{ed.name}</Badge>
                    </div>
                    <div className="text-[10.5px] text-arch-text2">{ed.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Architecture Components ───────────────────────────────
        if (activeId === "apigee-arch") {
          return (
            <div>
              <SectionTitle>Apigee Architecture Components</SectionTitle>
              <SectionDesc>Key components of the Apigee platform and how they map to Bell Canada&apos;s current architecture.</SectionDesc>
              <div className="space-y-3">
                {apigeeArchitectureComponents.map((comp) => (
                  <div key={comp.component} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5">
                    <div className="text-[11.5px] font-semibold text-arch-text mb-1.5">{comp.component}</div>
                    <div className="text-[11px] text-arch-text2 leading-relaxed mb-2">{comp.role}</div>
                    <div className="bg-arch-bg3 border border-arch-border rounded p-2.5">
                      <div className="text-[9.5px] font-semibold text-arch-teal uppercase tracking-wider mb-1">Bell Canada Parallel</div>
                      <div className="text-[10.5px] text-arch-text2">{comp.bellParallel}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Core Concept Q&A ──────────────────────────────────────
        const conceptMatch = activeId.match(/^apigee-concept-(\d+)$/);
        if (conceptMatch) {
          const num = parseInt(conceptMatch[1], 10);
          const qa = apigeeConceptQA.find((q) => q.num === num);
          if (!qa) return null;
          return (
            <div>
              <SectionTitle>Q{qa.num}: {qa.question}</SectionTitle>
              <div className="bg-arch-bg2 border border-arch-border rounded-lg p-4 mt-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-arch-blue/15 text-arch-blue text-[11px] font-bold flex items-center justify-center">
                    A
                  </span>
                  <span className="text-[10px] font-semibold text-arch-text3 uppercase tracking-wider">Answer</span>
                </div>
                <div className="text-[11.5px] text-arch-text2 leading-[1.7] whitespace-pre-line">{qa.answer}</div>
              </div>
            </div>
          );
        }

        // ── Bell Canada Integration: Architecture ─────────────────
        if (activeId === "apigee-bell-arch") {
          return (
            <div>
              <SectionTitle>Apigee in Bell Canada Architecture</SectionTitle>
              <SectionDesc>How Apigee fits into the existing Bell Canada Subscription Management Platform.</SectionDesc>

              <div className="space-y-3 mb-5">
                {[
                  {
                    label: "Current State",
                    color: "amber",
                    text: "AppSync = GraphQL gateway for mutations (5 resolvers). aggregator-api = REST for reads. BFF handles auth and proxying. No developer portal, no rate limiting, no monetization.",
                  },
                  {
                    label: "With Apigee",
                    color: "blue",
                    text: "Apigee sits in front of BFF or replaces AppSync for external-facing APIs. Adds: developer portal for partner onboarding, SpikeArrest + Quota for traffic management, OAuth2 at gateway level, API analytics, and monetization capabilities.",
                  },
                  {
                    label: "Migration Strategy",
                    color: "teal",
                    text: "Phase 1: Deploy Apigee in parallel (shadow mode). Phase 2: Migrate REST reads (aggregator-api — lower risk). Phase 3: Migrate GraphQL mutations via REST proxies. Phase 4: Decommission AppSync resolvers.",
                  },
                ].map((item) => (
                  <div key={item.label} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5">
                    <Badge color={item.color}>{item.label}</Badge>
                    <div className="text-[11px] text-arch-text2 leading-relaxed mt-2">{item.text}</div>
                  </div>
                ))}
              </div>

              <SubHeading>Architecture Mapping</SubHeading>
              <DataTable headers={["Current (AppSync)", "With Apigee", "Benefit"]}>
                {[
                  { current: "AppSync resolvers", apigee: "Apigee API proxies", benefit: "Richer policy framework, no VTL" },
                  { current: "Cognito/Auth0 authorizers", apigee: "OAuthV2 + VerifyJWT policies", benefit: "Unified auth at gateway" },
                  { current: "No rate limiting", apigee: "SpikeArrest + Quota", benefit: "Backend protection, SLA enforcement" },
                  { current: "CloudWatch metrics", apigee: "Apigee Analytics + BigQuery", benefit: "API-specific dashboards, developer metrics" },
                  { current: "No developer portal", apigee: "Drupal-based developer portal", benefit: "Self-service partner onboarding" },
                  { current: "No monetization", apigee: "Built-in monetization engine", benefit: "Revenue from API access" },
                  { current: "VTL mapping templates", apigee: "AssignMessage + ExtractVariables", benefit: "More readable, debuggable transforms" },
                ].map((row, i) => (
                  <tr key={i}>
                    <Td><code className="text-arch-amber text-[10px]">{row.current}</code></Td>
                    <Td><code className="text-arch-blue text-[10px]">{row.apigee}</code></Td>
                    <Td className="text-[10.5px]">{row.benefit}</Td>
                  </tr>
                ))}
              </DataTable>
            </div>
          );
        }

        // ── Bell Canada Integration: vs AppSync ───────────────────
        if (activeId === "apigee-bell-appsync") {
          return (
            <div>
              <SectionTitle>Apigee vs AppSync — Detailed Comparison</SectionTitle>
              <SectionDesc>Comparing the current AppSync-based architecture with an Apigee-based approach for Bell Canada.</SectionDesc>
              <DataTable headers={["Capability", "AppSync (Current)", "Apigee (Proposed)"]}>
                {[
                  { cap: "Protocol", current: "GraphQL native", proposed: "REST + GraphQL proxy (Apigee X)" },
                  { cap: "Auth model", current: "Cognito authorizer, Auth0 for dev", proposed: "OAuthV2, JWT, API Key — all built-in policies" },
                  { cap: "Rate limiting", current: "None (relies on backend)", proposed: "SpikeArrest per-second + Quota per-day" },
                  { cap: "Transforms", current: "VTL (Velocity Template Language)", proposed: "AssignMessage, ExtractVariables, JavaScript" },
                  { cap: "Developer portal", current: "Not available", proposed: "Built-in Drupal portal with self-service" },
                  { cap: "Analytics", current: "CloudWatch + custom Datadog", proposed: "Built-in API analytics + BigQuery export" },
                  { cap: "Monetization", current: "Not available", proposed: "Built-in: per-call, tiered, freemium pricing" },
                  { cap: "Multi-cloud", current: "AWS-only", proposed: "Hybrid: management on GCP, runtime on EKS (K8s)" },
                  { cap: "Caching", current: "AppSync response cache", proposed: "ResponseCache policy + L1/L2 cache" },
                  { cap: "CI/CD", current: "CDK + CloudFormation", proposed: "apigeecli, Terraform, Management API" },
                  { cap: "Error handling", current: "VTL error templates", proposed: "FaultRules + DefaultFaultRule (XML-based)" },
                  { cap: "Versioning", current: "Schema evolution", proposed: "URL path versioning + revision system" },
                ].map((row, i) => (
                  <tr key={i}>
                    <Td className="font-medium text-arch-text whitespace-nowrap">{row.cap}</Td>
                    <Td className="text-[10.5px]">{row.current}</Td>
                    <Td className="text-[10.5px]">{row.proposed}</Td>
                  </tr>
                ))}
              </DataTable>
            </div>
          );
        }

        // ── Bell Canada Integration: Proxying Go Services ─────────
        if (activeId === "apigee-bell-services") {
          return (
            <div>
              <SectionTitle>Proxying Go Microservices Through Apigee</SectionTitle>
              <SectionDesc>How each Go service maps to an Apigee API proxy with specific policy configurations.</SectionDesc>
              <DataTable headers={["Go Service", "Proxy Base Path", "Key Policies", "Cache TTL"]}>
                {[
                  { service: "reseller-service", path: "/v1/subscriptions/*", policies: "OAuthV2, SpikeArrest(100/s), Quota(10K/day)", cache: "None (writes)" },
                  { service: "order-api", path: "/v1/orders/*", policies: "VerifyAPIKey, ResponseCache", cache: "5 min" },
                  { service: "household-api", path: "/v1/households/*", policies: "OAuthV2, ResponseCache, ServiceCallout", cache: "30 min" },
                  { service: "subscription-configurator-api", path: "/v1/products/*", policies: "VerifyAPIKey, ResponseCache", cache: "24 hours" },
                  { service: "subscriptions-aggregator-api", path: "/v1/subscriptions", policies: "OAuthV2, ResponseCache", cache: "1 min" },
                  { service: "audit-api", path: "/v1/audit/*", policies: "OAuthV2 (admin scope), MessageLogging", cache: "None" },
                  { service: "auth-api", path: "/v1/auth/*", policies: "SpikeArrest(50/s), JSONThreatProtection", cache: "None" },
                ].map((row, i) => (
                  <tr key={i}>
                    <Td><code className="text-arch-purple text-[10px]">{row.service}</code></Td>
                    <Td><code className="text-arch-teal text-[10px]">{row.path}</code></Td>
                    <Td className="text-[10.5px]">{row.policies}</Td>
                    <Td className="text-[10.5px]">{row.cache}</Td>
                  </tr>
                ))}
              </DataTable>
            </div>
          );
        }

        // ── Policies by Category ──────────────────────────────────
        const policyMatch = activeId.match(/^apigee-policies-(.+)$/);
        if (policyMatch) {
          const categoryMap: Record<string, string> = {
            traffic: "Traffic",
            security: "Security",
            mediation: "Mediation",
            extension: "Extension",
          };
          const category = categoryMap[policyMatch[1]];
          if (!category) return null;
          const policies = apigeePolicies.filter((p) => p.category === category);
          const color = categoryColors[category];

          return (
            <div>
              <SectionTitle>{category} Policies</SectionTitle>
              <SectionDesc>
                {category === "Traffic" && "Control API traffic volume and protect backends from overload."}
                {category === "Security" && "Authenticate, authorize, and protect APIs from threats."}
                {category === "Mediation" && "Transform, extract, and route messages between consumers and backends."}
                {category === "Extension" && "Extend proxy behavior with callouts, scripts, and shared logic."}
              </SectionDesc>
              <div className="space-y-3">
                {policies.map((policy) => (
                  <div key={policy.name} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge color={color}>{policy.name}</Badge>
                    </div>
                    <div className="text-[11px] text-arch-text2 leading-relaxed mb-2">{policy.description}</div>
                    <div className="bg-arch-bg3 border border-arch-border rounded p-2.5 mb-2">
                      <div className="text-[9.5px] font-semibold text-arch-teal uppercase tracking-wider mb-1">Bell Canada Use Case</div>
                      <div className="text-[10.5px] text-arch-text2">{policy.bellUseCase}</div>
                    </div>
                    {policy.xmlSnippet && (
                      <CodeBlock language="xml">{policy.xmlSnippet}</CodeBlock>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Diagrams ──────────────────────────────────────────────
        if (activeId === "apigee-diag-bell") {
          return (
            <div>
              <SectionTitle>Bell Canada Architecture with Apigee</SectionTitle>
              <SectionDesc>How Apigee replaces/complements AppSync in the Bell Canada subscription management platform.</SectionDesc>
              <MermaidDiagram chart={bellArchitectureWithApigeeDiagram} />
            </div>
          );
        }

        if (activeId === "apigee-diag-request") {
          return (
            <div>
              <SectionTitle>Request Flow: Client → Apigee → Go Service</SectionTitle>
              <SectionDesc>Sequence diagram showing a subscription submission flowing through Apigee policies to the Go backend.</SectionDesc>
              <MermaidDiagram chart={requestFlowSequenceDiagram} />
            </div>
          );
        }

        if (activeId === "apigee-diag-proxy") {
          return (
            <div>
              <SectionTitle>API Proxy Internals</SectionTitle>
              <SectionDesc>How policies are organized within ProxyEndpoint and TargetEndpoint flows.</SectionDesc>
              <MermaidDiagram chart={proxyInternalsDiagram} />
            </div>
          );
        }

        if (activeId === "apigee-diag-policy") {
          return (
            <div>
              <SectionTitle>Policy Execution Flow</SectionTitle>
              <SectionDesc>Complete policy execution order: PreFlow → Conditional → PostFlow → Target → Response → FaultRules.</SectionDesc>
              <MermaidDiagram chart={policyExecutionFlowDiagram} />
            </div>
          );
        }

        if (activeId === "apigee-diag-services") {
          return (
            <div>
              <SectionTitle>Go Microservices Behind Apigee</SectionTitle>
              <SectionDesc>Each Go service from the Bell Canada repo mapped to an Apigee API proxy with specific policies.</SectionDesc>
              <MermaidDiagram chart={goServicesIntegrationDiagram} />
            </div>
          );
        }

        // ── Hands-On Setup Steps ──────────────────────────────────
        const setupMatch = activeId.match(/^apigee-setup-(\d+)$/);
        if (setupMatch) {
          const stepNum = parseInt(setupMatch[1], 10);
          const step = apigeeSetupSteps.find((s) => s.step === stepNum);
          if (!step) return null;
          return (
            <div>
              <SectionTitle>Step {step.step}: {step.title}</SectionTitle>
              <SectionDesc>{step.description}</SectionDesc>
              {step.code && (
                <CodeBlock language={step.codeLanguage ?? "bash"}>{step.code}</CodeBlock>
              )}
            </div>
          );
        }

        // ── Gateway Comparison ────────────────────────────────────
        if (activeId === "apigee-comparison") {
          return (
            <div>
              <SectionTitle>API Gateway Comparison</SectionTitle>
              <SectionDesc>Apigee vs Kong vs AWS API Gateway vs Azure APIM across {apigeeComparison.length} dimensions.</SectionDesc>
              <div className="overflow-x-auto">
                <DataTable headers={["Dimension", "Apigee", "Kong", "AWS API Gateway", "Azure APIM"]}>
                  {apigeeComparison.map((row) => (
                    <tr key={row.dimension}>
                      <Td className="font-medium text-arch-text whitespace-nowrap">{row.dimension}</Td>
                      <Td className="text-[10.5px] min-w-[160px]">{row.apigee}</Td>
                      <Td className="text-[10.5px] min-w-[160px]">{row.kong}</Td>
                      <Td className="text-[10.5px] min-w-[160px]">{row.awsApiGateway}</Td>
                      <Td className="text-[10.5px] min-w-[160px]">{row.azureApim}</Td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            </div>
          );
        }

        // ── BSA Interview Questions ───────────────────────────────
        const bsaMatch = activeId.match(/^apigee-bsa-(\d+)$/);
        if (bsaMatch) {
          const num = parseInt(bsaMatch[1], 10);
          const qa = apigeeBsaInterviewQuestions.find((q) => q.num === num);
          if (!qa) return null;
          return (
            <div>
              <SectionTitle>Q{qa.num}: {qa.question}</SectionTitle>
              <div className="bg-arch-bg2 border border-arch-border rounded-lg p-4 mt-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-arch-teal/15 text-arch-teal text-[11px] font-bold flex items-center justify-center">
                    A
                  </span>
                  <span className="text-[10px] font-semibold text-arch-text3 uppercase tracking-wider">Model Answer</span>
                </div>
                <div className="text-[11.5px] text-arch-text2 leading-[1.7] whitespace-pre-line">{qa.answer}</div>
              </div>
            </div>
          );
        }

        return null;
      }}
    </SectionLayout>
  );
}
