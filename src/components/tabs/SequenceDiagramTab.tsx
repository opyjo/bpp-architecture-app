"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { flows } from "@/data/flows";
import { allServiceDeepDives } from "@/data/service-deep-dives";
import { useChat } from "@/lib/hooks/useChat";
import { useSavedDiagrams } from "@/lib/hooks/useSavedDiagrams";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import CodeBlock from "@/components/ui/CodeBlock";
import ModelSelector from "@/components/ai/ModelSelector";
import MessageBubble from "@/components/ai/MessageBubble";
import ChatInput from "@/components/ai/ChatInput";
import type { SavedDiagram } from "@/lib/types/saved-diagram";
import {
  GitBranch,
  Copy,
  Download,
  Save,
  Loader2,
  Check,
  BookOpen,
  Trash2,
  Clock,
  Code2,
  Eye,
} from "lucide-react";

type RightView = "diagram" | "source";
type ViewMode = "generator" | "saved";

function buildSequenceContext(): string {
  const serviceLines = allServiceDeepDives
    .filter((s) => s.status === "active")
    .map((s) => {
      const deps = s.technical.dependencies
        .map((d) => `${d.service} (${d.protocol})`)
        .join(", ");
      const events = s.technical.kafkaEvents
        .map((e) => `${e.direction} ${e.topic}.${e.event}`)
        .join(", ");
      return `- ${s.displayName}: ${s.business.purpose}. Deps: [${deps}]. Events: [${events}]`;
    })
    .join("\n");

  const flowLines = flows
    .map(
      (f) =>
        `- ${f.title}: ${f.description} (${f.steps.length} steps, audience: ${f.audience})`
    )
    .join("\n");

  return `You are an expert at creating Mermaid sequence diagrams for a subscription management platform.

## Available Services
${serviceLines}

## Existing Flows
${flowLines}

## Instructions
- Output ONLY valid Mermaid sequenceDiagram syntax
- Start with "sequenceDiagram" on the first line
- Use the actual service names from the platform
- Include proper participant declarations
- Show request/response arrows with descriptions
- Use activate/deactivate for long-running operations
- Include notes for important details
- Use alt/else for conditional flows
- Use loop for retry/polling patterns

When the user asks to modify a diagram, output the COMPLETE updated diagram, not just the changes.
Do NOT wrap output in markdown code fences.`;
}

