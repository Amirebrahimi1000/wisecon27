-- WISEcon27 — auto-translation columns for the Info-page cards.
-- Holds Claude-generated translations keyed by language code
-- ({"en":"…","da":"…","no":"…","de":"…"}); written by the translate-info
-- edge function after each save. Safe to run whether or not 0017 is applied.

alter table public.info_sections add column if not exists title_i18n jsonb not null default '{}'::jsonb;
alter table public.info_sections add column if not exists body_i18n  jsonb not null default '{}'::jsonb;
