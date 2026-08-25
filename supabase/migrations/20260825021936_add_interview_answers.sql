create table if not exists public.interview_answers (
  id           uuid primary key default gen_random_uuid(),
  question_key text not null unique,
  question     text not null,
  answer       text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint interview_answers_question_key_format
    check (question_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint interview_answers_question_length
    check (char_length(question) between 1 and 300),
  constraint interview_answers_answer_length
    check (char_length(answer) between 1 and 20000)
);

drop trigger if exists set_updated_at on public.interview_answers;
create trigger set_updated_at
  before update on public.interview_answers
  for each row execute function public.update_updated_at();

alter table public.interview_answers enable row level security;

-- The browser never talks to Supabase directly. Only the authenticated Next.js
-- API route uses the server-side service-role client.
revoke all on table public.interview_answers from anon, authenticated;
grant select, insert, update on table public.interview_answers to service_role;
