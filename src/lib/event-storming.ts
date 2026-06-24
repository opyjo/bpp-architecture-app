// Event Storming domain model + helpers.
// Color grammar follows Alberto Brandolini's convention.
import { kafkaEvents, kafkaConsumers } from "@/data/events";

export type StickyKind =
  | "command"
  | "event"
  | "aggregate"
  | "policy"
  | "readmodel"
  | "external"
  | "actor"
  | "hotspot";

export interface Sticky {
  id: string;
  kind: StickyKind;
  text: string;
  x: number;
  y: number;
  ref?: string; // topic, file, or note shown on hover
}

export interface Connection {
  id: string;
  from: string; // sticky id
  to: string; // sticky id
}

export interface Board {
  stickies: Sticky[];
  connections: Connection[];
}

export interface StickyStyle {
  kind: StickyKind;
  label: string;
  bg: string;
  fg: string;
  hint: string;
}

// Order also drives the legend + "add" toolbar.
export const STICKY_KINDS: StickyStyle[] = [
  { kind: "command", label: "Command", bg: "#3b82f6", fg: "#0a1426", hint: "An intent / action a user or system issues" },
  { kind: "event", label: "Event", bg: "#f59e0b", fg: "#1c1404", hint: "Something happened — past tense" },
  { kind: "aggregate", label: "Aggregate", bg: "#fcd34d", fg: "#1c1404", hint: "The thing a command acts upon" },
  { kind: "policy", label: "Policy", bg: "#a855f7", fg: "#fdf4ff", hint: "Whenever <event> then <command>" },
  { kind: "readmodel", label: "Read model", bg: "#22c55e", fg: "#04210f", hint: "A view / projection used to decide" },
  { kind: "external", label: "External", bg: "#ec4899", fg: "#fdf2f8", hint: "An outside system or service" },
  { kind: "actor", label: "Actor", bg: "#fde68a", fg: "#1c1404", hint: "A person / role" },
  { kind: "hotspot", label: "Hotspot", bg: "#ef4444", fg: "#fff5f5", hint: "A problem, risk, or open question" },
];

export const STICKY_STYLE: Record<StickyKind, StickyStyle> = Object.fromEntries(
  STICKY_KINDS.map((k) => [k.kind, k])
) as Record<StickyKind, StickyStyle>;

// Vertical lane per kind so generated/added stickies land somewhere sensible.
export const LANE_Y: Record<StickyKind, number> = {
  actor: 24,
  command: 130,
  event: 280,
  aggregate: 430,
  policy: 580,
  readmodel: 730,
  external: 880,
  hotspot: 1000,
};

const STICKY_W = 168;
const STICKY_H = 66;
const LANE_GAP_X = 188;

export function stickyCenter(s: Sticky): { cx: number; cy: number } {
  return { cx: s.x + STICKY_W / 2, cy: s.y + STICKY_H / 2 };
}
export const STICKY_SIZE = { w: STICKY_W, h: STICKY_H };

let idCounter = 0;
export function newId(prefix = "s"): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/** Next free x position within a kind's lane, given the current board. */
export function lanePosition(kind: StickyKind, board: Board): { x: number; y: number } {
  const inLane = board.stickies.filter((s) => s.kind === kind).length;
  return { x: 40 + inLane * LANE_GAP_X, y: LANE_Y[kind] };
}

/** Deterministic seed from the repo's Kafka data — no AI required. */
export function seedBoardFromRepo(): Board {
  const stickies: Sticky[] = [];

  kafkaEvents.forEach((ev, i) => {
    stickies.push({
      id: `ev-${ev.id}`,
      kind: "event",
      text: ev.title,
      x: 40 + i * LANE_GAP_X,
      y: LANE_Y.event,
      ref: ev.topic,
    });
  });

  kafkaConsumers.forEach((c, i) => {
    stickies.push({
      id: `pol-${i}`,
      kind: "policy",
      text: c.title,
      x: 40 + i * LANE_GAP_X,
      y: LANE_Y.policy,
      ref: c.body,
    });
  });

  return { stickies, connections: [] };
}

function safeId(id: string): string {
  return "n_" + id.replace(/[^a-zA-Z0-9_]/g, "_");
}
function escapeText(t: string): string {
  return t.replace(/"/g, "'").replace(/\n/g, " ");
}

/** Serialize the board to a Mermaid flowchart with per-kind colors. */
export function boardToMermaid(board: Board): string {
  const lines: string[] = ["flowchart LR"];

  for (const s of board.stickies) {
    const id = safeId(s.id);
    lines.push(`  ${id}["${escapeText(s.text)}"]:::${s.kind}`);
  }
  for (const c of board.connections) {
    lines.push(`  ${safeId(c.from)} --> ${safeId(c.to)}`);
  }
  for (const k of STICKY_KINDS) {
    lines.push(`  classDef ${k.kind} fill:${k.bg},color:${k.fg},stroke:#00000022;`);
  }
  return lines.join("\n");
}

/** Serialize the board to a readable Markdown domain summary. */
export function boardToMarkdown(board: Board): string {
  const byId = new Map(board.stickies.map((s) => [s.id, s]));
  const out: string[] = ["# Event Storming — domain summary", ""];

  for (const k of STICKY_KINDS) {
    const items = board.stickies.filter((s) => s.kind === k.kind);
    if (!items.length) continue;
    out.push(`## ${k.label}s`);
    for (const s of items) {
      out.push(`- **${s.text}**${s.ref ? ` — _${s.ref.split("\n")[0]}_` : ""}`);
    }
    out.push("");
  }

  if (board.connections.length) {
    out.push("## Flows");
    for (const c of board.connections) {
      const a = byId.get(c.from)?.text ?? "?";
      const b = byId.get(c.to)?.text ?? "?";
      out.push(`- ${a} → ${b}`);
    }
    out.push("");
  }
  return out.join("\n");
}

// Shape the AI facilitator returns (text-referenced, resolved on the client).
export interface AiStickySuggestion {
  kind: StickyKind;
  text: string;
  ref?: string;
}
export interface AiConnectionSuggestion {
  from: string; // sticky text
  to: string; // sticky text
}
export interface AiResult {
  stickies?: AiStickySuggestion[];
  connections?: AiConnectionSuggestion[];
}

/** Merge AI suggestions (text-referenced) into the board, de-duping by text. */
export function mergeAiResult(board: Board, ai: AiResult): Board {
  const textToId = new Map(
    board.stickies.map((s) => [s.text.toLowerCase(), s.id])
  );
  const stickies = [...board.stickies];
  const working: Board = { stickies, connections: [...board.connections] };

  for (const sug of ai.stickies ?? []) {
    if (!sug.text || !STICKY_STYLE[sug.kind]) continue;
    if (textToId.has(sug.text.toLowerCase())) continue;
    const pos = lanePosition(sug.kind, working);
    const id = newId(sug.kind);
    stickies.push({ id, kind: sug.kind, text: sug.text, x: pos.x, y: pos.y, ref: sug.ref });
    textToId.set(sug.text.toLowerCase(), id);
  }

  const connections = [...board.connections];
  for (const c of ai.connections ?? []) {
    const from = textToId.get((c.from ?? "").toLowerCase());
    const to = textToId.get((c.to ?? "").toLowerCase());
    if (!from || !to || from === to) continue;
    if (connections.some((x) => x.from === from && x.to === to)) continue;
    connections.push({ id: newId("c"), from, to });
  }

  return { stickies, connections };
}
