-- WISEcon27 — direct messaging between connected delegates.
-- Run in Supabase SQL Editor.

create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body         text not null,
  created_at   timestamptz not null default now(),
  read_at      timestamptz
);
create index if not exists messages_pair_idx on public.messages(sender_id, recipient_id, created_at);
create index if not exists messages_recipient_idx on public.messages(recipient_id, read_at);

alter table public.messages enable row level security;

-- read messages you sent or received
drop policy if exists "messages read" on public.messages;
create policy "messages read" on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- send only as yourself, and only to a delegate you are CONNECTED with
drop policy if exists "messages insert" on public.messages;
create policy "messages insert" on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.connections c
      where c.status = 'connected'
        and ((c.requester_id = auth.uid() and c.target_id = recipient_id)
          or (c.target_id = auth.uid() and c.requester_id = recipient_id))
    )
  );

-- recipient may mark messages read (update read_at)
drop policy if exists "messages update" on public.messages;
create policy "messages update" on public.messages for update
  using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

-- realtime
do $$ begin
  begin
    execute 'alter publication supabase_realtime add table public.messages';
  exception when duplicate_object then null;
  end;
end $$;
