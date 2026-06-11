-- WISEcon27 -- speakers share slides & resources with attendees in-app.
-- Run in Supabase SQL Editor. (ASCII only, safe to paste anywhere.)

-- 1) Link a speaker to their delegate account. Backfilled by name below;
--    organisers can set/change it in Admin -> Speakers.
alter table public.speakers add column if not exists profile_id uuid references public.profiles(id) on delete set null;

update public.speakers s set profile_id = p.id
from public.profiles p
where s.profile_id is null and p.name <> ''
  and lower(regexp_replace(s.name, '^(dr|prof)\.?\s+', '', 'i'))
    = lower(regexp_replace(p.name, '^(dr|prof)\.?\s+', '', 'i'));

-- helper: is the signed-in user a linked speaker of this session?
create or replace function public.is_session_speaker(sid text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.session_speakers ss
    join public.speakers sp on sp.id = ss.speaker_id
    where ss.session_id = sid and sp.profile_id = auth.uid()
  );
$$;

-- 2) Resources (uploaded files or external links) attached to a session.
create table if not exists public.session_resources (
  id         uuid primary key default gen_random_uuid(),
  session_id text not null references public.sessions(id) on delete cascade,
  label      text not null,
  path       text,  -- storage path in the session-files bucket (file resources)
  url        text,  -- external link resources
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists session_resources_session_idx on public.session_resources(session_id);

alter table public.session_resources enable row level security;
drop policy if exists "sres read" on public.session_resources;
create policy "sres read" on public.session_resources for select using (auth.role() = 'authenticated');
drop policy if exists "sres insert" on public.session_resources;
create policy "sres insert" on public.session_resources for insert
  with check ((public.is_admin() or public.is_session_speaker(session_id)) and created_by = auth.uid());
drop policy if exists "sres delete" on public.session_resources;
create policy "sres delete" on public.session_resources for delete
  using (public.is_admin() or public.is_session_speaker(session_id));

-- 3) Storage: linked speakers may upload files under resources/<session_id>/
--    in the session-files bucket (admins already can via the existing policy).
drop policy if exists "files speaker insert" on storage.objects;
create policy "files speaker insert" on storage.objects for insert
  with check (
    bucket_id = 'session-files'
    and (storage.foldername(name))[1] = 'resources'
    and public.is_session_speaker((storage.foldername(name))[2])
  );
drop policy if exists "files speaker delete" on storage.objects;
create policy "files speaker delete" on storage.objects for delete
  using (
    bucket_id = 'session-files'
    and (storage.foldername(name))[1] = 'resources'
    and public.is_session_speaker((storage.foldername(name))[2])
  );

-- realtime
do $$ begin
  begin
    execute 'alter publication supabase_realtime add table public.session_resources';
  exception when duplicate_object then null;
  end;
end $$;
