"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Compact, instant-rendering, theme-aware "mental model" diagrams for the HOOPP
// prep tab. Pure CSS + inline SVG (arch-* tokens) — no Mermaid, no lazy render,
// no full-screen canvas. Each is a small picture you can hold in your head for an
// in-person panel. Big structural diagrams (ER, state machine) stay on Mermaid.
// ─────────────────────────────────────────────────────────────────────────────

import { ChevronRight, ChevronDown } from "lucide-react";

type Color = "blue" | "purple" | "teal" | "amber" | "green" | "coral" | "gray";

function mixBg(color: Color, pct = 9) {
  return `color-mix(in srgb, var(--arch-${color}) ${pct}%, transparent)`;
}
function mixBorder(color: Color, pct = 32) {
  return `color-mix(in srgb, var(--arch-${color}) ${pct}%, transparent)`;
}

// ─── Shared wrapper ──────────────────────────────────────────────────────────

function DiagramFrame({ caption, children }: { caption?: string; children: React.ReactNode }) {
  return (
    <div className="bg-arch-bg2 border border-arch-border rounded-lg p-4 my-3">
      {children}
      {caption && (
        <div className="text-[10.5px] text-arch-text3 mt-3 text-center italic leading-snug">{caption}</div>
      )}
    </div>
  );
}

function Node({ label, sub, color = "blue", wide }: { label: string; sub?: string; color?: Color; wide?: boolean }) {
  return (
    <div
      className={`rounded-lg px-3 py-2 text-center shrink-0 ${wide ? "min-w-[130px]" : "min-w-[92px]"}`}
      style={{ background: mixBg(color), border: `1px solid ${mixBorder(color)}` }}
    >
      <div className="text-[11px] font-semibold leading-tight" style={{ color: `var(--arch-${color})` }}>
        {label}
      </div>
      {sub && <div className="text-[9.5px] text-arch-text2 mt-0.5 leading-tight">{sub}</div>}
    </div>
  );
}

// ─── Horizontal flow: box → box → box ────────────────────────────────────────

export interface FlowNode {
  label: string;
  sub?: string;
  color?: Color;
}

export function FlowDiagram({ nodes, caption }: { nodes: FlowNode[]; caption?: string }) {
  return (
    <DiagramFrame caption={caption}>
      <div className="flex flex-wrap items-center justify-center gap-y-3">
        {nodes.map((n, i) => (
          <div key={i} className="flex items-center">
            <Node label={n.label} sub={n.sub} color={n.color} />
            {i < nodes.length - 1 && <ChevronRight className="mx-1.5 text-arch-text3 shrink-0" size={18} />}
          </div>
        ))}
      </div>
    </DiagramFrame>
  );
}

// ─── Source → many branches ──────────────────────────────────────────────────

export function BranchDiagram({
  source,
  branches,
  caption,
}: {
  source: FlowNode;
  branches: FlowNode[];
  caption?: string;
}) {
  return (
    <DiagramFrame caption={caption}>
      <div className="flex items-center justify-center gap-2">
        <Node label={source.label} sub={source.sub} color={source.color} wide />
        <ChevronRight className="text-arch-text3 shrink-0" size={18} />
        <div className="flex flex-col gap-2">
          {branches.map((b, i) => (
            <Node key={i} label={b.label} sub={b.sub} color={b.color} wide />
          ))}
        </div>
      </div>
    </DiagramFrame>
  );
}

// ─── Vertical layered stack (top → bottom) ───────────────────────────────────

export function StackDiagram({ layers, caption }: { layers: FlowNode[]; caption?: string }) {
  return (
    <DiagramFrame caption={caption}>
      <div className="flex flex-col items-center gap-0">
        {layers.map((l, i) => (
          <div key={i} className="flex flex-col items-center w-full max-w-[320px]">
            <div
              className="rounded-lg px-3 py-2 text-center w-full"
              style={{ background: mixBg(l.color ?? "blue"), border: `1px solid ${mixBorder(l.color ?? "blue")}` }}
            >
              <div className="text-[11px] font-semibold leading-tight" style={{ color: `var(--arch-${l.color ?? "blue"})` }}>
                {l.label}
              </div>
              {l.sub && <div className="text-[9.5px] text-arch-text2 mt-0.5 leading-tight">{l.sub}</div>}
            </div>
            {i < layers.length - 1 && <ChevronDown className="my-1 text-arch-text3 shrink-0" size={16} />}
          </div>
        ))}
      </div>
    </DiagramFrame>
  );
}

