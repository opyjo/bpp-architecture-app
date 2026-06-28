"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { load as yamlLoad } from "js-yaml";
import { streamNDJSON } from "@/lib/stream";

const STORAGE_KEY = "contract-builder-last-spec";

export interface UseContractBuilderReturn {
  yamlOutput: string;
  parsedSpec: object | null;
  parseError: string | null;
  isGenerating: boolean;
  error: string | null;
  generate: (
    goCode: string,
    opts?: { additionalFiles?: string[]; fileName?: string; modelId?: string }
  ) => Promise<void>;
  stop: () => void;
  reset: () => void;
}

function stripMarkdownFences(text: string): string {
  let result = text.trim();
  result = result.replace(/^```(?:ya?ml)?\s*\n?/, "");
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

  // Abort any in-flight stream when the component unmounts so it can't
  // setState on an unmounted component (leak + React warning).
  useEffect(() => () => abortRef.current?.abort(), []);

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
      opts?: { additionalFiles?: string[]; fileName?: string; modelId?: string }
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
        await streamNDJSON(
          "/api/contract-builder",
          {
            goCode,
            additionalFiles: opts?.additionalFiles,
            fileName: opts?.fileName,
            modelId: opts?.modelId,
          },
          controller.signal,
          (_text, accumulated) => setYamlOutput(accumulated),
          (message) => setError(message),
          (accumulated) => {
            const cleaned = stripMarkdownFences(accumulated);
            setYamlOutput(cleaned);
            try {
              const parsed = yamlLoad(cleaned);
              if (parsed && typeof parsed === "object") {
                setParsedSpec(parsed as object);
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
          }
        );
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

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsGenerating(false);
  }, []);

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
    stop,
    reset,
  };
}
