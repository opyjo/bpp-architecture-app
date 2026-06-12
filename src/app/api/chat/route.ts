import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { toolDefinitions, executeTool, type ToolName } from "@/lib/ai/tools";
import { getModel } from "@/lib/ai/models";
import type { ModelProvider } from "@/lib/types/chat";

export const runtime = "nodejs";
export const maxDuration = 120;

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

/** Truncate tool output to keep context manageable */
function truncateToolOutput(output: string, maxChars = 4000): string {
  if (output.length <= maxChars) return output;
  return (
    output.slice(0, maxChars) +
    `\n\n... [truncated — ${output.length - maxChars} more characters]`
  );
}

const OPENAI_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] =
  toolDefinitions.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }));

// ---------- Anthropic streaming with tool loop ----------

async function streamAnthropic(
  apiKey: string,
  modelId: string,
  incomingMessages: { role: "user" | "assistant"; content: string }[],
  controller: ReadableStreamDefaultController
) {
  const client = new Anthropic({ apiKey });

  type MsgParam = {
    role: "user" | "assistant";
    content: string | Anthropic.ContentBlock[];
  };

  const messages: MsgParam[] = incomingMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const tools: Anthropic.Tool[] = toolDefinitions.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as unknown as Anthropic.Tool.InputSchema,
  }));

  let iterations = 0;
  let totalToolCalls = 0;
  const MAX_ITERATIONS = 8;
  const MAX_TOOL_CALLS = 12;
  const loopStartTime = Date.now();
  const TIMEOUT_MS = 100_000; // 100s, leaving 20s buffer for final synthesis
  let needsForcedSynthesis = false;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    // Break if we're running out of time — leave room for final synthesis
    if (Date.now() - loopStartTime > TIMEOUT_MS) {
      console.warn(`[Anthropic] Tool loop timed out after ${iterations - 1} iterations (${totalToolCalls} tool calls)`);
      needsForcedSynthesis = true;
      break;
    }

    // Break if we've made too many total tool calls
    if (totalToolCalls >= MAX_TOOL_CALLS) {
      console.warn(`[Anthropic] Tool call limit reached: ${totalToolCalls} calls across ${iterations - 1} iterations`);
      needsForcedSynthesis = true;
      break;
    }

    const response = await client.messages.create({
      model: modelId,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages,
      tools,
      stream: true,
    });

    const contentBlocks: Anthropic.ContentBlock[] = [];
    // Cache tool results so we execute each tool only once
    const toolResultsCache: Map<number, string> = new Map();
    let currentToolId = "";
    let currentToolName = "";
    let currentToolInput = "";
    let currentBlockText = "";
    let stopReason: string | null = null;

    for await (const event of response) {
      switch (event.type) {
        case "content_block_start": {
          const block = event.content_block;
          if (block.type === "tool_use") {
            currentToolId = block.id;
            currentToolName = block.name;
            currentToolInput = "";
          } else if (block.type === "text") {
            currentBlockText = "";
          }
          break;
        }
        case "content_block_delta": {
          const delta = event.delta;
          if (delta.type === "text_delta") {
            currentBlockText += delta.text;
            sendEvent(controller, { type: "text_delta", text: delta.text });
          } else if (delta.type === "input_json_delta") {
            currentToolInput += delta.partial_json;
          }
          break;
        }
        case "message_delta": {
          if ("delta" in event && event.delta) {
            const d = event.delta as { stop_reason?: string };
            if (d.stop_reason) stopReason = d.stop_reason;
          }
          break;
        }
        case "content_block_stop": {
          if (currentToolName) {
            let parsedInput: Record<string, unknown> = {};
            try {
              parsedInput = JSON.parse(currentToolInput || "{}");
            } catch (e) {
              console.warn(
                `[Anthropic] Failed to parse tool input for "${currentToolName}":`,
                e instanceof Error ? e.message : e,
                `| raw input: ${currentToolInput.slice(0, 200)}`
              );
            }

            const blockIndex = contentBlocks.length;
            contentBlocks.push({
              type: "tool_use",
              id: currentToolId,
              name: currentToolName,
              input: parsedInput,
            } as Anthropic.ContentBlock);

            sendEvent(controller, {
              type: "tool_use_start",
              toolName: currentToolName,
              input: parsedInput,
            });

            // Execute tool ONCE and cache the result
            const startTime = Date.now();
            const output = executeTool(currentToolName as ToolName, parsedInput);
            const durationMs = Date.now() - startTime;
            toolResultsCache.set(blockIndex, output);
            totalToolCalls++;

            sendEvent(controller, {
              type: "tool_use_end",
              toolName: currentToolName,
              output:
                output.length > 200
                  ? output.slice(0, 200) + "..."
                  : output,
              durationMs,
            });

            currentToolId = "";
            currentToolName = "";
            currentToolInput = "";
          } else {
            // Text block ended
            if (currentBlockText) {
              contentBlocks.push({
                type: "text",
                text: currentBlockText,
              } as Anthropic.ContentBlock);
            }
            currentBlockText = "";
          }
          break;
        }
      }
    }

    const toolUseBlocks: { block: Anthropic.ToolUseBlock; index: number }[] = [];
    contentBlocks.forEach((b, i) => {
      if (b.type === "tool_use") {
        toolUseBlocks.push({ block: b as Anthropic.ToolUseBlock, index: i });
      }
    });

    if (toolUseBlocks.length === 0) break;

    // If the API explicitly signaled end_turn or max_tokens, stop looping
    if (stopReason && stopReason !== "tool_use") break;

    // Build assistant message with all content blocks
    messages.push({ role: "assistant", content: contentBlocks });

    // Use cached tool results (truncated to keep context manageable)
    const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map(
      ({ block, index }) => {
        const cachedOutput = toolResultsCache.get(index) ?? "";
        return {
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: truncateToolOutput(cachedOutput),
        };
      }
    );

    messages.push({
      role: "user",
      content: toolResults as unknown as Anthropic.ContentBlock[],
    });

    // If we're approaching the tool call limit, flag for forced synthesis
    if (totalToolCalls >= MAX_TOOL_CALLS) {
      needsForcedSynthesis = true;
      break;
    }
  }

  // Force a final text-only synthesis if we hit any limit
  // (max iterations, max tool calls, or timeout)
  if (needsForcedSynthesis || iterations >= MAX_ITERATIONS) {
    const finalResponse = await client.messages.create({
      model: modelId,
      max_tokens: 8192,
      system:
        SYSTEM_PROMPT +
        "\n\nIMPORTANT: You have already gathered information using tools. Now you MUST synthesize everything you have learned into a clear, comprehensive response. Do NOT request any more tools. Provide your answer directly based on the file contents you have already read.",
      messages,
      tools: [],          // no tools available — forces text response
      stream: true,
    });

    for await (const event of finalResponse) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        sendEvent(controller, { type: "text_delta", text: event.delta.text });
      }
    }
  }
}

