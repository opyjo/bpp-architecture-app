"use client";

import { useState } from "react";
import SectionLayout from "@/components/ui/SectionLayout";
import { routes, quickRefRows } from "@/data/routes";
import {
  flows,
  customerVsAgent,
  mermaidSequenceDiagram,
  mermaidOrderSequenceDiagram,
  orderEndpoints,
  orderErrorRows,
  orderFeatureFlags,
  orderDataStores,
  orderEventTopics,
} from "@/data/flows";
import { flowDiagramMap, flowNodeOverrides } from "@/data/flow-diagrams";
import {
  componentTreeMap,
  componentTreeSidebarItems,
  sharedComponents,
  sharedComponentsMermaid,
} from "@/data/component-trees";
import type { ComponentNode } from "@/data/component-trees";
import FlowDiagram from "@/components/ui/FlowDiagram";
import StepFlowDiagram from "@/components/ui/StepFlowDiagram";
import MermaidDiagram from "@/components/ui/MermaidDiagram";

const sidebarItems = [
  { id: "routes", label: "Route inventory" },
  { id: "flow-add", label: "Add subscription" },
  { id: "flow-cancel", label: "Cancel subscription" },
  { id: "flow-change", label: "Change plan" },
  { id: "flow-agent", label: "Agent-assisted" },
  { id: "flow-undo", label: "Undo flows" },
  { id: "flow-appsync", label: "AppSync lifecycle" },
  { id: "flow-order", label: "End-to-end order" },
  { id: "flow-renewal", label: "Renewal" },
  { id: "flow-grace", label: "Grace period" },
  { id: "flow-recovery", label: "Account recovery" },
  { id: "flow-fallout", label: "Fallout & self-healing" },
  { id: "flow-membership", label: "Membership / loyalty" },
  { id: "flow-promo", label: "Promo codes" },
  { id: "flow-notifications", label: "Notifications" },
  { id: "cmp", label: "Customer vs Agent" },
  { id: "seq", label: "Sequence diagram" },
  { id: "order-seq", label: "Order sequence" },
  { id: "order-ref", label: "Order endpoints & errors" },
  { id: "quickref", label: "Quick reference" },
];

function AudienceBadge({ audience }: { audience: string }) {
  const color = audience === "Agent"
    ? "bg-[rgba(232,112,90,0.12)] text-arch-coral border-[rgba(232,112,90,0.22)]"
    : audience === "System"
    ? "bg-[rgba(62,184,154,0.12)] text-arch-teal border-[rgba(62,184,154,0.22)]"
    : "bg-[rgba(124,111,205,0.14)] text-arch-purple border-[rgba(124,111,205,0.22)]";
  return <span className={`text-[10.5px] px-1.5 py-0.5 rounded border font-medium ${color}`}>{audience}</span>;
}