// ─── Small comparison matrix ─────────────────────────────────────────────────

export function MatrixDiagram({
  headers,
  rows,
  caption,
}: {
  headers: string[];
  rows: { cells: string[]; color?: Color }[];
  caption?: string;
}) {
  return (
    <DiagramFrame caption={caption}>
      <table className="w-full border-collapse text-[10.5px]">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-left px-2.5 py-1.5 text-[9px] font-semibold tracking-[0.06em] uppercase text-arch-text3 border-b border-arch-border"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.cells.map((c, j) => (
                <td
                  key={j}
                  className="px-2.5 py-1.5 border-b border-arch-border text-arch-text2 align-top leading-snug"
                  style={j === 0 ? { color: `var(--arch-${r.color ?? "blue"})`, fontWeight: 600 } : undefined}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </DiagramFrame>
  );
}

// ─── Join Venn diagrams (INNER / LEFT / RIGHT / FULL) ─────────────────────────

function MiniVenn({ mode, title, note }: { mode: "inner" | "left" | "right" | "full"; title: string; note: string }) {
  const id = `venn-${mode}`;
  const fill = "var(--arch-blue)";
  const stroke = "var(--arch-text2)";
  const ax = 34, bx = 62, cy = 34, r = 24;
  return (
    <div className="flex flex-col items-center w-[112px]">
      <svg viewBox="0 0 96 68" width="112" height="80">
        <defs>
          <clipPath id={id}>
            <circle cx={bx} cy={cy} r={r} />
          </clipPath>
        </defs>
        {/* Shaded regions per join type */}
        {(mode === "left" || mode === "full") && <circle cx={ax} cy={cy} r={r} fill={fill} opacity={0.35} />}
        {(mode === "right" || mode === "full") && <circle cx={bx} cy={cy} r={r} fill={fill} opacity={0.35} />}
        {mode === "inner" && <circle cx={ax} cy={cy} r={r} fill={fill} opacity={0.5} clipPath={`url(#${id})`} />}
        {/* Outlines */}
        <circle cx={ax} cy={cy} r={r} fill="none" stroke={stroke} strokeWidth={1.2} />
        <circle cx={bx} cy={cy} r={r} fill="none" stroke={stroke} strokeWidth={1.2} />
        <text x={ax - 8} y={cy + 3} fontSize={9} fill="var(--arch-text3)" textAnchor="middle">A</text>
        <text x={bx + 8} y={cy + 3} fontSize={9} fill="var(--arch-text3)" textAnchor="middle">B</text>
      </svg>
      <div className="text-[10.5px] font-semibold text-arch-blue -mt-1">{title}</div>
      <div className="text-[9px] text-arch-text3 text-center leading-tight mt-0.5">{note}</div>
    </div>
  );
}

export function JoinVenn({ caption }: { caption?: string }) {
  return (
    <DiagramFrame caption={caption}>
      <div className="flex flex-wrap items-start justify-center gap-3">
        <MiniVenn mode="inner" title="INNER" note="rows in BOTH" />
        <MiniVenn mode="left" title="LEFT" note="all A + matches" />
        <MiniVenn mode="right" title="RIGHT" note="all B + matches" />
        <MiniVenn mode="full" title="FULL OUTER" note="everything" />
      </div>
    </DiagramFrame>
  );
}

// ─── Reconciliation Venn (Source vs Target) ──────────────────────────────────

