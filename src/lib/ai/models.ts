import type { ModelOption } from "@/lib/types/chat";

export const MODEL_OPTIONS: ModelOption[] = [
  // Anthropic
  {
    id: "claude-sonnet-4.6",
    label: "Claude Sonnet 4.6",
    provider: "anthropic",
    modelId: "claude-sonnet-4-6",
  },
  {
    id: "claude-opus-4.8",
    label: "Claude Opus 4.8",
    provider: "anthropic",
    modelId: "claude-opus-4-8",
  },
  {
    id: "claude-haiku-4.5",
    label: "Claude Haiku 4.5",
    provider: "anthropic",
    modelId: "claude-haiku-4-5-20251001",
  },
  // Google
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    provider: "google",
    modelId: "gemini-2.5-pro",
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "google",
    modelId: "gemini-2.5-flash",
  },
  {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    provider: "google",
    modelId: "gemini-2.0-flash",
  },
  // MoonShot (Kimi K2 series)
  {
    id: "kimi-k2.7-code",
    label: "Kimi K2.7 Code",
    provider: "moonshot",
    modelId: "kimi-k2.7-code",
  },
  {
    id: "kimi-k2.6",
    label: "Kimi K2.6",
    provider: "moonshot",
    modelId: "kimi-k2.6",
  },
  {
    id: "kimi-k2.5",
    label: "Kimi K2.5",
    provider: "moonshot",
    modelId: "kimi-k2.5",
  },
  // xAI (Grok)
  {
    id: "grok-4.3",
    label: "Grok 4.3",
    provider: "xai",
    modelId: "grok-4.3",
  },
  {
    id: "grok-4.20-reasoning",
    label: "Grok 4.20 Reasoning",
    provider: "xai",
    modelId: "grok-4.20-0309-reasoning",
  },
  {
    id: "grok-build",
    label: "Grok Build 0.1",
    provider: "xai",
    modelId: "grok-build-0.1",
  },
];

export const DEFAULT_MODEL_ID = "gemini-2.5-flash";

export function getModel(id: string): ModelOption {
  return MODEL_OPTIONS.find((m) => m.id === id) ?? MODEL_OPTIONS[0];
}
