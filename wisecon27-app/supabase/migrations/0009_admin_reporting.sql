-- WISEcon27 — let admins read all survey responses for the in-app results
-- overview and CSV export (previously responses were readable only by their
-- author). Run in Supabase SQL Editor.

drop policy if exists "sr admin read" on public.survey_responses;
create policy "sr admin read" on public.survey_responses
  for select using (public.is_admin());
