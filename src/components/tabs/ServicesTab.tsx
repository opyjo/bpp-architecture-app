"use client";

import SectionLayout from "@/components/ui/SectionLayout";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import CodeBlock from "@/components/ui/CodeBlock";
import {
  allServiceDeepDives,
  getServiceById,
  merchantGroupData,
} from "@/data/service-deep-dives";
import type { ServiceDeepDive, MerchantGroupData } from "@/data/service-deep-dives";

// ─── Sidebar Definition ──────────────────────────────────────────────────────

const sidebarItems = [
  { id: "svc-overview", label: "Overview" },
  { id: "svc-comparison", label: "Service comparison" },
];

const sidebarGroups = [
  // Core Subscription
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
      { id: "svc-subscription-manager-biz", label: "Business perspective" },
      { id: "svc-subscription-manager-migration", label: "Decomposition & migration" },
      { id: "svc-subscription-manager-tech", label: "Legacy technical details" },
    ],
  },
  {
    label: "subscriptions-aggregator-api",
    items: [
      { id: "svc-sub-aggregator-biz", label: "Business perspective" },
      { id: "svc-sub-aggregator-tech", label: "Tech stack & endpoints" },
      { id: "svc-sub-aggregator-data", label: "Data model" },
      { id: "svc-sub-aggregator-deps", label: "Dependencies" },
    ],
  },
  {
    label: "subscriber-manager-api",
    items: [
      { id: "svc-subscriber-manager-compact", label: "Overview & tech" },
      { id: "svc-subscriber-manager-deps", label: "Dependencies" },
    ],
  },
  {
    label: "subscription-configurator-api",
    items: [{ id: "svc-sub-configurator-compact", label: "Service overview" }],
  },
  {
    label: "subscription-consumer",
    items: [{ id: "svc-sub-consumer-compact", label: "Service overview" }],
  },
  // Merchants
  {
    label: "Merchant APIs (grouped)",
    items: [
      { id: "svc-merchants-shared", label: "Shared architecture" },
      { id: "svc-merchants-comparison", label: "Per-merchant comparison" },
      { id: "svc-merchants-deps", label: "Dependencies & flows" },
    ],
  },
  // Catalog & Products
  {
    label: "catalog-api",
    items: [
      { id: "svc-catalog-biz", label: "Business perspective" },
      { id: "svc-catalog-tech", label: "Tech stack & endpoints" },
      { id: "svc-catalog-data", label: "Data model & caching" },
      { id: "svc-catalog-deps", label: "Dependencies & events" },
    ],
  },
  {
    label: "catalog-manager",
    items: [{ id: "svc-catalog-manager-compact", label: "Service overview" }],
  },
  {
    label: "product-catalog-api",
    items: [{ id: "svc-product-catalog-compact", label: "Service overview" }],
  },
  // Auth & Session
  {
    label: "auth-api",
    items: [
      { id: "svc-auth-biz", label: "Business perspective" },
      { id: "svc-auth-tech", label: "Tech stack & endpoints" },
      { id: "svc-auth-deps", label: "Auth flows & tokens" },
      { id: "svc-auth-ops", label: "Dependencies" },
    ],
  },
  {
    label: "session-api",
    items: [
      { id: "svc-session-biz", label: "Business perspective" },
      { id: "svc-session-tech", label: "Tech stack & endpoints" },
      { id: "svc-session-data", label: "Data model (DynamoDB)" },
      { id: "svc-session-deps", label: "Dependencies" },
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
  {
    label: "disney-auth-api",
    items: [{ id: "svc-disney-auth-compact", label: "Service overview" }],
  },
  // Orders & Billing
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
    label: "core-processor-api",
    items: [
      { id: "svc-core-processor-compact", label: "Overview & tech" },
      { id: "svc-core-processor-deps", label: "Dependencies" },
    ],
  },
  {
    label: "audit-api",
    items: [
      { id: "svc-audit-biz", label: "Business perspective" },
      { id: "svc-audit-tech", label: "Tech stack & endpoints" },
      { id: "svc-audit-data", label: "Data model" },
      { id: "svc-audit-deps", label: "Dependencies & events" },
    ],
  },
  // Promotions
  {
    label: "promocodes-api",
    items: [
      { id: "svc-promocodes-biz", label: "Business perspective" },
      { id: "svc-promocodes-tech", label: "Tech stack & endpoints" },
      { id: "svc-promocodes-deps", label: "Dependencies & events" },
    ],
  },
  {
    label: "promoredeem-consumer",
    items: [{ id: "svc-promoredeem-consumer-compact", label: "Service overview" }],
  },
  {
    label: "promostream-consumer",
    items: [{ id: "svc-promostream-consumer-compact", label: "Service overview" }],
  },
  {
    label: "promo-migration-consumer",
    items: [{ id: "svc-promo-migration-consumer-compact", label: "Service overview" }],
  },
  // Events & Messaging
  {
    label: "event-hub",
    items: [
      { id: "svc-event-hub-biz", label: "Business perspective" },
      { id: "svc-event-hub-tech", label: "Tech & routing patterns" },
      { id: "svc-event-hub-deps", label: "Dependencies" },
    ],
  },
  {
    label: "event-publisher",
    items: [{ id: "svc-event-publisher-compact", label: "Service overview" }],
  },
  {
    label: "notification-consumer",
    items: [
      { id: "svc-notification-consumer-compact", label: "Overview & tech" },
      { id: "svc-notification-consumer-deps", label: "Dependencies & events" },
    ],
  },
  // Flow & Orchestration
  {
    label: "flow-runner-api",
    items: [
      { id: "svc-flow-runner-biz", label: "Business perspective" },
      { id: "svc-flow-runner-tech", label: "Tech & orchestration" },
      { id: "svc-flow-runner-deps", label: "Dependencies" },
    ],
  },
  {
    label: "household-api",
    items: [
      { id: "svc-household-biz", label: "Business perspective" },
      { id: "svc-household-tech", label: "Tech stack & endpoints" },
      { id: "svc-household-deps", label: "Dependencies" },
    ],
  },
  {
    label: "account-recovery-api",
    items: [
      { id: "svc-account-recovery-compact", label: "Overview & tech" },
      { id: "svc-account-recovery-deps", label: "Dependencies" },
    ],
  },
  // Infrastructure
  {
    label: "http-proxy-api",
    items: [{ id: "svc-http-proxy-compact", label: "Service overview" }],
  },
  {
    label: "email-api",
    items: [{ id: "svc-email-compact", label: "Service overview" }],
  },
  {
    label: "policy-rule-configurator",
    items: [{ id: "svc-policy-rule-config-compact", label: "Service overview" }],
  },
];

