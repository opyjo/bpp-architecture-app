import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

// This route is protected by the shared-password proxy (it lives under /api/*),
// so only authenticated sessions reach it. The service-role client below bypasses
// RLS, which is why direct browser access to Supabase is no longer needed — and
// the database's `anon_all` policy is dropped (see supabase/schema.sql).

// Hard allowlist: the client may only touch these tables. Without this, the route
// would be a generic proxy to the whole database.
const TABLES = new Set([
  "test_plans",
  "specs",
  "sequence_diagrams",
  "analyses",
  "chats",
  "teleprompter_cards",
]);

// Order column must be a plain identifier (defense against odd input).
const SAFE_COLUMN = /^[a-z_][a-z0-9_]*$/;

function badTable() {
  return Response.json({ error: "Unknown table" }, { status: 404 });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;
  if (!TABLES.has(table)) return badTable();

  const sb = supabaseServer();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // Single item by id.
  if (id) {
    const { data, error } = await sb.from(table).select("*").eq("id", id).single();
    if (error) {
      // PostgREST returns an error for "no rows" on .single(); treat as not found.
      return Response.json({ error: error.message }, { status: 404 });
    }
    return Response.json(data);
  }

  // List, ordered (default: most-recently-updated first).
  const orderCol = searchParams.get("order") || "updated_at";
  if (!SAFE_COLUMN.test(orderCol)) {
    return Response.json({ error: "Invalid order column" }, { status: 400 });
  }
  const ascending = searchParams.get("dir") === "asc";

  let query = sb.from(table).select("*").order(orderCol, { ascending });

  const limit = Number(searchParams.get("limit"));
  if (Number.isFinite(limit) && limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data ?? []);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;
  if (!TABLES.has(table)) return badTable();

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data, error } = await supabaseServer()
    .from(table)
    .insert(payload)
    .select("id")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ id: data.id });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;
  if (!TABLES.has(table)) return badTable();

  const body = await request.json().catch(() => null);
  const id = body?.id;
  const updates = body?.updates;
  if (typeof id !== "string" || !updates || typeof updates !== "object") {
    return Response.json({ error: "Expected { id, updates }" }, { status: 400 });
  }

  const { error } = await supabaseServer().from(table).update(updates).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;
  if (!TABLES.has(table)) return badTable();

  const sb = supabaseServer();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const all = searchParams.get("all") === "true";

  if (id) {
    const { error } = await sb.from(table).delete().eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  if (all) {
    // Delete every row (used by the teleprompter "reset" flow). `not id is null`
    // matches all rows — PostgREST requires a filter on delete.
    const { error } = await sb.from(table).delete().not("id", "is", null);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Provide ?id= or ?all=true" }, { status: 400 });
}
