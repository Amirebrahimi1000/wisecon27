-- WISEcon27 — initial schema, security, and realtime setup.
-- Run this in your Supabase project: SQL Editor → paste → Run
-- (or `supabase db push` if you use the Supabase CLI).

-- ════════════════════════════════════════════════════════════════
-- CONTENT (editorial — managed by admins, readable by everyone)
-- Tracks stay as a client-side design constant; everything else is data.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.days (
  id          text primary key,
  dow         text not null,
  date        text not null,
  long        text not null,
  sort        int  not null default 0
);

create table if not exists public.speakers (
  id          text primary key,
  name        text not null,
  role        text not null default '',
  org         text not null default '',
  initials    text not null default '',
  color       text not null default 'var(--wf-green-9)',
  bio         text not null default '',
  topics      text[] not null default '{}',
  sort        int  not null default 0
);

create table if not exists public.sessions (
  id          text primary key,
  day_id      text not null references public.days(id) on delete cascade,
  start       text not null,        -- "HH:MM"
  "end"       text not null,        -- "HH:MM"
  title       text not null,
  type        text not null,        -- keynote|talk|panel|workshop|break|social|plenary
  track       text not null,        -- integrity|pedagogy|platform|research|workshop|plenary
  room        text not null default '',
  "desc"      text not null default '',
  tags        text[] not null default '{}',
  going       int  not null default 0,
  capacity    int
);
create index if not exists sessions_day_idx on public.sessions(day_id);

create table if not exists public.session_speakers (
  session_id  text references public.sessions(id) on delete cascade,
  speaker_id  text references public.speakers(id) on delete cascade,
  ord         int not null default 0,
  primary key (session_id, speaker_id)
);

create table if not exists public.sponsors (
  id          text primary key,
  name        text not null,
  tier        text not null,        -- Host|Platinum|Gold|Silver
  blurb       text not null default '',
  initials    text not null default '',
  color       text not null default 'var(--wf-green-7)',
  sort        int  not null default 0
);

create table if not exists public.event_info (
  id          text primary key,
  icon        text not null,
  label       text not null,
  detail      text not null,
  sort        int  not null default 0
);

-- ════════════════════════════════════════════════════════════════
-- PROFILES (one per auth user, auto-created on signup)
-- ════════════════════════════════════════════════════════════════

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  initials    text not null default '',
  role        text not null default '',
  org         text not null default '',
  color       text not null default 'var(--wf-blue-9)',
  ticket      text not null default 'Full delegate',
  badge_id    text not null,
  interests   text[] not null default '{}',
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- auto-create a profile + random badge id when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, badge_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    'WC27-' || lpad((floor(random() * 9000 + 1000))::int::text, 4, '0')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ════════════════════════════════════════════════════════════════
-- USER DATA (per-account; realtime)
-- ════════════════════════════════════════════════════════════════

create table if not exists public.bookmarks (
  user_id     uuid references auth.users(id) on delete cascade,
  session_id  text references public.sessions(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, session_id)
);

create table if not exists public.connections (
  requester_id uuid references auth.users(id) on delete cascade,
  target_id    uuid references auth.users(id) on delete cascade,
  status       text not null default 'pending',  -- pending|connected
  created_at   timestamptz not null default now(),
  primary key (requester_id, target_id)
);

