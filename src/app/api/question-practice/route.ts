import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

const QUESTION_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CONFIDENCE_LEVELS = new Set(["Weak", "Developing", "Ready"]);

export async function GET() {
  const { data, error } = await supabaseServer()
    .from("question_practice")
    .select("question_key,confidence,updated_at")
    .order("question_key", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data ?? []);
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const questionKey = typeof body?.questionKey === "string" ? body.questionKey.trim() : "";
  const confidence = typeof body?.confidence === "string" ? body.confidence : "";

  if (!QUESTION_KEY.test(questionKey) || questionKey.length > 80) {
    return Response.json({ error: "Invalid question key" }, { status: 400 });
  }
  if (!CONFIDENCE_LEVELS.has(confidence)) {
    return Response.json({ error: "Invalid confidence level" }, { status: 400 });
  }

  const { data, error } = await supabaseServer()
    .from("question_practice")
    .upsert(
      { question_key: questionKey, confidence },
      { onConflict: "question_key" }
    )
    .select("question_key,confidence,updated_at")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
