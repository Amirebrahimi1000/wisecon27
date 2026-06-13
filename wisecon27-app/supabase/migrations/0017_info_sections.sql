-- WISEcon27 — editable "practical essentials" cards on the Info page
-- (Getting here, Accessibility, etc.). Previously hardcoded; now admin-managed.
-- `link` holds either a full URL or a plain address — the app turns an address
-- into a maps link that opens the device's map app.

create table if not exists public.info_sections (
  id         text primary key,
  icon       text not null default 'info',
  title      text not null,
  body       text not null default '',
  link       text,
  sort       int  not null default 0,
  created_at timestamptz not null default now()
);

alter table public.info_sections enable row level security;

-- public read, admin write (mirrors the other content tables)
drop policy if exists "info_sections read" on public.info_sections;
create policy "info_sections read" on public.info_sections for select using (true);
drop policy if exists "info_sections admin write" on public.info_sections;
create policy "info_sections admin write" on public.info_sections
  for all using (public.is_admin()) with check (public.is_admin());

-- seed the six defaults that used to be hardcoded, so admins start with them
insert into public.info_sections (id, icon, title, body, sort) values
  ('is-getting-here', 'map',     'Getting here',           'The venue is reachable by public transport and car. Parking is available on-site; allow extra time at peak arrival hours.', 0),
  ('is-accessibility','user',    'Accessibility',          'Step-free access, accessible toilets and reserved seating are available. Tell a host at the welcome desk if you need assistance.', 1),
  ('is-dietary',      'coffee',  'Food & dietary needs',   'Lunch and refreshments are included. Vegetarian, vegan and gluten-free options are labelled; ask staff about allergens.', 2),
  ('is-conduct',      'shield',  'Code of conduct',        'WISEcon27 is a respectful, inclusive event. Harassment of any kind is not tolerated — report concerns to any organiser.', 3),
  ('is-emergency',    'bell',    'Emergency & first aid',  'First aid is at the welcome desk. In an emergency, alert the nearest staff member or call local emergency services.', 4),
  ('is-contact',      'message', 'Contact the organisers', 'Find a host at the welcome desk, or reach the team through the contact details shared in your registration email.', 5)
on conflict (id) do nothing;
