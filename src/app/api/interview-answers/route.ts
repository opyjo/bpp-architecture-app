import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

const QUESTION_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_QUESTION_LENGTH = 300;
const MAX_ANSWER_LENGTH = 20_000;

export async function GET() {
  const { data, error } = await supabaseServer()
    .from("interview_answers")
    .select("id,question_key,question,answer,updated_at")
    .order("question_key", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data ?? []);
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const questionKey = typeof body?.questionKey === "string" ? body.questionKey.trim() : "";
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  const answer = typeof body?.answer === "string" ? body.answer.trim() : "";

  if (!QUESTION_KEY.test(questionKey) || questionKey.length > 80) {
    return Response.json({ error: "Invalid question key" }, { status: 400 });
  }
  if (!question || question.length > MAX_QUESTION_LENGTH) {
    return Response.json({ error: "Question must be between 1 and 300 characters" }, { status: 400 });
  }
  if (!answer || answer.length > MAX_ANSWER_LENGTH) {
    return Response.json({ error: "Answer must be between 1 and 20,000 characters" }, { status: 400 });
  }

  const { data, error } = await supabaseServer()
    .from("interview_answers")
    .upsert(
      { question_key: questionKey, question, answer },
      { onConflict: "question_key" }
    )
    .select("id,question_key,question,answer,updated_at")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
