"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useChat } from "@/lib/hooks/useChat";
import { useSavedChats } from "@/lib/hooks/useSavedChats";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import MessageBubble from "@/components/ai/MessageBubble";
import ChatInput from "@/components/ai/ChatInput";
import SuggestedPrompts from "@/components/ai/SuggestedPrompts";
import ModelSelector from "@/components/ai/ModelSelector";
import type { SavedChat } from "@/lib/types/saved-chat";
import type { ChatMessage } from "@/lib/types/chat";
import { ArrowLeft, Pencil, Check } from "lucide-react";

export default function ChatDetailView({ chatId }: { chatId: string }) {
  const { getChat } = useSavedChats();
  const [chat, setChat] = useState<SavedChat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChat(chatId)
      .then((data) => setChat(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [chatId, getChat]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-arch-bg">
        <div className="w-5 h-5 border-2 border-arch-purple/30 border-t-arch-purple rounded-full animate-spin" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-arch-bg text-arch-text3 gap-3">
        <p className="text-[13px]">Chat not found</p>
        <Link href="/chats" className="text-[12px] text-arch-purple hover:underline">
          Back to saved chats
        </Link>
      </div>
    );
  }

  return <ChatDetailInner chat={chat} />;
}

function ChatDetailInner({ chat }: { chat: SavedChat }) {
  const { updateChat } = useSavedChats();
  const [modelId, setModelId] = useState(chat.model_id || DEFAULT_MODEL_ID);
  const [title, setTitle] = useState(chat.title);
  const [editingTitle, setEditingTitle] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatIdRef = useRef(chat.id);

  const handleMessagesChange = useCallback(
    (msgs: ChatMessage[]) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        updateChat(chatIdRef.current, { messages: msgs }).catch(() => {});
      }, 2000);
    },
    [updateChat]
  );

  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
  } = useChat(modelId, {
    initialMessages: chat.messages,
    persistToLocalStorage: false,
    onMessagesChange: handleMessagesChange,
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleTitleSave = async () => {
    const trimmed = title.trim() || "Untitled Chat";
    setTitle(trimmed);
    setEditingTitle(false);
    await updateChat(chat.id, { title: trimmed }).catch(() => {});
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-arch-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-arch-border bg-arch-bg2/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Link
            href="/chats"
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
                    setTitle(chat.title);
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
