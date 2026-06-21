import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 120;

const SYSTEM_PROMPT = `You are a senior QA engineer and test architect for a subscription management platform. You generate comprehensive, structured test plans from requirements.

## Platform Context
- Go microservices using gorilla/mux, chi, or net/http routers
- PostgreSQL, DynamoDB, Redis, ElastiCache for storage
- Kafka for async event-driven communication
- AppSync/GraphQL BFF layer
- AWS Lambda, ECS for compute
- React/Next.js microfrontends
- Strong emphasis on error handling, retry patterns, and idempotency

## Output Format
Structure your test plan as markdown with these sections:

### Test Summary
1-2 paragraph overview of what is being tested, the scope, and key risk areas.

### Test Scenarios
Group test cases by category. For each test case use this format:

#### [Category Name]

| ID | Title | Priority | Preconditions | Steps | Expected Result |
|----|-------|----------|---------------|-------|-----------------|
| TC-001 | ... | P1 | ... | 1. ... 2. ... | ... |

Priority levels:
- **P1** — Critical path, must pass for release
- **P2** — Important functionality, should pass
- **P3** — Edge cases and nice-to-haves

### Test Execution Matrix
A table covering:
| Aspect | Details |
|--------|---------|
| Environments | ... |
| Test Data Setup | ... |
| Dependencies | ... |
| Pre-requisites | ... |

### Edge Cases & Negative Tests
Bulleted list of boundary conditions, error scenarios, invalid inputs, timeout handling, and race conditions to verify.

### Automation Notes
Brief notes on which tests are good candidates for automation vs. manual testing.

Be thorough and specific. Reference platform patterns (Kafka consumers, Lambda handlers, API Gateway, DynamoDB streams) where relevant. Each test case should be actionable and unambiguous.`;

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
  const requirement: string = body.requirement ?? "";
  const testTypes: string[] = body.testTypes ?? [];
  const modelId: string = body.modelId ?? "";

  if (!requirement.trim()) {
    return Response.json({ error: "No requirement provided" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith("your-")) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured. Add it to .env.local" },
      { status: 500 }
    );
  }

  const testTypeText =
    testTypes.length > 0
      ? `\n\nFocus on the following test types: ${testTypes.join(", ")}. Emphasize these categories in your test plan.`
      : "";

  const userContent = `Generate a comprehensive test plan for the following requirement:${testTypeText}\n\n---\n\n${requirement}`;

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
