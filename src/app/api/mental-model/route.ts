import { createStreamingResponse } from "@/lib/ai/stream";

export const runtime = "nodejs";
export const maxDuration = 120;

// Default to a capable Claude model for generation quality (id from MODEL_OPTIONS).
const DEFAULT_MENTAL_MODEL_MODEL_ID = "claude-sonnet-4.6";

const SYSTEM_PROMPT = `You are an interview coach. You turn an interview talking-point card into a compact MENTAL MODEL the candidate can recall under pressure — NOT a script to read.

A mental model is a handful of named beats. Each beat is a short, punchy HOOK label plus a one-line "say" prompt the candidate improvises from (they speak the idea, they do not read the line). Optionally a one-sentence "spine": the whole point in a single breath, used as a fallback if they blank.

Choose whatever beat structure best fits THIS card's content. Do NOT force a fixed template — pick hooks that suit the material (e.g. for a technical card: WHAT, WHY, HOW, GOTCHA; for a pitch: WHO I AM, EDGE, PROOF). Keep it tight: 3–6 beats.

Output ONLY a single JSON object, no markdown fences, no commentary, in exactly this shape:
{"spine": string, "beats": [{"hook": string, "say": string, "crux": boolean}]}

Rules:
- "hook": 1–3 words, UPPERCASE, vivid and memorable.
- "say": one short line, the idea to improvise from (not a full paragraph).
- "crux": true on AT MOST one beat — the single most important one; false on the rest.
- "spine": one sentence, or "" (empty string) if a fallback line doesn't help this card.`;

export async function POST(request: Request) {
  let body: {
    title?: string;
    bulletsText?: string;
    fullText?: string;
    category?: string;
    modelId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  const bulletsText = (body.bulletsText ?? "").trim();
  const fullText = (body.fullText ?? "").trim();
  const category = (body.category ?? "").trim();
  const modelId = body.modelId || DEFAULT_MENTAL_MODEL_MODEL_ID;

  if (!title && !bulletsText && !fullText) {
    return Response.json({ error: "No card content provided" }, { status: 400 });
  }

  let userContent = `Create a mental model for this interview card.\n\nTitle: ${title || "(untitled)"}`;
  if (category) userContent += `\nCategory: ${category}`;
  if (bulletsText) userContent += `\n\nTalking points:\n${bulletsText}`;
  if (fullText) userContent += `\n\nFull notes:\n${fullText}`;
  userContent += `\n\nReturn ONLY the JSON object described in the instructions.`;

  return createStreamingResponse({
    modelId,
    systemPrompt: SYSTEM_PROMPT,
    userContent,
    maxTokens: 2048,
    signal: request.signal,
  });
}
