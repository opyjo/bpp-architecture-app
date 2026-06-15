"use client";

import { repoTree, repoEdges, type RepoNode } from "@/data/repo-structure";

// ── Layout Constants ──────────────────────────────────────

const SVG_W = 900;
const SVG_H = 340;
const BLOCK_W = 190;
const BLOCK_H = 80;
const GAP_X = 30;
const GAP_Y = 20;
const MARGIN_X = 35;
const MARGIN_Y = 20;

// Grid positions for 8 blocks (4 cols × 2 rows)
const GRID: Record<string, { col: number; row: number }> = {
  cmd:        { col: 0, row: 0 },
  services:   { col: 1, row: 0 },
  serverless: { col: 2, row: 0 },
  pkg:        { col: 3, row: 0 },
  model:      { col: 0, row: 1 },
  poc:        { col: 1, row: 1 },
  tests:      { col: 2, row: 1 },
  doc:        { col: 3, row: 1 },
};

function blockPos(id: string) {
  const g = GRID[id] ?? { col: 0, row: 0 };
  return {
    x: MARGIN_X + g.col * (BLOCK_W + GAP_X),
    y: MARGIN_Y + g.row * (BLOCK_H + GAP_Y),
  };
}

function blockCenter(id: string) {
  const p = blockPos(id);
  return { x: p.x + BLOCK_W / 2, y: p.y + BLOCK_H / 2 };
}

// ── Icon paths (simple shapes) ────────────────────────────

const ICONS: Record<string, string> = {
  cmd: "M4 17l6-6-6-6M12 19h8",                                          // terminal
  services: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",       // grid
  serverless: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",                         // bolt
  pkg: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", // box
  model: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z",       // file
  poc: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0", // lightbulb
  tests: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",              // check-circle
  doc: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", // book
};

// ── Child Node Grid Layout ────────────────────────────────

const CHILD_W = 120;
const CHILD_H = 26;
const CHILD_GAP_X = 12;
const CHILD_GAP_Y = 6;
const CHILD_COLS = 6;
const CHILD_MARGIN_X = 30;
const CHILD_MARGIN_Y = 50;

function childPos(index: number) {
  const col = index % CHILD_COLS;
  const row = Math.floor(index / CHILD_COLS);
  return {
    x: CHILD_MARGIN_X + col * (CHILD_W + CHILD_GAP_X),
    y: CHILD_MARGIN_Y + row * (CHILD_H + CHILD_GAP_Y),
  };
}

// ── Component Props ───────────────────────────────────────

interface RepoMapProps {
  highlightNodes: string[];
  highlightEdges?: [string, string][];
  zoomTarget?: string | null;
  onNodeClick?: (id: string) => void;
  selectedChild?: string | null;
  onChildClick?: (id: string) => void;
}

