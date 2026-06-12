"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ChatMessage, ToolCallInfo, StreamEvent } from "@/lib/types/chat";

const STORAGE_KEY = "ai-chat-history";
const MAX_STORED = 50;
const MAX_SENT = 20;

function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(messages.slice(-MAX_STORED))
    );
  } catch {
    // storage full — silently fail
  }
}

export interface UseChatOptions {
  initialMessages?: ChatMessage[];
  persistToLocalStorage?: boolean;
  onMessagesChange?: (msgs: ChatMessage[]) => void;
}

export function useChat(modelId: string, options?: UseChatOptions) {
  const {
    initialMessages,
    persistToLocalStorage = true,
    onMessagesChange,
  } = options ?? {};

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const initializedRef = useRef(false);
  const onMessagesChangeRef = useRef(onMessagesChange);
  onMessagesChangeRef.current = onMessagesChange;

  // Load on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      if (initialMessages) {
        setMessages(initialMessages);
      } else if (persistToLocalStorage) {
        setMessages(loadMessages());
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save on change + notify
  useEffect(() => {
    if (initializedRef.current && messages.length > 0) {
      if (persistToLocalStorage) {
        saveMessages(messages);
      }
      onMessagesChangeRef.current?.(messages);
    }
  }, [messages, persistToLocalStorage]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      setError(null);

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        toolCalls: [],
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Build API messages from last N turns
        const allMessages = [...messages, userMessage];
        const apiMessages = allMessages.slice(-MAX_SENT).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, modelId }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(
            errBody.error || `API error: ${res.status}`
          );
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";
        let currentToolCalls: ToolCallInfo[] = [];
        let accumulatedText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            let event: StreamEvent;
            try {
              event = JSON.parse(line);
            } catch {
              continue;
            }

            switch (event.type) {
              case "text_delta":
                accumulatedText += event.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant") {
                    updated[updated.length - 1] = {
                      ...last,
                      content: accumulatedText,
                      toolCalls: [...currentToolCalls],
                    };
                  }
                  return updated;
                });
                break;

              case "tool_use_start":
                currentToolCalls.push({
                  toolName: event.toolName,
                  input: event.input,
                  output: "",
                  durationMs: 0,
                });
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant") {
                    updated[updated.length - 1] = {
                      ...last,
                      toolCalls: [...currentToolCalls],
                    };
                  }
                  return updated;
                });
                break;

              case "tool_use_end":
                currentToolCalls = currentToolCalls.map((tc) =>
                  tc.toolName === event.toolName && !tc.output
                    ? { ...tc, output: event.output, durationMs: event.durationMs }
                    : tc
                );
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant") {
                    updated[updated.length - 1] = {
                      ...last,
                      toolCalls: [...currentToolCalls],
                    };
                  }
                  return updated;
                });
                break;

              case "error":
                setError(event.message);
                break;
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(
            err instanceof Error ? err.message : "Failed to send message"
          );
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming, modelId]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    if (persistToLocalStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
    setError(null);
  }, [persistToLocalStorage]);

  return { messages, isStreaming, error, sendMessage, stopStreaming, clearHistory };
}
