"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@/lib/hooks/useChat";
import { useSavedChats } from "@/lib/hooks/useSavedChats";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import MessageBubble from "@/components/ai/MessageBubble";
import ChatInput from "@/components/ai/ChatInput";
import ModelSelector from "@/components/ai/ModelSelector";
import { Save, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { bsaCoachSystemContext } from "@/data/bsa-cheatsheet";

const COACH_PROMPTS = [
  "Mock interview — 5 BSA questions",
  "How do I gather integration requirements?",
  "Explain the saga pattern simply",
  "Bell project examples for behavioral Qs",
];

export default function InterviewCoachTab() {
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const { messages, isStreaming, error, sendMessage, stopStreaming, clearHistory } =
    useChat(modelId, {
      storageKey: "bsa-coach-chat",
      systemContext: bsaCoachSystemContext,
    });
  const { saveChat } = useSavedChats();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [showSavePopover, setShowSavePopover] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const isEmpty = messages.length === 0;

  const handleSaveClick = () => {
    const firstUserMsg = messages.find((m) => m.role === "user");
    setSaveTitle(
      firstUserMsg
        ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? "\u2026" : "")
        : "Untitled"
    );
    setShowSavePopover(true);
  };

  const handleSaveConfirm = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const rawTitle = saveTitle.trim() || "Untitled";
    const finalTitle = rawTitle.startsWith("[BSA Coach]") ? rawTitle : `[BSA Coach] ${rawTitle}`;
    try {
      await saveChat({
        title: finalTitle,
        messages,
        model_id: modelId,
      });
      setShowSavePopover(false);
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
    } catch {
      toast.error("Failed to save chat");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-arch-border bg-arch-bg2/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-arch-teal to-arch-blue text-white flex items-center justify-center text-[8px] font-bold shrink-0">
            BSA
          </div>
          <span className="text-[13px] font-semibold text-arch-text truncate">
            Interview Coach
          </span>
          <ModelSelector
            value={modelId}
            onChange={setModelId}
            disabled={isStreaming}
          />
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/chats"
            className="text-[11px] text-arch-text3 hover:text-arch-teal transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
          >
            Saved chats <ExternalLink className="w-3 h-3" />
          </Link>
          {messages.length > 0 && (
            <>
              <button
                onClick={handleSaveClick}
                disabled={isStreaming}
                className="text-[11px] text-arch-text3 hover:text-arch-green transition-colors px-2 py-1 rounded hover:bg-white/5 cursor-pointer flex items-center gap-1 disabled:opacity-40"
              >
                <Save className="w-3 h-3" />
                {saveFeedback ? "Saved!" : "Save chat"}
              </button>
              <button
                onClick={clearHistory}
                className="text-[11px] text-arch-text3 hover:text-arch-red transition-colors px-2 py-1 rounded hover:bg-white/5 cursor-pointer"
              >
                Clear chat
              </button>
            </>
          )}
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
            placeholder="Chat title\u2026"
            autoFocus
            className="flex-1 bg-transparent text-[12px] text-arch-text outline-none placeholder:text-arch-text3"
          />
          <button
            onClick={handleSaveConfirm}
            disabled={isSaving}
            className="text-[11px] text-arch-green hover:bg-white/5 px-2 py-1 rounded transition-colors cursor-pointer disabled:opacity-40"
          >
            {isSaving ? "Saving\u2026" : "Save"}
          </button>
          <button
            onClick={() => setShowSavePopover(false)}
            className="text-[11px] text-arch-text3 hover:bg-white/5 px-2 py-1 rounded transition-colors cursor-pointer"
          >
            Cancel
          </button>
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
        className={`flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 ${isEmpty ? "flex flex-col items-center justify-center" : ""}`}
      >
        {isEmpty ? (
          <div className="w-full max-w-xl mx-auto flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {COACH_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="px-2.5 py-1 rounded-full text-[10.5px] text-arch-text3 border border-arch-border hover:border-arch-teal/40 hover:text-arch-teal transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <ChatInput onSend={sendMessage} onStop={stopStreaming} isStreaming={isStreaming} />
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        )}
      </div>

      {/* Input — only when conversation is active */}
      {!isEmpty && (
        <div className="max-w-3xl mx-auto w-full px-4 pb-4 pt-2">
          <ChatInput onSend={sendMessage} onStop={stopStreaming} isStreaming={isStreaming} />
        </div>
      )}
    </div>
  );
}