export default function RepoMap({
  highlightNodes,
  highlightEdges = [],
  zoomTarget,
  onNodeClick,
  selectedChild,
  onChildClick,
}: RepoMapProps) {
  const isZoomed = !!zoomTarget;
  const zoomedNode = isZoomed ? repoTree.find((n) => n.id === zoomTarget) : null;
  const children = zoomedNode?.children ?? [];

  // For zoomed-into view: calculate needed SVG height
  const childRows = Math.ceil(children.length / CHILD_COLS);
  const zoomedH = CHILD_MARGIN_Y + childRows * (CHILD_H + CHILD_GAP_Y) + 20;
  const viewH = isZoomed ? Math.max(SVG_H, zoomedH) : SVG_H;

  const highlightAll = highlightNodes.length === repoTree.length;

  return (
    <div className="bg-arch-bg2 border border-arch-border rounded-lg overflow-hidden h-full min-w-0">
      <div className="h-full min-w-0 p-2">
        <svg
          viewBox={`0 0 ${SVG_W} ${viewH}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMin meet"
        >
          <defs>
            <marker id="repo-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--arch-blue)" />
            </marker>
            <marker id="repo-arrow-dim" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--arch-text3)" opacity="0.4" />
            </marker>
            <filter id="repo-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {!isZoomed ? (
            <>
              {/* ── Dependency Edges ─────────────────── */}
              {repoEdges.map((edge, i) => {
                const from = blockCenter(edge.from);
                const to = blockCenter(edge.to);
                const isHighlighted = highlightEdges.some(
                  ([f, t]) => f === edge.from && t === edge.to
                );
                const hasEdgeHighlights = highlightEdges.length > 0;
                return (
                  <line
                    key={`edge-${i}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={isHighlighted ? "var(--arch-blue)" : "var(--arch-text3)"}
                    strokeWidth={isHighlighted ? 2 : 0.8}
                    opacity={hasEdgeHighlights ? (isHighlighted ? 0.9 : 0.1) : 0.15}
                    markerEnd={isHighlighted ? "url(#repo-arrow)" : "url(#repo-arrow-dim)"}
                    className={isHighlighted ? "fe-anim" : ""}
                    style={{ transition: "opacity 0.3s ease" }}
                  />
                );
              })}

              {/* ── Top-Level Blocks ─────────────────── */}
              {repoTree.map((node) => {
                const pos = blockPos(node.id);
                const isActive = highlightNodes.includes(node.id);
                const childCount = node.children?.length ?? 0;
                return (
                  <g
                    key={node.id}
                    style={{
                      cursor: onNodeClick ? "pointer" : "default",
                      transition: "opacity 0.3s ease",
                    }}
                    opacity={highlightAll || isActive ? 1 : 0.15}
                    onClick={() => onNodeClick?.(node.id)}
                  >
                    {/* Block rect */}
                    <rect
                      x={pos.x}
                      y={pos.y}
                      width={BLOCK_W}
                      height={BLOCK_H}
                      rx={8}
                      fill={isActive ? `${node.color}11` : "var(--arch-bg3)"}
                      stroke={isActive ? node.color : "var(--arch-border)"}
                      strokeWidth={isActive ? 1.5 : 0.5}
                      filter={isActive && !highlightAll ? "url(#repo-glow)" : undefined}
                    />

                    {/* Icon */}
                    <g transform={`translate(${pos.x + 14}, ${pos.y + 14})`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke={isActive ? node.color : "var(--arch-text3)"}
                        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                      >
                        <path d={ICONS[node.id] || ICONS.doc} />
                      </svg>
                    </g>

                    {/* Directory name */}
                    <text
                      x={pos.x + 38}
                      y={pos.y + 28}
                      fill={isActive ? "var(--arch-text)" : "var(--arch-text3)"}
                      fontSize={12}
                      fontWeight={700}
                      fontFamily="ui-monospace, SFMono-Regular, monospace"
                    >
                      {node.name}
                    </text>

                    {/* Module count badge */}
                    <rect
                      x={pos.x + BLOCK_W - 46}
                      y={pos.y + 14}
                      width={32}
                      height={18}
                      rx={9}
                      fill={isActive ? `${node.color}22` : "var(--arch-bg)"}
                      stroke={isActive ? `${node.color}44` : "var(--arch-border)"}
                      strokeWidth={0.5}
                    />
                    <text
                      x={pos.x + BLOCK_W - 30}
                      y={pos.y + 27}
                      textAnchor="middle"
                      fill={isActive ? node.color : "var(--arch-text3)"}
                      fontSize={9.5}
                      fontWeight={600}
                    >
                      {childCount}
                    </text>

                    {/* Type labels row */}
                    <TypeLabels node={node} pos={pos} isActive={isActive} />
                  </g>
                );
              })}
            </>
          ) : (
            <>
              {/* ── Zoomed-in View: Header ───────────── */}
              <rect
                x={20}
                y={8}
                width={SVG_W - 40}
                height={30}
                rx={5}
                fill={`${zoomedNode!.color}11`}
                stroke={`${zoomedNode!.color}33`}
                strokeWidth={1}
              />
              <g transform="translate(32, 14)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={zoomedNode!.color}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d={ICONS[zoomedNode!.id] || ICONS.doc} />
                </svg>
              </g>
              <text x={52} y={28} fill="var(--arch-text)" fontSize={11} fontWeight={700} fontFamily="ui-monospace, SFMono-Regular, monospace">
                {zoomedNode!.name}
              </text>
              <text x={52 + zoomedNode!.name.length * 7.5} y={28} fill="var(--arch-text2)" fontSize={10}>
                {" "}— {children.length} modules
              </text>

              {/* ── Child Nodes ──────────────────────── */}
              {children.map((child, i) => {
                const pos = childPos(i);
                const isSelected = selectedChild === child.id;
                return (
                  <g
                    key={child.id}
                    style={{
                      cursor: onChildClick ? "pointer" : "default",
                      animationDelay: `${i * 60}ms`,
                    }}
                    className="repo-node-enter"
                    onClick={() => onChildClick?.(child.id)}
                  >
                    <rect
                      x={pos.x}
                      y={pos.y}
                      width={CHILD_W}
                      height={CHILD_H}
                      rx={5}
                      fill={isSelected ? `${child.color}22` : `${child.color}0a`}
                      stroke={isSelected ? child.color : `${child.color}33`}
                      strokeWidth={isSelected ? 1.5 : 0.7}
                      filter={isSelected ? "url(#repo-glow)" : undefined}
                    />
                    <text
                      x={pos.x + 8}
                      y={pos.y + 17}
                      fill={isSelected ? "var(--arch-text)" : "var(--arch-text2)"}
                      fontSize={9}
                      fontWeight={600}
                      fontFamily="ui-monospace, SFMono-Regular, monospace"
                    >
                      {child.name}
                    </text>
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

// ── Type Labels Sub-component ─────────────────────────────

function TypeLabels({ node, pos, isActive }: { node: RepoNode; pos: { x: number; y: number }; isActive: boolean }) {
  const labels = getTypeLabels(node);
  return (
    <>
      {labels.map((label, i) => (
        <g key={i}>
          <rect
            x={pos.x + 14 + i * 52}
            y={pos.y + BLOCK_H - 24}
            width={46}
            height={14}
            rx={3}
            fill={isActive ? `${node.color}15` : "var(--arch-bg)"}
            stroke={isActive ? `${node.color}30` : "var(--arch-border)"}
            strokeWidth={0.5}
          />
          <text
            x={pos.x + 14 + i * 52 + 23}
            y={pos.y + BLOCK_H - 14}
            textAnchor="middle"
            fill={isActive ? node.color : "var(--arch-text3)"}
            fontSize={8}
            fontWeight={500}
          >
            {label}
          </text>
        </g>
      ))}
    </>
  );
}

function getTypeLabels(node: RepoNode): string[] {
  switch (node.id) {
    case "cmd": return ["CLI", "Binaries", "Main"];
    case "services": return ["GraphQL", "gRPC", "REST"];
    case "serverless": return ["Lambda", "SQS", "Events"];
    case "pkg": return ["Utils", "Clients", "Middleware"];
    case "model": return ["Structs", "Enums", "Types"];
    case "poc": return ["Proto", "Spike", "Exp"];
    case "tests": return ["E2E", "Load", "Integ"];
    case "doc": return ["ADR", "API", "Guides"];
    default: return [];
  }
}
