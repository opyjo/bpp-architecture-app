"use client";

import { useState, useRef, useEffect } from "react";
import { allServiceDeepDives } from "@/data/service-deep-dives";
import {
  generateImpactMermaid,
  buildImpactAnalysisContext,
  getServiceDependencies,
  changeTypeLabels,
  type ChangeType,
} from "@/lib/impact-analyzer";
import { useChat } from "@/lib/hooks/useChat";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import ModelSelector from "@/components/ai/ModelSelector";
import MessageBubble from "@/components/ai/MessageBubble";
import ChatInput from "@/components/ai/ChatInput";
import { downloadAsMarkdown } from "@/lib/utils";
import {
  GitBranch,
  Zap,
  BarChart3,
  MessageSquare,
  Loader2,
  Download,
} from "lucide-react";

type RightPanel = "graph" | "analysis";

const CHANGE_TYPES: ChangeType[] = [
  "api_change",
  "schema_change",
  "kafka_event_change",
  "new_dependency",
  "endpoint_removal",
];

export default function ChangeImpactTab() {
  const [serviceId, setServiceId] = useState("");
  const [changeType, setChangeType] = useState<ChangeType>("api_change");
  const [description, setDescription] = useState("");
  const [rightPanel, setRightPanel] = useState<RightPanel>("graph");
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const [chart, setChart] = useState("");
  const [impactCount, setImpactCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const systemContext =
    serviceId && changeType
      ? buildImpactAnalysisContext(serviceId, changeType, description)
      : undefined;

  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearHistory,
  } = useChat(modelId, {
    storageKey: "impact-analysis-chat",
    systemContext,
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleAnalyze = () => {
    if (!serviceId) return;
    const mermaid = generateImpactMermaid(serviceId, changeType);
    setChart(mermaid);
    const deps = getServiceDependencies(serviceId);
    setImpactCount(deps.length);
    setRightPanel("graph");
  };

  const handleAiAnalysis = () => {
    if (!serviceId) return;
    setRightPanel("analysis");
    // Always send a new analysis prompt (user can clearHistory() to reset context)
    const service = allServiceDeepDives.find((s) => s.id === serviceId);
    const prompt = `Analyze the impact of a ${changeTypeLabels[changeType].toLowerCase()} on ${service?.displayName || serviceId}.${description ? ` Details: ${description}` : ""}`;
    sendMessage(prompt);
  };

  const selectedService = allServiceDeepDives.find((s) => s.id === serviceId);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-arch-border bg-arch-bg2/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-arch-amber to-arch-coral text-white flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <span className="text-[13px] font-semibold text-arch-text truncate">
            Change Impact Analyzer
          </span>
          {impactCount > 0 && (
            <span className="text-[11px] text-arch-amber bg-arch-amber/10 px-2 py-0.5 rounded-full">
              {impactCount} service{impactCount !== 1 ? "s" : ""} impacted
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {rightPanel === "analysis" && (
            <>
              <ModelSelector
                value={modelId}
                onChange={setModelId}
                disabled={isStreaming}
              />
              {messages.length > 0 && (
                <button
                  onClick={() => {
                    const content = messages
                      .filter((m) => m.role === "assistant")
                      .map((m) => m.content)
                      .join("\n\n---\n\n");
                    downloadAsMarkdown(content, "impact-analysis.md");
                  }}
                  className="text-[11px] text-arch-text3 hover:text-arch-teal transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  .md
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Inputs */}
        <div className="w-[360px] shrink-0 flex flex-col border-r border-arch-border bg-arch-bg/50">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Service selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-arch-text2">
                Service
              </label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2 text-[12px] text-arch-text focus:outline-none focus:border-arch-blue/50 transition-colors"
              >
                <option value="">Select a service...</option>
                {allServiceDeepDives
                  .filter((s) => s.status === "active")
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName}
                    </option>
                  ))}
              </select>
            </div>

            {/* Change type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-arch-text2">
                Change Type
              </label>
              <div className="space-y-1">
                {CHANGE_TYPES.map((ct) => (
                  <button
                    key={ct}
                    onClick={() => setChangeType(ct)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[12px] transition-colors ${
                      changeType === ct
                        ? "bg-arch-amber/10 text-arch-amber border border-arch-amber/30"
                        : "bg-arch-bg2 text-arch-text2 border border-arch-border hover:border-arch-border hover:bg-arch-bg3"
                    }`}
                  >
                    {changeTypeLabels[ct]}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-arch-text2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the planned change..."
                rows={3}
                className="w-full resize-none bg-arch-bg2 border border-arch-border rounded-lg p-3 text-[12px] text-arch-text placeholder:text-arch-text3 focus:outline-none focus:border-arch-blue/50 transition-colors"
              />
            </div>

            {/* Selected service info */}
            {selectedService && (
              <div className="rounded-lg border border-arch-border bg-arch-bg2/60 p-3 space-y-2">
                <div className="text-[11px] font-medium text-arch-text2">
                  {selectedService.displayName}
                </div>
                <div className="text-[10px] text-arch-text3 leading-relaxed">
                  {selectedService.business.purpose}
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-arch-blue/10 text-arch-blue">
                    {selectedService.technical.endpoints.length} endpoints
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-arch-teal/10 text-arch-teal">
                    {selectedService.technical.dependencies.length} deps
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-arch-purple/10 text-arch-purple">
                    {selectedService.technical.kafkaEvents.length} events
                  </span>
                </div>
              </div>
            )}

            {/* Analyze button */}
            <button
              onClick={handleAnalyze}
              disabled={!serviceId}
              className="w-full py-2.5 bg-gradient-to-r from-arch-amber to-arch-coral text-white text-[12px] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <GitBranch className="w-3.5 h-3.5" />
              Analyze Impact
            </button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sub-tabs */}
          {chart && (
            <div className="flex border-b border-arch-border bg-arch-bg/50">
              <button
                onClick={() => setRightPanel("graph")}
                className={`px-4 py-2 text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                  rightPanel === "graph"
                    ? "text-arch-blue border-b-2 border-arch-blue bg-arch-blue/5"
                    : "text-arch-text3 hover:text-arch-text2"
                }`}
              >
                <BarChart3 className="w-3 h-3" />
                Dependency Graph
              </button>
              <button
                onClick={handleAiAnalysis}
                className={`px-4 py-2 text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                  rightPanel === "analysis"
                    ? "text-arch-blue border-b-2 border-arch-blue bg-arch-blue/5"
                    : "text-arch-text3 hover:text-arch-text2"
                }`}
              >
                <MessageSquare className="w-3 h-3" />
                AI Analysis
              </button>
            </div>
          )}

          {chart ? (
            rightPanel === "graph" ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Legend */}
                <div className="flex items-center gap-4 px-4 py-2 border-b border-arch-border bg-arch-bg2/40">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-[#4a8fe8]" />
                    <span className="text-[10px] text-arch-text3">
                      Selected
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-[#e85a5a]" />
                    <span className="text-[10px] text-arch-text3">
                      Direct Impact
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-[#e8a83a]" />
                    <span className="text-[10px] text-arch-text3">
                      Transitive
                    </span>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <MermaidDiagram chart={chart} />
                </div>
              </div>
            ) : (
              /* AI Analysis panel */
              <div className="flex-1 flex flex-col overflow-hidden">
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4"
                >
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-2">
                        <Loader2 className="w-5 h-5 animate-spin text-arch-blue mx-auto" />
                        <p className="text-[12px] text-arch-text3">
                          Starting AI analysis...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 max-w-3xl mx-auto">
                      {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                      ))}
                    </div>
                  )}
                </div>
                {error && (
                  <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-arch-red/10 border border-arch-red/30 text-arch-red text-[11.5px]">
                    {error}
                  </div>
                )}
                <div className="max-w-3xl mx-auto w-full px-4 pb-4 pt-2">
                  <ChatInput
                    onSend={sendMessage}
                    onStop={stopStreaming}
                    isStreaming={isStreaming}
                  />
                </div>
              </div>
            )
          ) : (
            /* Empty state */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3 max-w-sm">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-arch-amber/20 to-arch-coral/20 flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6 text-arch-amber" />
                </div>
                <h3 className="text-[13px] font-semibold text-arch-text">
                  Analyze Change Impact
                </h3>
                <p className="text-[11px] text-arch-text3 leading-relaxed">
                  Select a service and change type to visualize the dependency
                  graph and get AI-powered impact analysis with risk assessment,
                  affected tests, and rollback plans.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
