"use client";

import { useState, useCallback } from "react";
import { useChat } from "@/lib/hooks/useChat";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import { TICKET_ANALYZER_CONTEXT } from "@/lib/ai/ticket-analyzer-prompt";
import TicketInput from "@/components/analyze/TicketInput";
import AnalysisOutput from "@/components/analyze/AnalysisOutput";

type Phase = "input" | "analyzing";

export default function AnalyzePage() {
  const [phase, setPhase] = useState<Phase>("input");
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);

  const { messages, isStreaming, error, sendMessage, clearHistory } = useChat(
    modelId,
    {
      persistToLocalStorage: false,
      systemContext: TICKET_ANALYZER_CONTEXT,
    }
  );

  const handleAnalyze = useCallback(
    (text: string) => {
      setPhase("analyzing");
      sendMessage(text);
    },
    [sendMessage]
  );

  const handleNewAnalysis = useCallback(() => {
    clearHistory();
    setPhase("input");
  }, [clearHistory]);

  return (
    <div className="min-h-screen flex flex-col bg-arch-bg">
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

      {phase === "input" ? (
        <TicketInput
          onAnalyze={handleAnalyze}
          isDisabled={isStreaming}
          modelId={modelId}
          onModelChange={setModelId}
        />
      ) : (
        <AnalysisOutput
          messages={messages}
          isStreaming={isStreaming}
          error={error}
          modelId={modelId}
          onModelChange={setModelId}
          onNewAnalysis={handleNewAnalysis}
        />
      )}
    </div>
  );
}
