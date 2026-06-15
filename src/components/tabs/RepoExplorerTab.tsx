"use client";

import { useCallback, useState } from "react";
import { repoTree, repoTourSteps, repoDomains } from "@/data/repo-structure";
import RepoMap from "@/components/repo/RepoMap";
import RepoTour from "@/components/repo/RepoTour";
import RepoDetail from "@/components/repo/RepoDetail";

type Mode = "tour" | "explore";

export default function RepoExplorerTab() {
  const [mode, setMode] = useState<Mode>("tour");
  const [tourStep, setTourStep] = useState(0);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoomTarget, setZoomTarget] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  const step = repoTourSteps[tourStep];

  // Tour mode: derive SVG state from current step
  const tourHighlightNodes = step.highlightNodes;
  const tourHighlightEdges = step.highlightEdges ?? [];
  const tourZoomTarget = step.zoomTarget ?? null;

  // Explore mode: derive SVG state from user interaction
  const exploreHighlightNodes = zoomTarget
    ? [zoomTarget]
    : selectedNode
    ? [selectedNode]
    : repoTree.map((n) => n.id);

  const handleTourStep = useCallback((s: number) => {
    setTourStep(s);
  }, []);

  const handleNodeClick = (id: string) => {
    if (mode === "explore") {
      if (zoomTarget === id) {
        // Already zoomed into this — zoom out
        setZoomTarget(null);
        setSelectedChild(null);
        setSelectedNode(id);
      } else if (zoomTarget) {
        // Zoomed into different node — switch
        setZoomTarget(id);
        setSelectedChild(null);
        setSelectedNode(id);
      } else {
        // Not zoomed — zoom in
        setZoomTarget(id);
        setSelectedNode(id);
        setSelectedChild(null);
      }
    }
  };

  const handleChildClick = (id: string) => {
    setSelectedChild(id);
    setSelectedNode(id);
  };

  const handleBackToOverview = () => {
    setZoomTarget(null);
    setSelectedChild(null);
  };

  return (
    <div className="grid grid-cols-[206px_1fr_272px] overflow-hidden" style={{ height: "calc(100vh - 108px)" }}>
      {/* ── Left Sidebar ─────────────────────────────── */}
      <div className="border-r border-arch-border bg-arch-bg2 overflow-y-auto">
        {/* Mode toggle */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex rounded-md border border-arch-border overflow-hidden">
            <button
              onClick={() => setMode("tour")}
              className={`flex-1 py-1.5 text-[10.5px] font-semibold transition-colors ${
                mode === "tour"
                  ? "bg-arch-blue/15 text-arch-blue border-r border-arch-blue/30"
                  : "bg-arch-bg3 text-arch-text3 hover:text-arch-text2 border-r border-arch-border"
              }`}
            >
              Guided Tour
            </button>
            <button
              onClick={() => setMode("explore")}
              className={`flex-1 py-1.5 text-[10.5px] font-semibold transition-colors ${
                mode === "explore"
                  ? "bg-arch-blue/15 text-arch-blue"
                  : "bg-arch-bg3 text-arch-text3 hover:text-arch-text2"
              }`}
            >
              Free Explore
            </button>
          </div>
        </div>

        {mode === "tour" ? (
          /* ── Tour Step List ─────────────────────── */
          <div className="px-2 pb-3">
            <div className="text-[9.5px] uppercase tracking-wider text-arch-text3 font-semibold px-1 mb-2 mt-1">
              Tour Steps
            </div>
            {repoTourSteps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setTourStep(i)}
                className={`w-full flex items-start gap-2 px-2 py-1.5 rounded-md text-left transition-colors mb-0.5 ${
                  i === tourStep
                    ? "bg-arch-blue/10 border-l-2 border-arch-blue"
                    : "hover:bg-white/[0.03] border-l-2 border-transparent"
                }`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <span
                  className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold shrink-0 mt-0.5 ${
                    i === tourStep
                      ? "bg-arch-blue/20 text-arch-blue"
                      : i < tourStep
                      ? "bg-arch-green/20 text-arch-green"
                      : "bg-arch-bg3 text-arch-text3"
                  }`}
                >
                  {i < tourStep ? "\u2713" : i + 1}
                </span>
                <span
                  className={`text-[11px] leading-[1.4] ${
                    i === tourStep ? "text-arch-text font-medium" : "text-arch-text2"
                  }`}
                >
                  {s.title}
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* ── Explore Tree ───────────────────────── */
          <div className="px-2 pb-3">
            {zoomTarget && (
              <button
                onClick={handleBackToOverview}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 mb-1 rounded-md text-[10.5px] font-medium text-arch-blue hover:bg-arch-blue/10 transition-colors"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back to overview
              </button>
            )}
            <div className="text-[9.5px] uppercase tracking-wider text-arch-text3 font-semibold px-1 mb-2 mt-1">
              {zoomTarget ? "Modules" : "Directories"}
            </div>
            {!zoomTarget ? (
              /* Top-level directories */
              repoTree.map((node) => (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors mb-0.5 ${
                    selectedNode === node.id
                      ? "bg-arch-blue/10 border-l-2"
                      : "hover:bg-white/[0.03] border-l-2 border-transparent"
                  }`}
                  style={selectedNode === node.id ? { borderColor: node.color } : undefined}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: node.color }}
                  />
                  <span className="font-mono text-[11px] text-arch-text2">{node.name}</span>
                  <span className="ml-auto text-[9.5px] text-arch-text3">
                    {node.children?.length ?? 0}
                  </span>
                </button>
              ))
            ) : (
              /* Child modules of zoomed dir */
              repoTree
                .find((n) => n.id === zoomTarget)
                ?.children?.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => handleChildClick(child.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors mb-0.5 ${
                      selectedChild === child.id
                        ? "bg-arch-blue/10 border-l-2"
                        : "hover:bg-white/[0.03] border-l-2 border-transparent"
                    }`}
                    style={selectedChild === child.id ? { borderColor: child.color } : undefined}
                  >
                    <span className="font-mono text-[10.5px] text-arch-text2">{child.name}</span>
                  </button>
                ))
            )}

            {/* Domain groupings in explore mode (when not zoomed) */}
            {!zoomTarget && (
              <>
                <div className="text-[9.5px] uppercase tracking-wider text-arch-text3 font-semibold px-1 mb-2 mt-4">
                  Business Domains
                </div>
                {repoDomains.map((domain) => (
                  <div key={domain.id} className="px-2 py-1 mb-0.5">
                    <span
                      className="inline-block text-[9.5px] font-medium px-1.5 py-px rounded-full border"
                      style={{
                        background: `${domain.color}12`,
                        borderColor: `${domain.color}28`,
                        color: domain.color,
                      }}
                    >
                      {domain.name}
                    </span>
                    <span className="text-[9.5px] text-arch-text3 ml-1.5">
                      {domain.services.length} services
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Center Content ───────────────────────────── */}
      <div className="flex flex-col overflow-hidden bg-arch-bg p-2 gap-2 min-w-0">
        {/* SVG Map — takes ~55% of height */}
        <div className="min-h-0 min-w-0" style={{ flex: "55 1 0%" }}>
          <RepoMap
            highlightNodes={mode === "tour" ? tourHighlightNodes : exploreHighlightNodes}
            highlightEdges={mode === "tour" ? tourHighlightEdges : []}
            zoomTarget={mode === "tour" ? tourZoomTarget : zoomTarget}
            onNodeClick={mode === "explore" ? handleNodeClick : undefined}
            selectedChild={selectedChild}
            onChildClick={mode === "explore" ? handleChildClick : undefined}
          />
        </div>

        {/* Tour narration (tour mode) or spacer (explore mode) — fills remaining space */}
        {mode === "tour" ? (
          <div className="min-h-0 bg-arch-bg2 border border-arch-border rounded-lg overflow-y-auto" style={{ flex: "45 1 0%" }}>
            <RepoTour currentStep={tourStep} onStepChange={handleTourStep} />
          </div>
        ) : (
          <div style={{ flex: "45 1 0%" }} />
        )}

        {/* Stats bar */}
        <div className="shrink-0 flex gap-1.5 flex-wrap">
          {repoTree.map((node) => (
            <div
              key={node.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded border border-arch-border bg-arch-bg2"
            >
              <span className="w-2 h-2 rounded-full" style={{ background: node.color }} />
              <span className="font-mono text-[10.5px] text-arch-text">{node.name}</span>
              <span className="text-[10.5px] text-arch-text2 font-medium">{node.children?.length ?? 0}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-arch-border2 bg-arch-bg2">
            <span className="text-[10.5px] font-bold text-arch-text">Total: 162 modules</span>
          </div>
        </div>
      </div>

      {/* ── Right Detail Panel ───────────────────────── */}
      <div className="border-l border-arch-border bg-arch-bg2 overflow-y-auto">
        <div className="px-3 pt-3 pb-1.5 border-b border-arch-border">
          <div className="text-[9.5px] uppercase tracking-wider text-arch-text3 font-semibold">
            {mode === "tour" ? "Tour Info" : "Details"}
          </div>
        </div>
        {mode === "tour" ? (
          <RepoDetail nodeId={tourZoomTarget ?? tourHighlightNodes[0] ?? "cmd"} />
        ) : selectedNode ? (
          <RepoDetail nodeId={selectedChild ?? selectedNode} />
        ) : (
          <div className="p-4 text-[11px] text-arch-text3 leading-[1.6]">
            Click a directory block in the diagram to explore its contents. Click again to zoom in and see individual modules.
          </div>
        )}
      </div>
    </div>
  );
}
