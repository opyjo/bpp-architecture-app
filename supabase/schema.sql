-- ============================================================================
-- Subscription Manager — Architecture App · Supabase schema
-- ----------------------------------------------------------------------------
-- Idempotent bootstrap for a fresh Supabase project. Run in the SQL editor.
-- Covers every "saved items" table the app persists to.
--
-- Row Level Security is ENABLED on every table with NO permissive policy, so the
-- database denies all direct anon/authenticated access. The app reaches its data
-- only through the server route `/api/saved/[table]` (behind the shared-password
-- proxy) using the SERVICE-ROLE key, which bypasses RLS. The public anon key can
-- no longer read or write anything. See docs/auth-and-rls.md.
-- ============================================================================

-- ---- updated_at trigger function -------------------------------------------
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---- helper: apply standard columns + trigger + RLS to a table -------------
-- (Postgres has no "macro", so each table is spelled out below for clarity.)

-- ============================ reviews =======================================
create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  code_snippet  text not null default '',
  review_content text not null default '',
  focus_areas   text[] not null default '{}',
  language      text not null default 'go',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================ test_plans ====================================
create table if not exists public.test_plans (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  requirement  text not null default '',
  plan_content text not null default '',
  test_types   text[] not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================ specs =========================================
create table if not exists public.specs (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  service_name text not null default '',
  yaml_content text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================ sequence_diagrams =============================
create table if not exists public.sequence_diagrams (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text not null default '',
  mermaid_source text not null default '',
  flow_id        text,
  participants   text[] not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================ analyses ======================================
create table if not exists public.analyses (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  ticket_text text not null default '',
  messages    jsonb not null default '[]',
  model_id    text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================ chats =========================================
create table if not exists public.chats (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  messages   jsonb not null default '[]',
  model_id   text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================ runbooks ======================================
create table if not exists public.runbooks (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  severity   text not null default 'P3',
  content    jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================ teleprompter_cards ============================
create table if not exists public.teleprompter_cards (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  category   text not null default '',
  bullets    jsonb not null default '[]',
  sections   jsonb,
  full_text  text,
  mental_model jsonb,                           -- per-card mental model: { spine, beats[] }
  role       text,                              -- null = shared across all roles
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Migration for an existing database (safe to run repeatedly):
--   alter table public.teleprompter_cards add column if not exists role text;
--   alter table public.teleprompter_cards add column if not exists mental_model jsonb;

-- ---- triggers + RLS for every table ----------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'reviews','test_plans','specs','sequence_diagrams',
    'analyses','chats','runbooks','teleprompter_cards'
  ];
begin
  foreach t in array tables loop
    -- updated_at trigger
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.update_updated_at();', t);

    -- enable RLS, deny-by-default: no policy is created, so direct anon/
    -- authenticated access is denied. The service-role key (server API route
    -- only) bypasses RLS. Drop any permissive policy from earlier versions.
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "anon_all" on public.%I;', t);
  end loop;
end $$;

-- ============================================================================
-- HARDENING (optional) — when you enable Supabase Auth, drop the "anon_all"
-- policies above and add an owner column + per-user policies instead, e.g.:
--
--   alter table public.runbooks add column owner uuid default auth.uid();
--   drop policy "anon_all" on public.runbooks;
--   create policy "owner_rw" on public.runbooks for all to authenticated
--     using (owner = auth.uid()) with check (owner = auth.uid());
--
-- Repeat per table. See docs/auth-and-rls.md for the full walkthrough.
-- ============================================================================
