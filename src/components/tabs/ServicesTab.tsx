"use client";

import SectionLayout from "@/components/ui/SectionLayout";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import CodeBlock from "@/components/ui/CodeBlock";
import { serviceDeepDives, getServiceById } from "@/data/service-deep-dives";
import type { ServiceDeepDive } from "@/data/service-deep-dives";

const sidebarItems = [
  { id: "svc-overview", label: "Overview" },
  { id: "svc-comparison", label: "Service comparison" },
];

const sidebarGroups = [
  {
    label: "reseller-service",
    items: [
      { id: "svc-reseller-biz", label: "Business perspective" },
      { id: "svc-reseller-tech", label: "Tech stack & endpoints" },
      { id: "svc-reseller-data", label: "Data model & schema" },
      { id: "svc-reseller-deps", label: "Dependencies & events" },
      { id: "svc-reseller-ops", label: "Infra & error handling" },
      { id: "svc-reseller-code", label: "Code patterns" },
    ],
  },
  {
    label: "subscription-manager-api \u26A0",
    items: [
      { id: "svc-submgr-biz", label: "Business perspective" },
      { id: "svc-submgr-migration", label: "Decomposition & migration" },
      { id: "svc-submgr-tech", label: "Legacy technical details" },
    ],
  },
  {
    label: "order-api",
    items: [
      { id: "svc-order-biz", label: "Business perspective" },
      { id: "svc-order-tech", label: "Tech stack & endpoints" },
      { id: "svc-order-data", label: "Data model & schema" },
      { id: "svc-order-deps", label: "Dependencies & events" },
      { id: "svc-order-ops", label: "Infra & error handling" },
      { id: "svc-order-code", label: "Code patterns" },
    ],
  },
  {
    label: "token-api",
    items: [
      { id: "svc-token-biz", label: "Business perspective" },
      { id: "svc-token-tech", label: "Tech stack & endpoints" },
      { id: "svc-token-data", label: "Data model & TTL" },
      { id: "svc-token-deps", label: "Dependencies" },
      { id: "svc-token-ops", label: "Infra & error handling" },
    ],
  },
];

const badgeColors: Record<string, string> = {
  purple: "bg-[rgba(124,111,205,0.12)] text-arch-purple border-[rgba(124,111,205,0.22)]",
  teal: "bg-[rgba(62,184,154,0.12)] text-arch-teal border-[rgba(62,184,154,0.22)]",
  blue: "bg-[rgba(74,143,232,0.12)] text-arch-blue border-[rgba(74,143,232,0.22)]",
  amber: "bg-[rgba(232,168,58,0.12)] text-arch-amber border-[rgba(232,168,58,0.22)]",
  green: "bg-[rgba(88,184,122,0.12)] text-[#58b87a] border-[rgba(88,184,122,0.22)]",
  coral: "bg-[rgba(232,112,90,0.12)] text-[#e8705a] border-[rgba(232,112,90,0.22)]",
};

const accentBorderColors: Record<string, string> = {
  amber: "rgba(232,168,58,0.5)",
  coral: "rgba(232,112,90,0.5)",
  blue: "rgba(74,143,232,0.5)",
  teal: "rgba(62,184,154,0.5)",
};

const severityBorders: Record<string, string> = {
  critical: "border-l-[#e8705a]",
  important: "border-l-arch-amber",
  standard: "border-l-arch-blue",
};

const severityBadgeColors: Record<string, string> = {
  critical: "coral",
  important: "amber",
  standard: "blue",
};

const methodColors: Record<string, string> = {
  GET: "green",
  POST: "blue",
  PUT: "amber",
  DELETE: "coral",
};