function FlowDetailAccordion({ flow }: { flow: typeof flows[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-arch-bg2 border border-arch-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-3.5 py-2.5 flex items-center gap-2 hover:bg-white/[0.03] transition-colors text-left"
      >
        <svg
          className={`w-3.5 h-3.5 text-arch-purple transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        <span className="text-[11px] font-semibold text-arch-text">Detailed step reference</span>
        <AudienceBadge audience={flow.audience} />
        <span className="text-[10px] font-mono text-arch-text3 ml-auto">{flow.route}</span>
      </button>
      {open && (
        <div className="border-t border-arch-border p-3.5">
          <StepFlowDiagram steps={flow.steps} route={flow.route} />
        </div>
      )}
    </div>
  );
}

const categoryColors: Record<ComponentNode["category"], { bg: string; border: string; text: string; label: string }> = {
  provider: { bg: "bg-[rgba(124,111,205,0.12)]", border: "border-[rgba(124,111,205,0.35)]", text: "text-arch-purple", label: "Provider" },
  page: { bg: "bg-[rgba(74,143,232,0.12)]", border: "border-[rgba(74,143,232,0.35)]", text: "text-arch-blue", label: "Page" },
  feature: { bg: "bg-[rgba(62,184,154,0.12)]", border: "border-[rgba(62,184,154,0.35)]", text: "text-arch-teal", label: "Feature" },
  shared: { bg: "bg-[rgba(232,168,58,0.12)]", border: "border-[rgba(232,168,58,0.35)]", text: "text-arch-amber", label: "Shared" },
  "mutation-trigger": { bg: "bg-[rgba(232,112,90,0.12)]", border: "border-[rgba(232,112,90,0.35)]", text: "text-arch-coral", label: "Mutation trigger" },
};

function CategoryLegend() {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {Object.values(categoryColors).map((c) => (
        <span key={c.label} className={`text-[10.5px] px-2 py-0.5 rounded border font-medium ${c.bg} ${c.border} ${c.text}`}>
          {c.label}
        </span>
      ))}
    </div>
  );
}

function ComponentDetailCard({ node }: { node: ComponentNode }) {
  const [open, setOpen] = useState(false);
  const color = categoryColors[node.category];
  return (
    <div className={`bg-arch-bg2 border border-arch-border rounded-lg overflow-hidden border-l-2 ${color.border}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-white/[0.03] transition-colors text-left"
      >
        <svg
          className={`w-3 h-3 text-arch-text3 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        <span className={`text-[11.5px] font-semibold ${color.text}`}>{node.name}</span>
        <span className={`text-[10.5px] px-1.5 py-0.5 rounded border font-medium ${color.bg} ${color.border} ${color.text}`}>{color.label}</span>
        <span className="text-[10px] font-mono text-arch-text3 ml-auto">{node.file}</span>
      </button>
      {open && (
        <div className="border-t border-arch-border px-3.5 py-2.5 space-y-2">
          <div className="text-[11px] text-arch-text2 leading-[1.6]">{node.description}</div>
          {node.hooks.length > 0 && (
            <div>
              <div className="text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 mb-1">Hooks</div>
              <div className="flex flex-wrap gap-1">
                {node.hooks.map((h) => (
                  <span key={h} className="text-[10px] font-mono px-1.5 py-px rounded bg-arch-bg3 border border-arch-border text-arch-blue">{h}</span>
                ))}
              </div>
            </div>
          )}
          {node.consumesContext.length > 0 && (
            <div>
              <div className="text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 mb-1">Context</div>
              <div className="flex flex-wrap gap-1">
                {node.consumesContext.map((c) => (
                  <span key={c} className="text-[10px] font-mono px-1.5 py-px rounded bg-arch-bg3 border border-arch-border text-arch-purple">{c}</span>
                ))}
              </div>
            </div>
          )}
          {node.apiCalls.length > 0 && (
            <div>
              <div className="text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 mb-1">API calls</div>
              <div className="flex flex-wrap gap-1">
                {node.apiCalls.map((a) => (
                  <span key={a} className="text-[10px] font-mono px-1.5 py-px rounded bg-[rgba(232,112,90,0.1)] border border-[rgba(232,112,90,0.2)] text-arch-coral">{a}</span>
                ))}
              </div>
            </div>
          )}
          {node.props.length > 0 && (
            <div>
              <div className="text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 mb-1">Props received</div>
              <div className="flex flex-wrap gap-1">
                {node.props.map((p) => (
                  <span key={p} className="text-[10px] font-mono px-1.5 py-px rounded bg-arch-bg3 border border-arch-border text-arch-text2">{p}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function UiPagesTab() {
  return (
    <SectionLayout label="Sections" items={sidebarItems} extraItems={{ label: "Component Trees", items: componentTreeSidebarItems }}>
      {(activeId) => {
        if (activeId === "routes") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Route inventory</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-3.5">
                Every screen, its file, and its audience. French routes replace <code className="font-mono text-[10.5px] bg-arch-bg3 border border-arch-border rounded px-1 py-px text-arch-teal">/customer/</code> with <code className="font-mono text-[10.5px] bg-arch-bg3 border border-arch-border rounded px-1 py-px text-arch-teal">/client/</code> (locale=fr-ca).
              </div>
              <table className="w-full border-collapse text-[11px] mb-3.5">
                <thead>
                  <tr>
                    <th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Route</th>
                    <th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Page / component</th>
                    <th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">File</th>
                    <th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Audience</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((r) => (
                    <tr key={r.route}>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-purple font-mono text-[10.5px] align-top leading-[1.6]">{r.route}</td>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{r.page}</td>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{r.file}</td>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] align-top"><AudienceBadge audience={r.audience} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        const flow = flows.find((f) => f.id === activeId);
        if (flow) {
          const diagramSteps = flowDiagramMap[flow.id];
          const customNodes = flowNodeOverrides[flow.id];
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">{flow.title}</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-3.5">{flow.description}</div>
              {diagramSteps && <FlowDiagram steps={diagramSteps} nodes={customNodes} />}
              <FlowDetailAccordion flow={flow} />
            </div>
          );
        }

        if (activeId === "cmp") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Customer vs Agent</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-3.5">Same backend mutations, different session init, auth, permissions, and audit behaviour.</div>
              <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                {(["customer", "agent"] as const).map((key) => {
                  const data = customerVsAgent[key];
                  return (
                    <div key={key} className="bg-arch-bg2 border border-arch-border rounded-lg p-3">
                      <div className="text-[11.5px] font-semibold text-arch-text mb-2 flex items-center gap-1.5">
                        <AudienceBadge audience={data.label} />
                        {data.subtitle}
                      </div>
                      {data.rows.map((r) => (
                        <div key={r.key} className="flex justify-between gap-2 py-1 border-b border-white/[0.04] last:border-b-0 text-[11px]">
                          <span className="text-arch-text3">{r.key}</span>
                          <span className="text-arch-text2 text-right font-mono text-[10px]">{r.val}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        if (activeId === "seq") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Sequence diagram — Add subscription (happy path)</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-3.5">Full request chain from actor click to provider redirect.</div>
              <MermaidDiagram chart={mermaidSequenceDiagram} />
            </div>
          );
        }

        if (activeId === "order-seq") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Sequence diagram — End-to-end order</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-3.5">
                The full lifecycle across all three phases: Configurator session/cart, the Order API (one synchronous gate then an async fan-out), and the Billing Process Lambda. The <code className="font-mono text-[10.5px] bg-arch-bg3 border border-arch-border rounded px-1 py-px text-arch-coral">par</code> block shows the work that runs concurrently in the background.
              </div>
              <MermaidDiagram chart={mermaidOrderSequenceDiagram} />
            </div>
          );
        }

        if (activeId === "order-ref") {
          const methodColor: Record<string, string> = {
            POST: "bg-[rgba(62,184,154,0.1)] border-[rgba(62,184,154,0.2)] text-arch-teal",
            PATCH: "bg-[rgba(232,168,58,0.1)] border-[rgba(232,168,58,0.2)] text-arch-amber",
            GET: "bg-[rgba(74,143,232,0.1)] border-[rgba(74,143,232,0.2)] text-arch-blue",
          };
          const severityStyle: Record<string, { color: string; label: string }> = {
            block: { color: "bg-[rgba(232,112,90,0.12)] text-arch-coral border-[rgba(232,112,90,0.22)]", label: "Blocks" },
            partial: { color: "bg-[rgba(232,168,58,0.12)] text-arch-amber border-[rgba(232,168,58,0.22)]", label: "Partial" },
            continue: { color: "bg-[rgba(62,184,154,0.12)] text-arch-teal border-[rgba(62,184,154,0.22)]", label: "Continues" },
          };
          const th = "text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border";
          const sectionHeading = "text-[10px] font-semibold tracking-[0.1em] uppercase text-arch-text3 mb-2 mt-5";
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Order endpoints & error handling</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-3.5">
                Every call made during order creation and billing, in order, plus how each step fails and the flags that change its behaviour.
              </div>

              {/* Endpoints */}
              <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-arch-text3 mb-2">Endpoints called (in order)</div>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th className={`${th} w-10`}>#</th>
                    <th className={`${th} w-16`}>Method</th>
                    <th className={th}>Path</th>
                    <th className={th}>Service</th>
                  </tr>
                </thead>
                <tbody>
                  {orderEndpoints.map((e) => (
                    <tr key={e.step}>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text3 font-mono text-[10px] align-top">{e.step}</td>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] align-top">
                        <span className={`inline-block rounded px-1.5 py-px font-mono text-[10px] border ${methodColor[e.method]}`}>{e.method}</span>
                      </td>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-purple font-mono text-[10.5px] align-top leading-[1.6]">{e.path}</td>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{e.service}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Error handling */}
              <div className={sectionHeading}>Error handling</div>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th className={th}>Step</th>
                    <th className={`${th} w-24`}>Severity</th>
                    <th className={th}>Failure behaviour</th>
                  </tr>
                </thead>
                <tbody>
                  {orderErrorRows.map((r) => (
                    <tr key={r.step}>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text font-medium align-top leading-[1.6]">{r.step}</td>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] align-top">
                        <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border font-medium ${severityStyle[r.severity].color}`}>{severityStyle[r.severity].label}</span>
                      </td>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{r.behavior}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Feature flags + data stores side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-5">
                <div>
                  <div className={sectionHeading}>Feature flags</div>
                  <div className="space-y-2">
                    {orderFeatureFlags.map((f) => (
                      <div key={f.flag} className="bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2">
                        <div className="font-mono text-[10.5px] text-arch-amber mb-0.5">{f.flag}</div>
                        <div className="text-[11px] text-arch-text2 leading-[1.6]">{f.effect}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className={sectionHeading}>Data stores</div>
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr>
                        <th className={th}>Store</th>
                        <th className={`${th} w-20`}>Type</th>
                        <th className={th}>What&apos;s stored</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDataStores.map((d) => (
                        <tr key={d.store}>
                          <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-purple font-mono text-[10.5px] align-top leading-[1.6]">{d.store}</td>
                          <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-teal font-mono text-[10px] align-top leading-[1.6]">{d.type}</td>
                          <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{d.stored}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Event hub topics */}
              <div className={sectionHeading}>Event Hub topics</div>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th className={th}>Event</th>
                    <th className={th}>When published</th>
                    <th className={th}>Topic</th>
                  </tr>
                </thead>
                <tbody>
                  {orderEventTopics.map((t) => (
                    <tr key={t.event}>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text font-medium align-top leading-[1.6]">{t.event}</td>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{t.when}</td>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{t.topic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (activeId === "quickref") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Quick reference</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-3.5">Trace any bug end-to-end: screen → mutation → BFF → AppSync → Go service.</div>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">UI component / screen</th>
                    <th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Mutation / call</th>
                    <th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Go services hit</th>
                  </tr>
                </thead>
                <tbody>
                  {quickRefRows.map((r, i) => (
                    <tr key={i}>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-purple font-mono text-[10.5px] align-top leading-[1.6]">{r.screen}</td>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] align-top leading-[1.6]">
                        <span className={`inline-block rounded px-1.5 py-px font-mono text-[10px] border ${
                          r.mutationType === "rest"
                            ? "bg-[rgba(62,184,154,0.1)] border-[rgba(62,184,154,0.2)] text-arch-teal"
                            : "bg-[rgba(232,168,58,0.1)] border-[rgba(232,168,58,0.2)] text-arch-amber"
                        }`}>{r.mutation}</span>
                      </td>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{r.services}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        /* ---- Shared components view ---- */
        if (activeId === "ct-shared") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Shared components</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-3.5">
                Components reused across multiple routes. Colour indicates category.
              </div>
              <CategoryLegend />
              <MermaidDiagram chart={sharedComponentsMermaid} />
              <div className="mt-4">
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr>
                      <th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Component</th>
                      <th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">File</th>
                      <th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Used in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sharedComponents.map((sc) => {
                      const color = categoryColors[sc.category];
                      return (
                        <tr key={sc.name}>
                          <td className={`px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10.5px] align-top leading-[1.6] ${color.text}`}>{sc.name}</td>
                          <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 font-mono text-[10.5px] align-top leading-[1.6]">{sc.file}</td>
                          <td className="px-2.5 py-1.5 border-b border-white/[0.04] align-top">
                            <div className="flex flex-wrap gap-1">
                              {sc.usedIn.map((r) => (
                                <span key={r} className="text-[9.5px] px-1.5 py-0.5 rounded bg-arch-bg3 border border-arch-border text-arch-text2">{r}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        /* ---- Component tree views ---- */
        const tree = activeId.startsWith("ct-") ? componentTreeMap[activeId] : undefined;
        if (tree) {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">{tree.title}</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-1">{tree.description}</div>
              <div className="flex items-center gap-2 mb-3.5">
                <AudienceBadge audience={tree.audience} />
                <span className="text-[10px] font-mono text-arch-text3">{tree.route}</span>
              </div>
              <CategoryLegend />
              <MermaidDiagram chart={tree.mermaidChart} />
              <div className="mt-5 space-y-2">
                <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-arch-text3 mb-2">Component details</div>
                {tree.components.map((node) => (
                  <ComponentDetailCard key={node.id} node={node} />
                ))}
              </div>
            </div>
          );
        }

        return null;
      }}
    </SectionLayout>
  );
}
