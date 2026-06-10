-- WISEcon27 — richer delegate profiles: email surfaced to the app, optional
-- bio/LinkedIn, and per-field sharing preferences (share_prefs: a missing key
-- means SHOWN; {"bio": false} hides it). Run in Supabase SQL Editor.

alter table public.profiles add column if not exists email text not null default '';
alter table public.profiles add column if not exists bio text not null default '';
alter table public.profiles add column if not exists linkedin text not null default '';
alter table public.profiles add column if not exists share_prefs jsonb not null default '{}';

-- backfill emails from auth
update public.profiles p set email = coalesce(u.email, '')
from auth.users u where u.id = p.id and (p.email is null or p.email = '');

-- new signups carry their email into the profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, badge_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    'WC27-' || lpad((floor(random() * 9000 + 1000))::int::text, 4, '0')
  );
  return new;
end;
$$;
