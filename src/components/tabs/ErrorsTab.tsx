"use client";

import SectionLayout from "@/components/ui/SectionLayout";
import { errorStates, timingRows } from "@/data/errors";

const sidebarItems = [
  { id: "err-list", label: "Error states" },
  { id: "timing", label: "Call timing" },
];

export default function ErrorsTab() {
  return (
    <SectionLayout label="Sections" items={sidebarItems}>
      {(activeId) => {
        if (activeId === "err-list") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Error states</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-3.5">
                Known failure modes, where they originate, and how the UI responds. Check OpenAPI specs in each Go service and the BFF handlers in <code className="font-mono text-[10px] bg-arch-bg3 border border-arch-border rounded px-1 py-px text-arch-teal">src/app/api/protected/</code> for full HTTP status codes.
              </div>
              <div className="bg-arch-bg2 border border-arch-border rounded-lg overflow-hidden mb-4">
                <div className="grid grid-cols-[190px_180px_1fr]">
                  <div className="px-2 py-1 text-[9px] font-semibold tracking-[0.09em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Error state</div>
                  <div className="px-2 py-1 text-[9px] font-semibold tracking-[0.09em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Originates in</div>
                  <div className="px-2 py-1 text-[9px] font-semibold tracking-[0.09em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">What the UI does</div>
                </div>
                {errorStates.map((r, i) => (
                  <div key={i} className="grid grid-cols-[190px_180px_1fr] border-b border-white/[0.04] last:border-b-0 text-[10.5px] leading-[1.6]">
                    <div className="px-2 py-1.5 text-arch-text2 border-r border-white/[0.04]">{r.error}</div>
                    <div className="px-2 py-1.5 text-arch-red font-mono text-[9.5px] border-r border-white/[0.04]">{r.origin}</div>
                    <div className="px-2 py-1.5 text-arch-text2">{r.uiAction}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (activeId === "timing") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">{"Call timing & reliability"}</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-3.5">Typical latency and sync/async mode for every hop. Check Go service configs and BFF route handlers for exact timeout and retry values.</div>
              <div className="bg-arch-bg2 border border-arch-border rounded-lg overflow-hidden">
                <div className="grid grid-cols-[210px_80px_130px_1fr]">
                  <div className="px-2 py-1 text-[9px] font-semibold tracking-[0.09em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Call</div>
                  <div className="px-2 py-1 text-[9px] font-semibold tracking-[0.09em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Mode</div>
                  <div className="px-2 py-1 text-[9px] font-semibold tracking-[0.09em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Typical latency</div>
                  <div className="px-2 py-1 text-[9px] font-semibold tracking-[0.09em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Notes</div>
                </div>
                {timingRows.map((r, i) => (
                  <div key={i} className="grid grid-cols-[210px_80px_130px_1fr] border-b border-white/[0.04] last:border-b-0 text-[10.5px] leading-[1.6]">
                    <div className="px-2 py-1.5 text-arch-text2 border-r border-white/[0.04]">{r.call}</div>
                    <div className="px-2 py-1.5 text-arch-amber font-mono text-[9.5px] border-r border-white/[0.04]">{r.mode}</div>
                    <div className="px-2 py-1.5 text-arch-green font-mono text-[9.5px] border-r border-white/[0.04]">{r.latency}</div>
                    <div className="px-2 py-1.5 text-arch-text3 text-[10px]">{r.notes}</div>
                  </div>
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