// ─── Helper Components ───────────────────────────────────────────────────────

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full border-collapse text-[11px] mb-3.5">
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function StatusBadge({ status }: { status: "active" | "decommissioned" }) {
  const color = status === "active" ? "green" : "coral";
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${badgeColors[color]}`}>
      {status === "active" ? "Active" : "Decommissioned"}
    </span>
  );
}

function ServiceCard({ svc }: { svc: ServiceDeepDive }) {
  return (
    <div
      className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5"
      style={{ borderLeftWidth: 3, borderLeftColor: accentBorderColors[svc.accentColor] }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[10.5px] px-1.5 py-0.5 rounded border font-medium ${badgeColors[svc.accentColor]}`}>
          {svc.name}
        </span>
        <StatusBadge status={svc.status} />
      </div>
      <div className="text-[12px] font-semibold text-arch-text mb-1">{svc.displayName}</div>
      <div className="text-[11px] text-arch-text2 leading-[1.65] mb-2">{svc.business.purpose.split(". ").slice(0, 2).join(". ")}.</div>
      <div className="flex flex-wrap gap-1.5">
        {svc.technical.techStack.slice(0, 4).map((t) => (
          <span key={t.name} className={`text-[9px] px-1 py-px rounded border font-medium ${badgeColors[t.color]}`}>
            {t.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function BusinessSection({ svc }: { svc: ServiceDeepDive }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <div className="text-sm font-semibold text-arch-text">{svc.displayName}</div>
        <StatusBadge status={svc.status} />
      </div>
      {svc.statusNote && (
        <div className="bg-[rgba(232,112,90,0.06)] border border-[rgba(232,112,90,0.2)] rounded-lg px-3 py-2 mb-3">
          <div className="text-[10.5px] font-semibold text-[#e8705a] mb-0.5">Decommissioned</div>
          <div className="text-[11px] text-arch-text2 leading-[1.65]">{svc.statusNote}</div>
        </div>
      )}

      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Purpose</div>
      <div className="text-[11.5px] text-arch-text2 leading-[1.7] mb-4">{svc.business.purpose}</div>

      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Domain context</div>
      <div className="text-[11.5px] text-arch-text2 leading-[1.7] mb-4">{svc.business.domainContext}</div>

      {/* Flows table */}
      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Flow participation</div>
      <DataTable headers={["Flow", "Title", "Role"]}>
        {svc.business.flows.map((f, i) => (
          <tr key={i}>
            <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-blue font-mono text-[10px] align-top leading-[1.6] whitespace-nowrap">#{f.flowNum}</td>
            <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text font-medium align-top leading-[1.6] whitespace-nowrap">{f.title}</td>
            <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{f.role}</td>
          </tr>
        ))}
      </DataTable>

      {/* Stakeholders */}
      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Stakeholders & consumers</div>
      <div className="bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2.5 mb-4">
        {svc.business.stakeholders.map((s, i) => (
          <div key={i} className="flex items-start gap-2 text-[11px] text-arch-text2 leading-[1.8]">
            <span className="text-arch-text3 mt-0.5 shrink-0">&#8226;</span>
            <span>{s}</span>
          </div>
        ))}
      </div>

      {/* Business rules */}
      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Business rules</div>
      <div className="space-y-2 mb-4">
        {svc.business.businessRules.map((br, i) => (
          <div
            key={i}
            className={`bg-arch-bg2 border border-arch-border rounded-lg p-3 border-l-[3px] ${severityBorders[br.severity]}`}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[9.5px] px-1.5 py-0.5 rounded border font-medium ${badgeColors[severityBadgeColors[br.severity]]}`}>
                {br.severity}
              </span>
              <span className="text-[12px] font-semibold text-arch-text">{br.rule}</span>
            </div>
            <div className="text-[11px] text-arch-text2 leading-[1.65]">{br.description}</div>
          </div>
        ))}
      </div>

      {/* SLA callout */}
      <div className="bg-[rgba(74,143,232,0.06)] border border-[rgba(74,143,232,0.2)] rounded-lg px-3 py-2.5">
        <div className="text-[10.5px] font-semibold text-arch-blue mb-1">SLA</div>
        <div className="flex gap-4 text-[11px] leading-[1.8] mb-1">
          <div className="flex gap-1.5">
            <span className="text-arch-text3">Availability:</span>
            <span className="text-arch-text font-medium">{svc.business.sla.availability}</span>
          </div>
          <div className="flex gap-1.5">
            <span className="text-arch-text3">P99 Latency:</span>
            <span className="text-arch-text font-medium">{svc.business.sla.latencyP99}</span>
          </div>
        </div>
        <div className="text-[10.5px] text-arch-text2 leading-[1.6]">{svc.business.sla.notes}</div>
      </div>
    </div>
  );
}

function TechStackSection({ svc }: { svc: ServiceDeepDive }) {
  return (
    <div>
      <div className="text-sm font-semibold text-arch-text mb-1">Tech stack & endpoints</div>
      <div className="text-[11.5px] text-arch-text3 mb-3">Technology choices and API surface for {svc.name}.</div>

      {/* Tech badges */}
      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Technology stack</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {svc.technical.techStack.map((t) => (
          <div key={t.name} className="bg-arch-bg2 border border-arch-border rounded-lg px-2.5 py-1.5 flex items-center gap-2">
            <span className={`text-[9.5px] px-1 py-px rounded border font-medium ${badgeColors[t.color]}`}>{t.category}</span>
            <span className="text-[11px] text-arch-text font-medium">{t.name}</span>
          </div>
        ))}
      </div>

      {/* Endpoints */}
      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">API endpoints</div>
      <div className="space-y-3">
        {svc.technical.endpoints.map((ep, i) => (
          <div key={i} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold font-mono ${badgeColors[methodColors[ep.method]]}`}>
                {ep.method}
              </span>
              <code className="text-[11px] font-mono text-arch-teal">{ep.path}</code>
            </div>
            <div className="text-[11px] text-arch-text2 leading-[1.65] mb-2">{ep.description}</div>
            {ep.request && (
              <div className="mb-1.5">
                <div className="text-[9.5px] font-semibold text-arch-text3 mb-0.5">Request</div>
                <CodeBlock language="json" comment="// Request payload">{ep.request}</CodeBlock>
              </div>
            )}
            {ep.response && (
              <div>
                <div className="text-[9.5px] font-semibold text-arch-text3 mb-0.5">Response</div>
                <CodeBlock language="json" comment="// Response">{ep.response}</CodeBlock>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DataModelSection({ svc }: { svc: ServiceDeepDive }) {
  return (
    <div>
      <div className="text-sm font-semibold text-arch-text mb-1">Data model & schema</div>
      <div className="text-[11.5px] text-arch-text3 mb-3">Database entities and their relationships for {svc.name}.</div>

      {svc.technical.dataModel.map((entity, i) => (
        <div key={i} className="mb-4">
          <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1">{entity.entity}</div>
          <div className="text-[11px] text-arch-text2 leading-[1.65] mb-2">{entity.description}</div>
          <DataTable headers={["Field", "Type", "Notes"]}>
            {entity.fields.map((f, j) => (
              <tr key={j}>
                <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-teal align-top leading-[1.6]">{f.name}</td>
                <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-purple align-top leading-[1.6]">{f.type}</td>
                <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{f.note || "—"}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      ))}

      {svc.technical.databaseSchema && (
        <div>
          <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">ER diagram</div>
          <div className="max-h-[400px] overflow-auto">
            <MermaidDiagram chart={svc.technical.databaseSchema} />
          </div>
        </div>
      )}
    </div>
  );
}

function DependenciesSection({ svc }: { svc: ServiceDeepDive }) {
  const upstream = svc.technical.dependencies.filter((d) => d.direction === "upstream");
  const downstream = svc.technical.dependencies.filter((d) => d.direction === "downstream");

  return (
    <div>
      <div className="text-sm font-semibold text-arch-text mb-1">Dependencies & events</div>
      <div className="text-[11.5px] text-arch-text3 mb-3">Service-to-service dependencies and Kafka event participation for {svc.name}.</div>

      {/* Two-column upstream / downstream */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Upstream (calls {svc.name})</div>
          {upstream.length > 0 ? upstream.map((d, i) => (
            <div key={i} className="bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2 mb-2">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-semibold text-arch-text">{d.service}</span>
                <span className={`text-[9px] px-1 py-px rounded border font-medium ${badgeColors.blue}`}>{d.protocol}</span>
              </div>
              <div className="text-[10.5px] text-arch-text2 leading-[1.6]">{d.description}</div>
            </div>
          )) : (
            <div className="text-[11px] text-arch-text3 italic">None documented</div>
          )}
        </div>
        <div>
          <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Downstream ({svc.name} calls)</div>
          {downstream.length > 0 ? downstream.map((d, i) => (
            <div key={i} className="bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2 mb-2">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-semibold text-arch-text">{d.service}</span>
                <span className={`text-[9px] px-1 py-px rounded border font-medium ${badgeColors.teal}`}>{d.protocol}</span>
              </div>
              <div className="text-[10.5px] text-arch-text2 leading-[1.6]">{d.description}</div>
            </div>
          )) : (
            <div className="text-[11px] text-arch-text3 italic">None documented</div>
          )}
        </div>
      </div>

      {/* Kafka events */}
      {svc.technical.kafkaEvents.length > 0 && (
        <>
          <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Kafka events</div>
          <DataTable headers={["Topic", "Event", "Direction", "Description"]}>
            {svc.technical.kafkaEvents.map((e, i) => (
              <tr key={i}>
                <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-teal align-top leading-[1.6]">{e.topic}</td>
                <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text font-medium align-top leading-[1.6]">{e.event}</td>
                <td className="px-2.5 py-1.5 border-b border-white/[0.04] align-top leading-[1.6]">
                  <span className={`text-[9.5px] px-1 py-px rounded border font-medium ${e.direction === "publishes" ? badgeColors.green : badgeColors.purple}`}>
                    {e.direction}
                  </span>
                </td>
                <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{e.description}</td>
              </tr>
            ))}
          </DataTable>
        </>
      )}
    </div>
  );
}

function OpsSection({ svc }: { svc: ServiceDeepDive }) {
  return (
    <div>
      <div className="text-sm font-semibold text-arch-text mb-1">Infrastructure & error handling</div>
      <div className="text-[11.5px] text-arch-text3 mb-3">Deployment, observability, and error patterns for {svc.name}.</div>

      {/* Infrastructure key-value list */}
      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Infrastructure</div>
      <div className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5 mb-4">
        {svc.technical.infrastructure.map((inf, i) => (
          <div key={i} className="flex gap-3 text-[11px] leading-[1.8]">
            <span className="text-arch-text3 shrink-0 w-24 font-medium">{inf.aspect}</span>
            <span className="text-arch-text2">{inf.description}</span>
          </div>
        ))}
      </div>

      {/* Error patterns */}
      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Error patterns</div>
      <DataTable headers={["Scenario", "Handling", "Retry strategy"]}>
        {svc.technical.errorPatterns.map((ep, i) => (
          <tr key={i}>
            <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text font-medium align-top leading-[1.6]">{ep.scenario}</td>
            <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{ep.handling}</td>
            <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{ep.retry || "—"}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

function CodeSection({ svc }: { svc: ServiceDeepDive }) {
  if (svc.technical.codePatterns.length === 0) return null;
  return (
    <div>
      <div className="text-sm font-semibold text-arch-text mb-1">Code patterns</div>
      <div className="text-[11.5px] text-arch-text3 mb-4">Key implementation patterns used in {svc.name}.</div>
      {svc.technical.codePatterns.map((cp, i) => (
        <div key={i} className="mb-4">
          <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-0.5">{cp.title}</div>
          <div className="text-[11px] text-arch-text2 leading-[1.65] mb-1.5">{cp.description}</div>
          <CodeBlock language={cp.language} comment={`// ${cp.title}`}>{cp.code}</CodeBlock>
        </div>
      ))}
    </div>
  );
}

function MigrationSection({ svc }: { svc: ServiceDeepDive }) {
  if (!svc.migration) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <div className="text-sm font-semibold text-arch-text">Decomposition & migration</div>
        <StatusBadge status="decommissioned" />
      </div>
      <div className="text-[11.5px] text-arch-text3 mb-3">Why {svc.name} was decomposed and what replaced it.</div>

      {/* Reason callout */}
      <div className="bg-[rgba(232,112,90,0.06)] border border-[rgba(232,112,90,0.2)] rounded-lg px-3 py-2.5 mb-4">
        <div className="text-[10.5px] font-semibold text-[#e8705a] mb-0.5">Why decomposed?</div>
        <div className="text-[11px] text-arch-text2 leading-[1.65]">{svc.migration.reason}</div>
      </div>

      {/* Replaced by */}
      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Replaced by</div>
      <div className="space-y-2 mb-4">
        {svc.migration.replacedBy.map((r, i) => (
          <div key={i} className="bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2 flex items-start gap-2">
            <span className={`text-[9.5px] px-1.5 py-0.5 rounded border font-medium mt-0.5 shrink-0 ${badgeColors.green}`}>New</span>
            <span className="text-[11px] text-arch-text2 leading-[1.65]">{r}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Migration timeline</div>
      <div className="bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2.5 text-[11px] text-arch-text2 leading-[1.7] mb-4">
        {svc.migration.timeline}
      </div>

      {/* Before/after table */}
      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Key architecture changes</div>
      <DataTable headers={["Before", "After", "Rationale"]}>
        {svc.migration.keyChanges.map((kc, i) => (
          <tr key={i}>
            <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-[#e8705a] align-top leading-[1.6]">{kc.before}</td>
            <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-[#58b87a] align-top leading-[1.6]">{kc.after}</td>
            <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{kc.rationale}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

// ─── Main Tab Component ──────────────────────────────────────────────────────

export default function ServicesTab() {
  return (
    <SectionLayout label="Overview" items={sidebarItems} groups={sidebarGroups}>
      {(activeId) => {
        // ── Overview ──────────────────────────────────────────────
        if (activeId === "svc-overview") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Service Deep Dives</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.7] mb-4">
                Exhaustive documentation for the four most critical services in the subscription management platform. Each deep dive covers business context, technical architecture, data models, dependencies, and operational patterns.
              </div>

              {/* Service cards grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {serviceDeepDives.map((svc) => (
                  <ServiceCard key={svc.id} svc={svc} />
                ))}
              </div>

              {/* Architecture note */}
              <div className="bg-[rgba(232,168,58,0.06)] border border-[rgba(232,168,58,0.2)] rounded-lg px-3 py-2.5">
                <div className="text-[10.5px] font-semibold text-arch-amber mb-0.5">Architecture note</div>
                <div className="text-[11px] text-arch-text2 leading-[1.65]">
                  <strong>subscription-manager-api</strong> was the original monolith handling both reads and writes. It was decomposed into <strong>reseller-service</strong> (writes) and <strong>subscriptions-aggregator-api</strong> (reads) for single-responsibility. The full migration story is documented in its deep dive.
                </div>
              </div>
            </div>
          );
        }

        // ── Service Comparison ────────────────────────────────────
        if (activeId === "svc-comparison") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Service comparison</div>
              <div className="text-[11.5px] text-arch-text3 mb-3">Side-by-side comparison of all four services across key dimensions.</div>
              <DataTable headers={["Dimension", "reseller-service", "subscription-manager-api", "order-api", "token-api"]}>
                {[
                  { dim: "Status", reseller: "Active", submgr: "Decommissioned", order: "Active", token: "Active" },
                  { dim: "Primary role", reseller: "Write orchestrator", submgr: "Legacy monolith", order: "Order state machine", token: "Payload tokenizer" },
                  { dim: "Language", reseller: "Go (Gin)", submgr: "Go (Gin)", order: "Go", token: "Go" },
                  { dim: "Database", reseller: "PostgreSQL", submgr: "PostgreSQL", order: "PostgreSQL", token: "Redis" },
                  { dim: "API style", reseller: "REST (via AppSync)", submgr: "REST (via AppSync)", order: "REST + GraphQL", token: "REST (direct)" },
                  { dim: "Kafka", reseller: "Publisher", submgr: "Publisher (historical)", order: "Consumer", token: "None" },
                  { dim: "Availability", reseller: "99.95%", submgr: "99.9% (historical)", order: "99.95%", token: "99.99%" },
                  { dim: "P99 Latency", reseller: "< 800ms / 2s", submgr: "< 1.5s (historical)", order: "< 200ms / 500ms", token: "< 15ms / 25ms" },
                  { dim: "Replicas", reseller: "3 (prod)", submgr: "N/A", order: "2 (prod)", token: "2 (prod)" },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text font-medium align-top leading-[1.6] whitespace-nowrap">{row.dim}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{row.reseller}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{row.submgr}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{row.order}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{row.token}</td>
                  </tr>
                ))}
              </DataTable>
            </div>
          );
        }

        // ── reseller-service sections ─────────────────────────────
        if (activeId === "svc-reseller-biz") {
          const svc = getServiceById("reseller")!;
          return <BusinessSection svc={svc} />;
        }
        if (activeId === "svc-reseller-tech") {
          const svc = getServiceById("reseller")!;
          return <TechStackSection svc={svc} />;
        }
        if (activeId === "svc-reseller-data") {
          const svc = getServiceById("reseller")!;
          return <DataModelSection svc={svc} />;
        }
        if (activeId === "svc-reseller-deps") {
          const svc = getServiceById("reseller")!;
          return <DependenciesSection svc={svc} />;
        }
        if (activeId === "svc-reseller-ops") {
          const svc = getServiceById("reseller")!;
          return <OpsSection svc={svc} />;
        }
        if (activeId === "svc-reseller-code") {
          const svc = getServiceById("reseller")!;
          return <CodeSection svc={svc} />;
        }

        // ── subscription-manager-api sections ─────────────────────
        if (activeId === "svc-submgr-biz") {
          const svc = getServiceById("subscription-manager")!;
          return <BusinessSection svc={svc} />;
        }
        if (activeId === "svc-submgr-migration") {
          const svc = getServiceById("subscription-manager")!;
          return <MigrationSection svc={svc} />;
        }
        if (activeId === "svc-submgr-tech") {
          const svc = getServiceById("subscription-manager")!;
          return (
            <div>
              <TechStackSection svc={svc} />
              <div className="mt-6">
                <OpsSection svc={svc} />
              </div>
            </div>
          );
        }

        // ── order-api sections ────────────────────────────────────
        if (activeId === "svc-order-biz") {
          const svc = getServiceById("order")!;
          return <BusinessSection svc={svc} />;
        }
        if (activeId === "svc-order-tech") {
          const svc = getServiceById("order")!;
          return <TechStackSection svc={svc} />;
        }
        if (activeId === "svc-order-data") {
          const svc = getServiceById("order")!;
          return <DataModelSection svc={svc} />;
        }
        if (activeId === "svc-order-deps") {
          const svc = getServiceById("order")!;
          return <DependenciesSection svc={svc} />;
        }
        if (activeId === "svc-order-ops") {
          const svc = getServiceById("order")!;
          return <OpsSection svc={svc} />;
        }
        if (activeId === "svc-order-code") {
          const svc = getServiceById("order")!;
          return <CodeSection svc={svc} />;
        }

        // ── token-api sections ────────────────────────────────────
        if (activeId === "svc-token-biz") {
          const svc = getServiceById("token")!;
          return <BusinessSection svc={svc} />;
        }
        if (activeId === "svc-token-tech") {
          const svc = getServiceById("token")!;
          return <TechStackSection svc={svc} />;
        }
        if (activeId === "svc-token-data") {
          const svc = getServiceById("token")!;
          return <DataModelSection svc={svc} />;
        }
        if (activeId === "svc-token-deps") {
          const svc = getServiceById("token")!;
          return <DependenciesSection svc={svc} />;
        }
        if (activeId === "svc-token-ops") {
          const svc = getServiceById("token")!;
          return <OpsSection svc={svc} />;
        }

        return null;
      }}
    </SectionLayout>
  );
}
