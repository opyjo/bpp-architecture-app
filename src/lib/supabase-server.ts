import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client. Uses the SERVICE-ROLE key, which bypasses RLS, so
// it must NEVER be imported from a client component or exposed to the browser.
// All saved-items access goes through `/api/saved/[table]` (behind the password
// proxy); the database itself denies direct anon/authenticated access.
//
// Factory (not a module-level singleton) so a missing env var fails on first use
// at request time rather than crashing the build/prerender.
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase server env not configured: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
