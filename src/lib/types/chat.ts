export interface ToolCallInfo {
  toolName: string;
  input: Record<string, unknown>;
  output: string;
  durationMs: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  toolCalls?: ToolCallInfo[];
}

export type ModelProvider = "anthropic" | "google" | "moonshot" | "xai";

export interface ModelOption {
  id: string;
  label: string;
  provider: ModelProvider;
  modelId: string;
}

export interface ChatRequest {
  messages: { role: "user" | "assistant"; content: string }[];
  modelId?: string;
}

// NDJSON stream events
export type StreamEvent =
  | { type: "text_delta"; text: string }
  | { type: "tool_use_start"; toolName: string; input: Record<string, unknown> }
  | { type: "tool_use_end"; toolName: string; output: string; durationMs: number }
  | { type: "done" }
  | { type: "error"; message: string };
