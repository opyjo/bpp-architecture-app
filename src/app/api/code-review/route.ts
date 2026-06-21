import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 120;

const SYSTEM_PROMPT = `You are a senior Go/TypeScript code reviewer for a subscription management platform. Your reviews are thorough, actionable, and specific.

## Platform Context
- Go microservices using gorilla/mux, chi, or net/http routers
- PostgreSQL, DynamoDB, Redis, ElastiCache for storage
- Kafka for async event-driven communication
- AppSync/GraphQL BFF layer
- AWS Lambda, ECS for compute
- Strong emphasis on error handling, retry patterns, and idempotency

## Review Guidelines
- Focus on correctness, maintainability, and platform conventions
- Reference Go best practices: proper error wrapping (fmt.Errorf with %w), defer for cleanup, context propagation
- Check for resource leaks (unclosed connections, missing defer), goroutine leaks, race conditions
- Validate error handling: no swallowed errors, proper status codes, structured logging
- Check for security issues: SQL injection, unvalidated input, hardcoded secrets
- Assess performance: N+1 queries, missing indexes hints, unnecessary allocations
- For TypeScript: check type safety, proper async/await, error boundaries

## Output Format
Structure your review as markdown with these sections:

### Summary
1-2 sentence overview of the code quality and purpose.

### Critical Issues
Issues that MUST be fixed (bugs, security vulnerabilities, data loss risks).
Format: - **[Line X]** Description of the issue and how to fix it

### Warnings
Issues that SHOULD be fixed (performance, maintainability, potential edge cases).
Format: - **[Line X]** Description and suggestion

### Suggestions
Nice-to-have improvements (style, readability, best practices).
Format: - **[Line X]** Description and suggestion

### Architecture Notes
Any observations about how this code fits (or doesn't fit) the platform architecture.

If a section has no items, omit it entirely. Be specific with line references when possible.`;

function sendEvent(
  controller: ReadableStreamDefaultController,
  event: Record<string, unknown>
) {
  controller.enqueue(
    new TextEncoder().encode(JSON.stringify(event) + "\n")
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const code: string = body.code ?? "";
  const focus: string[] = body.focus ?? [];
  const language: string = body.language ?? "go";
  const modelId: string = body.modelId ?? "";

  if (!code.trim()) {
    return Response.json({ error: "No code provided" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith("your-")) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured. Add it to .env.local" },
      { status: 500 }
    );
  }

  const focusText =
    focus.length > 0
      ? `\n\nFocus areas for this review: ${focus.join(", ")}. Pay extra attention to these aspects.`
      : "";

  const userContent = `Review the following ${language} code.${focusText}\n\n\`\`\`${language}\n${code}\n\`\`\``;

  const { getModel } = await import("@/lib/ai/models");
  const selectedModel = modelId ? getModel(modelId) : null;
  const client = new Anthropic({ apiKey });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.create({
          model: selectedModel?.modelId || "claude-sonnet-4-6",
          max_tokens: 8192,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userContent }],
          stream: true,
        });

        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            sendEvent(controller, {
              type: "text_delta",
              text: event.delta.text,
            });
          }
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
