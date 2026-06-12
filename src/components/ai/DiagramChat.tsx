"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@/lib/hooks/useChat";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import { serviceDependencyDiagram } from "@/data/architecture";
import { serviceGroups } from "@/data/system-overview";
import ChatInput from "@/components/ai/ChatInput";
import MessageBubble from "@/components/ai/MessageBubble";

const SUGGESTED_PROMPTS = [
  "What depends on Kafka?",
  "How does the auth flow work?",
  "Which services use PostgreSQL?",
  "Explain the order placement flow",
];

function buildDiagramContext(): string {
  const servicesSummary = serviceGroups
    .map(
      (g) =>
        `## ${g.name}\n${g.services
          .map((s) => `- **${s.name}**: ${s.description} (${s.tech})`)
          .join("\n")}`
    )
    .join("\n\n");

  return [
    "You are an expert on this system's architecture. Answer questions using the service dependency diagram and service data below.",
    "Be concise and specific. Reference service names and connections from the diagram when answering.",
    "",
    "## Mermaid Diagram Source",
    "```mermaid",
    serviceDependencyDiagram,
    "```",
    "",
    "## Service Details",
    servicesSummary,
  ].join("\n");
}

export default function DiagramChat() {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const systemContext = useMemo(buildDiagramContext, []);

  const { messages, isStreaming, error, sendMessage, stopStreaming, clearHistory } =
    useChat(DEFAULT_MODEL_ID, {
      persistToLocalStorage: false,
      systemContext,
    });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Clear messages when panel closes
  function handleClose() {
    setOpen(false);
    clearHistory();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-arch-purple text-white shadow-lg hover:opacity-90 transition-all flex items-center justify-center cursor-pointer"
        title="Ask AI about this diagram"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[420px] h-[560px] flex flex-col rounded-xl border border-arch-border bg-arch-bg shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-arch-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-arch-purple/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c6fcd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-arch-text">Diagram Chat</span>
        </div>
        <button
          onClick={handleClose}
          className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center text-arch-text3 hover:text-arch-text transition-colors cursor-pointer"
          title="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="text-[12px] text-arch-text3">
              Ask questions about the service dependency diagram
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] text-arch-text2 bg-arch-bg2 border border-arch-border hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {error && (
          <div className="text-[11px] text-arch-red px-2 py-1 rounded bg-arch-red/10">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-1 shrink-0">
        <ChatInput onSend={sendMessage} onStop={stopStreaming} isStreaming={isStreaming} />
      </div>
    </div>
  );
}
