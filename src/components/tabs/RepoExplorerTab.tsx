"use client";

import { useCallback, useState } from "react";
import { repoTree, repoTourSteps } from "@/data/repo-structure";
import RepoMap from "@/components/repo/RepoMap";
import RepoTour from "@/components/repo/RepoTour";
import RepoDetail from "@/components/repo/RepoDetail";
import RepoTreeView from "@/components/repo/RepoTreeView";
import RepoTechSummary from "@/components/repo/RepoTechSummary";

type Mode = "tour" | "explore";

export default function RepoExplorerTab() {
  const [mode, setMode] = useState<Mode>("tour");
  const [tourStep, setTourStep] = useState(0);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoomTarget, setZoomTarget] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

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

  const handleToggleDir = (id: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Also select the directory
    setSelectedNode(id);
    setSelectedChild(null);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === "tour") {
      setSearchQuery("");
    }
  };

  // For tree-view child click: zoom into parent dir and select child
  const handleTreeChildClick = (childId: string) => {
    // Find parent dir for this child
    for (const dir of repoTree) {
      const child = dir.children?.find((c) => c.id === childId);
      if (child) {
        setZoomTarget(dir.id);
        setSelectedChild(childId);
        setSelectedNode(childId);
        // Expand the dir in tree
        setExpandedDirs((prev) => new Set(prev).add(dir.id));
        break;
      }
    }
  };

  // For tree-view node click: just zoom into that dir
  const handleTreeNodeClick = (dirId: string) => {
    setZoomTarget(dirId);
    setSelectedNode(dirId);
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
              onClick={() => handleModeChange("tour")}
              className={`flex-1 py-1.5 text-[10.5px] font-semibold transition-colors ${
                mode === "tour"
                  ? "bg-arch-blue/15 text-arch-blue border-r border-arch-blue/30"
                  : "bg-arch-bg3 text-arch-text3 hover:text-arch-text2 border-r border-arch-border"
              }`}
            >
              Guided Tour
            </button>
            <button
              onClick={() => handleModeChange("explore")}
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
          /* ── Explore: Search + Tree ───────────────── */
          <>
            {/* Search input */}
            <div className="px-2 pb-1">
              <div className="relative">
                <svg
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-arch-text3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 162 modules..."
                  className="w-full bg-arch-bg border border-arch-border rounded-md pl-7 pr-6 py-1.5 text-[10.5px] text-arch-text placeholder:text-arch-text3 focus:outline-none focus:border-arch-blue/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full hover:bg-arch-bg3 text-arch-text3 hover:text-arch-text2 transition-colors"
                  >
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Back button when zoomed */}
            {!searchQuery && zoomTarget && (
              <div className="px-2">
                <button
                  onClick={handleBackToOverview}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 mb-1 rounded-md text-[10.5px] font-medium text-arch-blue hover:bg-arch-blue/10 transition-colors"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Back to overview
                </button>
              </div>
            )}

            {/* Tree view or search results */}
            <RepoTreeView
              expandedDirs={expandedDirs}
              onToggleDir={handleToggleDir}
              selectedNode={selectedNode}
              selectedChild={selectedChild}
              onNodeClick={handleTreeNodeClick}
              onChildClick={handleTreeChildClick}
              searchQuery={searchQuery}
            />
          </>
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

        {/* Tour narration (tour mode) or tech summary (explore mode) */}
        {mode === "tour" ? (
          <div className="min-h-0 bg-arch-bg2 border border-arch-border rounded-lg overflow-y-auto" style={{ flex: "45 1 0%" }}>
            <RepoTour currentStep={tourStep} onStepChange={handleTourStep} />
          </div>
        ) : (
          <div className="min-h-0" style={{ flex: "45 1 0%" }}>
            <RepoTechSummary />
          </div>
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
