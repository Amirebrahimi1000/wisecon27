-- WISEcon27 — auto-translation columns for the Event-info key/value items
-- (Wi-Fi, venue, hours). Mirrors 0018 for info_sections: holds Claude-generated
-- translations keyed by language code ({"en":"…","da":"…","no":"…","de":"…"}),
-- written by the translation-info edge function after each save.

alter table public.event_info add column if not exists label_i18n  jsonb not null default '{}'::jsonb;
alter table public.event_info add column if not exists detail_i18n jsonb not null default '{}'::jsonb;
