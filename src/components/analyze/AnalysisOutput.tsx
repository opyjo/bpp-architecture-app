"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble from "@/components/ai/MessageBubble";
import ChatInput from "@/components/ai/ChatInput";
import type { ChatMessage } from "@/lib/types/chat";

interface AnalysisOutputProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  onNewAnalysis: () => void;
  onSendFollowUp: (message: string) => void;
  onStopStreaming: () => void;
}

export default function AnalysisOutput({
  messages,
  isStreaming,
  error,
  onNewAnalysis,
  onSendFollowUp,
  onStopStreaming,
}: AnalysisOutputProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Auto-scroll during streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCopyMarkdown = async () => {
    // Find the last assistant message
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && m.content);
    if (!lastAssistant) return;

    try {
      await navigator.clipboard.writeText(lastAssistant.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement("textarea");
      textarea.value = lastAssistant.content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasContent = messages.some(
    (m) => m.role === "assistant" && m.content
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-arch-border bg-arch-bg2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-arch-purple to-arch-blue flex items-center justify-center text-white text-[10px] font-bold shrink-0">
          AI
        </div>
        <span className="text-sm font-medium text-arch-text">
          Analysis
        </span>

        <div className="ml-auto flex items-center gap-2">
          {hasContent && !isStreaming && (
            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 text-[11px] font-medium rounded-md border border-arch-border bg-arch-bg3 text-arch-text2 hover:text-arch-text hover:border-arch-blue/30 transition-colors"
            >
              {copied ? "Copied!" : "Copy Markdown"}
            </button>
          )}

          <button
            onClick={onNewAnalysis}
            disabled={isStreaming}
            className="px-3 py-1.5 text-[11px] font-medium rounded-md border border-arch-border bg-arch-bg3 text-arch-text2 hover:text-arch-text hover:border-arch-blue/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            New Analysis
          </button>
        </div>
      </div>

      {/* Messages or empty state */}
      {messages.length === 0 && !isStreaming ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-arch-purple/20 to-arch-blue/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-arch-blue/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-arch-text">No analysis yet</h3>
            <p className="text-xs text-arch-text2">
              Paste a ticket in the left panel and click Analyze to get started.
            </p>
          </div>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {error && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              {error}
            </div>
          )}

          {isStreaming && !messages.some((m) => m.role === "assistant" && m.content) && (
            <div className="flex items-center gap-2 text-xs text-arch-text2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-arch-blue rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-arch-blue rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-arch-blue rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              Exploring the codebase...
            </div>
          )}
        </div>
      )}

      {/* Follow-up chat input */}
      {hasContent && (
        <div className="border-t border-arch-border px-4 py-3">
          <ChatInput
            onSend={onSendFollowUp}
            onStop={onStopStreaming}
            isStreaming={isStreaming}
          />
        </div>
      )}
    </div>
  );
}
