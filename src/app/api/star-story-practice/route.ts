import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

const STORY_KEYS = new Set([
  "catalog-management",
  "contingency-management",
  "aeroplan-integration",
  "flow-runner",
]);
const CONFIDENCE_LEVELS = new Set(["Weak", "Developing", "Ready"]);
const MAX_MODEL_BYTES = 80_000;

function isShortString(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function isValidModel(value: unknown, storyKey: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const model = value as Record<string, unknown>;
  if (model.storyKey !== storyKey) return false;
  if (!isShortString(model.storyTitle, 200) || !isShortString(model.memoryCode, 500) || !isShortString(model.useFor, 1_000)) return false;
  if (!isShortString(model.answer30, 5_000) || !isShortString(model.answer90, 12_000)) return false;

  if (!Array.isArray(model.nodes) || model.nodes.length !== 8) return false;
  const nodesAreValid = model.nodes.every((node) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return false;
    const item = node as Record<string, unknown>;
    return isShortString(item.id, 40)
      && isShortString(item.label, 80)
      && isShortString(item.prompt, 200)
      && isShortString(item.detail, 4_000);
  });
  if (!nodesAreValid) return false;

  if (!Array.isArray(model.followUps) || model.followUps.length < 1 || model.followUps.length > 10) return false;
  return model.followUps.every((followUp) => {
    if (!followUp || typeof followUp !== "object" || Array.isArray(followUp)) return false;
    const item = followUp as Record<string, unknown>;
    return isShortString(item.question, 500) && isShortString(item.route, 1_000);
  });
}

export async function GET() {
  const { data, error } = await supabaseServer()
    .from("star_story_practice")
    .select("story_key,model,confidence,practice_count,last_practiced_at,updated_at")
    .order("story_key", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data ?? []);
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const storyKey = typeof body?.storyKey === "string" ? body.storyKey.trim() : "";
  const confidence = typeof body?.confidence === "string" ? body.confidence : "Developing";
  const incrementPractice = body?.incrementPractice === true;
  const model = body?.model;

  if (!STORY_KEYS.has(storyKey)) {
    return Response.json({ error: "Invalid story key" }, { status: 400 });
  }
  if (!CONFIDENCE_LEVELS.has(confidence)) {
    return Response.json({ error: "Invalid confidence level" }, { status: 400 });
  }
  if (!isValidModel(model, storyKey)) {
    return Response.json({ error: "Invalid mental model" }, { status: 400 });
  }
  if (JSON.stringify(model).length > MAX_MODEL_BYTES) {
    return Response.json({ error: "Mental model is too large" }, { status: 400 });
  }

  const client = supabaseServer();
  const { data: existing, error: readError } = await client
    .from("star_story_practice")
    .select("practice_count,last_practiced_at")
    .eq("story_key", storyKey)
    .maybeSingle();

  if (readError) return Response.json({ error: readError.message }, { status: 500 });

  const practiceCount = (existing?.practice_count ?? 0) + (incrementPractice ? 1 : 0);
  const lastPracticedAt = incrementPractice
    ? new Date().toISOString()
    : existing?.last_practiced_at ?? null;

  const { data, error } = await client
    .from("star_story_practice")
    .upsert(
      {
        story_key: storyKey,
        model,
        confidence,
        practice_count: practiceCount,
        last_practiced_at: lastPracticedAt,
      },
      { onConflict: "story_key" }
    )
    .select("story_key,model,confidence,practice_count,last_practiced_at,updated_at")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
