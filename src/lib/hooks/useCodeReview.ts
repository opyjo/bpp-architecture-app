"use client";

import { useState, useCallback, useRef } from "react";
import { streamNDJSON } from "@/lib/stream";

export interface UseCodeReviewReturn {
  reviewOutput: string;
  isReviewing: boolean;
  error: string | null;
  review: (code: string, focus: string[], language?: string, modelId?: string) => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export function useCodeReview(): UseCodeReviewReturn {
  const [reviewOutput, setReviewOutput] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const review = useCallback(
    async (code: string, focus: string[], language: string = "go", modelId?: string) => {
      if (!code.trim() || isReviewing) return;

      setError(null);
      setReviewOutput("");
      setIsReviewing(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamNDJSON(
          "/api/code-review",
          { code, focus, language, modelId },
          controller.signal,
          (_text, accumulated) => setReviewOutput(accumulated),
          (message) => setError(message)
        );
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

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsReviewing(false);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setReviewOutput("");
    setError(null);
    setIsReviewing(false);
  }, []);

  return { reviewOutput, isReviewing, error, review, stop, reset };
}