// ---------- OpenAI-compatible streaming with tool loop (Google / MoonShot / xAI) ----------

async function streamOpenAICompatible(
  apiKey: string,
  modelId: string,
  provider: ModelProvider,
  incomingMessages: { role: "user" | "assistant"; content: string }[],
  controller: ReadableStreamDefaultController
) {
  const baseURLs: Record<string, string> = {
    google: "https://generativelanguage.googleapis.com/v1beta/openai/",
    moonshot: "https://api.moonshot.ai/v1",
    xai: "https://api.x.ai/v1",
  };
  const baseURL = baseURLs[provider];

  const client = new OpenAI({ apiKey, baseURL });

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...incomingMessages.map(
      (m) =>
        ({
          role: m.role,
          content: m.content,
        }) as OpenAI.Chat.Completions.ChatCompletionMessageParam
    ),
  ];

  let iterations = 0;
  let totalToolCalls = 0;
  const MAX_ITERATIONS = 8;
  const MAX_TOOL_CALLS = 12;
  const loopStartTime = Date.now();
  const TIMEOUT_MS = 100_000; // 100s, leaving 20s buffer for final synthesis
  let needsForcedSynthesis = false;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    // Break if we're running out of time
    if (Date.now() - loopStartTime > TIMEOUT_MS) {
      console.warn(`[OpenAI] Tool loop timed out after ${iterations - 1} iterations (${totalToolCalls} tool calls)`);
      needsForcedSynthesis = true;
      break;
    }

    // Break if we've made too many total tool calls
    if (totalToolCalls >= MAX_TOOL_CALLS) {
      console.warn(`[OpenAI] Tool call limit reached: ${totalToolCalls} calls across ${iterations - 1} iterations`);
      needsForcedSynthesis = true;
      break;
    }

    const stream = await client.chat.completions.create({
      model: modelId,
      max_tokens: 8192,
      messages,
      tools: OPENAI_TOOLS,
      stream: true,
    });

    let assistantText = "";
    let finishReason: string | null = null;
    const toolCalls: Map<
      number,
      { id: string; name: string; arguments: string }
    > = new Map();

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;
      if (choice.finish_reason) finishReason = choice.finish_reason;
      const delta = choice.delta;
      if (!delta) continue;

      if (delta.content) {
        assistantText += delta.content;
        sendEvent(controller, { type: "text_delta", text: delta.content });
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index;
          if (!toolCalls.has(idx)) {
            toolCalls.set(idx, {
              id: tc.id ?? `tc_${iterations}_${idx}`,
              name: tc.function?.name ?? "",
              arguments: "",
            });
          }
          const existing = toolCalls.get(idx)!;
          if (tc.id) existing.id = tc.id;
          if (tc.function?.name) existing.name = tc.function.name;
          if (tc.function?.arguments)
            existing.arguments += tc.function.arguments;
        }
      }
    }

    if (toolCalls.size === 0) break;

    // If the API signaled stop (not tool_calls), stop looping
    if (finishReason && finishReason !== "tool_calls") break;

    const assistantMsg: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
      role: "assistant",
      content: assistantText || null,
      tool_calls: Array.from(toolCalls.values()).map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: { name: tc.name, arguments: tc.arguments },
      })),
    };
    messages.push(assistantMsg);

    for (const tc of toolCalls.values()) {
      let parsedInput: Record<string, unknown> = {};
      try {
        parsedInput = JSON.parse(tc.arguments || "{}");
      } catch (e) {
        console.warn(
          `[OpenAI] Failed to parse tool input for "${tc.name}":`,
          e instanceof Error ? e.message : e,
          `| raw input: ${tc.arguments.slice(0, 200)}`
        );
      }

      sendEvent(controller, {
        type: "tool_use_start",
        toolName: tc.name,
        input: parsedInput,
      });

      const startTime = Date.now();
      const output = executeTool(tc.name as ToolName, parsedInput);
      const durationMs = Date.now() - startTime;
      totalToolCalls++;

      sendEvent(controller, {
        type: "tool_use_end",
        toolName: tc.name,
        output: output.length > 200 ? output.slice(0, 200) + "..." : output,
        durationMs,
      });

      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: truncateToolOutput(output),
      });
    }

    // If we hit the tool call limit, flag for forced synthesis
    if (totalToolCalls >= MAX_TOOL_CALLS) {
      needsForcedSynthesis = true;
      break;
    }
  }

  // Force a final text-only synthesis if we hit any limit
  if (needsForcedSynthesis || iterations >= MAX_ITERATIONS) {
    // Replace system message with one that forces synthesis
    messages[0] = {
      role: "system",
      content:
        SYSTEM_PROMPT +
        "\n\nIMPORTANT: You have already gathered information using tools. Now you MUST synthesize everything you have learned into a clear, comprehensive response. Do NOT request any more tools. Provide your answer directly based on the file contents you have already read.",
    };

    const finalStream = await client.chat.completions.create({
      model: modelId,
      max_tokens: 8192,
      messages,
      stream: true,
      // No tools — forces text response
    });

    for await (const chunk of finalStream) {
      const choice = chunk.choices[0];
      if (choice?.delta?.content) {
        sendEvent(controller, {
          type: "text_delta",
          text: choice.delta.content,
        });
      }
    }
  }
}

// ---------- Main handler ----------

export async function POST(request: Request) {
  const body = await request.json();
  const incomingMessages: { role: "user" | "assistant"; content: string }[] =
    body.messages ?? [];
  const selectedModelId: string = body.modelId ?? "claude-sonnet-4.6";

  if (!incomingMessages.length) {
    return Response.json({ error: "No messages provided" }, { status: 400 });
  }

  const model = getModel(selectedModelId);
  const apiKey = getApiKey(model.provider);

  if (!apiKey || apiKey.startsWith("your-")) {
    const envVars: Record<string, string> = {
      anthropic: "ANTHROPIC_API_KEY",
      google: "GOOGLE_AI_API_KEY",
      moonshot: "MOONSHOT_API_KEY",
      xai: "XAI_API_KEY",
    };
    const envVar = envVars[model.provider];
    return Response.json(
      { error: `${envVar} is not configured. Add it to .env.local` },
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
            incomingMessages,
            controller
          );
        } else {
          await streamOpenAICompatible(
            apiKey,
            model.modelId,
            model.provider,
            incomingMessages,
            controller
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
