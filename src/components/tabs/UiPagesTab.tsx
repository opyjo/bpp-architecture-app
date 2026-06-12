"use client";

import { useState } from "react";
import SectionLayout from "@/components/ui/SectionLayout";
import { routes, quickRefRows } from "@/data/routes";
import { flows, customerVsAgent, mermaidSequenceDiagram } from "@/data/flows";
import { flowDiagramMap } from "@/data/flow-diagrams";
import FlowDiagram from "@/components/ui/FlowDiagram";
import MermaidDiagram from "@/components/ui/MermaidDiagram";

const sidebarItems = [
  { id: "routes", label: "Route inventory" },
  { id: "flow-add", label: "Add subscription" },
  { id: "flow-cancel", label: "Cancel subscription" },
  { id: "flow-change", label: "Change plan" },
  { id: "flow-agent", label: "Agent-assisted" },
  { id: "flow-undo", label: "Undo flows" },
  { id: "cmp", label: "Customer vs Agent" },
  { id: "seq", label: "Sequence diagram" },
  { id: "quickref", label: "Quick reference" },
];

function AudienceBadge({ audience }: { audience: string }) {
  const color = audience === "Agent"
    ? "bg-[rgba(232,112,90,0.12)] text-arch-coral border-[rgba(232,112,90,0.22)]"
    : "bg-[rgba(124,111,205,0.14)] text-arch-purple border-[rgba(124,111,205,0.22)]";
  return <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${color}`}>{audience}</span>;
}

function FlowDetailAccordion({ flow }: { flow: typeof flows[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-arch-bg2 border border-arch-border rounded-lg overflow-hidden">
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
        <span className="text-[10px] text-arch-text3">Detailed step reference</span>
        <AudienceBadge audience={flow.audience} />
        <span className="text-[9.5px] font-mono text-arch-text3 ml-auto">{flow.route}</span>
      </button>
      {open && (
        <div className="border-t border-arch-border">
          <div className="grid grid-cols-[160px_1fr_1fr] border-b border-white/5">
            <div className="px-2.5 py-1 text-[9px] font-semibold tracking-[0.09em] uppercase text-arch-text3 bg-white/[0.02]">Screen</div>
            <div className="px-2.5 py-1 text-[9px] font-semibold tracking-[0.09em] uppercase text-arch-text3 bg-white/[0.02]">Action</div>
            <div className="px-2.5 py-1 text-[9px] font-semibold tracking-[0.09em] uppercase text-arch-text3 bg-white/[0.02]">Mutation → services</div>
          </div>
          {flow.steps.map((s, i) => (
            <div key={i} className="grid grid-cols-[160px_1fr_1fr] border-b border-white/[0.04] last:border-b-0">
              <div className="px-2.5 py-2 text-arch-purple font-mono text-[9.5px] border-r border-white/[0.04] leading-[1.6]">{s.screen}</div>
              <div className="px-2.5 py-2 text-arch-text2 text-[10.5px] border-r border-white/[0.04] leading-[1.6]">{s.action}</div>
              <div className="px-2.5 py-2 text-arch-teal font-mono text-[9.5px] leading-[1.6]" dangerouslySetInnerHTML={{ __html: s.mutation }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UiPagesTab() {
  return (
    <SectionLayout label="Sections" items={sidebarItems}>
      {(activeId) => {
        if (activeId === "routes") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Route inventory</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-3.5">
                Every screen, its file, and its audience. French routes replace <code className="font-mono text-[10px] bg-arch-bg3 border border-arch-border rounded px-1 py-px text-arch-teal">/customer/</code> with <code className="font-mono text-[10px] bg-arch-bg3 border border-arch-border rounded px-1 py-px text-arch-teal">/client/</code> (locale=fr-ca).
              </div>
              <table className="w-full border-collapse text-[11px] mb-3.5">
                <thead>
                  <tr>
                    <th className="text-left px-2.5 py-1.5 text-[9px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Route</th>
                    <th className="text-left px-2.5 py-1.5 text-[9px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Page / component</th>
                    <th className="text-left px-2.5 py-1.5 text-[9px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">File</th>
                    <th className="text-left px-2.5 py-1.5 text-[9px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Audience</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((r) => (
                    <tr key={r.route}>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-purple font-mono text-[10px] align-top leading-[1.6]">{r.route}</td>
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
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">{flow.title}</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-3.5">{flow.description}</div>
              {diagramSteps && <FlowDiagram steps={diagramSteps} />}
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
                        <div key={r.key} className="flex justify-between gap-2 py-1 border-b border-white/[0.04] last:border-b-0 text-[10.5px]">
                          <span className="text-arch-text3">{r.key}</span>
                          <span className="text-arch-text2 text-right font-mono text-[9.5px]">{r.val}</span>
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

        if (activeId === "quickref") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Quick reference</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-3.5">Trace any bug end-to-end: screen → mutation → BFF → AppSync → Go service.</div>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th className="text-left px-2.5 py-1.5 text-[9px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">UI component / screen</th>
                    <th className="text-left px-2.5 py-1.5 text-[9px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Mutation / call</th>
                    <th className="text-left px-2.5 py-1.5 text-[9px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Go services hit</th>
                  </tr>
                </thead>
                <tbody>
                  {quickRefRows.map((r, i) => (
                    <tr key={i}>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-purple font-mono text-[10px] align-top leading-[1.6]">{r.screen}</td>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] align-top leading-[1.6]">
                        <span className={`inline-block rounded px-1.5 py-px font-mono text-[9.5px] border ${
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

        return null;
      }}
    </SectionLayout>
  );
}
