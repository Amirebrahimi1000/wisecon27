-- WISEcon27 — Brella-inspired networking upgrades:
-- 1:1 meeting scheduling (with bookable meeting points and per-day
-- availability windows) + community feed. Run in Supabase SQL Editor.

-- ── profiles: when am I bookable for 1:1 meetings? ──
-- jsonb keyed by day id, e.g. {"d1": {"available": true, "start": "09:00", "end": "12:00"}}.
-- A missing day means available all day; "available": false blocks the whole day.
alter table public.profiles add column if not exists meeting_availability jsonb not null default '{}';

-- ════════ meeting points (where 1:1 meetings happen) ════════
create table if not exists public.meeting_points (
  id    text primary key,
  label text not null,
  sort  int not null default 0
);
alter table public.meeting_points enable row level security;
drop policy if exists "mp read" on public.meeting_points;
create policy "mp read" on public.meeting_points for select using (true);
drop policy if exists "mp admin write" on public.meeting_points;
create policy "mp admin write" on public.meeting_points for all using (public.is_admin()) with check (public.is_admin());

insert into public.meeting_points (id, label, sort) values
  ('mp1', 'Networking Lounge · Table 1', 0),
  ('mp2', 'Networking Lounge · Table 2', 1),
  ('mp3', 'Networking Lounge · Table 3', 2),
  ('mp4', 'Foyer · high tables', 3),
  ('mp5', 'Rooftop Terrace', 4),
  ('mp6', 'Expo Hall · meeting corner', 5)
on conflict (id) do nothing;

-- ════════ 1:1 meetings ════════
create table if not exists public.meetings (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  invitee_id   uuid not null references auth.users(id) on delete cascade,
  day_id       text not null references public.days(id) on delete cascade,
  start        text not null,        -- "HH:MM"
  "end"        text not null,        -- "HH:MM"
  point_id     text references public.meeting_points(id) on delete set null,
  message      text not null default '',
  status       text not null default 'pending',  -- pending|accepted|declined|cancelled
  created_at   timestamptz not null default now()
);
create index if not exists meetings_requester_idx on public.meetings(requester_id);
create index if not exists meetings_invitee_idx on public.meetings(invitee_id);

alter table public.meetings enable row level security;
drop policy if exists "meetings read" on public.meetings;
create policy "meetings read" on public.meetings for select
  using (auth.uid() = requester_id or auth.uid() = invitee_id);
drop policy if exists "meetings insert" on public.meetings;
create policy "meetings insert" on public.meetings for insert
  with check (auth.uid() = requester_id);
-- either party can update (invitee accepts/declines, requester cancels)
drop policy if exists "meetings update" on public.meetings;
create policy "meetings update" on public.meetings for update
  using (auth.uid() = requester_id or auth.uid() = invitee_id)
  with check (auth.uid() = requester_id or auth.uid() = invitee_id);
drop policy if exists "meetings delete" on public.meetings;
create policy "meetings delete" on public.meetings for delete
  using (auth.uid() = requester_id);

-- ════════ community feed ════════
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts(created_at desc);

alter table public.posts enable row level security;
drop policy if exists "posts read" on public.posts;
create policy "posts read" on public.posts for select using (auth.role() = 'authenticated');
drop policy if exists "posts insert" on public.posts;
create policy "posts insert" on public.posts for insert with check (auth.uid() = user_id);
drop policy if exists "posts delete" on public.posts;
create policy "posts delete" on public.posts for delete using (auth.uid() = user_id or public.is_admin());

create table if not exists public.post_likes (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (post_id, user_id)
);
alter table public.post_likes enable row level security;
drop policy if exists "plikes read" on public.post_likes;
create policy "plikes read" on public.post_likes for select using (auth.role() = 'authenticated');
drop policy if exists "plikes own" on public.post_likes;
create policy "plikes own" on public.post_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ════════ realtime ════════
do $$
declare t text;
begin
  foreach t in array array['meetings', 'posts', 'post_likes', 'meeting_points']
  loop
    begin execute format('alter publication supabase_realtime add table public.%I;', t);
    exception when duplicate_object then null; end;
  end loop;
end $$;