export function ReconVenn({ caption }: { caption?: string }) {
  const fill = "var(--arch-teal)";
  const stroke = "var(--arch-text2)";
  return (
    <DiagramFrame caption={caption}>
      <div className="flex justify-center">
        <svg viewBox="0 0 300 150" width="100%" style={{ maxWidth: 360 }}>
          <circle cx={110} cy={70} r={58} fill={fill} opacity={0.12} stroke={stroke} strokeWidth={1.2} />
          <circle cx={190} cy={70} r={58} fill={fill} opacity={0.12} stroke={stroke} strokeWidth={1.2} />
          <text x={72} y={26} fontSize={11} fontWeight={700} fill="var(--arch-teal)" textAnchor="middle">SOURCE</text>
          <text x={228} y={26} fontSize={11} fontWeight={700} fill="var(--arch-teal)" textAnchor="middle">TARGET</text>
          {/* left-only */}
          <text x={72} y={68} fontSize={9} fill="var(--arch-coral)" textAnchor="middle" fontWeight={600}>MISSING IN</text>
          <text x={72} y={80} fontSize={9} fill="var(--arch-coral)" textAnchor="middle" fontWeight={600}>TARGET</text>
          {/* overlap */}
          <text x={150} y={64} fontSize={8.5} fill="var(--arch-text)" textAnchor="middle" fontWeight={600}>IN BOTH</text>
          <text x={150} y={76} fontSize={8} fill="var(--arch-text2)" textAnchor="middle">compare</text>
          <text x={150} y={86} fontSize={8} fill="var(--arch-text2)" textAnchor="middle">values</text>
          {/* right-only */}
          <text x={228} y={68} fontSize={9} fill="var(--arch-coral)" textAnchor="middle" fontWeight={600}>MISSING IN</text>
          <text x={228} y={80} fontSize={9} fill="var(--arch-coral)" textAnchor="middle" fontWeight={600}>SOURCE</text>
        </svg>
      </div>
    </DiagramFrame>
  );
}

// ─── Cardinality crow's-foot legend ──────────────────────────────────────────

function CrowRow({ notation, label, symbol }: { notation: string; label: string; symbol: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-[120px] shrink-0">
        <svg viewBox="0 0 120 24" width="120" height="24">{symbol}</svg>
      </div>
      <div>
        <span className="text-[11px] font-semibold text-arch-purple">{notation}</span>
        <span className="text-[10.5px] text-arch-text2 ml-2">{label}</span>
      </div>
    </div>
  );
}

export function CardinalityLegend({ caption }: { caption?: string }) {
  const s = "var(--arch-text2)";
  return (
    <DiagramFrame caption={caption}>
      <div className="flex flex-col gap-3 items-start pl-2">
        <CrowRow
          notation="1 : 1"
          label="member ↔ profile"
          symbol={
            <g stroke={s} strokeWidth={1.4} fill="none">
              <line x1={10} y1={12} x2={110} y2={12} />
              <line x1={28} y1={4} x2={28} y2={20} />
              <line x1={92} y1={4} x2={92} y2={20} />
            </g>
          }
        />
        <CrowRow
          notation="1 : M"
          label="member → many beneficiaries"
          symbol={
            <g stroke={s} strokeWidth={1.4} fill="none">
              <line x1={10} y1={12} x2={110} y2={12} />
              <line x1={28} y1={4} x2={28} y2={20} />
              {/* crow's foot on the right (many) */}
              <line x1={92} y1={12} x2={110} y2={4} />
              <line x1={92} y1={12} x2={110} y2={20} />
              <line x1={92} y1={12} x2={110} y2={12} />
            </g>
          }
        />
        <CrowRow
          notation="M : N"
          label="members ↔ plans (via junction)"
          symbol={
            <g stroke={s} strokeWidth={1.4} fill="none">
              <line x1={10} y1={12} x2={110} y2={12} />
              {/* crow's foot left (many) */}
              <line x1={28} y1={12} x2={10} y2={4} />
              <line x1={28} y1={12} x2={10} y2={20} />
              {/* crow's foot right (many) */}
              <line x1={92} y1={12} x2={110} y2={4} />
              <line x1={92} y1={12} x2={110} y2={20} />
            </g>
          }
        />
      </div>
    </DiagramFrame>
  );
}
