"use client";

import SectionLayout from "@/components/ui/SectionLayout";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import CodeBlock from "@/components/ui/CodeBlock";
import {
  openapiOverview,
  openapiSpecStructure,
  openapiConceptQA,
  openapiDataTypes,
  openapiSchemaComposition,
  openapiSecuritySchemes,
  openapiProductionEndpoints,
  openapiComparison,
  openapiBestPractices,
  openapiTools,
  openapiBsaQuestions,
  openapiSpecStructureDiagram,
  openapiRequestLifecycleDiagram,
  openapiAuthFlowDiagram,
} from "@/data/openapi";

// ─── Sidebar Definition ──────────────────────────────────────────────────────

const sidebarItems = [
  { id: "openapi-overview", label: "Overview & Benefits" },
  { id: "openapi-spec-structure", label: "Spec Structure" },
];

const serviceGroups = [...new Set(openapiProductionEndpoints.map((e) => e.service))];

const sidebarGroups = [
  {
    label: "Core Concepts",
    items: openapiConceptQA.map((q) => ({
      id: `openapi-concept-${q.num}`,
      label: `Q${q.num}: ${q.question.slice(0, 32)}…`,
    })),
  },
  {
    label: "Data Types & Schemas",
    items: [
      { id: "openapi-data-types", label: "Data Types & Formats" },
      ...openapiSchemaComposition.map((s) => ({
        id: `openapi-composition-${s.keyword}`,
        label: s.keyword,
      })),
    ],
  },
  {
    label: "Security Schemes",
    items: openapiSecuritySchemes.map((s) => ({
      id: `openapi-security-${s.type}`,
      label: s.name,
    })),
  },
  {
    label: "Production APIs",
    items: serviceGroups.map((svc) => ({
      id: `openapi-service-${svc.replace(/[\s()]/g, "-").toLowerCase()}`,
      label: svc,
    })),
  },
  {
    label: "Diagrams",
    items: [
      { id: "openapi-diag-structure", label: "Spec Structure" },
      { id: "openapi-diag-lifecycle", label: "Request Lifecycle" },
      { id: "openapi-diag-auth", label: "Auth Flows" },
    ],
  },
  {
    label: "Tools & Ecosystem",
    items: [{ id: "openapi-tools", label: "Tools Overview" }],
  },
  {
    label: "Comparison Matrix",
    items: [{ id: "openapi-comparison", label: "OpenAPI vs Swagger vs GraphQL vs gRPC" }],
  },
  {
    label: "Best Practices",
    items: [{ id: "openapi-best-practices", label: "API Design Best Practices" }],
  },
  {
    label: "BSA Interview Questions",
    items: openapiBsaQuestions.map((q) => ({
      id: `openapi-bsa-${q.num}`,
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

const methodColors: Record<string, string> = {
  GET: "blue",
  POST: "green",
  PUT: "amber",
  PATCH: "purple",
  DELETE: "coral",
};

const toolCategoryColors: Record<string, string> = {
  Documentation: "blue",
  "Code Generation": "green",
  Validation: "amber",
  Testing: "purple",
  Design: "teal",
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function OpenApiTab() {
  return (
    <SectionLayout label="Overview" items={sidebarItems} groups={sidebarGroups}>
      {(activeId) => {
        // ── Overview ──────────────────────────────────────────────
        if (activeId === "openapi-overview") {
          return (
            <div>
              <SectionTitle>OpenAPI 3.0 — The API Specification Standard</SectionTitle>
              <SectionDesc>{openapiOverview.what}</SectionDesc>

              <SubHeading>Why Use OpenAPI</SubHeading>
              <div className="space-y-2 mb-5">
                {openapiOverview.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-2.5 bg-arch-bg2 border border-arch-border rounded-lg p-3">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-arch-blue/15 text-arch-blue text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="text-[11px] text-arch-text2 leading-relaxed">{benefit}</div>
                  </div>
                ))}
              </div>

              <SubHeading>Version History</SubHeading>
              <DataTable headers={["Version", "Year", "Milestone"]}>
                {openapiOverview.versionHistory.map((v) => (
                  <tr key={v.version}>
                    <Td><Badge color={v.version.includes("3.0") ? "blue" : v.version.includes("3.1") ? "teal" : "amber"}>{v.version}</Badge></Td>
                    <Td className="font-medium text-arch-text">{v.year}</Td>
                    <Td className="text-[10.5px]">{v.milestone}</Td>
                  </tr>
                ))}
              </DataTable>
            </div>
          );
        }

        // ── Spec Structure ────────────────────────────────────────
        if (activeId === "openapi-spec-structure") {
          return (
            <div>
              <SectionTitle>OpenAPI 3.0 Document Structure</SectionTitle>
              <SectionDesc>{openapiSpecStructure.description}</SectionDesc>

              <DataTable headers={["Field", "Required", "Description"]}>
                {openapiSpecStructure.fields.map((f) => (
                  <tr key={f.field}>
                    <Td><code className="text-arch-blue text-[10px]">{f.field}</code></Td>
                    <Td>{f.required ? <Badge color="coral">Required</Badge> : <Badge color="teal">Optional</Badge>}</Td>
                    <Td className="text-[10.5px]">{f.description}</Td>
                  </tr>
                ))}
              </DataTable>

              <SubHeading>Complete Spec Example</SubHeading>
              <CodeBlock language="yaml">{openapiSpecStructure.yamlSnippet}</CodeBlock>
            </div>
          );
        }

        // ── Core Concept Q&A ──────────────────────────────────────
        const conceptMatch = activeId.match(/^openapi-concept-(\d+)$/);
        if (conceptMatch) {
          const num = parseInt(conceptMatch[1], 10);
          const qa = openapiConceptQA.find((q) => q.num === num);
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
              {qa.yamlSnippet && (
                <div className="mt-4">
                  <SubHeading>YAML Example</SubHeading>
                  <CodeBlock language="yaml">{qa.yamlSnippet}</CodeBlock>
                </div>
              )}
            </div>
          );
        }

        // ── Data Types ────────────────────────────────────────────
        if (activeId === "openapi-data-types") {
          return (
            <div>
              <SectionTitle>OpenAPI Data Types &amp; Formats</SectionTitle>
              <SectionDesc>OpenAPI uses a subset of JSON Schema for data type definitions. The &quot;type&quot; field specifies the base type, while &quot;format&quot; provides semantic meaning.</SectionDesc>
              <DataTable headers={["Type", "Format", "Description", "Example"]}>
                {openapiDataTypes.map((dt, i) => (
                  <tr key={i}>
                    <Td><code className="text-arch-purple text-[10px]">{dt.type}</code></Td>
                    <Td>{dt.format ? <code className="text-arch-teal text-[10px]">{dt.format}</code> : <span className="text-arch-text3 text-[10px]">—</span>}</Td>
                    <Td className="text-[10.5px]">{dt.description}</Td>
                    <Td><code className="text-arch-amber text-[10px]">{dt.example}</code></Td>
                  </tr>
                ))}
              </DataTable>
            </div>
          );
        }

        // ── Schema Composition ────────────────────────────────────
        const compositionMatch = activeId.match(/^openapi-composition-(.+)$/);
        if (compositionMatch) {
          const keyword = compositionMatch[1];
          const comp = openapiSchemaComposition.find((s) => s.keyword === keyword);
          if (!comp) return null;
          return (
            <div>
              <SectionTitle>{comp.keyword}</SectionTitle>
              <SectionDesc>{comp.description}</SectionDesc>
              <div className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5 mb-4">
                <div className="text-[9.5px] font-semibold text-arch-teal uppercase tracking-wider mb-1">Use Case</div>
                <div className="text-[10.5px] text-arch-text2">{comp.useCase}</div>
              </div>
              <CodeBlock language="yaml">{comp.yamlSnippet}</CodeBlock>
            </div>
          );
        }

        // ── Security Schemes ──────────────────────────────────────
        const securityMatch = activeId.match(/^openapi-security-(.+)$/);
        if (securityMatch) {
          const type = securityMatch[1];
          const scheme = openapiSecuritySchemes.find((s) => s.type === type);
          if (!scheme) return null;
          return (
            <div>
              <SectionTitle>{scheme.name} Authentication</SectionTitle>
              <SectionDesc>{scheme.description}</SectionDesc>
              <div className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5 mb-4">
                <div className="text-[9.5px] font-semibold text-arch-teal uppercase tracking-wider mb-1">Production Use Case</div>
                <div className="text-[10.5px] text-arch-text2 leading-relaxed">{scheme.productionUseCase}</div>
              </div>
              <SubHeading>OpenAPI Definition</SubHeading>
              <CodeBlock language="yaml">{scheme.yamlSnippet}</CodeBlock>
            </div>
          );
        }

        // ── Production Endpoints by Service ───────────────────────
        const serviceMatch = activeId.match(/^openapi-service-(.+)$/);
        if (serviceMatch) {
          const serviceSlug = serviceMatch[1];
          const matchingService = serviceGroups.find(
            (svc) => svc.replace(/[\s()]/g, "-").toLowerCase() === serviceSlug
          );
          if (!matchingService) return null;
          const endpoints = openapiProductionEndpoints.filter((e) => e.service === matchingService);
          return (
            <div>
              <SectionTitle>{matchingService} — API Endpoints</SectionTitle>
              <SectionDesc>Production API endpoints documented in OpenAPI spec format.</SectionDesc>
              <DataTable headers={["Method", "Path", "Summary", "Auth"]}>
                {endpoints.map((ep, i) => (
                  <tr key={i}>
                    <Td><Badge color={methodColors[ep.method] ?? "blue"}>{ep.method}</Badge></Td>
                    <Td><code className="text-arch-teal text-[10px]">{ep.path}</code></Td>
                    <Td className="text-[10.5px]">{ep.summary}</Td>
                    <Td className="text-[10.5px]">{ep.authScheme}</Td>
                  </tr>
                ))}
              </DataTable>
              <SubHeading>Endpoint Details</SubHeading>
              <div className="space-y-3">
                {endpoints.map((ep, i) => (
                  <div key={i} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge color={methodColors[ep.method] ?? "blue"}>{ep.method}</Badge>
                      <code className="text-[11px] text-arch-text font-medium">{ep.path}</code>
                    </div>
                    <div className="text-[11px] text-arch-text2 mb-2">{ep.summary}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {ep.requestBody && (
                        <div className="bg-arch-bg3 border border-arch-border rounded p-2">
                          <div className="text-[9px] font-semibold text-arch-amber uppercase tracking-wider mb-0.5">Request Body</div>
                          <code className="text-[10px] text-arch-text2">{ep.requestBody}</code>
                        </div>
                      )}
                      <div className="bg-arch-bg3 border border-arch-border rounded p-2">
                        <div className="text-[9px] font-semibold text-arch-blue uppercase tracking-wider mb-0.5">Response</div>
                        <code className="text-[10px] text-arch-text2">{ep.responseSchema}</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Diagrams ──────────────────────────────────────────────
        if (activeId === "openapi-diag-structure") {
          return (
            <div>
              <SectionTitle>OpenAPI 3.0 Spec Structure</SectionTitle>
              <SectionDesc>Visual representation of how the top-level fields and components relate to each other.</SectionDesc>
              <MermaidDiagram chart={openapiSpecStructureDiagram} />
            </div>
          );
        }

        if (activeId === "openapi-diag-lifecycle") {
          return (
            <div>
              <SectionTitle>API Request Lifecycle</SectionTitle>
              <SectionDesc>How a request flows from client through the API gateway, validated against the OpenAPI spec, to the backend service.</SectionDesc>
              <MermaidDiagram chart={openapiRequestLifecycleDiagram} />
            </div>
          );
        }

        if (activeId === "openapi-diag-auth") {
          return (
            <div>
              <SectionTitle>Authentication Flows</SectionTitle>
              <SectionDesc>The three main security schemes defined in OpenAPI and how they work in production.</SectionDesc>
              <MermaidDiagram chart={openapiAuthFlowDiagram} />
            </div>
          );
        }

        // ── Tools & Ecosystem ─────────────────────────────────────
        if (activeId === "openapi-tools") {
          const categories = [...new Set(openapiTools.map((t) => t.category))];
          return (
            <div>
              <SectionTitle>OpenAPI Tools &amp; Ecosystem</SectionTitle>
              <SectionDesc>Key tools for working with OpenAPI specifications across the API lifecycle.</SectionDesc>
              {categories.map((cat) => {
                const tools = openapiTools.filter((t) => t.category === cat);
                return (
                  <div key={cat} className="mb-5">
                    <SubHeading>{cat}</SubHeading>
                    <div className="space-y-2">
                      {tools.map((tool) => (
                        <div key={tool.name} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge color={toolCategoryColors[tool.category] ?? "blue"}>{tool.name}</Badge>
                          </div>
                          <div className="text-[11px] text-arch-text2 leading-relaxed">{tool.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        // ── Comparison Matrix ─────────────────────────────────────
        if (activeId === "openapi-comparison") {
          return (
            <div>
              <SectionTitle>API Specification Comparison</SectionTitle>
              <SectionDesc>OpenAPI 3.0 vs Swagger 2.0 vs GraphQL vs gRPC across {openapiComparison.length} dimensions.</SectionDesc>
              <div className="overflow-x-auto">
                <DataTable headers={["Dimension", "OpenAPI 3.0", "Swagger 2.0", "GraphQL", "gRPC"]}>
                  {openapiComparison.map((row) => (
                    <tr key={row.dimension}>
                      <Td className="font-medium text-arch-text whitespace-nowrap">{row.dimension}</Td>
                      <Td className="text-[10.5px] min-w-[160px]">{row.openapi30}</Td>
                      <Td className="text-[10.5px] min-w-[140px]">{row.openapi20}</Td>
                      <Td className="text-[10.5px] min-w-[140px]">{row.graphql}</Td>
                      <Td className="text-[10.5px] min-w-[140px]">{row.grpc}</Td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            </div>
          );
        }

        // ── Best Practices ────────────────────────────────────────
        if (activeId === "openapi-best-practices") {
          return (
            <div>
              <SectionTitle>API Design Best Practices</SectionTitle>
              <SectionDesc>Guidelines for writing production-quality OpenAPI specifications.</SectionDesc>
              <div className="space-y-3">
                {openapiBestPractices.map((bp) => (
                  <div key={bp.title} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge color={
                        bp.category === "Naming" ? "blue"
                          : bp.category === "Versioning" ? "purple"
                          : bp.category === "Error Responses" ? "coral"
                          : bp.category === "Pagination" ? "teal"
                          : bp.category === "Deprecation" ? "amber"
                          : bp.category === "Security" ? "coral"
                          : bp.category === "Documentation" ? "green"
                          : "blue"
                      }>{bp.category}</Badge>
                      <span className="text-[11.5px] font-semibold text-arch-text">{bp.title}</span>
                    </div>
                    <div className="text-[11px] text-arch-text2 leading-relaxed mb-2">{bp.description}</div>
                    {bp.yamlSnippet && (
                      <CodeBlock language="yaml">{bp.yamlSnippet}</CodeBlock>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── BSA Interview Questions ───────────────────────────────
        const bsaMatch = activeId.match(/^openapi-bsa-(\d+)$/);
        if (bsaMatch) {
          const num = parseInt(bsaMatch[1], 10);
          const qa = openapiBsaQuestions.find((q) => q.num === num);
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
