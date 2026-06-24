"use client";

import { useState, useRef, useEffect } from "react";
import { useRepoInsights, type InsightLens } from "@/lib/hooks/useRepoInsights";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import ModelSelector from "@/components/ai/ModelSelector";
import { downloadAsMarkdown } from "@/lib/utils";
import { toast } from "sonner";
import {
  Building2,
  Code2,
  Rocket,
  Sparkles,
  Loader2,
  Square,
  Copy,
  Check,
  Download,
  RotateCcw,
  FileDown,
} from "lucide-react";

interface LensDef {
  id: InsightLens;
  label: string;
  blurb: string;
  icon: typeof Building2;
  // Full literal class names so Tailwind keeps them.
  accentText: string;
  accentBg: string;
  accentBorder: string;
  ring: string;
  starters: string[];
}

const LENSES: LensDef[] = [
  {
    id: "business",
    label: "Business Design",
    blurb: "Reverse-engineer the business behind the code",
    icon: Building2,
    accentText: "text-arch-blue",
    accentBg: "bg-arch-blue/10",
    accentBorder: "border-arch-blue/50",
    ring: "focus:ring-arch-blue/30",
    starters: [
      "Map the business capabilities of the subscription platform.",
      "What business rules govern plan upgrades and downgrades?",
      "Build a domain glossary for billing & entitlements.",
    ],
  },
  {
    id: "go",
    label: "Go Mastery",
    blurb: "Learn idiomatic Go from your real handlers",
    icon: Code2,
    accentText: "text-arch-teal",
    accentBg: "bg-arch-teal/10",
    accentBorder: "border-arch-teal/50",
    ring: "focus:ring-arch-teal/30",
    starters: [
      "Explain the error-wrapping and context patterns used here.",
      "Walk me through this HTTP handler line by line.",
      "Where are the concurrency risks in this code?",
    ],
  },
  {
    id: "saas",
    label: "SaaS Ideas",
    blurb: "Find productizable engines & scope an MVP",
    icon: Rocket,
    accentText: "text-arch-purple",
    accentBg: "bg-arch-purple/10",
    accentBorder: "border-arch-purple/50",
    ring: "focus:ring-arch-purple/30",
    starters: [
      "What in this code could become a standalone SaaS?",
      "Scope an MVP for a feature-flag service.",
      "What's needed to make the billing engine multi-tenant?",
    ],
  },
];

