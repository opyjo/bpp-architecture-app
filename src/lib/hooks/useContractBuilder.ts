"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { load as yamlLoad } from "js-yaml";

const STORAGE_KEY = "contract-builder-last-spec";

export interface UseContractBuilderReturn {
  yamlOutput: string;
  parsedSpec: object | null;
  parseError: string | null;
  isGenerating: boolean;
  error: string | null;
  generate: (
    goCode: string,
    opts?: { additionalFiles?: string[]; fileName?: string }
  ) => Promise<void>;
  reset: () => void;
}

function stripMarkdownFences(text: string): string {
  let result = text.trim();
  // Remove opening fence like ```yaml or ```
  result = result.replace(/^```(?:ya?ml)?\s*\n?/, "");
  // Remove closing fence
  result = result.replace(/\n?```\s*$/, "");
  return result;
}

export function useContractBuilder(): UseContractBuilderReturn {
  const [yamlOutput, setYamlOutput] = useState("");
  const [parsedSpec, setParsedSpec] = useState<object | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Restore last spec from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setYamlOutput(saved);
        const parsed = yamlLoad(saved);
        if (parsed && typeof parsed === "object") {
          setParsedSpec(parsed as object);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const generate = useCallback(
    async (
      goCode: string,
      opts?: { additionalFiles?: string[]; fileName?: string }
    ) => {
      if (!goCode.trim() || isGenerating) return;

      setError(null);
      setParseError(null);
      setParsedSpec(null);
      setYamlOutput("");
      setIsGenerating(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/contract-builder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goCode,
            additionalFiles: opts?.additionalFiles,
            fileName: opts?.fileName,
          }),
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
                setYamlOutput(accumulated);
                break;
              case "error":
                setError(event.message ?? "Unknown error");
                break;
              case "done": {
                const cleaned = stripMarkdownFences(accumulated);
                setYamlOutput(cleaned);
                try {
                  const parsed = yamlLoad(cleaned);
                  if (parsed && typeof parsed === "object") {
                    setParsedSpec(parsed as object);
                    // Save to localStorage
                    try {
                      localStorage.setItem(STORAGE_KEY, cleaned);
                    } catch {
                      // storage full
                    }
                  } else {
                    setParseError("AI output is not a valid YAML object");
                  }
                } catch (e) {
                  setParseError(
                    e instanceof Error
                      ? `YAML parse error: ${e.message}`
                      : "Failed to parse YAML"
                  );
                }
                break;
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(
            err instanceof Error ? err.message : "Failed to generate spec"
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
    setYamlOutput("");
    setParsedSpec(null);
    setParseError(null);
    setError(null);
    setIsGenerating(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return {
    yamlOutput,
    parsedSpec,
    parseError,
    isGenerating,
    error,
    generate,
    reset,
  };
}
