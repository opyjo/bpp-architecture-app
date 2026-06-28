"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { streamNDJSON } from "@/lib/stream";

export interface UseTestPlanGeneratorReturn {
  planOutput: string;
  isGenerating: boolean;
  error: string | null;
  generate: (requirement: string, testTypes: string[], modelId?: string) => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export function useTestPlanGenerator(): UseTestPlanGeneratorReturn {
  const [planOutput, setPlanOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Abort any in-flight stream when the component unmounts so it can't
  // setState on an unmounted component (leak + React warning).
  useEffect(() => () => abortRef.current?.abort(), []);

  const generate = useCallback(
    async (requirement: string, testTypes: string[], modelId?: string) => {
      if (!requirement.trim() || isGenerating) return;

      setError(null);
      setPlanOutput("");
      setIsGenerating(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamNDJSON(
          "/api/test-plan",
          { requirement, testTypes, modelId },
          controller.signal,
          (_text, accumulated) => setPlanOutput(accumulated),
          (message) => setError(message)
        );
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(
            err instanceof Error ? err.message : "Failed to generate test plan"
          );
        }
      } finally {
        setIsGenerating(false);
        abortRef.current = null;
      }
    },
    [isGenerating]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsGenerating(false);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setPlanOutput("");
    setError(null);
    setIsGenerating(false);
  }, []);

  return { planOutput, isGenerating, error, generate, stop, reset };
}
