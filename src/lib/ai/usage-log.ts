import { MODEL_OPTIONS } from "@/lib/ai/models";

const STORAGE_KEY = "ai-usage-log";
const MAX_ENTRIES = 2000;

export interface UsageEntry {
  id: string;
  ts: number;
  feature: string;
  modelId: string;
  provider: string;
  promptChars: number;
  completionChars: number;
  tokensEst: number;
}

/**
 * Record one AI call into the local usage log (localStorage ring buffer).
 * SSR-safe: no-ops when there is no window. Caps the buffer at 2000 entries.
 */
export function logAiUsage(e: {
  feature: string;
  modelId: string;
  provider: string;
  promptChars: number;
  completionChars: number;
  tokensEst?: number;
}): void {
  if (typeof window === "undefined") return;

  const entry: UsageEntry = {
    id: crypto.randomUUID(),
    ts: Date.now(),
    feature: e.feature,
    modelId: e.modelId,
    provider: e.provider,
    promptChars: e.promptChars,
    completionChars: e.completionChars,
    tokensEst:
      e.tokensEst ?? Math.ceil((e.promptChars + e.completionChars) / 4),
  };

  try {
    const log = getUsage();
    log.push(entry);
    // Keep only the most recent MAX_ENTRIES (ring buffer).
    const trimmed =
      log.length > MAX_ENTRIES ? log.slice(log.length - MAX_ENTRIES) : log;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // storage full / unavailable — silently drop
  }
}

/** Read the full usage log (oldest → newest). Returns [] on SSR or parse error. */
export function getUsage(): UsageEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UsageEntry[]) : [];
  } catch {
    return [];
  }
}

/** Wipe the usage log. */
export function clearUsage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export interface ModelPricing {
  inPer1M: number;
  outPer1M: number;
}

/**
 * Approximate / ballpark public USD pricing per 1M tokens (input / output).
 * These are NOT authoritative — vendor list prices drift over time and may
 * differ by tier, region, or batch/cache discounts. Used only for rough
 * cost estimates in the local usage dashboard.
 */
export const PRICING: Record<string, ModelPricing> = {
  // Anthropic (Claude)
  "claude-opus-4-8": { inPer1M: 15, outPer1M: 75 },
  "claude-sonnet-4-6": { inPer1M: 3, outPer1M: 15 },
  "claude-haiku-4-5-20251001": { inPer1M: 1, outPer1M: 5 },
  // Google (Gemini)
  "gemini-2.5-pro": { inPer1M: 1.25, outPer1M: 10 },
  "gemini-2.5-flash": { inPer1M: 0.3, outPer1M: 2.5 },
  "gemini-2.0-flash": { inPer1M: 0.1, outPer1M: 0.4 },
  // MoonShot (Kimi K2 series)
  "kimi-k2.7-code": { inPer1M: 0.6, outPer1M: 2.5 },
  "kimi-k2.6": { inPer1M: 0.6, outPer1M: 2.5 },
  "kimi-k2.5": { inPer1M: 0.6, outPer1M: 2.5 },
  // xAI (Grok)
  "grok-4.3": { inPer1M: 3, outPer1M: 15 },
  "grok-4.20-0309-reasoning": { inPer1M: 3, outPer1M: 15 },
  "grok-build-0.1": { inPer1M: 0.2, outPer1M: 1.5 },
};

/** Sane fallback when a modelId has no pricing entry (mid-range estimate). */
const FALLBACK_PRICING: ModelPricing = { inPer1M: 3, outPer1M: 15 };

/**
 * Estimate the USD cost of a single usage entry. tokensEst is split into
 * prompt vs. completion tokens by the character ratio, then priced.
 */
export function estimateCost(e: UsageEntry): number {
  const pricing = PRICING[e.modelId] ?? FALLBACK_PRICING;
  const totalChars = e.promptChars + e.completionChars;
  const promptRatio = totalChars > 0 ? e.promptChars / totalChars : 0.5;

  const promptTokens = e.tokensEst * promptRatio;
  const completionTokens = e.tokensEst * (1 - promptRatio);

  const cost =
    (promptTokens / 1_000_000) * pricing.inPer1M +
    (completionTokens / 1_000_000) * pricing.outPer1M;

  return cost;
}

/** Friendly label for a modelId (falls back to the raw id). */
export function modelLabel(modelId: string): string {
  return MODEL_OPTIONS.find((m) => m.modelId === modelId)?.label ?? modelId;
}
