import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 120;

const SYSTEM_PROMPT = `You are an expert Go developer and API specification writer. Your task is to analyze Go source code and generate a complete, valid OpenAPI 3.0 YAML specification.

Instructions:
- Output ONLY valid YAML. No markdown fences, no explanations, no commentary.
- Start the output with "openapi: '3.0.3'" on the first line.
- Extract all HTTP routes, methods, path parameters, query parameters, and request/response bodies.
- Detect router patterns (gorilla/mux, chi, gin, echo, net/http) and extract routes accordingly.
- Convert Go structs to OpenAPI schemas using $ref references under components/schemas.
- Map Go types: string→string, int/int64→integer, float64→number, bool→boolean, []T→array, time.Time→string(date-time).
- Detect authentication middleware (JWT, API keys, OAuth) and add security schemes.
- Include realistic example values in schemas.
- Use descriptive operation IDs based on handler function names.
- Group endpoints with tags based on the package or file they come from.
- If additional context files are provided (models, middleware, etc.), use them to enrich the spec.`;

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
  const goCode: string = body.goCode ?? "";
  const additionalFiles: string[] = body.additionalFiles ?? [];
  const fileName: string = body.fileName ?? "handler.go";

  if (!goCode.trim()) {
    return Response.json({ error: "No Go code provided" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith("your-")) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured. Add it to .env.local" },
      { status: 500 }
    );
  }

  let userContent = `Generate a complete OpenAPI 3.0 YAML specification for the following Go code.\n\nFile: ${fileName}\n\`\`\`go\n${goCode}\n\`\`\``;

  if (additionalFiles.length > 0) {
    userContent += "\n\nAdditional context files:";
    additionalFiles.forEach((file, i) => {
      userContent += `\n\nAdditional file ${i + 1}:\n\`\`\`go\n${file}\n\`\`\``;
    });
  }

  const client = new Anthropic({ apiKey });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 16384,
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
