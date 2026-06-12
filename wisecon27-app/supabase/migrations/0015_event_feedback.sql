-- WISEcon27 -- general event feedback (the "Give feedback" screen).
-- Found in code review: the screen showed a success state without saving
-- anything. This table gives it a home. Run in Supabase SQL Editor.

create table if not exists public.event_feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  stars      int not null,
  tags       text[] not null default '{}',
  comment    text not null default '',
  created_at timestamptz not null default now()
);

alter table public.event_feedback enable row level security;
drop policy if exists "ef insert own" on public.event_feedback;
create policy "ef insert own" on public.event_feedback for insert
  with check (auth.uid() = user_id);
-- respondents see their own; organisers see everything
drop policy if exists "ef read" on public.event_feedback;
create policy "ef read" on public.event_feedback for select
  using (auth.uid() = user_id or public.is_admin());
