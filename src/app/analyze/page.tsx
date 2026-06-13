"use client";

import { useState, useCallback } from "react";
import { useChat } from "@/lib/hooks/useChat";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import { TICKET_ANALYZER_CONTEXT } from "@/lib/ai/ticket-analyzer-prompt";
import TicketInput from "@/components/analyze/TicketInput";
import AnalysisOutput from "@/components/analyze/AnalysisOutput";

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
      </div>

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
        />
      </div>
    </div>
  );
}
