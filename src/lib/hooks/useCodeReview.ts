"use client";

import { useState, useCallback, useRef } from "react";

export interface UseCodeReviewReturn {
  reviewOutput: string;
  isReviewing: boolean;
  error: string | null;
  review: (code: string, focus: string[], language?: string) => Promise<void>;
  reset: () => void;
}

export function useCodeReview(): UseCodeReviewReturn {
  const [reviewOutput, setReviewOutput] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const review = useCallback(
    async (code: string, focus: string[], language: string = "go") => {
      if (!code.trim() || isReviewing) return;

      setError(null);
      setReviewOutput("");
      setIsReviewing(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/code-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, focus, language }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `API error: ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            let event: { type: string; text?: string; message?: string };
            try {
              event = JSON.parse(line);
            } catch {
              continue;
            }

            switch (event.type) {
              case "text_delta":
                accumulated += event.text ?? "";
                setReviewOutput(accumulated);
                break;
              case "error":
                setError(event.message ?? "Unknown error");
                break;
              case "done":
                break;
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(
            err instanceof Error ? err.message : "Failed to generate review"
          );
        }
      } finally {
        setIsReviewing(false);
        abortRef.current = null;
      }
    },
    [isReviewing]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setReviewOutput("");
    setError(null);
    setIsReviewing(false);
  }, []);

  return { reviewOutput, isReviewing, error, review, reset };
}
