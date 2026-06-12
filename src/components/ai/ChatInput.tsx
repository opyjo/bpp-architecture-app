"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
}

export default function ChatInput({ onSend, onStop, isStreaming }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  const handleSend = () => {
    if (!value.trim() || isStreaming) return;
    onSend(value);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 p-3 rounded-xl border border-arch-border bg-arch-bg2 shadow-sm">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about the codebase, paste a Jira ticket..."
        rows={1}
        className="flex-1 bg-transparent px-2 py-1.5 text-[13px] text-arch-text placeholder:text-arch-text3 resize-none focus:outline-none"
      />
      {isStreaming ? (
        <button
          onClick={onStop}
          className="w-8 h-8 rounded-lg bg-arch-red/15 text-arch-red flex items-center justify-center hover:bg-arch-red/25 transition-colors shrink-0 cursor-pointer"
          title="Stop generating"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="2" width="10" height="10" rx="1.5" />
          </svg>
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={!value.trim()}
          className="w-8 h-8 rounded-lg bg-arch-purple text-white flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 cursor-pointer"
          title="Send message"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 12V4M8 4L4 8M8 4L12 8" />
          </svg>
        </button>
      )}
    </div>
  );
}
