import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { getModel, DEFAULT_MODEL_ID } from "@/lib/ai/models";
import type { ModelProvider } from "@/lib/types/chat";

export const runtime = "nodejs";
export const maxDuration = 60;

const BASE_URLS: Record<string, string> = {
  google: "https://generativelanguage.googleapis.com/v1beta/openai/",
  moonshot: "https://api.moonshot.ai/v1",
  xai: "https://api.x.ai/v1",
};

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

const PLATFORM = `Subscription-management platform: Go microservices (gorilla/mux, chi, net/http), PostgreSQL/DynamoDB/Redis, Kafka events, AppSync/GraphQL BFF, AWS Lambda/ECS.`;

const SYSTEM = `You are an expert Event Storming facilitator using Alberto Brandolini's color grammar.
${PLATFORM}

Sticky kinds you may emit: "command", "event", "aggregate", "policy", "readmodel", "external", "actor", "hotspot".
- event: something that happened, PAST tense (e.g. "OrderActivated")
- command: the imperative intent that causes an event (e.g. "ActivateOrder")
- aggregate: the noun the command acts on (e.g. "Order", "Subscription")
- policy: a reaction — "whenever <event> then <command>"
- readmodel: a projection/view used to decide
- external: an outside system or actor
- hotspot: a risk, inconsistency, or open question

You MUST respond with STRICT JSON only — no prose, no markdown fences. Schema:
{
  "stickies": [ { "kind": "<kind>", "text": "<short label>", "ref": "<optional note>" } ],
  "connections": [ { "from": "<sticky text>", "to": "<sticky text>" } ]
}
"from"/"to" reference sticky text (existing or newly suggested). Keep labels short (1-4 words). Do not repeat stickies that already exist.`;

const ACTIONS: Record<string, string> = {
  infer:
    "For each existing EVENT, infer the COMMAND that produces it and the AGGREGATE it belongs to. Add those command and aggregate stickies, and connections command→event and aggregate→event.",
  policies:
    "Find missing POLICIES: where one event should trigger a downstream command (e.g. OrderActivated → SendConfirmation). Add policy stickies plus the command they trigger, with connections event→policy and policy→command.",
  hotspots:
    "Critically review the board for gaps, inconsistencies, missing error/compensation flows, or risky coupling. Add HOTSPOT stickies describing each concern.",
};

async function complete(
  modelId: string,
  system: string,
  user: string
): Promise<string> {
  const model = getModel(modelId);
  const apiKey = getApiKey(model.provider);
  if (!apiKey || apiKey.startsWith("your-")) {
    throw new Error(`API key for ${model.provider} is not configured in .env.local`);
  }

  if (model.provider === "anthropic") {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: model.modelId,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    });
    return res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
  }

  const client = new OpenAI({ apiKey, baseURL: BASE_URLS[model.provider] });
  const res = await client.chat.completions.create({
    model: model.modelId,
    max_tokens: 4096,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return res.choices[0]?.message?.content ?? "";
}

function parseJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  // Fall back to slicing the outermost braces if the model added stray text.
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Model did not return valid JSON");
  }
}

export async function POST(request: Request) {
  let body: {
    action?: string;
    stickies?: { kind: string; text: string }[];
    modelId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const action = body.action ?? "infer";
  const instruction = ACTIONS[action];
  if (!instruction) {
    return Response.json({ error: "Unknown action" }, { status: 400 });
  }

  const modelId = body.modelId || DEFAULT_MODEL_ID;
  const current = (body.stickies ?? [])
    .map((s) => `- [${s.kind}] ${s.text}`)
    .join("\n");

  const user = `Current board stickies:\n${current || "(empty)"}\n\nTask: ${instruction}\n\nReturn STRICT JSON only.`;

  try {
    const raw = await complete(modelId, SYSTEM, user);
    const json = parseJson(raw) as {
      stickies?: unknown;
      connections?: unknown;
    };
    return Response.json({
      stickies: Array.isArray(json.stickies) ? json.stickies : [],
      connections: Array.isArray(json.connections) ? json.connections : [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