create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  session_id  text references public.sessions(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  body        text not null,
  anonymous   boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists questions_session_idx on public.questions(session_id);

create table if not exists public.question_votes (
  question_id uuid references public.questions(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  primary key (question_id, user_id)
);

create table if not exists public.polls (
  id          uuid primary key default gen_random_uuid(),
  session_id  text references public.sessions(id) on delete cascade,
  question    text not null,
  is_live     boolean not null default true
);

create table if not exists public.poll_options (
  id          uuid primary key default gen_random_uuid(),
  poll_id     uuid references public.polls(id) on delete cascade,
  label       text not null,
  sort        int not null default 0
);

create table if not exists public.poll_votes (
  poll_id     uuid references public.polls(id) on delete cascade,
  option_id   uuid references public.poll_options(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  primary key (poll_id, user_id)   -- one vote per poll per user
);

-- global announcements + per-user read receipts
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  type        text not null default 'announce', -- reminder|connect|announce|social|feedback
  title       text not null,
  body        text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists public.notification_reads (
  user_id          uuid references auth.users(id) on delete cascade,
  announcement_id  uuid references public.announcements(id) on delete cascade,
  primary key (user_id, announcement_id)
);

-- web-push subscriptions (one row per device/browser)
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

-- aggregate poll results, readable without exposing individual votes
create or replace view public.poll_results as
  select o.poll_id, o.id as option_id, o.label, o.sort,
         count(v.user_id)::int as votes
  from public.poll_options o
  left join public.poll_votes v on v.option_id = o.id
  group by o.poll_id, o.id, o.label, o.sort;

-- ════════════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════
alter table public.days              enable row level security;
alter table public.speakers          enable row level security;
alter table public.sessions          enable row level security;
alter table public.session_speakers  enable row level security;
alter table public.sponsors          enable row level security;
alter table public.event_info        enable row level security;
alter table public.profiles          enable row level security;
alter table public.bookmarks         enable row level security;
alter table public.connections       enable row level security;
alter table public.questions         enable row level security;
alter table public.question_votes    enable row level security;
alter table public.polls             enable row level security;
alter table public.poll_options      enable row level security;
alter table public.poll_votes        enable row level security;
alter table public.announcements     enable row level security;
alter table public.notification_reads enable row level security;
alter table public.push_subscriptions enable row level security;

-- helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Content: anyone may read; only admins may write.
do $$
declare t text;
begin
  foreach t in array array['days','speakers','sessions','session_speakers','sponsors','event_info','polls','poll_options','announcements']
  loop
    execute format('drop policy if exists "%s read" on public.%I;', t, t);
    execute format('create policy "%s read" on public.%I for select using (true);', t, t);
    execute format('drop policy if exists "%s admin write" on public.%I;', t, t);
    execute format('create policy "%s admin write" on public.%I for all using (public.is_admin()) with check (public.is_admin());', t, t);
  end loop;
end $$;

-- Profiles: everyone can read (names shown in networking/Q&A); you edit your own.
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select using (true);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Bookmarks: manage your own only.
drop policy if exists "bookmarks own" on public.bookmarks;
create policy "bookmarks own" on public.bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Connections: either party can read; requester creates; either side can update status.
drop policy if exists "connections read" on public.connections;
create policy "connections read" on public.connections for select using (auth.uid() = requester_id or auth.uid() = target_id);
drop policy if exists "connections insert" on public.connections;
create policy "connections insert" on public.connections for insert with check (auth.uid() = requester_id);
drop policy if exists "connections update" on public.connections;
create policy "connections update" on public.connections for update using (auth.uid() = requester_id or auth.uid() = target_id);
drop policy if exists "connections delete" on public.connections;
create policy "connections delete" on public.connections for delete using (auth.uid() = requester_id or auth.uid() = target_id);

-- Q&A: any signed-in user reads; insert your own; delete your own.
drop policy if exists "questions read" on public.questions;
create policy "questions read" on public.questions for select using (auth.role() = 'authenticated');
drop policy if exists "questions insert" on public.questions;
create policy "questions insert" on public.questions for insert with check (auth.uid() = user_id);
drop policy if exists "questions delete" on public.questions;
create policy "questions delete" on public.questions for delete using (auth.uid() = user_id or public.is_admin());

drop policy if exists "qvotes read" on public.question_votes;
create policy "qvotes read" on public.question_votes for select using (auth.role() = 'authenticated');
drop policy if exists "qvotes own" on public.question_votes;
create policy "qvotes own" on public.question_votes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Poll votes: read all (for aggregates); cast/change your own.
drop policy if exists "pvotes read" on public.poll_votes;
create policy "pvotes read" on public.poll_votes for select using (auth.role() = 'authenticated');
drop policy if exists "pvotes own" on public.poll_votes;
create policy "pvotes own" on public.poll_votes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Notification read receipts + push subscriptions: your own only.
drop policy if exists "reads own" on public.notification_reads;
create policy "reads own" on public.notification_reads for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "push own" on public.push_subscriptions;
create policy "push own" on public.push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════
-- REALTIME (push row changes to subscribed clients)
-- ════════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  foreach t in array array['questions','question_votes','poll_votes','connections','announcements','sessions']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I;', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
