-- WISEcon27 — mark delegates that were synced from HubSpot, so the sync can
-- safely remove only those who later drop off the list (never admins or
-- manually-imported delegates).
alter table public.profiles add column if not exists from_hubspot boolean not null default false;