// ─── Color Maps ──────────────────────────────────────────────────────────────

const badgeColors: Record<string, string> = {
  purple: "bg-[rgba(124,111,205,0.12)] text-arch-purple border-[rgba(124,111,205,0.22)]",
  teal: "bg-[rgba(62,184,154,0.12)] text-arch-teal border-[rgba(62,184,154,0.22)]",
  blue: "bg-[rgba(74,143,232,0.12)] text-arch-blue border-[rgba(74,143,232,0.22)]",
  amber: "bg-[rgba(232,168,58,0.12)] text-arch-amber border-[rgba(232,168,58,0.22)]",
  green: "bg-[rgba(88,184,122,0.12)] text-[#58b87a] border-[rgba(88,184,122,0.22)]",
  coral: "bg-[rgba(232,112,90,0.12)] text-[#e8705a] border-[rgba(232,112,90,0.22)]",
  gray: "bg-[rgba(107,117,144,0.12)] text-[#9aa0b4] border-[rgba(107,117,144,0.22)]",
};

const accentBorderColors: Record<string, string> = {
  amber: "rgba(232,168,58,0.5)",
  coral: "rgba(232,112,90,0.5)",
  blue: "rgba(74,143,232,0.5)",
  teal: "rgba(62,184,154,0.5)",
  purple: "rgba(124,111,205,0.5)",
  green: "rgba(88,184,122,0.5)",
  gray: "rgba(107,117,144,0.5)",
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
      style={{ borderLeftWidth: 3, borderLeftColor: accentBorderColors[svc.accentColor] || accentBorderColors.gray }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[10.5px] px-1.5 py-0.5 rounded border font-medium ${badgeColors[svc.accentColor] || badgeColors.gray}`}>
          {svc.name}
        </span>
        <StatusBadge status={svc.status} />
      </div>
      <div className="text-[12px] font-semibold text-arch-text mb-1">{svc.displayName}</div>
      <div className="text-[11px] text-arch-text2 leading-[1.65] mb-2">{svc.business.purpose.split(". ").slice(0, 2).join(". ")}.</div>
      <div className="flex flex-wrap gap-1.5">
        {svc.technical.techStack.slice(0, 4).map((t) => (
          <span key={t.name} className={`text-[9px] px-1 py-px rounded border font-medium ${badgeColors[t.color] || badgeColors.gray}`}>
            {t.name}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Service Section Components ──────────────────────────────────────────────

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
      {svc.business.flows.length > 0 && (
        <>
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
        </>
      )}
      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Stakeholders & consumers</div>
      <div className="bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2.5 mb-4">
        {svc.business.stakeholders.map((s, i) => (
          <div key={i} className="flex items-start gap-2 text-[11px] text-arch-text2 leading-[1.8]">
            <span className="text-arch-text3 mt-0.5 shrink-0">&#8226;</span>
            <span>{s}</span>
          </div>
        ))}
      </div>
      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Business rules</div>
      <div className="space-y-2 mb-4">
        {svc.business.businessRules.map((br, i) => (
          <div key={i} className={`bg-arch-bg2 border border-arch-border rounded-lg p-3 border-l-[3px] ${severityBorders[br.severity]}`}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[9.5px] px-1.5 py-0.5 rounded border font-medium ${badgeColors[severityBadgeColors[br.severity]]}`}>{br.severity}</span>
              <span className="text-[12px] font-semibold text-arch-text">{br.rule}</span>
            </div>
            <div className="text-[11px] text-arch-text2 leading-[1.65]">{br.description}</div>
          </div>
        ))}
      </div>
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
      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Technology stack</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {svc.technical.techStack.map((t) => (
          <div key={t.name} className="bg-arch-bg2 border border-arch-border rounded-lg px-2.5 py-1.5 flex items-center gap-2">
            <span className={`text-[9.5px] px-1 py-px rounded border font-medium ${badgeColors[t.color] || badgeColors.gray}`}>{t.category}</span>
            <span className="text-[11px] text-arch-text font-medium">{t.name}</span>
          </div>
        ))}
      </div>
      {svc.technical.endpoints.length > 0 && (
        <>
          <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">API endpoints</div>
          <div className="space-y-3">
            {svc.technical.endpoints.map((ep, i) => (
              <div key={i} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold font-mono ${badgeColors[methodColors[ep.method]] || badgeColors.blue}`}>{ep.method}</span>
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
        </>
      )}
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
                <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{f.note || "\u2014"}</td>
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
          )) : <div className="text-[11px] text-arch-text3 italic">None documented</div>}
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
          )) : <div className="text-[11px] text-arch-text3 italic">None documented</div>}
        </div>
      </div>
      {svc.technical.kafkaEvents.length > 0 && (
        <>
          <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Kafka events</div>
          <DataTable headers={["Topic", "Event", "Direction", "Description"]}>
            {svc.technical.kafkaEvents.map((e, i) => (
              <tr key={i}>
                <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-teal align-top leading-[1.6]">{e.topic}</td>
                <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text font-medium align-top leading-[1.6]">{e.event}</td>
                <td className="px-2.5 py-1.5 border-b border-white/[0.04] align-top leading-[1.6]">
                  <span className={`text-[9.5px] px-1 py-px rounded border font-medium ${e.direction === "publishes" ? badgeColors.green : badgeColors.purple}`}>{e.direction}</span>
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
      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Infrastructure</div>
      <div className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5 mb-4">
        {svc.technical.infrastructure.map((inf, i) => (
          <div key={i} className="flex gap-3 text-[11px] leading-[1.8]">
            <span className="text-arch-text3 shrink-0 w-24 font-medium">{inf.aspect}</span>
            <span className="text-arch-text2">{inf.description}</span>
          </div>
        ))}
      </div>
      {svc.technical.errorPatterns.length > 0 && (
        <>
          <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Error patterns</div>
          <DataTable headers={["Scenario", "Handling", "Retry strategy"]}>
            {svc.technical.errorPatterns.map((ep, i) => (
              <tr key={i}>
                <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text font-medium align-top leading-[1.6]">{ep.scenario}</td>
                <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{ep.handling}</td>
                <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{ep.retry || "\u2014"}</td>
              </tr>
            ))}
          </DataTable>
        </>
      )}
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
      <div className="bg-[rgba(232,112,90,0.06)] border border-[rgba(232,112,90,0.2)] rounded-lg px-3 py-2.5 mb-4">
        <div className="text-[10.5px] font-semibold text-[#e8705a] mb-0.5">Why decomposed?</div>
        <div className="text-[11px] text-arch-text2 leading-[1.65]">{svc.migration.reason}</div>
      </div>
      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Replaced by</div>
      <div className="space-y-2 mb-4">
        {svc.migration.replacedBy.map((r, i) => (
          <div key={i} className="bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2 flex items-start gap-2">
            <span className={`text-[9.5px] px-1.5 py-0.5 rounded border font-medium mt-0.5 shrink-0 ${badgeColors.green}`}>New</span>
            <span className="text-[11px] text-arch-text2 leading-[1.65]">{r}</span>
          </div>
        ))}
      </div>
      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Migration timeline</div>
      <div className="bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2.5 text-[11px] text-arch-text2 leading-[1.7] mb-4">{svc.migration.timeline}</div>
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

// ─── Compact Service View ────────────────────────────────────────────────────

function CompactServiceView({ svc }: { svc: ServiceDeepDive }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <div className="text-sm font-semibold text-arch-text">{svc.displayName}</div>
        <StatusBadge status={svc.status} />
      </div>
      <div className="text-[11.5px] text-arch-text2 leading-[1.7] mb-4">{svc.business.purpose}</div>

      {/* Tech stack badges */}
      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Technology stack</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {svc.technical.techStack.map((t) => (
          <div key={t.name} className="bg-arch-bg2 border border-arch-border rounded-lg px-2.5 py-1.5 flex items-center gap-2">
            <span className={`text-[9.5px] px-1 py-px rounded border font-medium ${badgeColors[t.color] || badgeColors.gray}`}>{t.category}</span>
            <span className="text-[11px] text-arch-text font-medium">{t.name}</span>
          </div>
        ))}
      </div>

      {/* Domain context */}
      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Domain context</div>
      <div className="text-[11.5px] text-arch-text2 leading-[1.7] mb-4">{svc.business.domainContext}</div>

      {/* Endpoints (if any) */}
      {svc.technical.endpoints.length > 0 && (
        <>
          <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Key endpoints</div>
          <div className="space-y-2 mb-4">
            {svc.technical.endpoints.map((ep, i) => (
              <div key={i} className="bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[9px] px-1 py-px rounded border font-bold font-mono ${badgeColors[methodColors[ep.method]] || badgeColors.blue}`}>{ep.method}</span>
                  <code className="text-[10px] font-mono text-arch-teal">{ep.path}</code>
                </div>
                <div className="text-[10.5px] text-arch-text2 leading-[1.6]">{ep.description}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Data model (if any) */}
      {svc.technical.dataModel.length > 0 && svc.technical.dataModel.map((entity, i) => (
        <div key={i} className="mb-4">
          <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1">{entity.entity}</div>
          <div className="text-[11px] text-arch-text2 leading-[1.65] mb-2">{entity.description}</div>
          <DataTable headers={["Field", "Type", "Notes"]}>
            {entity.fields.map((f, j) => (
              <tr key={j}>
                <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-teal align-top leading-[1.6]">{f.name}</td>
                <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-purple align-top leading-[1.6]">{f.type}</td>
                <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{f.note || "\u2014"}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      ))}

      {/* Business rules */}
      {svc.business.businessRules.length > 0 && (
        <>
          <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Business rules</div>
          <div className="space-y-2 mb-4">
            {svc.business.businessRules.map((br, i) => (
              <div key={i} className={`bg-arch-bg2 border border-arch-border rounded-lg p-3 border-l-[3px] ${severityBorders[br.severity]}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[9.5px] px-1.5 py-0.5 rounded border font-medium ${badgeColors[severityBadgeColors[br.severity]]}`}>{br.severity}</span>
                  <span className="text-[12px] font-semibold text-arch-text">{br.rule}</span>
                </div>
                <div className="text-[11px] text-arch-text2 leading-[1.65]">{br.description}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Dependencies */}
      {svc.technical.dependencies.length > 0 && (
        <>
          <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Dependencies</div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {svc.technical.dependencies.map((d, i) => (
              <div key={i} className="bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold text-arch-text">{d.service}</span>
                  <span className={`text-[9px] px-1 py-px rounded border font-medium ${d.direction === "upstream" ? badgeColors.blue : badgeColors.teal}`}>{d.direction}</span>
                </div>
                <div className="text-[10.5px] text-arch-text2 leading-[1.6]">{d.description}</div>
              </div>
            ))}
          </div>
        </>
      )}

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
                  <span className={`text-[9.5px] px-1 py-px rounded border font-medium ${e.direction === "publishes" ? badgeColors.green : badgeColors.purple}`}>{e.direction}</span>
                </td>
                <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{e.description}</td>
              </tr>
            ))}
          </DataTable>
        </>
      )}

      {/* Infrastructure */}
      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Infrastructure</div>
      <div className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5 mb-4">
        {svc.technical.infrastructure.map((inf, i) => (
          <div key={i} className="flex gap-3 text-[11px] leading-[1.8]">
            <span className="text-arch-text3 shrink-0 w-24 font-medium">{inf.aspect}</span>
            <span className="text-arch-text2">{inf.description}</span>
          </div>
        ))}
      </div>

      {/* Code patterns (if any) */}
      {svc.technical.codePatterns.length > 0 && svc.technical.codePatterns.map((cp, i) => (
        <div key={i} className="mb-4">
          <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-0.5">{cp.title}</div>
          <div className="text-[11px] text-arch-text2 leading-[1.65] mb-1.5">{cp.description}</div>
          <CodeBlock language={cp.language} comment={`// ${cp.title}`}>{cp.code}</CodeBlock>
        </div>
      ))}

      {/* SLA */}
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

// ─── Merchant Group View ─────────────────────────────────────────────────────

function MerchantSharedView({ data }: { data: MerchantGroupData }) {
  return (
    <div>
      <div className="text-sm font-semibold text-arch-text mb-1">Merchant APIs — Shared Architecture</div>
      <div className="text-[11.5px] text-arch-text2 leading-[1.7] mb-4">{data.sharedPattern.purpose}</div>

      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Architecture pattern</div>
      <div className="text-[11.5px] text-arch-text2 leading-[1.7] mb-4">{data.sharedPattern.architecture}</div>

      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Go interface contract</div>
      <CodeBlock language="go" comment="// MerchantProvider interface">{data.sharedPattern.interfaceContract}</CodeBlock>

      <div className="mt-4 text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Common endpoints</div>
      <div className="space-y-2 mb-4">
        {data.sharedPattern.commonEndpoints.map((ep, i) => (
          <div key={i} className="bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[9px] px-1 py-px rounded border font-bold font-mono ${badgeColors[methodColors[ep.method]] || badgeColors.blue}`}>{ep.method}</span>
              <code className="text-[10px] font-mono text-arch-teal">{ep.path}</code>
            </div>
            <div className="text-[10.5px] text-arch-text2 leading-[1.6]">{ep.description}</div>
          </div>
        ))}
      </div>

      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Error handling</div>
      <div className="text-[11px] text-arch-text2 leading-[1.7] mb-3">{data.sharedPattern.errorHandling}</div>

      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Retry strategy</div>
      <div className="text-[11px] text-arch-text2 leading-[1.7] mb-4">{data.sharedPattern.retryStrategy}</div>

      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Individual merchants</div>
      <div className="grid grid-cols-1 gap-3">
        {data.merchants.map((m) => (
          <div key={m.id} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5" style={{ borderLeftWidth: 3, borderLeftColor: accentBorderColors.gray }}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10.5px] px-1.5 py-0.5 rounded border font-medium ${badgeColors.gray}`}>{m.name}</span>
              <span className={`text-[9px] px-1 py-px rounded border font-medium ${badgeColors.blue}`}>{m.provider}</span>
            </div>
            <div className="text-[11px] text-arch-text2 leading-[1.65] mb-1.5">{m.provisioningModel}</div>
            <div className="flex gap-4 text-[10.5px]">
              <div><span className="text-arch-text3">Auth:</span> <span className="text-arch-text2">{m.authMethod}</span></div>
            </div>
            <div className="text-[10.5px] mt-1"><span className="text-arch-text3">Callback:</span> <span className="text-arch-text2">{m.callbackPattern}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MerchantComparisonView({ data }: { data: MerchantGroupData }) {
  const merchantIds = data.merchants.map(m => m.id);
  return (
    <div>
      <div className="text-sm font-semibold text-arch-text mb-1">Per-merchant comparison</div>
      <div className="text-[11.5px] text-arch-text3 mb-3">Side-by-side comparison of all 5 merchant APIs across key dimensions.</div>
      <div className="overflow-x-auto">
        <DataTable headers={["Dimension", ...data.merchants.map(m => m.provider)]}>
          {data.comparisonRows.map((row, i) => (
            <tr key={i}>
              <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text font-medium align-top leading-[1.6] whitespace-nowrap">{row.dimension}</td>
              {merchantIds.map((id) => (
                <td key={id} className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{row.values[id] || "\u2014"}</td>
              ))}
            </tr>
          ))}
        </DataTable>
      </div>

      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mt-4 mb-1.5">Provider-specific endpoints</div>
      {data.merchants.map((m) => (
        <div key={m.id} className="mb-3">
          <div className="text-[11px] font-semibold text-arch-text mb-1">{m.displayName}</div>
          <div className="space-y-1.5">
            {m.specificEndpoints.map((ep, i) => (
              <div key={i} className="bg-arch-bg2 border border-arch-border rounded-lg px-3 py-1.5 flex items-center gap-2">
                <span className={`text-[9px] px-1 py-px rounded border font-bold font-mono ${badgeColors[methodColors[ep.method]] || badgeColors.blue}`}>{ep.method}</span>
                <code className="text-[10px] font-mono text-arch-teal">{ep.path}</code>
                <span className="text-[10px] text-arch-text2">{ep.description}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MerchantDepsView({ data }: { data: MerchantGroupData }) {
  return (
    <div>
      <div className="text-sm font-semibold text-arch-text mb-1">Dependencies & flow participation</div>
      <div className="text-[11.5px] text-arch-text3 mb-3">How merchant APIs participate in subscription flows and their infrastructure.</div>

      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Flow participation</div>
      <DataTable headers={["Flow", "Title", "Role"]}>
        {data.flowParticipation.map((f, i) => (
          <tr key={i}>
            <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-blue font-mono text-[10px] align-top leading-[1.6] whitespace-nowrap">#{f.flowNum}</td>
            <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text font-medium align-top leading-[1.6] whitespace-nowrap">{f.title}</td>
            <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{f.role}</td>
          </tr>
        ))}
      </DataTable>

      <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Infrastructure</div>
      <div className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5">
        {data.infrastructure.map((inf, i) => (
          <div key={i} className="flex gap-3 text-[11px] leading-[1.8]">
            <span className="text-arch-text3 shrink-0 w-24 font-medium">{inf.aspect}</span>
            <span className="text-arch-text2">{inf.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Data-Driven Routing ─────────────────────────────────────────────────────

type SectionType = "biz" | "tech" | "data" | "deps" | "ops" | "code" | "compact" | "migration";

/** Map of activeId → { serviceId, section } for data-driven routing */
const routeMap: Record<string, { serviceId: string; section: SectionType }> = {};

// Build route map from sidebar groups
for (const group of sidebarGroups) {
  for (const item of group.items) {
    const id = item.id;
    // Parse svc-{serviceId}-{section} pattern
    const match = id.match(/^svc-(.+)-(biz|tech|data|deps|ops|code|compact|migration)$/);
    if (match) {
      routeMap[id] = { serviceId: match[1], section: match[2] as SectionType };
    }
  }
}

function renderServiceSection(svc: ServiceDeepDive, section: SectionType): React.ReactNode {
  switch (section) {
    case "biz": return <BusinessSection svc={svc} />;
    case "tech": return <TechStackSection svc={svc} />;
    case "data": return <DataModelSection svc={svc} />;
    case "deps": return <DependenciesSection svc={svc} />;
    case "ops": return <OpsSection svc={svc} />;
    case "code": return <CodeSection svc={svc} />;
    case "compact": return <CompactServiceView svc={svc} />;
    case "migration": return <MigrationSection svc={svc} />;
    default: return null;
  }
}

// ─── Domain Group Config for Comparison ──────────────────────────────────────

const domainGroups = [
  { name: "Core Subscription", color: "amber", ids: ["reseller", "sub-aggregator", "subscriber-manager", "sub-configurator", "sub-consumer"] },
  { name: "subscription-manager-api", color: "coral", ids: ["subscription-manager"] },
  { name: "Auth & Session", color: "coral", ids: ["auth", "session", "token", "disney-auth"] },
  { name: "Catalog & Products", color: "amber", ids: ["catalog", "catalog-manager", "product-catalog"] },
  { name: "Orders & Billing", color: "blue", ids: ["order", "core-processor", "audit"] },
  { name: "Promotions", color: "green", ids: ["promocodes", "promoredeem-consumer", "promostream-consumer", "promo-migration-consumer"] },
  { name: "Events & Messaging", color: "blue", ids: ["event-hub", "event-publisher", "notification-consumer"] },
  { name: "Flow & Orchestration", color: "purple", ids: ["flow-runner", "household", "account-recovery"] },
  { name: "Infrastructure", color: "gray", ids: ["http-proxy", "email", "policy-rule-config"] },
];

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
                Comprehensive documentation for all {allServiceDeepDives.length} Go microservices and 5 merchant API adapters in the subscription management platform. Each deep dive covers business context, technical architecture, data models, dependencies, and operational patterns.
              </div>

              {/* Domain group cards */}
              {domainGroups.map((group) => {
                const services = group.ids.map(id => getServiceById(id)).filter(Boolean) as ServiceDeepDive[];
                if (services.length === 0) return null;
                return (
                  <div key={group.name} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${badgeColors[group.color]}`}>{group.name}</span>
                      <span className="text-[10px] text-arch-text3">{services.length} services</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {services.map((svc) => (
                        <ServiceCard key={svc.id} svc={svc} />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Merchant group callout */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${badgeColors.gray}`}>Merchant APIs</span>
                  <span className="text-[10px] text-arch-text3">5 adapter services</span>
                </div>
                <div className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5" style={{ borderLeftWidth: 3, borderLeftColor: accentBorderColors.gray }}>
                  <div className="text-[12px] font-semibold text-arch-text mb-1">Merchant API Adapters</div>
                  <div className="text-[11px] text-arch-text2 leading-[1.65] mb-2">5 provider-specific adapter services implementing a shared MerchantProvider interface: Bango, Netflix, Disney+, Bell Media, Radio Canada.</div>
                  <div className="flex flex-wrap gap-1.5">
                    {merchantGroupData.merchants.map((m) => (
                      <span key={m.id} className={`text-[9px] px-1 py-px rounded border font-medium ${badgeColors.gray}`}>{m.name}</span>
                    ))}
                  </div>
                </div>
              </div>

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
              <div className="text-sm font-semibold text-arch-text mb-1">Service comparison by domain</div>
              <div className="text-[11.5px] text-arch-text3 mb-4">All {allServiceDeepDives.length} services organized by domain group.</div>

              {domainGroups.map((group) => {
                const services = group.ids.map(id => getServiceById(id)).filter(Boolean) as ServiceDeepDive[];
                if (services.length === 0) return null;
                return (
                  <div key={group.name} className="mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${badgeColors[group.color]}`}>{group.name}</span>
                    </div>
                    <DataTable headers={["Service", "Status", "Primary role", "Database", "API", "Kafka", "Availability"]}>
                      {services.map((svc) => (
                        <tr key={svc.id}>
                          <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text font-medium align-top leading-[1.6] whitespace-nowrap">{svc.name}</td>
                          <td className="px-2.5 py-1.5 border-b border-white/[0.04] align-top leading-[1.6]"><StatusBadge status={svc.status} /></td>
                          <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{svc.business.purpose.split(". ")[0]}</td>
                          <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{svc.technical.techStack.find(t => ["Database", "Storage", "Cache"].includes(t.category))?.name || "\u2014"}</td>
                          <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{svc.technical.techStack.find(t => ["API", "Framework", "Gateway"].includes(t.category))?.name || "\u2014"}</td>
                          <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{svc.technical.kafkaEvents.length > 0 ? (svc.technical.kafkaEvents[0].direction === "publishes" ? "Publisher" : "Consumer") : "\u2014"}</td>
                          <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{svc.business.sla.availability}</td>
                        </tr>
                      ))}
                    </DataTable>
                  </div>
                );
              })}
            </div>
          );
        }

        // ── Special: subscription-manager-api legacy tech (combined view) ──
        if (activeId === "svc-subscription-manager-tech") {
          const svc = getServiceById("subscription-manager")!;
          return (
            <div>
              <TechStackSection svc={svc} />
              <div className="mt-6"><OpsSection svc={svc} /></div>
            </div>
          );
        }

        // ── Merchant group views ──────────────────────────────────
        if (activeId === "svc-merchants-shared") return <MerchantSharedView data={merchantGroupData} />;
        if (activeId === "svc-merchants-comparison") return <MerchantComparisonView data={merchantGroupData} />;
        if (activeId === "svc-merchants-deps") return <MerchantDepsView data={merchantGroupData} />;

        // ── Data-driven routing for all service sections ──────────
        const route = routeMap[activeId];
        if (route) {
          const svc = getServiceById(route.serviceId);
          if (svc) return renderServiceSection(svc, route.section);
        }

        return null;
      }}
    </SectionLayout>
  );
}
