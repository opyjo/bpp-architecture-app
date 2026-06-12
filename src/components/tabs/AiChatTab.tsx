"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@/lib/hooks/useChat";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import MessageBubble from "@/components/ai/MessageBubble";
import ChatInput from "@/components/ai/ChatInput";
import SuggestedPrompts from "@/components/ai/SuggestedPrompts";
import ModelSelector from "@/components/ai/ModelSelector";

export default function AiChatTab() {
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const { messages, isStreaming, error, sendMessage, stopStreaming, clearHistory } =
    useChat(modelId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-90px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-arch-border bg-arch-bg2/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-arch-purple to-arch-blue text-white flex items-center justify-center text-[9px] font-bold">
            AI
          </div>
          <span className="text-[13px] font-semibold text-arch-text">
            Architecture Assistant
          </span>
          <ModelSelector
            value={modelId}
            onChange={setModelId}
            disabled={isStreaming}
          />
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-[10.5px] text-arch-text3 hover:text-arch-red transition-colors px-2 py-1 rounded hover:bg-white/5 cursor-pointer"
          >
            Clear chat
          </button>
        )}
      </div>

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
          <SuggestedPrompts onSelect={sendMessage} />
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
