"use client";

import { useState, useMemo } from "react";
import { steps, nodeDetails, sidebarSteps, legendItems, serviceDependencyDiagram, type SidebarItem } from "@/data/architecture";
import ArchitectureSvg from "@/components/ArchitectureSvg";
import SystemOverview from "@/components/SystemOverview";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import DiagramChat from "@/components/ai/DiagramChat";

interface SidebarGroup {
  label: string;
  items: { key: string; label: string }[];
}

function parseSidebarGroups(sidebarItems: SidebarItem[]): SidebarGroup[] {
  const groups: SidebarGroup[] = [];
  let current: SidebarGroup = { label: "Lifecycle flows", items: [] };

  for (const s of sidebarItems) {
    if ("separator" in s) {
      if (current.items.length > 0) groups.push(current);
      current = { label: s.header ?? "", items: [] };
    } else {
      current.items.push(s);
    }
  }
  if (current.items.length > 0) groups.push(current);
  return groups;
}

const archAccents = [
  { border: "rgba(74, 143, 232, 0.35)", bg: "rgba(74, 143, 232, 0.06)", dot: "rgba(74, 143, 232, 0.6)" },       // blue
  { border: "rgba(124, 111, 205, 0.35)", bg: "rgba(124, 111, 205, 0.06)", dot: "rgba(124, 111, 205, 0.6)" },     // purple
  { border: "rgba(62, 184, 154, 0.35)", bg: "rgba(62, 184, 154, 0.06)", dot: "rgba(62, 184, 154, 0.6)" },        // teal
  { border: "rgba(232, 168, 58, 0.35)", bg: "rgba(232, 168, 58, 0.06)", dot: "rgba(232, 168, 58, 0.6)" },        // amber
];

