"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { type Runbook, severityColors } from "@/data/runbooks";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import { downloadAsMarkdown, cn } from "@/lib/utils";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Activity,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Loader2,
  MessageSquarePlus,
  RotateCcw,
  Download,
  X,
} from "lucide-react";

interface StepState {
  done: boolean;
  doneTs: number | null;
  note: string;
}

interface IncidentState {
  startedTs: number;
  steps: Record<number, StepState>;
}

interface RunbookExecutionProps {
  runbook: Runbook;
  onClose?: () => void;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = (totalSeconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function RunbookExecution({
  runbook,
  onClose,
}: RunbookExecutionProps) {
  const storageKey = `runbook-incident:${runbook.id}`;
  const steps = runbook.resolutionSteps;
  const sev = severityColors[runbook.severity] ?? "arch-coral";

  const [incident, setIncident] = useState<IncidentState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());

  const [postmortem, setPostmortem] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const pmRef = useRef<HTMLDivElement>(null);

  // Restore or initialize the active incident on mount.
  useEffect(() => {
    let restored: IncidentState | null = null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) restored = JSON.parse(raw) as IncidentState;
    } catch {
      restored = null;
    }
    setIncident(
      restored ?? { startedTs: Date.now(), steps: {} }
    );
  }, [storageKey]);

  // Persist on every change.
  useEffect(() => {
    if (!incident) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(incident));
    } catch {
      /* ignore quota errors */
    }
  }, [incident, storageKey]);

  // Live ticking timer.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Auto-scroll postmortem panel while streaming.
  useEffect(() => {
    if (isGenerating && pmRef.current) {
      pmRef.current.scrollTop = pmRef.current.scrollHeight;
    }
  }, [postmortem, isGenerating]);

  // Cancel any in-flight stream on unmount.
  useEffect(() => () => abortRef.current?.abort(), []);

  const getStep = useCallback(
    (idx: number): StepState =>
      incident?.steps[idx] ?? { done: false, doneTs: null, note: "" },
    [incident]
  );

  const toggleStep = (idx: number) => {
    setIncident((prev) => {
      if (!prev) return prev;
      const cur = prev.steps[idx] ?? { done: false, doneTs: null, note: "" };
      const done = !cur.done;
      return {
        ...prev,
        steps: {
          ...prev.steps,
          [idx]: { ...cur, done, doneTs: done ? Date.now() : null },
        },
      };
    });
  };

  const setNote = (idx: number, note: string) => {
    setIncident((prev) => {
      if (!prev) return prev;
      const cur = prev.steps[idx] ?? { done: false, doneTs: null, note: "" };
      return {
        ...prev,
        steps: { ...prev.steps, [idx]: { ...cur, note } },
      };
    });
  };

  const toggleNote = (idx: number) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const resetIncident = () => {
    if (
      !window.confirm(
        "Reset this incident? All checked steps, timestamps, and notes will be cleared."
      )
    )
      return;
    abortRef.current?.abort();
    setIsGenerating(false);
    setPostmortem("");
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    setIncident({ startedTs: Date.now(), steps: {} });
    setExpandedNotes(new Set());
    toast.success("Incident reset");
  };

  const doneCount = steps.reduce(
    (acc, _s, i) => acc + (getStep(i).done ? 1 : 0),
    0
  );
  const progressPct = steps.length
    ? Math.round((doneCount / steps.length) * 100)
    : 0;

  const buildPrompt = (): string => {
    const startedTs = incident?.startedTs ?? Date.now();
    const lines: string[] = [
      `You are an SRE writing a blameless incident postmortem in Markdown.`,
      `Use exactly these sections as level-2 headings: "Incident summary", "Timeline", "Impact", "Root cause", "Action items".`,
      `In the Root cause section, explicitly mark the root cause as **TBD** (it has not yet been confirmed) and list the most likely candidates as hypotheses.`,
      `Keep it concise, factual, and professional. Derive the timeline strictly from the completed steps and their timestamps below.`,
      ``,
      `## Incident metadata`,
      `- Runbook: ${runbook.title}`,
      `- Severity: ${runbook.severity}`,
      `- Description: ${runbook.description}`,
      `- Affected services: ${runbook.affectedServices.join(", ")}`,
      `- Escalation path: ${runbook.escalationPath}`,
      `- Incident started: ${new Date(startedTs).toISOString()}`,
      `- Elapsed at report time: ${formatElapsed(now - startedTs)} (mm:ss)`,
      `- Progress: ${doneCount} of ${steps.length} resolution steps completed`,
      ``,
      `## Resolution steps taken (in order)`,
    ];

    steps.forEach((step, i) => {
      const s = getStep(i);
      const status = s.done
        ? `DONE at ${new Date(s.doneTs ?? startedTs).toISOString()}`
        : "NOT COMPLETED";
      lines.push(`${i + 1}. [${status}] ${step}`);
      if (s.note.trim()) lines.push(`   - Operator note: ${s.note.trim()}`);
    });

    lines.push(
      ``,
      `Now produce the postmortem in Markdown.`
    );
    return lines.join("\n");
  };

  const generatePostmortem = async () => {
    if (isGenerating) return;
    setPostmortem("");
    setIsGenerating(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: buildPrompt() }],
          modelId: DEFAULT_MODEL_ID,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const msg = await res
          .json()
          .then((d) => d?.error)
          .catch(() => null);
        throw new Error(msg || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Stream NDJSON, accumulating text_delta events.
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          let evt: { type?: string; text?: string; message?: string };
          try {
            evt = JSON.parse(trimmed);
          } catch {
            continue;
          }
          if (evt.type === "text_delta" && evt.text) {
            setPostmortem((prev) => prev + evt.text);
          } else if (evt.type === "error") {
            throw new Error(evt.message || "Stream error");
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const message =
        err instanceof Error ? err.message : "Failed to generate postmortem";
      toast.error(message);
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  };

  const downloadPostmortem = () => {
    const slug = runbook.id.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const stamp = new Date().toISOString().slice(0, 10);
    downloadAsMarkdown(postmortem, `postmortem-${slug}-${stamp}.md`);
    toast.success("Postmortem downloaded");
  };

  const startedTs = incident?.startedTs ?? now;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-arch-bg">
      {/* Incident header / console bar */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-arch-border bg-gradient-to-r from-arch-red/10 via-arch-bg2/80 to-arch-bg2/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "w-7 h-7 rounded-lg text-white flex items-center justify-center shrink-0",
              `bg-${sev}`
            )}
          >
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide",
                  `bg-${sev}/15 text-${sev}`
                )}
              >
                {runbook.severity}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-arch-red">
                Incident active
              </span>
            </div>
            <h2 className="text-[13px] font-semibold text-arch-text truncate mt-0.5">
              {runbook.title}
            </h2>
          </div>
        </div>

        {/* Live timer */}
        <div className="flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-lg bg-arch-bg border border-arch-border">
          <Clock className="w-3.5 h-3.5 text-arch-red" />
          <span className="text-[13px] font-mono font-semibold text-arch-text tabular-nums">
            {formatElapsed(now - startedTs)}
          </span>
          <span className="text-[9px] text-arch-text3 uppercase tracking-wide">
            elapsed
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetIncident}
            className="text-arch-text3 hover:text-arch-red"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="text-arch-text3 hover:text-arch-text"
              aria-label="Close execution mode"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-5 max-w-3xl mx-auto">
          {/* Progress */}
          <div className="rounded-xl border border-arch-border bg-arch-bg2/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-arch-text3">
                Resolution progress
              </span>
              <span className="text-[11px] font-semibold text-arch-text tabular-nums">
                {doneCount} / {steps.length} steps
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-arch-bg3 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  progressPct === 100 ? "bg-arch-green" : "bg-arch-blue"
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-1.5 text-[10px] text-arch-text3">
              Started {formatClock(startedTs)}
            </div>
          </div>

          {/* Step-through checklist */}
          <div className="space-y-2">
            {steps.map((step, i) => {
              const s = getStep(i);
              const noteOpen = expandedNotes.has(i);
              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-xl border transition-colors",
                    s.done
                      ? "border-arch-green/30 bg-arch-green/5"
                      : "border-arch-border bg-arch-bg2/60"
                  )}
                >
                  <div className="flex items-start gap-3 p-3">
                    <button
                      onClick={() => toggleStep(i)}
                      className="shrink-0 mt-0.5"
                      aria-pressed={s.done}
                      aria-label={
                        s.done ? "Mark step incomplete" : "Mark step complete"
                      }
                    >
                      {s.done ? (
                        <CheckCircle2 className="w-5 h-5 text-arch-green" />
                      ) : (
                        <Circle className="w-5 h-5 text-arch-text3 hover:text-arch-blue transition-colors" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-bold text-arch-text3 mt-0.5 tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p
                          className={cn(
                            "text-[12px] leading-relaxed",
                            s.done
                              ? "text-arch-text3 line-through"
                              : "text-arch-text2"
                          )}
                        >
                          {step}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 mt-1.5 ml-6">
                        {s.done && s.doneTs && (
                          <span className="flex items-center gap-1 text-[10px] text-arch-green font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            {formatClock(s.doneTs)}
                          </span>
                        )}
                        <button
                          onClick={() => toggleNote(i)}
                          className={cn(
                            "flex items-center gap-1 text-[10px] transition-colors",
                            s.note.trim()
                              ? "text-arch-amber hover:text-arch-amber"
                              : "text-arch-text3 hover:text-arch-blue"
                          )}
                        >
                          <MessageSquarePlus className="w-3 h-3" />
                          {s.note.trim()
                            ? "Note"
                            : noteOpen
                              ? "Hide note"
                              : "Add note"}
                        </button>
                      </div>

                      {noteOpen && (
                        <textarea
                          value={s.note}
                          onChange={(e) => setNote(i, e.target.value)}
                          placeholder="Add a note for this step (observations, commands run, results)..."
                          rows={2}
                          className="mt-2 ml-6 w-[calc(100%-1.5rem)] resize-y rounded-lg bg-arch-bg border border-arch-border px-2.5 py-2 text-[11px] text-arch-text placeholder:text-arch-text3 focus:outline-none focus:border-arch-blue/40 transition-colors"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Postmortem */}
          <div className="rounded-xl border border-arch-purple/30 bg-arch-purple/5 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <FileText className="w-4 h-4 text-arch-purple" />
              <h3 className="text-[12px] font-semibold text-arch-text">
                Postmortem
              </h3>
              <div className="flex items-center gap-1.5 ml-auto">
                <Button
                  size="sm"
                  onClick={generatePostmortem}
                  disabled={isGenerating}
                  className="bg-arch-purple text-white hover:bg-arch-purple/80"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  {isGenerating ? "Generating..." : "Generate postmortem"}
                </Button>
                {postmortem && !isGenerating && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadPostmortem}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .md
                  </Button>
                )}
              </div>
            </div>

            {postmortem ? (
              <div
                ref={pmRef}
                className="max-h-[420px] overflow-y-auto rounded-lg bg-arch-bg border border-arch-border px-4 py-3"
              >
                <MarkdownRenderer content={postmortem} />
                {isGenerating && (
                  <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-arch-purple animate-pulse align-middle" />
                )}
              </div>
            ) : (
              <p className="text-[11px] text-arch-text3 leading-relaxed">
                Generate a Markdown postmortem from the incident timeline,
                completed steps, and notes. Root cause is left as TBD for you to
                confirm.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
