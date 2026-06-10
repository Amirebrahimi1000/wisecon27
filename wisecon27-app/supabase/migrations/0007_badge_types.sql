-- WISEcon27 — badge types, gala dinner flag, entrance check-in.
-- Run in Supabase SQL Editor.

-- delegate_type drives the badge colour:
--   uniwise | sponsor_gold | sponsor_silver | sponsor_bronze | delegate (default)
alter table public.profiles add column if not exists delegate_type text not null default 'delegate';
alter table public.profiles add column if not exists gala boolean not null default false;
alter table public.profiles add column if not exists checked_in_at timestamptz;

-- admins manage delegate type / gala / check-in on any profile (RLS previously
-- only allowed self-updates)
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- fast lookup at the door
create index if not exists profiles_badge_idx on public.profiles(badge_id);