export default function SequenceDiagramTab() {
  const [flowId, setFlowId] = useState("");
  const [description, setDescription] = useState("");
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const [mermaidSource, setMermaidSource] = useState("");
  const [rightView, setRightView] = useState<RightView>("diagram");
  const [viewMode, setViewMode] = useState<ViewMode>("generator");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [savedDiagrams, setSavedDiagrams] = useState<SavedDiagram[]>([]);
  const [isLoadingDiagrams, setIsLoadingDiagrams] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { fetchDiagrams, saveDiagram, deleteDiagram } = useSavedDiagrams();

  const systemContext = buildSequenceContext();

  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearHistory,
  } = useChat(modelId, {
    storageKey: "sequence-gen-chat",
    systemContext,
  });

  const loadSavedDiagrams = useCallback(async () => {
    setIsLoadingDiagrams(true);
    try {
      const diagrams = await fetchDiagrams();
      setSavedDiagrams(diagrams);
    } catch {
      // silently fail
    } finally {
      setIsLoadingDiagrams(false);
    }
  }, [fetchDiagrams]);

  useEffect(() => {
    loadSavedDiagrams();
  }, [loadSavedDiagrams]);

  // Extract mermaid source from last assistant message
  useEffect(() => {
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && m.content.trim());
    if (!lastAssistant) return;

    let content = lastAssistant.content.trim();
    // Strip markdown fences if present
    content = content.replace(/^```(?:mermaid)?\s*\n?/, "");
    content = content.replace(/\n?```\s*$/, "");
    content = content.trim();

    if (content.startsWith("sequenceDiagram")) {
      setMermaidSource(content);
    }
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleGenerate = () => {
    let prompt = "";
    if (flowId) {
      const flow = flows.find((f) => f.id === flowId);
      if (flow) {
        prompt = `Generate a detailed Mermaid sequence diagram for: ${flow.title}. ${flow.description}. Route: ${flow.route}. Include all ${flow.steps.length} steps with the actual services involved.`;
      }
    } else if (description.trim()) {
      prompt = `Generate a Mermaid sequence diagram for: ${description}`;
    }
    if (prompt) sendMessage(prompt);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mermaidSource);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // copy failed
    }
  };

  const handleDownload = () => {
    const blob = new Blob([mermaidSource], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sequence-diagram.mmd";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    if (!mermaidSource.trim()) return;
    setIsSaving(true);
    try {
      const title = flowId
        ? flows.find((f) => f.id === flowId)?.title || "Sequence Diagram"
        : description.slice(0, 50) || "Sequence Diagram";
      await saveDiagram({
        title,
        description: description || flowId || "",
        mermaid_source: mermaidSource,
        flow_id: flowId || undefined,
      });
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
      await loadSavedDiagrams();
    } catch {
      // save failed
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadDiagram = (d: SavedDiagram) => {
    setMermaidSource(d.mermaid_source);
    setDescription(d.description);
    setFlowId(d.flow_id || "");
    setViewMode("generator");
  };

  const handleDeleteDiagram = async (id: string) => {
    try {
      await deleteDiagram(id);
      setSavedDiagrams((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // delete failed
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-arch-border bg-arch-bg2/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-arch-teal to-arch-green text-white flex items-center justify-center shrink-0">
            <GitBranch className="w-3.5 h-3.5" />
          </div>
          <span className="text-[13px] font-semibold text-arch-text truncate">
            Sequence Diagram Generator
          </span>
          <ModelSelector
            value={modelId}
            onChange={setModelId}
            disabled={isStreaming}
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setViewMode(viewMode === "saved" ? "generator" : "saved")
            }
            className={`text-[11px] transition-colors px-2 py-1 rounded flex items-center gap-1 ${
              viewMode === "saved"
                ? "text-arch-blue bg-arch-blue/10"
                : "text-arch-text3 hover:text-arch-blue hover:bg-white/5"
            }`}
          >
            <BookOpen className="w-3 h-3" />
            Saved ({savedDiagrams.length})
          </button>
          {mermaidSource && (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="text-[11px] text-arch-text3 hover:text-arch-green transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1 disabled:opacity-40"
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : saveFeedback ? (
                  <Check className="w-3 h-3 text-arch-green" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                {saveFeedback ? "Saved!" : "Save"}
              </button>
              <button
                onClick={handleCopy}
                className="text-[11px] text-arch-text3 hover:text-arch-teal transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                {copyFeedback ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={handleDownload}
                className="text-[11px] text-arch-text3 hover:text-arch-teal transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                .mmd
              </button>
            </>
          )}
          {messages.length > 0 && (
            <button
              onClick={() => {
                clearHistory();
                setMermaidSource("");
              }}
              className="text-[11px] text-arch-text3 hover:text-arch-red transition-colors px-2 py-1 rounded hover:bg-white/5"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Saved diagrams panel */}
        {viewMode === "saved" && (
          <div className="w-[380px] shrink-0 flex flex-col border-r border-arch-border bg-arch-bg/50">
            <div className="px-4 pt-4 pb-3 border-b border-arch-border">
              <h3 className="text-[13px] font-semibold text-arch-text flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-arch-blue" />
                Saved Diagrams
              </h3>
              <p className="text-[11px] text-arch-text3 mt-1">
                {savedDiagrams.length} saved diagram
                {savedDiagrams.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoadingDiagrams ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-arch-blue" />
                  <span className="text-[13px] text-arch-text3">
                    Loading...
                  </span>
                </div>
              ) : savedDiagrams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <BookOpen className="w-8 h-8 text-arch-text3" />
                  <span className="text-[13px] text-arch-text3">
                    No saved diagrams yet
                  </span>
                </div>
              ) : (
                savedDiagrams.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => handleLoadDiagram(d)}
                    className="rounded-lg border border-arch-border bg-arch-bg2/60 hover:bg-arch-bg2 transition-colors cursor-pointer group"
                  >
                    <div className="w-full text-left px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-medium text-arch-text truncate">
                            {d.title}
                          </div>
                          {d.description && (
                            <div className="text-[10px] text-arch-text3 mt-0.5 truncate">
                              {d.description}
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-arch-text3">
                            <Clock className="w-3 h-3" />
                            {new Date(d.updated_at).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDiagram(d.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-arch-text3 hover:text-arch-coral transition-all p-1 rounded hover:bg-arch-coral/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Left panel: inputs + chat refinement */}
        {viewMode === "generator" && (
          <div className="w-[400px] shrink-0 flex flex-col border-r border-arch-border bg-arch-bg/50">
            {/* Input area */}
            <div className="p-4 space-y-3 border-b border-arch-border">
              {/* Flow selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-arch-text2">
                  From Existing Flow
                </label>
                <select
                  value={flowId}
                  onChange={(e) => setFlowId(e.target.value)}
                  className="w-full bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2 text-[12px] text-arch-text focus:outline-none focus:border-arch-blue/50 transition-colors"
                >
                  <option value="">Select a flow (optional)...</option>
                  {flows.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Or text description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-arch-text2">
                  Or Describe a Flow
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Customer adds a Netflix subscription with promo code..."
                  rows={3}
                  className="w-full resize-none bg-arch-bg2 border border-arch-border rounded-lg p-3 text-[12px] text-arch-text placeholder:text-arch-text3 focus:outline-none focus:border-arch-blue/50 transition-colors"
                />
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={isStreaming || (!flowId && !description.trim())}
                className="w-full py-2.5 bg-gradient-to-r from-arch-teal to-arch-green text-white text-[12px] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isStreaming ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <GitBranch className="w-3.5 h-3.5" />
                    Generate Diagram
                  </>
                )}
              </button>
            </div>

            {/* Chat refinement area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {error && (
                <div className="mx-3 mt-2 px-3 py-2 rounded-lg bg-arch-red/10 border border-arch-red/30 text-arch-red text-[11.5px]">
                  {error}
                </div>
              )}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3"
              >
                {messages.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {messages.map((msg) => (
                      <MessageBubble key={msg.id} message={msg} />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[11px] text-arch-text3 text-center">
                      Generate a diagram, then refine it with follow-up messages.
                    </p>
                  </div>
                )}
              </div>
              {messages.length > 0 && (
                <div className="px-3 pb-3 pt-1">
                  <ChatInput
                    onSend={sendMessage}
                    onStop={stopStreaming}
                    isStreaming={isStreaming}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right panel: diagram rendering */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {mermaidSource ? (
            <>
              {/* View toggle */}
              <div className="flex border-b border-arch-border bg-arch-bg/50">
                <button
                  onClick={() => setRightView("diagram")}
                  className={`px-4 py-2 text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                    rightView === "diagram"
                      ? "text-arch-blue border-b-2 border-arch-blue bg-arch-blue/5"
                      : "text-arch-text3 hover:text-arch-text2"
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  Diagram
                </button>
                <button
                  onClick={() => setRightView("source")}
                  className={`px-4 py-2 text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                    rightView === "source"
                      ? "text-arch-blue border-b-2 border-arch-blue bg-arch-blue/5"
                      : "text-arch-text3 hover:text-arch-text2"
                  }`}
                >
                  <Code2 className="w-3 h-3" />
                  Source
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                {rightView === "diagram" ? (
                  <MermaidDiagram chart={mermaidSource} />
                ) : (
                  <div className="p-4 overflow-y-auto h-full">
                    <CodeBlock language="mermaid">{mermaidSource}</CodeBlock>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3 max-w-sm">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-arch-teal/20 to-arch-green/20 flex items-center justify-center mx-auto">
                  <GitBranch className="w-6 h-6 text-arch-teal" />
                </div>
                <h3 className="text-[13px] font-semibold text-arch-text">
                  Generate Sequence Diagrams
                </h3>
                <p className="text-[11px] text-arch-text3 leading-relaxed">
                  Select an existing flow or describe a scenario to generate
                  interactive Mermaid sequence diagrams. Refine iteratively
                  with AI chat.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
