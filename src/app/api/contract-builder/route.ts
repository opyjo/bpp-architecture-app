import { createStreamingResponse } from "@/lib/ai/stream";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";

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

export async function POST(request: Request) {
  let body: { goCode?: string; additionalFiles?: string[]; fileName?: string; modelId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const goCode: string = body.goCode ?? "";
  const additionalFiles: string[] = body.additionalFiles ?? [];
  const fileName: string = body.fileName ?? "handler.go";
  const modelId: string = body.modelId || DEFAULT_MODEL_ID;

  if (!goCode.trim()) {
    return Response.json({ error: "No Go code provided" }, { status: 400 });
  }

  let userContent = `Generate a complete OpenAPI 3.0 YAML specification for the following Go code.\n\nFile: ${fileName}\n\`\`\`go\n${goCode}\n\`\`\``;

  if (additionalFiles.length > 0) {
    userContent += "\n\nAdditional context files:";
    additionalFiles.forEach((file, i) => {
      userContent += `\n\nAdditional file ${i + 1}:\n\`\`\`go\n${file}\n\`\`\``;
    });
  }

  return createStreamingResponse({
    modelId,
    systemPrompt: SYSTEM_PROMPT,
    userContent,
    maxTokens: 16384,
    signal: request.signal,
  });
}
