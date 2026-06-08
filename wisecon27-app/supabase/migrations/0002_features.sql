-- WISEcon27 — organiser-requested features:
-- session feedback · exhibitor profiles · speaker slides · post-conf survey ·
-- interactive activities (with sign-up) · profile pictures.
-- Run in Supabase SQL Editor.

-- ── profiles: avatar ──
alter table public.profiles add column if not exists avatar_url text;

-- ── sponsors → exhibitor info ──
alter table public.sponsors add column if not exists description text not null default '';
alter table public.sponsors add column if not exists booth text not null default '';
alter table public.sponsors add column if not exists website text not null default '';

-- ── sessions: uploaded slides ──
alter table public.sessions add column if not exists slides_path text;
alter table public.sessions add column if not exists slides_name text;

-- ════════ per-session feedback ════════
create table if not exists public.session_feedback (
  session_id text references public.sessions(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  stars      int not null,
  tags       text[] not null default '{}',
  comment    text not null default '',
  created_at timestamptz not null default now(),
  primary key (session_id, user_id)
);
alter table public.session_feedback enable row level security;
drop policy if exists "sf read" on public.session_feedback;
create policy "sf read" on public.session_feedback for select using (auth.role() = 'authenticated');
drop policy if exists "sf own" on public.session_feedback;
create policy "sf own" on public.session_feedback for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- aggregate view for organisers (avg + count per session)
create or replace view public.session_feedback_summary as
  select session_id, round(avg(stars)::numeric, 2) as avg_stars, count(*)::int as responses
  from public.session_feedback group by session_id;

-- ════════ interactive activities (with sign-up) ════════
create table if not exists public.activities (
  id          text primary key,
  title       text not null,
  description text not null default '',
  location    text not null default '',
  day_id      text references public.days(id) on delete set null,
  start       text not null default '',
  "end"       text not null default '',
  capacity    int,
  sort        int not null default 0
);
alter table public.activities enable row level security;
drop policy if exists "act read" on public.activities;
create policy "act read" on public.activities for select using (true);
drop policy if exists "act admin write" on public.activities;
create policy "act admin write" on public.activities for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.activity_signups (
  activity_id text references public.activities(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (activity_id, user_id)
);
alter table public.activity_signups enable row level security;
drop policy if exists "asu read" on public.activity_signups;
create policy "asu read" on public.activity_signups for select using (auth.role() = 'authenticated');
drop policy if exists "asu own" on public.activity_signups;
create policy "asu own" on public.activity_signups for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ════════ post-conference survey ════════
create table if not exists public.survey_questions (
  id      text primary key,
  prompt  text not null,
  kind    text not null default 'rating',  -- rating | nps | choice | text
  options text[] not null default '{}',
  sort    int not null default 0,
  active  boolean not null default true
);
alter table public.survey_questions enable row level security;
drop policy if exists "sq read" on public.survey_questions;
create policy "sq read" on public.survey_questions for select using (true);
drop policy if exists "sq admin write" on public.survey_questions;
create policy "sq admin write" on public.survey_questions for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.survey_responses (
  user_id    uuid references auth.users(id) on delete cascade primary key,
  answers    jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.survey_responses enable row level security;
drop policy if exists "sr own" on public.survey_responses;
create policy "sr own" on public.survey_responses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- standard editable survey (seed once)
insert into public.survey_questions (id, prompt, kind, options, sort) values
  ('q_overall', 'Overall, how would you rate WISEcon27?', 'rating', '{}', 0),
  ('q_nps', 'How likely are you to recommend WISEcon27 to a colleague?', 'nps', '{}', 1),
  ('q_value', 'What did you value most?', 'choice', '{Keynotes,Workshops,Networking,Exhibition,"Content quality"}', 2),
  ('q_improve', 'What could we improve for WISEcon28?', 'text', '{}', 3),
  ('q_comments', 'Any other comments?', 'text', '{}', 4)
on conflict (id) do nothing;

-- sample activities (organisers edit/add via Admin)
insert into public.activities (id, title, description, location, day_id, start, "end", capacity, sort) values
  ('ac_yoga', 'Morning mindfulness & coffee', 'Start the day with a short guided mindfulness session before the keynote.', 'Rooftop Terrace', 'd2', '08:00', '08:40', 20, 0),
  ('ac_speed', 'Speed networking', 'Meet ten fellow delegates in thirty minutes — structured, friendly, fast.', 'Foyer', 'd1', '16:00', '16:30', 40, 1),
  ('ac_lab', 'WISEflow hands-on demo lab', 'Drop in for a guided, hands-on tour of the latest WISEflow features.', 'Workshop Lab', 'd2', '13:00', '13:45', 30, 2),
  ('ac_quiz', 'Conference dinner & quiz', 'An informal evening of food and a light-hearted assessment-themed quiz.', 'Main Hall', 'd2', '19:00', '22:00', null, 3)
on conflict (id) do nothing;

-- ════════ realtime ════════
do $$
declare t text;
begin
  foreach t in array array['activity_signups', 'session_feedback']
  loop
    begin execute format('alter publication supabase_realtime add table public.%I;', t);
    exception when duplicate_object then null; end;
  end loop;
end $$;

-- ════════ storage buckets + policies ════════
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('session-files', 'session-files', true) on conflict (id) do nothing;

-- avatars: anyone reads; a user manages files under their own <uid>/ folder
drop policy if exists "avatars read" on storage.objects;
create policy "avatars read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatars insert own" on storage.objects;
create policy "avatars insert own" on storage.objects for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own" on storage.objects for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- session files (slides): anyone reads; only admins write
drop policy if exists "files read" on storage.objects;
create policy "files read" on storage.objects for select using (bucket_id = 'session-files');
drop policy if exists "files admin insert" on storage.objects;
create policy "files admin insert" on storage.objects for insert with check (bucket_id = 'session-files' and public.is_admin());
drop policy if exists "files admin update" on storage.objects;
create policy "files admin update" on storage.objects for update using (bucket_id = 'session-files' and public.is_admin());
drop policy if exists "files admin delete" on storage.objects;
create policy "files admin delete" on storage.objects for delete using (bucket_id = 'session-files' and public.is_admin());
