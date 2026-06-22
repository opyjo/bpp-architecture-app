# Auth & Row Level Security

This app currently runs **single-tenant**: it ships with only the Supabase
**anon** key and no end-user sign-in, so every saved artifact is readable and
writable by anyone holding the anon key. That's fine for a personal/internal
tool, but `supabase/schema.sql` still **enables RLS on every table** so the
project is one policy swap away from being multi-user safe.

## Current state (default)

- RLS is **ON** for all tables (`reviews`, `test_plans`, `specs`,
  `sequence_diagrams`, `analyses`, `chats`, `runbooks`, `teleprompter_cards`,
  `adrs`).
- Each table has a single permissive policy `anon_all` that allows `select /
  insert / update / delete` for the `anon` and `authenticated` roles.
- No data is exposed beyond what the anon key already implies — RLS being on
  means that the moment you tighten a policy, access is denied by default.

## Hardening to per-user data (when you add login)

1. **Turn on a Supabase Auth provider** (email magic link, Google, etc.) in the
   Supabase dashboard.

2. **Add an `owner` column** to each table and backfill it:

   ```sql
   alter table public.adrs add column owner uuid default auth.uid();
   -- (repeat for each table)
   ```

3. **Replace the permissive policy** with an owner-scoped one:

   ```sql
   drop policy "anon_all" on public.adrs;

   create policy "owner_rw" on public.adrs
     for all to authenticated
     using (owner = auth.uid())
     with check (owner = auth.uid());
   ```

4. **Gate the UI.** Wrap the app (or just the persistence-backed tabs) in a
   Supabase session check and call `supabase.auth.signInWithOtp(...)` /
   `signInWithOAuth(...)`. `src/lib/supabase.ts` already exports a configured
   client; add an `onAuthStateChange` listener and render a sign-in screen when
   there is no session.

5. **Stop using the anon key for writes from untrusted clients.** With auth on,
   the JWT from the signed-in session is sent automatically by `supabase-js`, so
   `auth.uid()` resolves inside the policies above.

## Why RLS-on-by-default matters

Even before you add auth, enabling RLS protects you from accidentally exposing a
table through a future policy or a PostgREST misconfiguration: with RLS on and no
matching policy, the default answer is **deny**. The `anon_all` policy is an
explicit, auditable opt-in rather than an implicit "RLS is off" hole.
