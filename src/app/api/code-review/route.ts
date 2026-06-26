import { createStreamingResponse } from "@/lib/ai/stream";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";

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

export async function POST(request: Request) {
  let body: { code?: string; focus?: string[]; language?: string; modelId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const code: string = body.code ?? "";
  const focus: string[] = body.focus ?? [];
  const language: string = body.language ?? "go";
  const modelId: string = body.modelId || DEFAULT_MODEL_ID;

  if (!code.trim()) {
    return Response.json({ error: "No code provided" }, { status: 400 });
  }

  const focusText =
    focus.length > 0
      ? `\n\nFocus areas for this review: ${focus.join(", ")}. Pay extra attention to these aspects.`
      : "";

  const userContent = `Review the following ${language} code.${focusText}\n\n\`\`\`${language}\n${code}\n\`\`\``;

  return createStreamingResponse({
    modelId,
    systemPrompt: SYSTEM_PROMPT,
    userContent,
    signal: request.signal,
  });
}
