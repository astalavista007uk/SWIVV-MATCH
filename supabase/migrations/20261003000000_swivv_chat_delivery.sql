-- Let members deliver messages into each other's inbox (recipient copies).
-- ponytail: tight shape (them-copy referencing the sender) so nobody can forge other senders — a shared thread table if delivery ever needs more than inserts
drop policy if exists "deliver to peer" on public.swivv_chats;
create policy "deliver to peer" on public.swivv_chats
  for insert to authenticated
  with check (
    auth.uid() <> user_id
    and sender = 'them'
    and peer_id = 'u:' || (auth.uid())::text
  );
