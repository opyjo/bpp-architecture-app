"use client";

import { useState, useRef, useEffect } from "react";
import {
  runbookCatalog,
  severityColors,
  serializeRunbookCatalog,
  type Runbook,
} from "@/data/runbooks";
import { allServiceDeepDives } from "@/data/service-deep-dives";
import { useChat } from "@/lib/hooks/useChat";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import ModelSelector from "@/components/ai/ModelSelector";
import MessageBubble from "@/components/ai/MessageBubble";
import ChatInput from "@/components/ai/ChatInput";
import {
  BookOpen,
  Search,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Shield,
  Clock,
  ArrowUpRight,
} from "lucide-react";

type ViewMode = "catalog" | "diagnose";

export default function RunbookManagerTab() {
  const [viewMode, setViewMode] = useState<ViewMode>("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["resolution"])
  );
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearHistory,
  } = useChat(modelId, {
    storageKey: "runbook-diagnose-chat",
    systemContext: serializeRunbookCatalog(),
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Filtering
  const filteredRunbooks = runbookCatalog.filter((rb) => {
    if (selectedSeverity && rb.severity !== selectedSeverity) return false;
    if (
      selectedService &&
      !rb.affectedServices.some((s) =>
        s.toLowerCase().includes(selectedService.toLowerCase())
      )
    )
      return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        rb.title.toLowerCase().includes(q) ||
        rb.description.toLowerCase().includes(q) ||
        rb.tags.some((t) => t.includes(q)) ||
        rb.symptoms.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Get unique services from runbooks
  const allAffectedServices = Array.from(
    new Set(runbookCatalog.flatMap((rb) => rb.affectedServices))
  ).sort();

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-arch-border bg-arch-bg2/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-arch-red to-arch-coral text-white flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <span className="text-[13px] font-semibold text-arch-text truncate">
            Incident Runbooks
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode("catalog")}
            className={`text-[11px] px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
              viewMode === "catalog"
                ? "text-arch-blue bg-arch-blue/10"
                : "text-arch-text3 hover:text-arch-text2 hover:bg-white/5"
            }`}
          >
            <BookOpen className="w-3 h-3" />
            Catalog
          </button>
          <button
            onClick={() => setViewMode("diagnose")}
            className={`text-[11px] px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
              viewMode === "diagnose"
                ? "text-arch-blue bg-arch-blue/10"
                : "text-arch-text3 hover:text-arch-text2 hover:bg-white/5"
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            Diagnose
          </button>
          {viewMode === "diagnose" && (
            <>
              <ModelSelector
                value={modelId}
                onChange={setModelId}
                disabled={isStreaming}
              />
              {messages.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[11px] text-arch-text3 hover:text-arch-red transition-colors px-2 py-1 rounded hover:bg-white/5"
                >
                  Clear
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {viewMode === "catalog" ? (
        /* ── Catalog View ── */
        <div className="flex-1 flex overflow-hidden">
          {/* Left: runbook list */}
          <div className="w-[380px] shrink-0 flex flex-col border-r border-arch-border bg-arch-bg/50">
            {/* Filters */}
            <div className="p-3 space-y-2 border-b border-arch-border">
              <div className="flex items-center gap-2 bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2 focus-within:border-arch-blue/40 transition-colors">
                <Search className="w-3.5 h-3.5 text-arch-text3 shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search runbooks..."
                  className="flex-1 bg-transparent text-[12px] text-arch-text placeholder:text-arch-text3 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="flex-1 bg-arch-bg2 border border-arch-border rounded-lg px-2 py-1.5 text-[11px] text-arch-text focus:outline-none"
                >
                  <option value="">All severities</option>
                  <option value="P1">P1 - Critical</option>
                  <option value="P2">P2 - High</option>
                  <option value="P3">P3 - Medium</option>
                  <option value="P4">P4 - Low</option>
                </select>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="flex-1 bg-arch-bg2 border border-arch-border rounded-lg px-2 py-1.5 text-[11px] text-arch-text focus:outline-none"
                >
                  <option value="">All services</option>
                  {allAffectedServices.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-[10px] text-arch-text3">
                {filteredRunbooks.length} of {runbookCatalog.length} runbooks
              </div>
            </div>

            {/* Runbook list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredRunbooks.map((rb) => (
                <button
                  key={rb.id}
                  onClick={() => setSelectedRunbook(rb)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    selectedRunbook?.id === rb.id
                      ? "bg-arch-blue/10 border border-arch-blue/30"
                      : "hover:bg-arch-bg2 border border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0 bg-${severityColors[rb.severity]}/15 text-${severityColors[rb.severity]}`}
                    >
                      {rb.severity}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[12px] font-medium text-arch-text truncate">
                        {rb.title}
                      </div>
                      <div className="text-[10px] text-arch-text3 mt-0.5 line-clamp-2">
                        {rb.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: runbook detail */}
          <div className="flex-1 overflow-y-auto">
            {selectedRunbook ? (
              <div className="p-5 space-y-4 max-w-3xl">
                {/* Header */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded bg-${severityColors[selectedRunbook.severity]}/15 text-${severityColors[selectedRunbook.severity]}`}
                    >
                      {selectedRunbook.severity}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-arch-text3">
                      <Clock className="w-3 h-3" />
                      {selectedRunbook.estimatedResolutionTime}
                    </span>
                  </div>
                  <h2 className="text-[16px] font-semibold text-arch-text">
                    {selectedRunbook.title}
                  </h2>
                  <p className="text-[12px] text-arch-text2 mt-1.5 leading-relaxed">
                    {selectedRunbook.description}
                  </p>
                </div>

                {/* Affected Services */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedRunbook.affectedServices.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-arch-blue/10 text-arch-blue border border-arch-blue/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* Symptoms */}
                <div className="rounded-lg border border-arch-border bg-arch-bg2/60 p-4">
                  <h3 className="text-[12px] font-semibold text-arch-text flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-arch-amber" />
                    Symptoms
                  </h3>
                  <ul className="space-y-1.5">
                    {selectedRunbook.symptoms.map((s, i) => (
                      <li
                        key={i}
                        className="text-[11px] text-arch-text2 flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-arch-amber/60 mt-1.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Resolution Steps (collapsible) */}
                <div className="rounded-lg border border-arch-border bg-arch-bg2/60 overflow-hidden">
                  <button
                    onClick={() => toggleSection("resolution")}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-arch-bg3/30 transition-colors"
                  >
                    <h3 className="text-[12px] font-semibold text-arch-text flex items-center gap-1.5">
                      <ArrowUpRight className="w-3.5 h-3.5 text-arch-green" />
                      Resolution Steps ({selectedRunbook.resolutionSteps.length})
                    </h3>
                    {expandedSections.has("resolution") ? (
                      <ChevronDown className="w-3.5 h-3.5 text-arch-text3" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-arch-text3" />
                    )}
                  </button>
                  {expandedSections.has("resolution") && (
                    <div className="px-4 pb-4 border-t border-arch-border">
                      <ol className="space-y-2 mt-3">
                        {selectedRunbook.resolutionSteps.map((step, i) => (
                          <li
                            key={i}
                            className="text-[11px] text-arch-text2 flex items-start gap-2.5"
                          >
                            <span className="w-5 h-5 rounded-full bg-arch-green/10 text-arch-green text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                {/* Rollback Steps (collapsible) */}
                <div className="rounded-lg border border-arch-border bg-arch-bg2/60 overflow-hidden">
                  <button
                    onClick={() => toggleSection("rollback")}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-arch-bg3/30 transition-colors"
                  >
                    <h3 className="text-[12px] font-semibold text-arch-text flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-arch-coral" />
                      Rollback Steps ({selectedRunbook.rollbackSteps.length})
                    </h3>
                    {expandedSections.has("rollback") ? (
                      <ChevronDown className="w-3.5 h-3.5 text-arch-text3" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-arch-text3" />
                    )}
                  </button>
                  {expandedSections.has("rollback") && (
                    <div className="px-4 pb-4 border-t border-arch-border">
                      <ul className="space-y-1.5 mt-3">
                        {selectedRunbook.rollbackSteps.map((step, i) => (
                          <li
                            key={i}
                            className="text-[11px] text-arch-text2 flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-arch-coral/60 mt-1.5 shrink-0" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Escalation */}
                <div className="rounded-lg border border-arch-border bg-arch-bg2/60 p-4">
                  <h3 className="text-[12px] font-semibold text-arch-text mb-1.5">
                    Escalation Path
                  </h3>
                  <p className="text-[11px] text-arch-text2">
                    {selectedRunbook.escalationPath}
                  </p>
                </div>

                {/* Kafka Events */}
                {selectedRunbook.relatedKafkaEvents &&
                  selectedRunbook.relatedKafkaEvents.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-arch-text3 mr-1">
                        Related events:
                      </span>
                      {selectedRunbook.relatedKafkaEvents.map((e) => (
                        <span
                          key={e}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-arch-purple/10 text-arch-purple font-mono"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {selectedRunbook.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-arch-bg3 text-arch-text3"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center h-full">
                <div className="text-center space-y-3 max-w-sm">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-arch-red/20 to-arch-coral/20 flex items-center justify-center mx-auto">
                    <Shield className="w-6 h-6 text-arch-coral" />
                  </div>
                  <h3 className="text-[13px] font-semibold text-arch-text">
                    Incident Runbook Catalog
                  </h3>
                  <p className="text-[11px] text-arch-text3 leading-relaxed">
                    Browse {runbookCatalog.length} pre-built runbooks for common
                    platform incidents. Select a runbook to view symptoms,
                    resolution steps, and escalation paths.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Diagnose View ── */
        <div className="flex-1 flex flex-col overflow-hidden">
          {error && (
            <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-arch-red/10 border border-arch-red/30 text-arch-red text-[11.5px]">
              {error}
            </div>
          )}
          <div
            ref={scrollRef}
            className={`flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 ${isEmpty ? "flex flex-col items-center justify-center" : ""}`}
          >
            {isEmpty ? (
              <div className="w-full max-w-xl mx-auto flex flex-col gap-3">
                <div className="text-center space-y-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-arch-red/20 to-arch-coral/20 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-5 h-5 text-arch-coral" />
                  </div>
                  <h3 className="text-[13px] font-semibold text-arch-text">
                    AI Incident Diagnosis
                  </h3>
                  <p className="text-[11px] text-arch-text3">
                    Paste an error message or describe an incident to get matched
                    runbook guidance.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {[
                    "activateSubscription returning 500 errors",
                    "Kafka consumer lag > 50k on subscription-consumer",
                    "DynamoDB ThrottledRequests spiking on session table",
                    "Promo codes not validating for active campaigns",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="px-2.5 py-1 rounded-full text-[10.5px] text-arch-text3 border border-arch-border hover:border-arch-coral/40 hover:text-arch-coral transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <ChatInput
                  onSend={sendMessage}
                  onStop={stopStreaming}
                  isStreaming={isStreaming}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-4 max-w-3xl mx-auto">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
              </div>
            )}
          </div>
          {!isEmpty && (
            <div className="max-w-3xl mx-auto w-full px-4 pb-4 pt-2">
              <ChatInput
                onSend={sendMessage}
                onStop={stopStreaming}
                isStreaming={isStreaming}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