function CollapsibleArchSection({
  label,
  items,
  activeStep,
  defaultOpen,
  onSelect,
  accentIndex = 0,
}: {
  label: string;
  items: { key: string; label: string }[];
  activeStep: string;
  defaultOpen: boolean;
  onSelect: (key: string) => void;
  accentIndex?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasActiveChild = items.some((item) => item.key === activeStep);
  const accent = archAccents[accentIndex % archAccents.length];

  return (
    <>
      <div className="h-px bg-arch-border mx-3.5 my-1.5" />
      {label && (
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="sidebar-section-header flex items-center justify-between w-full px-3.5 py-1.5 group select-none rounded-sm"
          style={hasActiveChild ? { background: accent.bg } : undefined}
        >
          <div className="flex items-center gap-1.5">
            <div
              className="w-1 h-1 rounded-full shrink-0 transition-colors"
              style={{ background: hasActiveChild ? accent.border : "transparent" }}
            />
            <span
              className="text-[10px] font-semibold tracking-[0.1em] uppercase transition-colors"
              style={{ color: hasActiveChild ? accent.border.replace("0.35", "1") : undefined }}
            >
              {label}
            </span>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-arch-text3 group-hover:text-arch-text2 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
      {open && (
        <div className="sidebar-section-items">
          {items.map((item, i) => (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              style={{ animationDelay: `${i * 25}ms` }}
              className={`flex items-center gap-2 px-3.5 py-2 w-full text-left border-l-2 transition-all duration-200 select-none ${
                activeStep === item.key
                  ? "bg-white/5 border-l-arch-blue"
                  : "border-l-transparent hover:bg-white/[0.03]"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                  activeStep === item.key
                    ? "sidebar-dot-active bg-arch-blue"
                    : "bg-arch-text3"
                }`}
                style={activeStep === item.key ? { "--dot-glow": accent.dot } as React.CSSProperties : undefined}
              />
              <span className={`text-[11.5px] transition-colors duration-200 ${activeStep === item.key ? "text-arch-text" : "text-arch-text2"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export default function ArchitectureTab() {
  const [activeStep, setActiveStep] = useState("all");
  const [nodeInfo, setNodeInfo] = useState<{ title: string; body: string } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const sidebarGroups = useMemo(() => parseSidebarGroups(sidebarSteps), []);

  const step = steps[activeStep];

  function handleStepClick(key: string) {
    setActiveStep(key);
    setNodeInfo(null);
  }

  function handleNodeClick(key: string) {
    const detail = nodeDetails[key];
    if (detail) setNodeInfo(detail);
  }

  const infoTitle = nodeInfo ? nodeInfo.title : step.title;
  const infoBody = nodeInfo ? nodeInfo.body : step.body;

  const isOverview = activeStep === "overview";
  const isDependencies = activeStep === "dependencies";

  return (
    <div className="grid grid-cols-[206px_1fr_272px] min-h-[calc(100vh-108px)]">
      {/* Sidebar */}
      <aside className="bg-arch-bg2 border-r border-arch-border py-4 overflow-y-auto">
        {sidebarGroups.map((group, i) => (
          <CollapsibleArchSection
            key={group.label || i}
            label={group.label}
            items={group.items}
            activeStep={activeStep}
            defaultOpen={false}
            onSelect={handleStepClick}
            accentIndex={i}
          />
        ))}
        <div className="h-px bg-arch-border mx-3.5 my-1.5" />
        <div className="text-[10px] font-semibold tracking-[0.1em] text-arch-text3 uppercase px-3.5 pb-1.5 pt-1">
          Legend
        </div>
        {legendItems.map((l) => (
          <div key={l.label} className="flex items-center gap-1.5 px-3.5 py-0.5">
            <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: l.color }} />
            <span className="text-[11px] text-arch-text3">{l.label}</span>
          </div>
        ))}
      </aside>

      {/* Main Content Area */}
      <main className="overflow-auto p-5 flex items-start justify-center">
        {isDependencies ? (
          <div className="w-full max-w-[1200px]">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setExpanded(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] text-arch-text2 bg-arch-bg3 border border-arch-border hover:bg-white/10 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                Expand
              </button>
            </div>
            <MermaidDiagram chart={serviceDependencyDiagram} />
          </div>
        ) : isOverview ? (
          <div className="w-full max-w-[800px]">
            <SystemOverview />
          </div>
        ) : (
          <ArchitectureSvg activeStep={activeStep} onNodeClick={handleNodeClick} />
        )}
      </main>

      {/* Info Panel */}
      <aside className="bg-arch-bg2 border-l border-arch-border p-4 overflow-y-auto">
        <div className="flex items-center gap-1.5 mb-2">
          {nodeInfo ? (
            <div className="w-[19px] h-[19px] rounded-full bg-[rgba(88,184,122,0.15)] border border-arch-green text-arch-green text-[9px] font-semibold flex items-center justify-center shrink-0">
              NODE
            </div>
          ) : step.num ? (
            <div className="w-[19px] h-[19px] rounded-full bg-[rgba(74,143,232,0.12)] border border-arch-blue text-arch-blue text-[10.5px] font-semibold flex items-center justify-center shrink-0">
              {step.num}
            </div>
          ) : (
            <div className="w-[19px] h-[19px] rounded-full bg-[rgba(74,143,232,0.15)] border border-arch-blue text-arch-blue text-[10.5px] flex items-center justify-center shrink-0">
              ●
            </div>
          )}
          <div className="text-[12.5px] font-semibold text-arch-text">{infoTitle}</div>
        </div>
        <div
          className="text-[11.5px] text-arch-text2 leading-[1.7] [&_code]:font-mono [&_code]:text-[10.5px] [&_code]:bg-arch-bg3 [&_code]:border [&_code]:border-arch-border [&_code]:rounded [&_code]:px-1 [&_code]:py-px [&_code]:text-arch-teal [&_strong]:text-arch-text [&_strong]:font-medium"
          dangerouslySetInnerHTML={{ __html: infoBody }}
        />

        {nodeInfo && (
          <>
            <div className="h-px bg-arch-border my-2" />
            <div className="text-[10.5px] text-arch-text3">
              Click a flow step on the left to return to the lifecycle view.
            </div>
          </>
        )}

        {!nodeInfo && step.services && step.services.length > 0 && (
          <>
            <div className="h-px bg-arch-border my-2" />
            <div className="text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 mb-1">
              Services involved
            </div>
            <div className="flex flex-wrap gap-0.5">
              {step.services.map((s) => (
                <span
                  key={s}
                  className="inline-block font-mono text-[9.5px] px-1.5 py-px rounded bg-arch-bg3 border border-arch-border text-arch-text2"
                >
                  {s}
                </span>
              ))}
            </div>
          </>
        )}

        {!nodeInfo && step.notes && (
          <>
            <div className="h-px bg-arch-border my-2" />
            <div className="text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 mb-1">
              Notes
            </div>
            <div
              className="text-[11.5px] text-arch-text2 leading-[1.7] [&_code]:font-mono [&_code]:text-[10.5px] [&_code]:bg-arch-bg3 [&_code]:border [&_code]:border-arch-border [&_code]:rounded [&_code]:px-1 [&_code]:py-px [&_code]:text-arch-teal"
              dangerouslySetInnerHTML={{ __html: step.notes }}
            />
          </>
        )}
      </aside>

      {/* Diagram Chat */}
      {isDependencies && <DiagramChat />}

      {/* Fullscreen overlay */}
      {expanded && (
        <div className="fixed inset-0 z-50 bg-arch-bg/95 backdrop-blur-sm flex flex-col">
          <div className="flex justify-end p-4">
            <button
              onClick={() => setExpanded(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] text-arch-text2 bg-arch-bg3 border border-arch-border hover:bg-white/10 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>
              Close
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
            <div className="w-full max-w-[1600px]">
              <MermaidDiagram chart={serviceDependencyDiagram} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
