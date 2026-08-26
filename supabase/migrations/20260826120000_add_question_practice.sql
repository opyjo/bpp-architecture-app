create table if not exists public.question_practice (
  question_key text primary key,
  confidence   text not null default 'Developing',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint question_practice_key_format
    check (question_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint question_practice_confidence
    check (confidence in ('Weak', 'Developing', 'Ready'))
);

drop trigger if exists set_updated_at on public.question_practice;
create trigger set_updated_at
  before update on public.question_practice
  for each row execute function public.update_updated_at();

alter table public.question_practice enable row level security;

-- The browser never talks to Supabase directly. Only the authenticated Next.js
-- API route uses the server-side service-role client.
revoke all on table public.question_practice from anon, authenticated;
grant select, insert, update on table public.question_practice to service_role;
