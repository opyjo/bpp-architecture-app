"use client";

import SectionLayout from "@/components/ui/SectionLayout";
import CodeBlock from "@/components/ui/CodeBlock";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import {
  microfrontends,
  mfeGroups,
  getMfeById,
  getMfesByGroup,
  type MicrofrontendAnalysis,
} from "@/data/microfrontends";

// ─── Sidebar Definition ──────────────────────────────────────────────────────

const sidebarItems = [
  { id: "mfe-overview", label: "Overview & Architecture" },
  { id: "mfe-comparison", label: "Comparison Matrix" },
  { id: "mfe-data-flow", label: "Data Flow Diagram" },
];

const sidebarGroups = mfeGroups.map((group) => ({
  label: group.label,
  items: group.mfeIds.flatMap((mfeId) => {
    const mfe = getMfeById(mfeId);
    if (!mfe) return [];
    return [
      { id: `mfe-${mfeId}-summary`, label: `${mfe.displayName}` },
      { id: `mfe-${mfeId}-screens`, label: `  Screens & Routes` },
      { id: `mfe-${mfeId}-integrations`, label: `  Integrations` },
      { id: `mfe-${mfeId}-operations`, label: `  Business Operations` },
      { id: `mfe-${mfeId}-entities`, label: `  Data Entities` },
      { id: `mfe-${mfeId}-rules`, label: `  Business Rules` },
    ];
  }),
}));

// ─── Shared Styles ───────────────────────────────────────────────────────────

const badgeColors: Record<string, string> = {
  blue: "bg-[rgba(74,143,232,0.12)] text-arch-blue border-[rgba(74,143,232,0.22)]",
  purple: "bg-[rgba(124,111,205,0.12)] text-arch-purple border-[rgba(124,111,205,0.22)]",
  teal: "bg-[rgba(62,184,154,0.12)] text-arch-teal border-[rgba(62,184,154,0.22)]",
  amber: "bg-[rgba(232,168,58,0.12)] text-arch-amber border-[rgba(232,168,58,0.22)]",
  green: "bg-[rgba(88,184,122,0.12)] text-[#58b87a] border-[rgba(88,184,122,0.22)]",
  coral: "bg-[rgba(232,112,90,0.12)] text-[#e8705a] border-[rgba(232,112,90,0.22)]",
};

const statusColors: Record<string, { bg: string; text: string }> = {
  production: { bg: "bg-[rgba(88,184,122,0.12)]", text: "text-[#58b87a]" },
  "active-development": { bg: "bg-[rgba(232,168,58,0.12)]", text: "text-arch-amber" },
  "internal-tool": { bg: "bg-[rgba(124,111,205,0.12)]", text: "text-arch-purple" },
};

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${badgeColors[color] ?? badgeColors.blue}`}>
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = statusColors[status] ?? statusColors.production;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${s.bg} ${s.text}`}>
      {status.replace("-", " ").toUpperCase()}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-semibold text-arch-text mb-1">{children}</div>;
}

