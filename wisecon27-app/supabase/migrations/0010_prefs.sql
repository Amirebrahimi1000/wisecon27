-- WISEcon27 — per-user preferences: hide from delegate list + push topics.
-- notif_prefs example: {"announce": false, "message": true} — a missing key
-- means ON. Run in Supabase SQL Editor.

alter table public.profiles add column if not exists hidden boolean not null default false;
alter table public.profiles add column if not exists notif_prefs jsonb not null default '{}';
