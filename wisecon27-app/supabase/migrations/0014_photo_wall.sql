-- WISEcon27 -- community photo wall, privacy-first.
-- Photos live in a PRIVATE bucket: only signed-in delegates can view them
-- (the app uses short-lived signed URLs), nothing is reachable from the open
-- internet. Uploaders write to their own folder; authors and organisers can
-- delete. Run in Supabase SQL Editor. (ASCII only.)

-- a post may carry one photo
alter table public.posts add column if not exists photo_path text;

-- private bucket (public = false -> no anonymous access, ever)
insert into storage.buckets (id, name, public) values ('wall-photos', 'wall-photos', false)
on conflict (id) do nothing;

-- signed-in delegates may view (needed for signed URLs / downloads)
drop policy if exists "wall read" on storage.objects;
create policy "wall read" on storage.objects for select
  using (bucket_id = 'wall-photos' and auth.role() = 'authenticated');

-- upload only into your own folder: <uid>/...
drop policy if exists "wall insert own" on storage.objects;
create policy "wall insert own" on storage.objects for insert
  with check (bucket_id = 'wall-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- delete your own photos; organisers can take anything down
drop policy if exists "wall delete" on storage.objects;
create policy "wall delete" on storage.objects for delete
  using (bucket_id = 'wall-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
