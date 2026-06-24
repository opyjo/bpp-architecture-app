"use client";

import { useState, useCallback, useRef } from "react";
import { streamNDJSON } from "@/lib/stream";

export type InsightLens = "business" | "go" | "saas";

export interface UseRepoInsightsReturn {
  output: string;
  isRunning: boolean;
  error: string | null;
  analyze: (
    lens: InsightLens,
    input: string,
    filePath?: string,
    modelId?: string
  ) => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export function useRepoInsights(): UseRepoInsightsReturn {
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const analyze = useCallback(
    async (
      lens: InsightLens,
      input: string,
      filePath: string = "",
      modelId?: string
    ) => {
      if (!input.trim() || isRunning) return;

      setError(null);
      setOutput("");
      setIsRunning(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamNDJSON(
          "/api/repo-insights",
          { lens, input, filePath, modelId },
          controller.signal,
          (_text, accumulated) => setOutput(accumulated),
          (message) => setError(message)
        );
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(
            err instanceof Error ? err.message : "Failed to generate insights"
          );
        }
      } finally {
        setIsRunning(false);
        abortRef.current = null;
      }
    },
    [isRunning]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setOutput("");
    setError(null);
    setIsRunning(false);
  }, []);

  return { output, isRunning, error, analyze, stop, reset };
}
