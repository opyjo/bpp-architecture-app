create table if not exists public.star_story_practice (
  story_key         text primary key,
  model             jsonb not null default '{}'::jsonb,
  confidence        text not null default 'Developing',
  practice_count    integer not null default 0,
  last_practiced_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint star_story_practice_key_format
    check (story_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint star_story_practice_model_object
    check (jsonb_typeof(model) = 'object'),
  constraint star_story_practice_confidence
    check (confidence in ('Weak', 'Developing', 'Ready')),
  constraint star_story_practice_count_nonnegative
    check (practice_count >= 0)
);

drop trigger if exists set_updated_at on public.star_story_practice;
create trigger set_updated_at
  before update on public.star_story_practice
  for each row execute function public.update_updated_at();

alter table public.star_story_practice enable row level security;

-- The browser never talks to Supabase directly. Only the password-protected
-- Next.js API route uses the server-side service-role client.
revoke all on table public.star_story_practice from anon, authenticated;
grant select, insert, update on table public.star_story_practice to service_role;
