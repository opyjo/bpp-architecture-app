"use client";

import { useState, useCallback } from "react";
import { useChat } from "@/lib/hooks/useChat";
import { useSavedAnalyses } from "@/lib/hooks/useSavedAnalyses";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import { TICKET_ANALYZER_CONTEXT } from "@/lib/ai/ticket-analyzer-prompt";
import TicketInput from "@/components/analyze/TicketInput";
import AnalysisOutput from "@/components/analyze/AnalysisOutput";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default function AnalyzePage() {
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const [ticketText, setTicketText] = useState("");

  const { messages, isStreaming, error, sendMessage, stopStreaming, clearHistory } = useChat(
    modelId,
    {
      persistToLocalStorage: false,
      systemContext: TICKET_ANALYZER_CONTEXT,
    }
  );

  const { saveAnalysis } = useSavedAnalyses();

  const [showSavePopover, setShowSavePopover] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAnalyze = useCallback(
    (text: string) => {
      sendMessage(text.trim());
    },
    [sendMessage]
  );

  const handleNewAnalysis = useCallback(() => {
    clearHistory();
    setTicketText("");
  }, [clearHistory]);

  const handleSaveClick = () => {
    const firstUserMsg = messages.find((m) => m.role === "user");
    setSaveTitle(
      firstUserMsg
        ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? "…" : "")
        : "Untitled Analysis"
    );
    setShowSavePopover(true);
  };

  const handleSaveConfirm = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await saveAnalysis({
        title: saveTitle.trim() || "Untitled Analysis",
        ticket_text: ticketText,
        messages,
        model_id: modelId,
      });
      setShowSavePopover(false);
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
    } catch {
      // save failed silently
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-arch-bg">
      {/* Minimal header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-arch-border bg-arch-bg2">
        <a
          href="/"
          className="text-xs text-arch-text2 hover:text-arch-text transition-colors"
        >
          &larr; Back
        </a>
        <span className="text-xs text-arch-border">|</span>
        <span className="text-sm font-medium text-arch-text">
          Ticket Analyzer
        </span>
        <div className="ml-auto">
          <Link
            href="/analyses"
            className="text-[10.5px] text-arch-text3 hover:text-arch-purple transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
          >
            Saved analyses <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Save popover */}
      {showSavePopover && (
        <div className="mx-4 mt-2 px-3 py-2.5 rounded-lg bg-arch-bg2 border border-arch-border flex items-center gap-2">
          <input
            type="text"
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveConfirm();
              if (e.key === "Escape") setShowSavePopover(false);
            }}
            placeholder="Analysis title…"
            autoFocus
            className="flex-1 bg-transparent text-[12px] text-arch-text outline-none placeholder:text-arch-text3"
          />
          <button
            onClick={handleSaveConfirm}
            disabled={isSaving}
            className="text-[10.5px] text-arch-green hover:bg-white/5 px-2 py-1 rounded transition-colors cursor-pointer disabled:opacity-40"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => setShowSavePopover(false)}
            className="text-[10.5px] text-arch-text3 hover:bg-white/5 px-2 py-1 rounded transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        <TicketInput
          onAnalyze={handleAnalyze}
          isStreaming={isStreaming}
          modelId={modelId}
          onModelChange={setModelId}
          ticketText={ticketText}
          onTicketTextChange={setTicketText}
        />
        <AnalysisOutput
          messages={messages}
          isStreaming={isStreaming}
          error={error}
          onNewAnalysis={handleNewAnalysis}
          onSendFollowUp={sendMessage}
          onStopStreaming={stopStreaming}
          onSaveClick={handleSaveClick}
          saveFeedback={saveFeedback}
        />
      </div>
    </div>
  );
}
