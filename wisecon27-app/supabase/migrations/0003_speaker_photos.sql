-- WISEcon27 — speaker photos. Stored in the existing public 'session-files'
-- bucket (admin-write, public-read), so no new bucket/policies needed.
alter table public.speakers add column if not exists photo_url text;
