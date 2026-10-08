-- SWIVV photo feedback: reactions / reports / downloads on shared images.
-- ponytail: open read/write for authenticated (keyed by opaque msg_id, minimal payload) — scope to thread participants when chats become user-mapped
create table if not exists public.swivv_chat_feedback (
  id bigint generated always as identity primary key,
  msg_id text not null,
  kind text not null,
  detail text not null default '',
  reactor text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_swivv_chat_feedback_msg on public.swivv_chat_feedback (msg_id);

alter table public.swivv_chat_feedback enable row level security;

grant select, insert on public.swivv_chat_feedback to authenticated;

drop policy if exists feedback_open on public.swivv_chat_feedback;
create policy feedback_open on public.swivv_chat_feedback
  for all to authenticated
  using (true)
  with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'swivv_chat_feedback'
  ) then
    alter publication supabase_realtime add table public.swivv_chat_feedback;
  end if;
end $$;
