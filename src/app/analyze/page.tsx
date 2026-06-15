"use client";

import { useState, useCallback, useEffect } from "react";
import { useChat } from "@/lib/hooks/useChat";
import { useSavedAnalyses } from "@/lib/hooks/useSavedAnalyses";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import { TICKET_ANALYZER_CONTEXT } from "@/lib/ai/ticket-analyzer-prompt";
import TicketInput from "@/components/analyze/TicketInput";
import AnalysisOutput from "@/components/analyze/AnalysisOutput";
import Breadcrumbs from "@/components/nav/Breadcrumbs";

const TICKET_TEXT_KEY = "analyzer-ticket-text";

function loadTicketText(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(TICKET_TEXT_KEY) || "";
  } catch {
    return "";
  }
}

export default function AnalyzePage() {
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const [ticketText, setTicketText] = useState(loadTicketText);

  // Persist ticket text to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TICKET_TEXT_KEY, ticketText);
    } catch {
      // storage full
    }
  }, [ticketText]);

  const { messages, isStreaming, error, sendMessage, stopStreaming, clearHistory } = useChat(
    modelId,
    {
      persistToLocalStorage: true,
      storageKey: "analyzer-chat-history",
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
    try { localStorage.removeItem(TICKET_TEXT_KEY); } catch { /* */ }
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
    <div className="flex-1 flex flex-col bg-arch-bg min-h-0">
      <Breadcrumbs />

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
            className="text-[11px] text-arch-green hover:bg-white/5 px-2 py-1 rounded transition-colors cursor-pointer disabled:opacity-40"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => setShowSavePopover(false)}
            className="text-[11px] text-arch-text3 hover:bg-white/5 px-2 py-1 rounded transition-colors cursor-pointer"
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
