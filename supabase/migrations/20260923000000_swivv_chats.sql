-- SWIVV dating chats: one row per message, owned by the logged-in user.
-- ponytail: per-user rows (not a shared conversation) because seed peers aren't auth users —
-- a real two-user thread table replaces this when both sides are real accounts
create table if not exists public.swivv_chats (
  user_id uuid not null references auth.users (id) on delete cascade,
  peer_id text not null,
  msg_id text not null,
  sender text not null check (sender in ('me', 'them')),
  body text not null,
  audio_url text,
  duration_s int,
  created_at timestamptz not null default now(),
  primary key (user_id, msg_id)
);

create index if not exists idx_swivv_chats_user_peer
  on public.swivv_chats (user_id, peer_id);

alter table public.swivv_chats enable row level security;

grant select, insert, update, delete on public.swivv_chats to authenticated;

drop policy if exists "own chats" on public.swivv_chats;
create policy "own chats" on public.swivv_chats
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Live inbox updates on the other device.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'swivv_chats'
  ) then
    alter publication supabase_realtime add table public.swivv_chats;
  end if;
end $$;
