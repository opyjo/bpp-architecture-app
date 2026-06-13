"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useChat } from "@/lib/hooks/useChat";
import { useSavedAnalyses } from "@/lib/hooks/useSavedAnalyses";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import { TICKET_ANALYZER_CONTEXT } from "@/lib/ai/ticket-analyzer-prompt";
import MessageBubble from "@/components/ai/MessageBubble";
import ChatInput from "@/components/ai/ChatInput";
import ModelSelector from "@/components/ai/ModelSelector";
import type { SavedAnalysis } from "@/lib/types/saved-analysis";
import type { ChatMessage } from "@/lib/types/chat";
import { ArrowLeft, Pencil, Check, ChevronDown, ChevronRight } from "lucide-react";

export default function AnalysisDetailView({ analysisId }: { analysisId: string }) {
  const { getAnalysis } = useSavedAnalyses();
  const [analysis, setAnalysis] = useState<SavedAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalysis(analysisId)
      .then((data) => setAnalysis(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [analysisId, getAnalysis]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-arch-bg">
        <div className="w-5 h-5 border-2 border-arch-purple/30 border-t-arch-purple rounded-full animate-spin" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-arch-bg text-arch-text3 gap-3">
        <p className="text-[13px]">Analysis not found</p>
        <Link href="/analyses" className="text-[12px] text-arch-purple hover:underline">
          Back to saved analyses
        </Link>
      </div>
    );
  }

  return <AnalysisDetailInner analysis={analysis} />;
}

function AnalysisDetailInner({ analysis }: { analysis: SavedAnalysis }) {
  const { updateAnalysis } = useSavedAnalyses();
  const [modelId, setModelId] = useState(analysis.model_id || DEFAULT_MODEL_ID);
  const [title, setTitle] = useState(analysis.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [ticketExpanded, setTicketExpanded] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analysisIdRef = useRef(analysis.id);

  const handleMessagesChange = useCallback(
    (msgs: ChatMessage[]) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        updateAnalysis(analysisIdRef.current, { messages: msgs }).catch(() => {});
      }, 2000);
    },
    [updateAnalysis]
  );

  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
  } = useChat(modelId, {
    initialMessages: analysis.messages,
    persistToLocalStorage: false,
    onMessagesChange: handleMessagesChange,
    systemContext: TICKET_ANALYZER_CONTEXT,
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleTitleSave = async () => {
    const trimmed = title.trim() || "Untitled Analysis";
    setTitle(trimmed);
    setEditingTitle(false);
    await updateAnalysis(analysis.id, { title: trimmed }).catch(() => {});
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-arch-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-arch-border bg-arch-bg2/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Link
            href="/analyses"
            className="p-1.5 rounded-lg text-arch-text3 hover:text-arch-text hover:bg-white/5 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {editingTitle ? (
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave();
                  if (e.key === "Escape") {
                    setTitle(analysis.title);
                    setEditingTitle(false);
                  }
                }}
                autoFocus
                className="flex-1 bg-transparent text-[13px] font-semibold text-arch-text outline-none border-b border-arch-purple/50 min-w-0"
              />
              <button
                onClick={handleTitleSave}
                className="p-1 text-arch-green hover:bg-white/5 rounded cursor-pointer shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="flex items-center gap-1.5 min-w-0 group cursor-pointer"
            >
              <span className="text-[13px] font-semibold text-arch-text truncate">
                {title}
              </span>
              <Pencil className="w-3 h-3 text-arch-text3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          )}

          <ModelSelector
            value={modelId}
            onChange={setModelId}
            disabled={isStreaming}
          />
        </div>
      </div>

      {/* Collapsible ticket text panel */}
      {analysis.ticket_text && (
        <div className="border-b border-arch-border">
          <button
            onClick={() => setTicketExpanded(!ticketExpanded)}
            className="w-full flex items-center gap-2 px-5 py-2 text-[11.5px] text-arch-text2 hover:text-arch-text hover:bg-white/5 transition-colors cursor-pointer"
          >
            {ticketExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="font-medium">Original Ticket</span>
            {!ticketExpanded && (
              <span className="text-arch-text3 truncate">
                — {analysis.ticket_text.slice(0, 80)}
                {analysis.ticket_text.length > 80 ? "…" : ""}
              </span>
            )}
          </button>
          {ticketExpanded && (
            <div className="px-5 pb-3">
              <pre className="text-[11.5px] text-arch-text2 whitespace-pre-wrap bg-arch-bg2 rounded-lg p-3 border border-arch-border max-h-60 overflow-y-auto">
                {analysis.ticket_text}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-arch-red/10 border border-arch-red/30 text-arch-red text-[11.5px]">
          {error}
        </div>
      )}

      {/* Messages area */}
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto px-4 py-4 ${isEmpty ? "flex flex-col justify-center" : ""}`}
      >
        {isEmpty ? (
          <div className="text-center text-arch-text3 text-[13px]">
            No messages in this analysis.
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="max-w-3xl mx-auto w-full px-4 pb-4 pt-2">
        <ChatInput
          onSend={sendMessage}
          onStop={stopStreaming}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}
