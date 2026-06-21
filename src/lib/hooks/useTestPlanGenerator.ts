"use client";

import { useState, useCallback, useRef } from "react";

export interface UseTestPlanGeneratorReturn {
  planOutput: string;
  isGenerating: boolean;
  error: string | null;
  generate: (requirement: string, testTypes: string[]) => Promise<void>;
  reset: () => void;
}

export function useTestPlanGenerator(): UseTestPlanGeneratorReturn {
  const [planOutput, setPlanOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (requirement: string, testTypes: string[]) => {
      if (!requirement.trim() || isGenerating) return;

      setError(null);
      setPlanOutput("");
      setIsGenerating(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/test-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requirement, testTypes }),
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
                setPlanOutput(accumulated);
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

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setPlanOutput("");
    setError(null);
    setIsGenerating(false);
  }, []);

  return { planOutput, isGenerating, error, generate, reset };
}