export default function RepoInsightsTab() {
  const { output, isRunning, error, analyze, stop, reset } = useRepoInsights();

  const [lens, setLens] = useState<InsightLens>("business");
  const [input, setInput] = useState("");
  const [filePath, setFilePath] = useState("");
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const [pulling, setPulling] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = LENSES.find((l) => l.id === lens)!;

  // Auto-scroll output while streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  async function pullFile() {
    if (!filePath.trim() || pulling) return;
    setPulling(true);
    try {
      const res = await fetch("/api/github-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: filePath.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not read file");
      setInput(data.content);
      toast.success(`Loaded ${filePath.trim()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read file");
    } finally {
      setPulling(false);
    }
  }

  function run() {
    if (!input.trim()) {
      toast.error("Paste some code or pick a starter prompt first.");
      return;
    }
    analyze(lens, input, filePath.trim(), modelId);
  }

  async function copyOutput() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="h-full flex flex-col bg-arch-bg">
      {/* Header */}
      <div className="px-6 pt-5 pb-3 border-b border-arch-border">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-arch-amber" />
          <h1 className="text-base font-semibold tracking-tight text-arch-text">
            Repo Insights
          </h1>
        </div>
        <p className="mt-1 text-xs text-arch-text2">
          Turn <span className="font-mono text-arch-text">go-repo-new</span> into
          understanding — pick a lens, paste code or pull a file, and learn.
        </p>

        {/* Lens switcher */}
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {LENSES.map((l) => {
            const Icon = l.icon;
            const selected = l.id === lens;
            return (
              <button
                key={l.id}
                onClick={() => setLens(l.id)}
                className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all ${
                  selected
                    ? `${l.accentBorder} ${l.accentBg}`
                    : "border-arch-border bg-arch-bg2 hover:border-arch-border2"
                }`}
              >
                <span
                  className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${l.accentBg} ${l.accentText}`}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-sm font-semibold ${
                      selected ? l.accentText : "text-arch-text"
                    }`}
                  >
                    {l.label}
                  </span>
                  <span className="block text-[11px] text-arch-text3">
                    {l.blurb}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body: input (left) + output (right) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Input column */}
        <div className="flex flex-col min-h-0 border-r border-arch-border">
          <div className="px-6 py-3 flex flex-wrap items-center gap-2 border-b border-arch-border">
            {/* Repo file puller */}
            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
              <input
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && pullFile()}
                placeholder="path/in/repo/handler.go"
                className="h-7 flex-1 rounded-md border border-arch-border bg-arch-bg2 px-2 text-[11px] font-mono text-arch-text outline-none focus:border-arch-blue/50"
              />
              <button
                onClick={pullFile}
                disabled={pulling || !filePath.trim()}
                className="h-7 inline-flex items-center gap-1 rounded-md border border-arch-border bg-arch-bg3 px-2 text-[11px] font-medium text-arch-text2 hover:text-arch-text disabled:opacity-50"
              >
                {pulling ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <FileDown className="size-3" />
                )}
                Pull file
              </button>
            </div>
            <ModelSelector value={modelId} onChange={setModelId} disabled={isRunning} />
          </div>

          {/* Starter prompts */}
          <div className="px-6 pt-3 flex flex-wrap gap-1.5">
            {active.starters.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${active.accentBorder} ${active.accentText} ${active.accentBg} hover:opacity-80`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input textarea */}
          <div className="flex-1 min-h-0 px-6 py-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste Go code, or pull a repo file above, or type a question…"
              className={`h-full w-full resize-none rounded-lg border border-arch-border bg-arch-bg2 p-3 font-mono text-xs text-arch-text outline-none transition-colors focus:ring-2 ${active.ring}`}
            />
          </div>

          {/* Actions */}
          <div className="px-6 pb-4 flex items-center gap-2">
            {isRunning ? (
              <button
                onClick={stop}
                className="inline-flex items-center gap-1.5 rounded-lg bg-arch-red/10 px-3 py-2 text-sm font-medium text-arch-red hover:bg-arch-red/20"
              >
                <Square className="size-3.5" /> Stop
              </button>
            ) : (
              <button
                onClick={run}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: `var(--arch-${
                    lens === "business" ? "blue" : lens === "go" ? "teal" : "purple"
                  })`,
                }}
              >
                <Sparkles className="size-4" /> Analyze
              </button>
            )}
            {(output || error) && !isRunning && (
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-arch-border px-3 py-2 text-sm text-arch-text2 hover:text-arch-text"
              >
                <RotateCcw className="size-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Output column */}
        <div className="flex flex-col min-h-0">
          <div className="px-6 py-3 flex items-center justify-between border-b border-arch-border">
            <span className="text-[11px] font-medium uppercase tracking-wider text-arch-text3">
              {active.label} · Result
            </span>
            {output && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={copyOutput}
                  className="inline-flex items-center gap-1 rounded-md border border-arch-border px-2 py-1 text-[11px] text-arch-text2 hover:text-arch-text"
                >
                  {copied ? <Check className="size-3 text-arch-green" /> : <Copy className="size-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={() => downloadAsMarkdown(output, `repo-insights-${lens}.md`)}
                  className="inline-flex items-center gap-1 rounded-md border border-arch-border px-2 py-1 text-[11px] text-arch-text2 hover:text-arch-text"
                >
                  <Download className="size-3" /> Save
                </button>
              </div>
            )}
          </div>

          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            {error && (
              <div className="rounded-lg border border-arch-red/30 bg-arch-red/10 px-3 py-2 text-xs text-arch-red">
                {error}
              </div>
            )}
            {!output && !error && !isRunning && (
              <div className="flex h-full flex-col items-center justify-center text-center text-arch-text3">
                <active.icon className={`size-8 ${active.accentText} opacity-60`} />
                <p className="mt-3 text-sm">
                  Results appear here. Try a starter prompt or pull a file.
                </p>
              </div>
            )}
            {isRunning && !output && (
              <div className="flex items-center gap-2 text-sm text-arch-text2">
                <Loader2 className="size-4 animate-spin" /> Analyzing…
              </div>
            )}
            {output && <MarkdownRenderer content={output} />}
          </div>
        </div>
      </div>
    </div>
  );
}
