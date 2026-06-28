"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X, Eraser } from "lucide-react";
import { ALL_TAB_IDS } from "@/lib/tabs";
import { useChat } from "@/lib/hooks/useChat";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import { getAssistantContext, buildSystemContext } from "@/lib/assistant-context";
import { cn } from "@/lib/utils";
import MessageBubble from "@/components/ai/MessageBubble";
import ChatInput from "@/components/ai/ChatInput";
import ModelSelector from "@/components/ai/ModelSelector";

function AssistantSidebarInner() {
  const pathname = usePathname();
  // Tabs are now their own routes (/services, /teleprompter, …); derive the
  // active tab id from the path segment so assistant context still resolves.
  const seg = pathname.slice(1);
  const tab = ALL_TAB_IDS.includes(seg) ? seg : null;

  const [open, setOpen] = useState(false);
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { label, prompts } = useMemo(
    () => getAssistantContext(tab, pathname),
    [tab, pathname]
  );
  const systemContext = useMemo(
    () => buildSystemContext(tab, pathname),
    [tab, pathname]
  );

  const { messages, isStreaming, error, sendMessage, stopStreaming, clearHistory } =
    useChat(modelId, {
      storageKey: "assistant-sidebar-chat",
      systemContext,
      feature: "AI Assistant (sidebar)",
    });

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI assistant"
          className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full border border-arch-blue/30 bg-arch-blue px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-arch-blue/30 transition-all hover:scale-[1.03] hover:bg-arch-blue/90"
        >
          <Sparkles className="size-4" />
          Ask AI
        </button>
      )}

      {/* Slide-in panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-[70] flex h-full w-full max-w-[min(94vw,560px)] flex-col border-l border-arch-border bg-arch-bg2 shadow-2xl shadow-black/30 transition-transform duration-200",
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-arch-border px-4 py-3">
          <Sparkles className="size-4 text-arch-blue" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold leading-tight">AI Assistant</div>
            <div className="truncate text-[11px] text-arch-text3">
              Context: <span className="text-arch-blue">{label}</span>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              title="Clear conversation"
              className="rounded-md p-1.5 text-arch-text3 transition-colors hover:bg-arch-bg3 hover:text-arch-text"
            >
              <Eraser className="size-4" />
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            aria-label="Close assistant"
            className="rounded-md p-1.5 text-arch-text3 transition-colors hover:bg-arch-bg3 hover:text-arch-text"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="border-b border-arch-border px-4 py-2">
          <ModelSelector value={modelId} onChange={setModelId} disabled={isStreaming} />
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-arch-blue/10">
                <Sparkles className="size-6 text-arch-blue" />
              </div>
              <p className="max-w-[260px] text-[13px] text-arch-text2">
                Ask about whatever you’re viewing. I can read real source from the
                connected repos when needed.
              </p>
              <div className="flex flex-col gap-1.5">
                {prompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="rounded-lg border border-arch-border bg-arch-bg3/60 px-3 py-1.5 text-[12px] text-arch-text2 transition-colors hover:border-arch-blue/40 hover:text-arch-text"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
          {error && (
            <div className="rounded-lg border border-arch-red/30 bg-arch-red/10 px-3 py-2 text-[12px] text-arch-red">
              {error}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-arch-border p-3">
          <ChatInput onSend={sendMessage} onStop={stopStreaming} isStreaming={isStreaming} />
        </div>
      </div>
    </>
  );
}

export default function AssistantSidebar() {
  return (
    <Suspense fallback={null}>
      <AssistantSidebarInner />
    </Suspense>
  );
}
