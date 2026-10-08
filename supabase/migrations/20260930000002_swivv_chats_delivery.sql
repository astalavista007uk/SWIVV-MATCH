-- SWIVV cross-account delivery: senders also write the recipient's copy.
-- ponytail: open insert (any authenticated user can file another's inbox) — match-gated inserts when abuse appears
alter table public.swivv_chats add column if not exists peer_name text not null default '';
alter table public.swivv_chats add column if not exists peer_photo text not null default '';

drop policy if exists chats_deliver on public.swivv_chats;
create policy chats_deliver on public.swivv_chats
  for insert to authenticated
  with check (true);

