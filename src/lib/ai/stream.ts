import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { getModel } from "@/lib/ai/models";
import type { ModelProvider } from "@/lib/types/chat";

function sendEvent(
  controller: ReadableStreamDefaultController,
  event: Record<string, unknown>
) {
  controller.enqueue(
    new TextEncoder().encode(JSON.stringify(event) + "\n")
  );
}

function getApiKey(provider: ModelProvider): string | undefined {
  switch (provider) {
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY;
    case "google":
      return process.env.GOOGLE_AI_API_KEY;
    case "moonshot":
      return process.env.MOONSHOT_API_KEY;
    case "xai":
      return process.env.XAI_API_KEY;
  }
}

const BASE_URLS: Record<string, string> = {
  google: "https://generativelanguage.googleapis.com/v1beta/openai/",
  moonshot: "https://api.moonshot.ai/v1",
  xai: "https://api.x.ai/v1",
};

async function streamAnthropic(
  apiKey: string,
  modelId: string,
  systemPrompt: string,
  userContent: string,
  controller: ReadableStreamDefaultController,
  maxTokens: number
) {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: modelId,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
    stream: true,
  });

  for await (const event of response) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      sendEvent(controller, { type: "text_delta", text: event.delta.text });
    }
  }
}

async function streamOpenAICompatible(
  apiKey: string,
  modelId: string,
  provider: ModelProvider,
  systemPrompt: string,
  userContent: string,
  controller: ReadableStreamDefaultController,
  maxTokens: number
) {
  const client = new OpenAI({ apiKey, baseURL: BASE_URLS[provider] });
  const stream = await client.chat.completions.create({
    model: modelId,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      sendEvent(controller, { type: "text_delta", text: content });
    }
  }
}

/**
 * Creates a streaming Response for a simple (no tool-use) AI generation.
 * Handles provider routing, API key validation, and error handling.
 */
export function createStreamingResponse(opts: {
  modelId: string;
  systemPrompt: string;
  userContent: string;
  maxTokens?: number;
}): Response {
  const { modelId, systemPrompt, userContent, maxTokens = 8192 } = opts;

  const model = getModel(modelId);
  const apiKey = getApiKey(model.provider);

  if (!apiKey || apiKey.startsWith("your-")) {
    const envVars: Record<string, string> = {
      anthropic: "ANTHROPIC_API_KEY",
      google: "GOOGLE_AI_API_KEY",
      moonshot: "MOONSHOT_API_KEY",
      xai: "XAI_API_KEY",
    };
    return Response.json(
      { error: `${envVars[model.provider]} is not configured. Add it to .env.local` },
      { status: 500 }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (model.provider === "anthropic") {
          await streamAnthropic(
            apiKey,
            model.modelId,
            systemPrompt,
            userContent,
            controller,
            maxTokens
          );
        } else {
          await streamOpenAICompatible(
            apiKey,
            model.modelId,
            model.provider,
            systemPrompt,
            userContent,
            controller,
            maxTokens
          );
        }
        sendEvent(controller, { type: "done" });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error occurred";
        sendEvent(controller, { type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
