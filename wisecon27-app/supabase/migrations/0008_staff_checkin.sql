-- WISEcon27 — "Staff" role: scanning/check-in only, no other admin rights.
-- Run in Supabase SQL Editor.

alter table public.profiles add column if not exists is_staff boolean not null default false;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_staff from public.profiles where id = auth.uid()), false);
$$;

-- Check-in by badge id. SECURITY DEFINER so staff don't need (and don't get)
-- direct update rights on profiles — this function can ONLY stamp checked_in_at.
-- Returns the resulting timestamp, or null if the badge is unknown.
create or replace function public.check_in(p_badge text)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare ts timestamptz;
begin
  if not (public.is_admin() or public.is_staff()) then
    raise exception 'Only staff or admins can check delegates in';
  end if;
  update public.profiles set checked_in_at = now() where badge_id = p_badge
  returning checked_in_at into ts;
  return ts;
end;
$$;
