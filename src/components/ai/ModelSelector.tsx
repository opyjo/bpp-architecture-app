"use client";

import { MODEL_OPTIONS } from "@/lib/ai/models";
import type { ModelProvider } from "@/lib/types/chat";

const PROVIDER_COLORS: Record<ModelProvider, string> = {
  anthropic: "text-arch-coral",
  google: "text-arch-blue",
  moonshot: "text-arch-amber",
  xai: "text-arch-green",
};

const PROVIDER_LABELS: Record<ModelProvider, string> = {
  anthropic: "Anthropic",
  google: "Google",
  moonshot: "Kimi (MoonShot AI)",
  xai: "xAI (Grok)",
};

export default function ModelSelector({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="bg-arch-bg3 border border-arch-border rounded-md px-2 py-1 text-[11px] text-arch-text font-mono focus:outline-none focus:border-arch-blue/50 transition-colors disabled:opacity-50 cursor-pointer appearance-none pr-5"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%235c6278'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 6px center",
      }}
    >
      {(["anthropic", "google", "moonshot", "xai"] as ModelProvider[]).map(
        (provider) => (
          <optgroup key={provider} label={PROVIDER_LABELS[provider]}>
            {MODEL_OPTIONS.filter((m) => m.provider === provider).map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </optgroup>
        )
      )}
    </select>
  );
}
