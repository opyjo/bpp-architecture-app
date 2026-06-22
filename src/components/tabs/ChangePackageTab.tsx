"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import ModelSelector from "@/components/ai/ModelSelector";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import { cn, downloadAsMarkdown } from "@/lib/utils";
import Link from "next/link";
import type { StreamEvent } from "@/lib/types/chat";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Circle,
  Package,
  Sparkles,
  Copy,
  Download,
  Radar,
  Workflow,
  ClipboardCheck,
  FileCode2,
  ExternalLink,
} from "lucide-react";

// ---------- Stage definitions ----------

type StageStatus = "pending" | "running" | "done" | "error";

interface StageDef {
  key: string;
  title: string;
  blurb: string;
  icon: typeof Radar;
  accent: string; // arch accent name, e.g. "blue"
  instruction: string;
}

const STAGES: StageDef[] = [
  {
    key: "impact",
    title: "Impact Analysis",
    blurb: "Blast radius across services, Kafka events & lambdas",
    icon: Radar,
    accent: "blue",
    instruction:
      "You are a senior platform architect on the Bell Canada Subscription Manager (Go microservices + Next.js BFF). Perform a rigorous IMPACT ANALYSIS for the ticket below. Map the blast radius: which microservices are affected (upstream/downstream), which Kafka events/topics are produced or consumed, and which lambda functions are touched. Call out data/schema migrations, backward-compatibility risks, and rollback considerations. Respond in concise, well-structured Markdown with clear headings and tables where useful.",
  },
  {
    key: "sequence",
    title: "Sequence Diagram",
    blurb: "Mermaid sequenceDiagram for the primary flow",
    icon: Workflow,
    accent: "purple",
    instruction:
      "Based on the ticket below, produce a Mermaid sequenceDiagram describing the PRIMARY end-to-end flow for this change across the relevant services, BFF, Kafka, and lambdas. Output the diagram inside a single ```mermaid fenced code block beginning with `sequenceDiagram`. Use participants/actors and clear messages with notes where helpful. After the diagram, add a short bullet-point walkthrough of the steps in Markdown.",
  },
  {
    key: "testplan",
    title: "Test Plan",
    blurb: "Objectives, scenarios & edge cases",
    icon: ClipboardCheck,
    accent: "teal",
    instruction:
      "Write a concise TEST PLAN for the ticket below. Include sections: Objectives, Test Scenarios (happy path + integration across services/Kafka), Edge Cases & Negative Tests, and Non-functional considerations (performance, idempotency, observability). Use Markdown with headings and checkbox-style bullet lists.",
  },
  {
    key: "contract",
    title: "API Contract",
    blurb: "Endpoint & request/response contract changes",
    icon: FileCode2,
    accent: "amber",
    instruction:
      "Propose the API CONTRACT changes required for the ticket below. For each new or modified endpoint, specify method + path, request schema, response schema, status codes, and error shapes in an OpenAPI-flavoured style. Prefer fenced ```yaml or ```json blocks for the contract snippets and explain backward-compatibility/versioning in Markdown prose.",
  },
];

const STORAGE_KEY = "change-package-last";

interface StageState {
  status: StageStatus;
  text: string;
}

interface PersistedRun {
  ticket: string;
  modelId: string;
  stages: Record<string, string>;
  savedAt: number;
}

// ---------- Accent helpers ----------

const ACCENT: Record<
  string,
  { text: string; bg: string; border: string; ring: string; from: string; to: string }
> = {
  blue: {
    text: "text-arch-blue",
    bg: "bg-arch-blue/10",
    border: "border-arch-blue/30",
    ring: "ring-arch-blue/30",
    from: "from-arch-blue",
    to: "to-arch-teal",
  },
  purple: {
    text: "text-arch-purple",
    bg: "bg-arch-purple/10",
    border: "border-arch-purple/30",
    ring: "ring-arch-purple/30",
    from: "from-arch-purple",
    to: "to-arch-blue",
  },
  teal: {
    text: "text-arch-teal",
    bg: "bg-arch-teal/10",
    border: "border-arch-teal/30",
    ring: "ring-arch-teal/30",
    from: "from-arch-teal",
    to: "to-arch-green",
  },
  amber: {
    text: "text-arch-amber",
    bg: "bg-arch-amber/10",
    border: "border-arch-amber/30",
    ring: "ring-arch-amber/30",
    from: "from-arch-amber",
    to: "to-arch-coral",
  },
};

// Extract first ```mermaid fenced block.
function extractMermaid(md: string): string | null {
  const match = md.match(/```mermaid\s*\n([\s\S]*?)```/i);
  return match ? match[1].trim() : null;
}

function loadPersisted(): PersistedRun | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedRun;
  } catch {
    return null;
  }
}

function StatusIcon({ status, accent }: { status: StageStatus; accent: string }) {
  if (status === "running")
    return <Loader2 className={cn("w-4 h-4 animate-spin", ACCENT[accent].text)} />;
  if (status === "done")
    return <CheckCircle2 className="w-4 h-4 text-arch-green" />;
  if (status === "error")
    return <AlertCircle className="w-4 h-4 text-arch-red" />;
  return <Circle className="w-4 h-4 text-arch-text3" />;
}

