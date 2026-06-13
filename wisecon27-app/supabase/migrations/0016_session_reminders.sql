-- WISEcon27 — session reminders for guaranteed (closed-app) delivery.
-- The app writes one row per opted-in session with the absolute time to remind;
-- the send-reminders edge function (run on a schedule) sweeps due rows, pushes
-- to the delegate's devices and stamps sent_at so each reminder fires once.

create table if not exists public.session_reminders (
  user_id    uuid references auth.users(id) on delete cascade,
  session_id text references public.sessions(id) on delete cascade,
  remind_at  timestamptz not null,
  sent_at    timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, session_id)
);

alter table public.session_reminders enable row level security;

-- Delegates manage only their own reminders. The edge function uses the service
-- role key, which bypasses RLS, to read all due rows and stamp sent_at.
drop policy if exists "reminders own" on public.session_reminders;
create policy "reminders own" on public.session_reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- fast lookup for the cron sweep: only unsent rows, ordered by when they're due
create index if not exists session_reminders_due_idx
  on public.session_reminders (remind_at) where sent_at is null;

-- ════════════════════════════════════════════════════════════════
-- SCHEDULING (optional — run once after deploying the edge function)
-- Requires the pg_cron and pg_net extensions (enable in Dashboard →
-- Database → Extensions). Replace <PROJECT_REF> and store the service
-- role key in Vault, then schedule a minute-by-minute sweep:
--
--   select cron.schedule(
--     'wisecon27-session-reminders',
--     '* * * * *',
--     $$
--     select net.http_post(
--       url     := 'https://<PROJECT_REF>.functions.supabase.co/send-reminders',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'x-cron-key', (select decrypted_secret from vault.decrypted_secrets where name = 'CRON_SECRET')
--       ),
--       body    := '{}'::jsonb
--     );
--     $$
--   );
--
-- To stop:  select cron.unschedule('wisecon27-session-reminders');
-- ════════════════════════════════════════════════════════════════
