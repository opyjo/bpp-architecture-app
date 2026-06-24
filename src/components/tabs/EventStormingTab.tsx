"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import ModelSelector from "@/components/ai/ModelSelector";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import { downloadAsMarkdown } from "@/lib/utils";
import {
  type Board,
  type StickyKind,
  STICKY_KINDS,
  STICKY_STYLE,
  STICKY_SIZE,
  seedBoardFromRepo,
  lanePosition,
  newId,
  stickyCenter,
  boardToMermaid,
  boardToMarkdown,
  mergeAiResult,
} from "@/lib/event-storming";
import {
  Sparkles,
  Wand2,
  Workflow,
  AlertTriangle,
  Link2,
  Trash2,
  RotateCcw,
  Copy,
  Download,
  LayoutGrid,
  Network,
  Loader2,
  Plus,
} from "lucide-react";

const MermaidDiagram = dynamic(
  () => import("@/components/ui/MermaidDiagram"),
  { ssr: false }
);

const STORAGE_KEY = "event-storming-board-v1";

type AiAction = "infer" | "policies" | "hotspots";

function loadBoard(): Board {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Board;
    } catch {
      /* ignore */
    }
  }
  return seedBoardFromRepo();
}

export default function EventStormingTab() {
  const [board, setBoard] = useState<Board>(loadBoard);
  const [view, setView] = useState<"canvas" | "diagram">("canvas");
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<AiAction | null>(null);

  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  // Persist on every change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
    } catch {
      /* ignore */
    }
  }, [board]);

  // Canvas size grows to fit the furthest sticky.
  const canvasSize = useMemo(() => {
    let w = 1200;
    let h = 1120;
    for (const s of board.stickies) {
      w = Math.max(w, s.x + STICKY_SIZE.w + 80);
      h = Math.max(h, s.y + STICKY_SIZE.h + 80);
    }
    return { w, h };
  }, [board.stickies]);

  // ---- dragging ----
  const onPointerMove = useCallback((e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    setBoard((b) => ({
      ...b,
      stickies: b.stickies.map((s) =>
        s.id === d.id
          ? { ...s, x: Math.max(0, d.originX + dx), y: Math.max(0, d.originY + dy) }
          : s
      ),
    }));
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }, [onPointerMove]);

  const startDrag = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (editingId === id) return;
      const sticky = board.stickies.find((s) => s.id === id);
      if (!sticky) return;
      dragRef.current = {
        id,
        startX: e.clientX,
        startY: e.clientY,
        originX: sticky.x,
        originY: sticky.y,
      };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [board.stickies, editingId, onPointerMove, onPointerUp]
  );

  // ---- mutations ----
  const addSticky = (kind: StickyKind) => {
    setBoard((b) => {
      const pos = lanePosition(kind, b);
      return {
        ...b,
        stickies: [
          ...b.stickies,
          { id: newId(kind), kind, text: STICKY_STYLE[kind].label, x: pos.x, y: pos.y },
        ],
      };
    });
  };

  const updateText = (id: string, text: string) =>
    setBoard((b) => ({
      ...b,
      stickies: b.stickies.map((s) => (s.id === id ? { ...s, text } : s)),
    }));

  const deleteSticky = (id: string) =>
    setBoard((b) => ({
      stickies: b.stickies.filter((s) => s.id !== id),
      connections: b.connections.filter((c) => c.from !== id && c.to !== id),
    }));

  const handleStickyClick = (id: string) => {
    if (!connectFrom) return;
    if (connectFrom !== id) {
      setBoard((b) =>
        b.connections.some((c) => c.from === connectFrom && c.to === id)
          ? b
          : { ...b, connections: [...b.connections, { id: newId("c"), from: connectFrom, to: id }] }
      );
    }
    setConnectFrom(null);
  };

  const regenerate = () => {
    setBoard(seedBoardFromRepo());
    setConnectFrom(null);
    toast.success("Board reseeded from repo events");
  };

  const clearBoard = () => {
    setBoard({ stickies: [], connections: [] });
    setConnectFrom(null);
  };

  const runAi = async (action: AiAction) => {
    if (loadingAction) return;
    setLoadingAction(action);
    try {
      const res = await fetch("/api/event-storming", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          modelId,
          stickies: board.stickies.map((s) => ({ kind: s.kind, text: s.text })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");
      const before = board.stickies.length;
      const merged = mergeAiResult(board, data);
      setBoard(merged);
      toast.success(
        `Added ${merged.stickies.length - before} sticky${
          merged.stickies.length - before === 1 ? "" : "s"
        }`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setLoadingAction(null);
    }
  };

  const copyMermaid = async () => {
    await navigator.clipboard.writeText(boardToMermaid(board));
    toast.success("Mermaid copied");
  };

  const mermaid = useMemo(() => boardToMermaid(board), [board]);

  return (
    <div className="h-full flex flex-col bg-arch-bg">
      {/* Toolbar */}
      <div className="px-5 pt-4 pb-3 border-b border-arch-border space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Sparkles className="size-4 text-arch-amber" />
          <h1 className="text-base font-semibold tracking-tight text-arch-text">
            Event Storming
          </h1>
          <span className="text-[11px] text-arch-text3">
            seeded from <span className="font-mono">events.ts</span>
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            {/* View toggle */}
            <div className="flex rounded-lg border border-arch-border overflow-hidden">
              <button
                onClick={() => setView("canvas")}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium ${
                  view === "canvas"
                    ? "bg-arch-blue/15 text-arch-blue"
                    : "text-arch-text2 hover:text-arch-text"
                }`}
              >
                <LayoutGrid className="size-3.5" /> Canvas
              </button>
              <button
                onClick={() => setView("diagram")}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium ${
                  view === "diagram"
                    ? "bg-arch-blue/15 text-arch-blue"
                    : "text-arch-text2 hover:text-arch-text"
                }`}
              >
                <Network className="size-3.5" /> Diagram
              </button>
            </div>
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <ModelSelector value={modelId} onChange={setModelId} disabled={!!loadingAction} />

          <AiButton label="Infer commands" icon={Wand2} onClick={() => runAi("infer")} loading={loadingAction === "infer"} color="var(--arch-blue)" />
          <AiButton label="Find policies" icon={Workflow} onClick={() => runAi("policies")} loading={loadingAction === "policies"} color="var(--arch-purple)" />
          <AiButton label="Spot hotspots" icon={AlertTriangle} onClick={() => runAi("hotspots")} loading={loadingAction === "hotspots"} color="var(--arch-red)" />

          <div className="w-px h-5 bg-arch-border mx-1" />

          <button onClick={regenerate} className="toolbtn">
            <RotateCcw className="size-3.5" /> Reseed
          </button>
          <button onClick={copyMermaid} className="toolbtn">
            <Copy className="size-3.5" /> Mermaid
          </button>
          <button
            onClick={() => downloadAsMarkdown(boardToMarkdown(board), "event-storming.md")}
            className="toolbtn"
          >
            <Download className="size-3.5" /> .md
          </button>
          <button onClick={clearBoard} className="toolbtn text-arch-red">
            <Trash2 className="size-3.5" /> Clear
          </button>
        </div>

        {/* Add palette + legend */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-arch-text3 mr-1">Add:</span>
          {STICKY_KINDS.map((k) => (
            <button
              key={k.kind}
              onClick={() => addSticky(k.kind)}
              title={k.hint}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium border"
              style={{ backgroundColor: `${k.bg}22`, color: k.bg, borderColor: `${k.bg}55` }}
            >
              <Plus className="size-3" /> {k.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {view === "diagram" ? (
        <div className="flex-1 min-h-0">
          <MermaidDiagram chart={mermaid} />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto relative bg-[radial-gradient(circle,_var(--arch-border)_1px,_transparent_1px)] [background-size:24px_24px]">
          {connectFrom && (
            <div className="sticky top-2 left-2 z-30 inline-flex items-center gap-1.5 rounded-md bg-arch-blue px-2.5 py-1 text-[11px] font-medium text-white shadow-md ml-2">
              <Link2 className="size-3.5" /> Click a target sticky to connect — or
              <button className="underline" onClick={() => setConnectFrom(null)}>cancel</button>
            </div>
          )}
          <div className="relative" style={{ width: canvasSize.w, height: canvasSize.h }}>
            {/* Connection layer */}
            <svg className="absolute inset-0 pointer-events-none" width={canvasSize.w} height={canvasSize.h}>
              <defs>
                <marker id="es-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--arch-text3)" />
                </marker>
              </defs>
              {board.connections.map((c) => {
                const from = board.stickies.find((s) => s.id === c.from);
                const to = board.stickies.find((s) => s.id === c.to);
                if (!from || !to) return null;
                const a = stickyCenter(from);
                const b = stickyCenter(to);
                return (
                  <line
                    key={c.id}
                    x1={a.cx}
                    y1={a.cy}
                    x2={b.cx}
                    y2={b.cy}
                    stroke="var(--arch-text3)"
                    strokeWidth={1.5}
                    markerEnd="url(#es-arrow)"
                    opacity={0.7}
                  />
                );
              })}
            </svg>

            {/* Stickies */}
            {board.stickies.map((s) => {
              const style = STICKY_STYLE[s.kind];
              const isConnecting = connectFrom === s.id;
              return (
                <div
                  key={s.id}
                  onPointerDown={(e) => startDrag(e, s.id)}
                  onClick={() => handleStickyClick(s.id)}
                  onDoubleClick={() => setEditingId(s.id)}
                  title={s.ref}
                  className={`group absolute select-none rounded-md shadow-sm transition-shadow hover:shadow-md ${
                    connectFrom ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"
                  } ${isConnecting ? "ring-2 ring-offset-1 ring-arch-blue" : ""}`}
                  style={{
                    left: s.x,
                    top: s.y,
                    width: STICKY_SIZE.w,
                    minHeight: STICKY_SIZE.h,
                    backgroundColor: style.bg,
                    color: style.fg,
                  }}
                >
                  <div className="px-2.5 py-2">
                    <div className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                      {style.label}
                    </div>
                    {editingId === s.id ? (
                      <textarea
                        autoFocus
                        defaultValue={s.text}
                        onBlur={(e) => {
                          updateText(s.id, e.target.value.trim() || style.label);
                          setEditingId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            (e.target as HTMLTextAreaElement).blur();
                          }
                        }}
                        className="w-full resize-none bg-transparent text-[12px] font-semibold leading-tight outline-none"
                        style={{ color: style.fg }}
                        rows={2}
                      />
                    ) : (
                      <div className="text-[12px] font-semibold leading-tight break-words">
                        {s.text}
                      </div>
                    )}
                  </div>

                  {/* Hover controls */}
                  <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConnectFrom(connectFrom === s.id ? null : s.id);
                      }}
                      title="Connect to another sticky"
                      className="flex size-5 items-center justify-center rounded-full bg-arch-bg2 text-arch-blue shadow border border-arch-border"
                    >
                      <Link2 className="size-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSticky(s.id);
                      }}
                      title="Delete"
                      className="flex size-5 items-center justify-center rounded-full bg-arch-bg2 text-arch-red shadow border border-arch-border"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AiButton({
  label,
  icon: Icon,
  onClick,
  loading,
  color,
}: {
  label: string;
  icon: typeof Wand2;
  onClick: () => void;
  loading: boolean;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
      style={{ backgroundColor: color }}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Icon className="size-3.5" />}
      {label}
    </button>
  );
}