export default function ChangePackageTab() {
  // Restore last run on mount via lazy initializers (avoids setState-in-effect).
  const [ticket, setTicket] = useState(() => loadPersisted()?.ticket ?? "");
  const [modelId, setModelId] = useState(
    () => loadPersisted()?.modelId ?? DEFAULT_MODEL_ID
  );
  const [isRunning, setIsRunning] = useState(false);
  const [stages, setStages] = useState<Record<string, StageState>>(() => {
    const persisted = loadPersisted();
    return Object.fromEntries(
      STAGES.map((s) => {
        const text = persisted?.stages?.[s.key] ?? "";
        return [s.key, { status: text ? "done" : "pending", text } as StageState];
      })
    );
  });
  const [savedAt, setSavedAt] = useState<number | null>(
    () => loadPersisted()?.savedAt ?? null
  );
  const abortRef = useRef<AbortController | null>(null);

  const setStage = useCallback(
    (key: string, patch: Partial<StageState>) => {
      setStages((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
    },
    []
  );

  // Run a single stage to completion, streaming deltas live.
  const runStage = useCallback(
    async (stage: StageDef, ticketText: string, signal: AbortSignal) => {
      setStage(stage.key, { status: "running", text: "" });
      let accumulated = "";

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: stage.instruction + "\n\nTICKET:\n" + ticketText,
            },
          ],
          modelId,
        }),
        signal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `API error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let event: StreamEvent;
          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }
          if (event.type === "text_delta") {
            accumulated += event.text;
            setStage(stage.key, { text: accumulated });
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }

      setStage(stage.key, { status: "done", text: accumulated });
      return accumulated;
    },
    [modelId, setStage]
  );

  const handleGenerate = useCallback(async () => {
    const ticketText = ticket.trim();
    if (!ticketText || isRunning) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setIsRunning(true);

    // Reset all stages.
    setStages(
      Object.fromEntries(
        STAGES.map((s) => [s.key, { status: "pending" as StageStatus, text: "" }])
      )
    );

    const results: Record<string, string> = {};
    try {
      for (const stage of STAGES) {
        results[stage.key] = await runStage(stage, ticketText, controller.signal);
      }
      const ts = Date.now();
      setSavedAt(ts);
      try {
        const payload: PersistedRun = {
          ticket: ticketText,
          modelId,
          stages: results,
          savedAt: ts,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // storage full — ignore
      }
      toast.success("Change package generated");
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : "Generation failed";
      // Mark the currently-running stage as errored.
      setStages((prev) => {
        const next = { ...prev };
        for (const s of STAGES) {
          if (next[s.key].status === "running") {
            next[s.key] = { ...next[s.key], status: "error" };
          }
        }
        return next;
      });
      toast.error(message);
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, [ticket, isRunning, modelId, runStage]);

  // Build the combined document.
  const buildDoc = useCallback(() => {
    const header = `# Change Package\n\n> Generated ${new Date(
      savedAt ?? Date.now()
    ).toLocaleString()}\n\n## Ticket\n\n${ticket.trim()}\n`;
    const body = STAGES.map((s, i) => {
      const text = stages[s.key]?.text?.trim();
      return `\n---\n\n# ${i + 1}. ${s.title}\n\n${text || "_(not generated)_"}\n`;
    }).join("");
    return header + body;
  }, [ticket, stages, savedAt]);

  const handleCopyAll = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildDoc());
      toast.success("Copied change package to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }, [buildDoc]);

  const handleDownload = useCallback(() => {
    downloadAsMarkdown(buildDoc(), "change-package.md");
  }, [buildDoc]);

  const doneCount = STAGES.filter((s) => stages[s.key]?.status === "done").length;
  const hasContent = STAGES.some((s) => stages[s.key]?.text);
  const progress = Math.round((doneCount / STAGES.length) * 100);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-arch-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-arch-border bg-arch-bg2/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-arch-blue via-arch-purple to-arch-coral text-white flex items-center justify-center shrink-0 shadow-sm">
            <Package className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-arch-text truncate leading-tight">
              Change Package Pipeline
            </div>
            <div className="text-[10.5px] text-arch-text3 truncate">
              One ticket in, a complete change package out
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/?tab=sequence"
            className="hidden sm:flex items-center gap-1 text-[11px] text-arch-text3 hover:text-arch-purple transition-colors px-2 py-1 rounded hover:bg-white/5"
          >
            <ExternalLink className="w-3 h-3" />
            Sequence tab
          </Link>
          <Link
            href="/?tab=testplan"
            className="hidden sm:flex items-center gap-1 text-[11px] text-arch-text3 hover:text-arch-teal transition-colors px-2 py-1 rounded hover:bg-white/5"
          >
            <ExternalLink className="w-3 h-3" />
            Test Plan tab
          </Link>
          <div className="w-px h-4 bg-arch-border mx-0.5" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyAll}
            disabled={!hasContent}
          >
            <Copy className="w-3.5 h-3.5" />
            Copy all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={!hasContent}
          >
            <Download className="w-3.5 h-3.5" />
            .md
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-5 py-6 space-y-6">
          {/* Input card */}
          <Card className="border-arch-border2/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-arch-blue" />
                <CardTitle className="text-[13px]">
                  Ticket / Requirement
                </CardTitle>
              </div>
              <CardDescription>
                Paste a ticket or describe the change. Four AI stages run in
                sequence to produce a full change package.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={ticket}
                onChange={(e) => setTicket(e.target.value)}
                disabled={isRunning}
                rows={5}
                placeholder="e.g. SUBM-1421: Add a 'pause subscription' capability allowing customers to suspend billing for up to 90 days, then auto-resume..."
                className="w-full resize-none bg-arch-bg2 border border-arch-border rounded-lg p-3 text-[12.5px] text-arch-text placeholder:text-arch-text3 leading-relaxed focus:outline-none focus:border-arch-blue/50 focus:ring-2 focus:ring-arch-blue/20 transition-all disabled:opacity-60"
              />
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-arch-text3">
                    Model
                  </span>
                  <ModelSelector
                    value={modelId}
                    onChange={setModelId}
                    disabled={isRunning}
                  />
                  {savedAt && !isRunning && (
                    <span className="text-[10px] text-arch-text3">
                      restored last run
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={isRunning || !ticket.trim()}
                  className="bg-gradient-to-r from-arch-blue to-arch-purple text-white hover:opacity-90 border-0"
                >
                  {isRunning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Package className="w-4 h-4" />
                  )}
                  {isRunning ? "Generating…" : "Generate change package"}
                </Button>
              </div>

              {/* Overall progress */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10.5px] text-arch-text3">
                  <span className="uppercase tracking-wider font-medium">
                    Overall progress
                  </span>
                  <span className="font-mono">
                    {doneCount}/{STAGES.length} · {progress}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-arch-bg3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-arch-blue via-arch-purple to-arch-coral transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stepper */}
          <div className="relative space-y-4">
            {STAGES.map((stage, idx) => {
              const st = stages[stage.key];
              const accent = ACCENT[stage.accent];
              const Icon = stage.icon;
              const isLast = idx === STAGES.length - 1;
              const mermaid =
                stage.key === "sequence" && st.text
                  ? extractMermaid(st.text)
                  : null;

              return (
                <div key={stage.key} className="relative flex gap-3.5">
                  {/* Numbered circle + connector line */}
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold border transition-all",
                        st.status === "done"
                          ? "bg-arch-green/10 border-arch-green/40 text-arch-green"
                          : st.status === "running"
                          ? cn(accent.bg, accent.border, accent.text, "ring-4", accent.ring)
                          : st.status === "error"
                          ? "bg-arch-red/10 border-arch-red/40 text-arch-red"
                          : "bg-arch-bg3 border-arch-border text-arch-text3"
                      )}
                    >
                      {idx + 1}
                    </div>
                    {!isLast && (
                      <div
                        className={cn(
                          "w-px flex-1 mt-1 transition-colors",
                          st.status === "done"
                            ? "bg-arch-green/40"
                            : "bg-arch-border"
                        )}
                      />
                    )}
                  </div>

                  {/* Stage card */}
                  <Card
                    className={cn(
                      "flex-1 mb-1 transition-colors",
                      st.status === "running" && cn(accent.border, "shadow-sm")
                    )}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={cn(
                              "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                              accent.bg
                            )}
                          >
                            <Icon className={cn("w-3.5 h-3.5", accent.text)} />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-[12.5px] flex items-center gap-2">
                              <span className="truncate">{stage.title}</span>
                            </CardTitle>
                            <CardDescription className="text-[10.5px]">
                              {stage.blurb}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={cn(
                              "text-[10px] uppercase tracking-wider font-medium",
                              st.status === "done"
                                ? "text-arch-green"
                                : st.status === "running"
                                ? accent.text
                                : st.status === "error"
                                ? "text-arch-red"
                                : "text-arch-text3"
                            )}
                          >
                            {st.status}
                          </span>
                          <StatusIcon status={st.status} accent={stage.accent} />
                        </div>
                      </div>
                    </CardHeader>

                    {(st.text || st.status === "running") && (
                      <CardContent className="space-y-3">
                        {/* Rendered mermaid for sequence stage */}
                        {mermaid && (
                          <div className="rounded-lg border border-arch-border overflow-hidden">
                            <MermaidDiagram chart={mermaid} />
                          </div>
                        )}
                        {st.text ? (
                          <div className="rounded-lg bg-arch-bg2/40 border border-arch-border px-3.5 py-2.5">
                            <MarkdownRenderer content={st.text} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-[11px] text-arch-text3">
                            <Loader2
                              className={cn(
                                "w-3 h-3 animate-spin",
                                accent.text
                              )}
                            />
                            Thinking…
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
