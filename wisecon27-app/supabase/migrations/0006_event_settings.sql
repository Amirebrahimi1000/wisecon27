-- WISEcon27 — app-wide editable settings (key/value). Used for the event
-- headline (date range + location) shown on the sign-in, agenda, home and
-- ticket screens. Run in Supabase SQL Editor.

create table if not exists public.settings (
  key   text primary key,
  value text not null default ''
);

alter table public.settings enable row level security;

drop policy if exists "settings read" on public.settings;
create policy "settings read" on public.settings for select using (true);

drop policy if exists "settings admin write" on public.settings;
create policy "settings admin write" on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- seed with the current values so nothing changes until an organiser edits them
insert into public.settings (key, value) values
  ('event_dateline', '14–16 September'),
  ('event_location', 'Aarhus')
on conflict (key) do nothing;

-- realtime so a headline / day change shows up on every device
do $$
declare t text;
begin
  foreach t in array array['settings', 'days']
  loop
    begin execute format('alter publication supabase_realtime add table public.%I;', t);
    exception when duplicate_object then null; end;
  end loop;
end $$;