function SectionDesc({ children }: { children: React.ReactNode }) {
  return <div className="text-[11.5px] text-arch-text2 mb-4 leading-relaxed">{children}</div>;
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <div className="text-[12px] font-semibold text-arch-text mt-5 mb-2">{children}</div>;
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

// ─── MFE Card for Overview ───────────────────────────────────────────────────

function MfeOverviewCard({ mfe }: { mfe: MicrofrontendAnalysis }) {
  return (
    <div className="bg-arch-bg2 border border-arch-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full" style={{ background: `var(--arch-${mfe.accentColor})` }} />
        <span className="text-[12px] font-semibold text-arch-text">{mfe.displayName}</span>
        <StatusBadge status={mfe.status} />
      </div>
      <div className="text-[10.5px] text-arch-text2 leading-relaxed mb-3">{mfe.summary.slice(0, 180)}...</div>
      <div className="flex flex-wrap gap-1.5">
        <Badge color={mfe.accentColor}>{mfe.businessDomain.split("(")[0].trim()}</Badge>
        <Badge color="blue">{mfe.screens.length} screens</Badge>
        <Badge color="purple">{mfe.integrations.length} integrations</Badge>
      </div>
    </div>
  );
}

// ─── MFE Detail Sections ─────────────────────────────────────────────────────

function MfeSummarySection({ mfe }: { mfe: MicrofrontendAnalysis }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <SectionTitle>{mfe.displayName}</SectionTitle>
        <StatusBadge status={mfe.status} />
        <span className="text-[10px] text-arch-text3 font-mono">v{mfe.version}</span>
      </div>
      <SectionDesc>{mfe.summary}</SectionDesc>

      <div className="bg-arch-bg3 border border-arch-border rounded-lg p-4 mb-4">
        <div className="text-[10.5px] font-semibold text-arch-blue mb-2">Business Domain</div>
        <div className="text-[11px] text-arch-text2">{mfe.businessDomain}</div>
      </div>

      <SubHeading>Tech Stack</SubHeading>
      <div className="flex flex-wrap gap-2 mb-4">
        {mfe.techStack.map((t) => (
          <div key={t.category} className="bg-arch-bg2 border border-arch-border rounded-md px-2.5 py-1.5">
            <div className="text-[9px] font-semibold text-arch-text3 uppercase tracking-wider">{t.category}</div>
            <div className="text-[11px] text-arch-text mt-0.5">{t.name}</div>
          </div>
        ))}
      </div>

      <SubHeading>Business Value</SubHeading>
      <div className="space-y-1.5">
        {mfe.businessValue.map((v, i) => (
          <div key={i} className="flex items-start gap-2 text-[11px] text-arch-text2">
            <span className="text-arch-green mt-0.5 shrink-0">&#10003;</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MfeScreensSection({ mfe }: { mfe: MicrofrontendAnalysis }) {
  return (
    <div>
      <SectionTitle>{mfe.displayName} &mdash; Screens & Routes</SectionTitle>
      <SectionDesc>{mfe.screens.length} screens/views identified in this microfrontend.</SectionDesc>
      <DataTable headers={["Screen", "Route", "Business Purpose"]}>
        {mfe.screens.map((s) => (
          <tr key={s.name}>
            <Td className="font-medium text-arch-text whitespace-nowrap">{s.name}</Td>
            <Td><code className="text-arch-teal text-[10px] bg-arch-bg3 px-1 py-0.5 rounded">{s.route}</code></Td>
            <Td>{s.purpose}</Td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

function MfeIntegrationsSection({ mfe }: { mfe: MicrofrontendAnalysis }) {
  const typeColors: Record<string, string> = {
    GraphQL: "purple",
    REST: "blue",
    OAuth: "amber",
    SAML: "amber",
    CMS: "teal",
    Analytics: "coral",
    "Feature Flags": "green",
    "Module Federation": "blue",
  };
  return (
    <div>
      <SectionTitle>{mfe.displayName} &mdash; Integrations</SectionTitle>
      <SectionDesc>External systems and APIs this microfrontend connects to.</SectionDesc>
      <DataTable headers={["Integration", "Type", "Description"]}>
        {mfe.integrations.map((int) => (
          <tr key={int.name}>
            <Td className="font-medium text-arch-text whitespace-nowrap">{int.name}</Td>
            <Td><Badge color={typeColors[int.type] ?? "blue"}>{int.type}</Badge></Td>
            <Td>{int.description}</Td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

function MfeOperationsSection({ mfe }: { mfe: MicrofrontendAnalysis }) {
  return (
    <div>
      <SectionTitle>{mfe.displayName} &mdash; Business Operations</SectionTitle>
      <SectionDesc>Key business operations and transactions supported by this microfrontend.</SectionDesc>
      <DataTable headers={["Operation", "Description", ...(mfe.operations.some((o) => o.timing) ? ["Timing"] : [])]}>
        {mfe.operations.map((op) => (
          <tr key={op.operation}>
            <Td className="font-medium text-arch-text whitespace-nowrap">
              <code className="text-arch-blue text-[10.5px]">{op.operation}</code>
            </Td>
            <Td>{op.description}</Td>
            {mfe.operations.some((o) => o.timing) && (
              <Td>
                {op.timing && (
                  <Badge color={op.timing === "Same day" ? "green" : "amber"}>{op.timing}</Badge>
                )}
              </Td>
            )}
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

function MfeEntitiesSection({ mfe }: { mfe: MicrofrontendAnalysis }) {
  return (
    <div>
      <SectionTitle>{mfe.displayName} &mdash; Data Entities</SectionTitle>
      <SectionDesc>Core business entities and their key fields.</SectionDesc>
      <div className="space-y-3">
        {mfe.entities.map((entity) => (
          <div key={entity.name} className="bg-arch-bg2 border border-arch-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <code className="text-[11.5px] font-semibold text-arch-purple">{entity.name}</code>
            </div>
            <div className="text-[10.5px] text-arch-text2 mb-2">{entity.description}</div>
            <div className="flex flex-wrap gap-1">
              {entity.keyFields.map((f) => (
                <code key={f} className="text-[9.5px] text-arch-teal bg-arch-bg3 px-1.5 py-0.5 rounded border border-arch-border">
                  {f}
                </code>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MfeRulesSection({ mfe }: { mfe: MicrofrontendAnalysis }) {
  return (
    <div>
      <SectionTitle>{mfe.displayName} &mdash; Business Rules</SectionTitle>
      <SectionDesc>Key business rules, constraints, and validation logic.</SectionDesc>
      <div className="space-y-2">
        {mfe.businessRules.map((rule, i) => (
          <div key={i} className="flex items-start gap-2.5 bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2">
            <span className="text-arch-amber font-bold text-[11px] mt-0.5 shrink-0">{i + 1}.</span>
            <span className="text-[11px] text-arch-text2 leading-relaxed">{rule}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function MicrofrontendsTab() {
  return (
    <SectionLayout label="Overview" items={sidebarItems} groups={sidebarGroups}>
      {(activeId) => {
        // ── Overview ──────────────────────────────────────────────
        if (activeId === "mfe-overview") {
          return (
            <div>
              <SectionTitle>Microfrontends &mdash; BSA Analysis</SectionTitle>
              <SectionDesc>
                Business Systems Analyst review of all 10 microfrontends in the node-mono-real monorepo.
                Each microfrontend is a Next.js 14 application deployed via Module Federation, connected to AWS AppSync (GraphQL) and ~58 Go microservices.
              </SectionDesc>

              <div className="bg-arch-bg3 border border-arch-border rounded-lg p-4 mb-5">
                <div className="text-[11px] font-semibold text-arch-blue mb-2">Architecture Pattern</div>
                <div className="text-[11px] text-arch-text2 leading-relaxed">
                  All microfrontends follow the <strong>Backend-for-Frontend (BFF)</strong> pattern with Next.js 14, using Module Federation for independent deployment.
                  The frontend layer connects to AWS AppSync (GraphQL) which routes to Go microservices. Kafka handles async communication between services.
                  Each MFE has its own BFF layer, auth middleware, feature flags, and bilingual (EN/FR) support.
                </div>
              </div>

              <SubHeading>Microfrontend Groups</SubHeading>
              <div className="space-y-4 mb-5">
                {mfeGroups.map((group) => (
                  <div key={group.id} className="bg-arch-bg2 border border-arch-border rounded-lg p-4">
                    <div className="text-[11.5px] font-semibold text-arch-text mb-1">{group.label}</div>
                    <div className="text-[10.5px] text-arch-text2 mb-3">{group.description}</div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                      {getMfesByGroup(group.id).map((mfe) => (
                        <MfeOverviewCard key={mfe.id} mfe={mfe} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <SubHeading>Quick Stats</SubHeading>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total MFEs", value: "10", color: "blue" },
                  { label: "Total Screens", value: String(microfrontends.reduce((sum, m) => sum + m.screens.length, 0)), color: "purple" },
                  { label: "Total Integrations", value: String(microfrontends.reduce((sum, m) => sum + m.integrations.length, 0)), color: "teal" },
                  { label: "Total Operations", value: String(microfrontends.reduce((sum, m) => sum + m.operations.length, 0)), color: "amber" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-arch-bg2 border border-arch-border rounded-lg p-3 text-center">
                    <div className={`text-xl font-bold text-arch-${stat.color}`}>{stat.value}</div>
                    <div className="text-[10px] text-arch-text3 uppercase tracking-wider mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Comparison Matrix ─────────────────────────────────────
        if (activeId === "mfe-comparison") {
          return (
            <div>
              <SectionTitle>Microfrontend Comparison Matrix</SectionTitle>
              <SectionDesc>Side-by-side comparison of all 10 microfrontends from a BSA perspective.</SectionDesc>

              <div className="overflow-x-auto">
                <DataTable headers={["MFE", "Domain", "Status", "Screens", "Integrations", "Key Pattern"]}>
                  {microfrontends.map((mfe) => (
                    <tr key={mfe.id}>
                      <Td className="font-medium text-arch-text whitespace-nowrap">{mfe.displayName}</Td>
                      <Td><Badge color={mfe.accentColor}>{mfe.businessDomain.split("(")[0].trim().slice(0, 40)}</Badge></Td>
                      <Td><StatusBadge status={mfe.status} /></Td>
                      <Td className="text-center font-mono">{mfe.screens.length}</Td>
                      <Td className="text-center font-mono">{mfe.integrations.length}</Td>
                      <Td className="text-[10.5px]">{mfe.businessRules[0]?.slice(0, 60)}...</Td>
                    </tr>
                  ))}
                </DataTable>
              </div>

              <SubHeading>Integration Type Distribution</SubHeading>
              <div className="grid grid-cols-4 gap-2">
                {["GraphQL", "REST", "OAuth", "Feature Flags", "Module Federation", "Analytics", "CMS", "SAML"].map((type) => {
                  const count = microfrontends.reduce(
                    (sum, m) => sum + m.integrations.filter((i) => i.type === type).length,
                    0
                  );
                  if (count === 0) return null;
                  return (
                    <div key={type} className="bg-arch-bg2 border border-arch-border rounded-md px-3 py-2">
                      <div className="text-[14px] font-bold text-arch-text">{count}</div>
                      <div className="text-[10px] text-arch-text3">{type}</div>
                    </div>
                  );
                })}
              </div>

              <SubHeading>Tech Stack Commonalities</SubHeading>
              <DataTable headers={["Technology", "Used By", "Coverage"]}>
                {[
                  { tech: "Next.js 14", mfes: "All 10 MFEs", coverage: "100%" },
                  { tech: "Tailwind CSS", mfes: "All 10 MFEs", coverage: "100%" },
                  { tech: "Module Federation", mfes: "All 10 MFEs", coverage: "100%" },
                  { tech: "TanStack React Query", mfes: "8 MFEs", coverage: "80%" },
                  { tech: "OpenFeature (Feature Flags)", mfes: "6 MFEs", coverage: "60%" },
                  { tech: "GraphQL", mfes: "7 MFEs", coverage: "70%" },
                  { tech: "next-i18next", mfes: "4 MFEs", coverage: "40%" },
                  { tech: "NextAuth / OAuth2", mfes: "4 MFEs", coverage: "40%" },
                ].map((row) => (
                  <tr key={row.tech}>
                    <Td className="font-medium text-arch-text">{row.tech}</Td>
                    <Td>{row.mfes}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-arch-bg3 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-arch-blue rounded-full"
                            style={{ width: row.coverage }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-arch-text3">{row.coverage}</span>
                      </div>
                    </Td>
                  </tr>
                ))}
              </DataTable>
            </div>
          );
        }

        // ── Data Flow Diagram ─────────────────────────────────────
        if (activeId === "mfe-data-flow") {
          const diagram = `graph TB
  subgraph "Customer-Facing"
    SM["Subscription Manager"]
    MM["Membership Management"]
  end
  subgraph "Catalog & Contract Admin"
    CM["Catalog Management"]
    CTM["Contract Manager"]
  end
  subgraph "Business Rules & Config"
    PR["Policy Rules"]
    FC["Flow Configurator"]
    RM["Reseller Management"]
  end
  subgraph "Promotions"
    PL["Promocode Lookup"]
  end
  subgraph "Contingency & Ops"
    SMC["SM Contingency Container"]
    CMG["Contingency Management"]
  end

  subgraph "Shared Infrastructure"
    AS["AWS AppSync\\n(GraphQL Gateway)"]
    KF["Kafka\\n(Event Bus)"]
    FF["OpenFeature\\n(Feature Flags)"]
    AUTH["OAuth2 / SAML\\n(Auth Gateway)"]
  end

  subgraph "Backend"
    GO["~58 Go Microservices\\n(go-repo-new)"]
    DB[("PostgreSQL / DynamoDB")]
  end

  SM --> AS
  MM --> AS
  CM --> AS
  CTM --> AS
  PR --> AS
  RM --> AS
  PL --> AS
  CMG --> AS

  SMC -->|"Module Federation"| CMG

  AS --> GO
  GO --> DB
  GO <--> KF

  SM --> AUTH
  MM --> AUTH
  SMC --> AUTH

  SM --> FF
  CM --> FF
  PR --> FF
  PL --> FF
  CMG --> FF
  SMC --> FF

  style SM fill:#1a365d,stroke:#4a8fe8,color:#fff
  style MM fill:#2d2854,stroke:#7c6fcd,color:#fff
  style CM fill:#1a3a3a,stroke:#3eb89a,color:#fff
  style CTM fill:#3a2a1a,stroke:#e8a83a,color:#fff
  style PR fill:#1a3a2a,stroke:#58b87a,color:#fff
  style FC fill:#3a2020,stroke:#e8705a,color:#fff
  style RM fill:#2d2854,stroke:#7c6fcd,color:#fff
  style PL fill:#3a2a1a,stroke:#e8a83a,color:#fff
  style SMC fill:#3a2020,stroke:#e8705a,color:#fff
  style CMG fill:#1a365d,stroke:#4a8fe8,color:#fff
  style AS fill:#0f2440,stroke:#4a8fe8,color:#fff
  style KF fill:#0f2440,stroke:#e8a83a,color:#fff
  style GO fill:#0f2440,stroke:#3eb89a,color:#fff`;

          return (
            <div>
              <SectionTitle>Microfrontend Architecture &mdash; Data Flow</SectionTitle>
              <SectionDesc>
                How all 10 microfrontends connect to shared infrastructure and backend services.
              </SectionDesc>
              <MermaidDiagram chart={diagram} />

              <SubHeading>Architecture Highlights</SubHeading>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { title: "Module Federation", desc: "SM Contingency Container acts as the host app, loading Contingency Management as a remote module. All MFEs can be independently deployed.", color: "blue" },
                  { title: "GraphQL Gateway", desc: "AWS AppSync serves as the unified GraphQL gateway, routing queries/mutations to the appropriate Go microservices.", color: "purple" },
                  { title: "Event-Driven", desc: "Kafka provides async communication between Go microservices for order processing, notifications, and state synchronization.", color: "amber" },
                  { title: "Feature Flags", desc: "OpenFeature (with go-feature-flag provider) enables gradual rollouts and A/B testing across 6 of 10 MFEs.", color: "green" },
                  { title: "Auth Layer", desc: "OAuth2 for customer-facing apps, SAML 2.0 for internal contingency tools. NextAuth manages sessions.", color: "coral" },
                  { title: "Bilingual (EN/FR)", desc: "All MFEs support English and French via CMS translations, next-i18next, or custom translation contexts.", color: "teal" },
                ].map((item) => (
                  <div key={item.title} className="bg-arch-bg2 border border-arch-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge color={item.color}>{item.title}</Badge>
                    </div>
                    <div className="text-[10.5px] text-arch-text2 leading-relaxed">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Dynamic MFE Detail Sections ───────────────────────────
        for (const mfe of microfrontends) {
          if (activeId === `mfe-${mfe.id}-summary`) return <MfeSummarySection mfe={mfe} />;
          if (activeId === `mfe-${mfe.id}-screens`) return <MfeScreensSection mfe={mfe} />;
          if (activeId === `mfe-${mfe.id}-integrations`) return <MfeIntegrationsSection mfe={mfe} />;
          if (activeId === `mfe-${mfe.id}-operations`) return <MfeOperationsSection mfe={mfe} />;
          if (activeId === `mfe-${mfe.id}-entities`) return <MfeEntitiesSection mfe={mfe} />;
          if (activeId === `mfe-${mfe.id}-rules`) return <MfeRulesSection mfe={mfe} />;
        }

        return <div className="text-arch-text3 text-sm">Select a section from the sidebar.</div>;
      }}
    </SectionLayout>
  );
}
