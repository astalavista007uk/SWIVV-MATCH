-- SWIVV MATCH: initial message requests + mutual media permissions.
-- Not applied automatically. Run with `supabase db push` after review.
--
-- Model: one request per pair (conversation_key = "lowerUuid:higherUuid"), reused for
-- later permission requests. Text is allowed once accepted (or for legacy mutual
-- matches / existing threads, so older conversations keep working). Voice and files
-- are mutual opt-ins granted by the recipient, revocable by either side.
-- ponytail: no conversation table - the pair key IS the conversation id; split into
-- a threads table if group chats or per-thread settings ever appear.

create table if not exists public.swivv_message_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  initial_message text not null check (char_length(initial_message) between 1 and 500),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  voice_allowed boolean not null default false,
  files_allowed boolean not null default false,
  voice_requested boolean not null default false,
  files_requested boolean not null default false,
  voice_changed_at timestamptz,
  files_changed_at timestamptz,
  conversation_key text not null,
  sender_name text not null default '',
  sender_photo text not null default '',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (sender_id <> recipient_id)
);

create index if not exists swivv_requests_recipient_idx
  on public.swivv_message_requests (recipient_id, status, created_at desc);
create index if not exists swivv_requests_sender_idx
  on public.swivv_message_requests (sender_id, status, created_at desc);

-- One pending request per pair; declined pairs wait out the cooldown below.
create unique index if not exists swivv_requests_one_pending
  on public.swivv_message_requests (conversation_key)
  where status = 'pending';

alter table public.swivv_message_requests enable row level security;

grant select, insert, update on public.swivv_message_requests to authenticated;
grant all on public.swivv_message_requests to service_role;

-- ---------------------------------------------------------------------------
-- Helpers (security definer: RLS cannot read the other party's private rows)
-- ---------------------------------------------------------------------------

create or replace function public.swivv_pair_key(a uuid, b uuid)
returns text language sql immutable as $$
  select least(a, b)::text || ':' || greatest(a, b)::text;
$$;

create or replace function public.swivv_has_match(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.swivv_matches m
    where m.user_a = least(a, b) and m.user_b = greatest(a, b)
  );
$$;

create or replace function public.swivv_has_thread(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.swivv_chats c
    where (c.user_id = a and c.peer_id = 'u:' || b::text)
       or (c.user_id = b and c.peer_id = 'u:' || a::text)
  );
$$;

-- Accepted request, mutual match, or pre-existing thread. Keeps old chats alive.
create or replace function public.swivv_can_message(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select a <> b
    and not public.is_blocked(a, b)
    and (
      public.swivv_has_match(a, b)
      or public.swivv_has_thread(a, b)
      or exists (
        select 1 from public.swivv_message_requests r
        where r.conversation_key = public.swivv_pair_key(a, b)
          and r.status = 'accepted'
      )
    );
$$;

-- Mutual match still unlocks media without an explicit grant (pre-request behaviour).
create or replace function public.swivv_media_allowed(a uuid, b uuid, kind text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.swivv_can_message(a, b)
    and (
      public.swivv_has_match(a, b)
      or exists (
        select 1 from public.swivv_message_requests r
        where r.conversation_key = public.swivv_pair_key(a, b)
          and r.status = 'accepted'
          and case kind
            when 'voice' then r.voice_allowed
            when 'files' then r.files_allowed
            else false
          end
      )
    );
$$;

create or replace function public.swivv_can_request(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select a <> b
    and not public.is_blocked(a, b)
    and not public.swivv_can_message(a, b)
    and not exists (
      select 1 from public.swivv_message_requests r
      where r.conversation_key = public.swivv_pair_key(a, b)
        and r.status = 'pending'
    )
    and not exists (
      -- ponytail: fixed 7-day cooldown after a decline; per-user cooldowns if abuse scales
      select 1 from public.swivv_message_requests r
      where r.conversation_key = public.swivv_pair_key(a, b)
        and r.status = 'declined'
        and r.responded_at > now() - interval '7 days'
    );
$$;

grant execute on function public.swivv_pair_key(uuid, uuid) to authenticated;
grant execute on function public.swivv_has_match(uuid, uuid) to authenticated;
grant execute on function public.swivv_has_thread(uuid, uuid) to authenticated;
grant execute on function public.swivv_can_message(uuid, uuid) to authenticated;
grant execute on function public.swivv_media_allowed(uuid, uuid, text) to authenticated;
grant execute on function public.swivv_can_request(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row policies
-- ---------------------------------------------------------------------------

drop policy if exists swivv_requests_read on public.swivv_message_requests;
create policy swivv_requests_read on public.swivv_message_requests
  for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists swivv_requests_insert on public.swivv_message_requests;
create policy swivv_requests_insert on public.swivv_message_requests
  for insert to authenticated
  with check (
    auth.uid() = sender_id
    and public.swivv_can_request(sender_id, recipient_id)
  );

drop policy if exists swivv_requests_update on public.swivv_message_requests;
create policy swivv_requests_update on public.swivv_message_requests
  for update to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id)
  with check (auth.uid() = sender_id or auth.uid() = recipient_id);

-- ---------------------------------------------------------------------------
-- Insert defaults + state machine (RLS cannot police column-level changes)
-- ---------------------------------------------------------------------------

create or replace function public.swivv_request_defaults()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  snap jsonb;
begin
  new.status := 'pending';
  new.voice_allowed := false;
  new.files_allowed := false;
  new.voice_requested := false;
  new.files_requested := false;
  new.responded_at := null;
  new.conversation_key := public.swivv_pair_key(new.sender_id, new.recipient_id);
  select coalesce(data, '{}'::jsonb) into snap
    from public.swivv_profiles where user_id = new.sender_id;
  new.sender_name := coalesce(nullif(snap->>'name', ''), '');
  new.sender_photo := coalesce(snap->'photos'->>0, '');
  return new;
end $$;

drop trigger if exists swivv_request_defaults on public.swivv_message_requests;
create trigger swivv_request_defaults
  before insert on public.swivv_message_requests
  for each row execute function public.swivv_request_defaults();

create or replace function public.swivv_request_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  is_sender boolean := me = old.sender_id;
  is_recipient boolean := me = old.recipient_id;
begin
  if me is null or not (is_sender or is_recipient) then
    raise exception 'not a participant' using errcode = '42501';
  end if;
  if new.sender_id <> old.sender_id
     or new.recipient_id <> old.recipient_id
     or new.initial_message <> old.initial_message
     or new.conversation_key <> old.conversation_key then
    raise exception 'request identity is immutable' using errcode = '42501';
  end if;

  -- Recipient decides the requests; sender may only ask for media or cancel.
  if new.status is distinct from old.status then
    if new.status = 'accepted' or new.status = 'declined' then
      if not is_recipient or old.status <> 'pending' then
        raise exception 'only the recipient can answer a pending request' using errcode = '42501';
      end if;
      new.responded_at := now();
      new.voice_requested := false;
      new.files_requested := false;
    elsif new.status = 'cancelled' then
      if not is_sender or old.status <> 'pending' then
        raise exception 'only the sender can cancel a pending request' using errcode = '42501';
      end if;
    else
      raise exception 'invalid status transition' using errcode = '42501';
    end if;
  end if;

  -- Grantee only: false -> true. Either side may revoke (true -> false).
  if new.voice_allowed and not old.voice_allowed then
    if not is_recipient or (old.status <> 'accepted' and new.status <> 'accepted') then
      raise exception 'only the recipient can grant voice' using errcode = '42501';
    end if;
    new.voice_requested := false;
    new.voice_changed_at := now();
  elsif old.voice_allowed and not new.voice_allowed then
    new.voice_changed_at := now();
  end if;

  if new.files_allowed and not old.files_allowed then
    if not is_recipient or (old.status <> 'accepted' and new.status <> 'accepted') then
      raise exception 'only the recipient can grant files' using errcode = '42501';
    end if;
    new.files_requested := false;
    new.files_changed_at := now();
  elsif old.files_allowed and not new.files_allowed then
    new.files_changed_at := now();
  end if;

  -- Sender asks for a feature that is not already granted.
  if new.voice_requested and not old.voice_requested then
    if not is_sender or old.status <> 'accepted' or old.voice_allowed then
      raise exception 'invalid voice request' using errcode = '42501';
    end if;
  end if;
  if new.files_requested and not old.files_requested then
    if not is_sender or old.status <> 'accepted' or old.files_allowed then
      raise exception 'invalid files request' using errcode = '42501';
    end if;
  end if;

  -- Recipient declines a feature request: clear the ask.
  if new.voice_requested = false and old.voice_requested then
    new.voice_changed_at := now();
  end if;
  if new.files_requested = false and old.files_requested then
    new.files_changed_at := now();
  end if;

  return new;
end $$;

drop trigger if exists swivv_request_guard on public.swivv_message_requests;
create trigger swivv_request_guard
  before update on public.swivv_message_requests
  for each row execute function public.swivv_request_guard();

-- ---------------------------------------------------------------------------
-- Notifications (existing table; staff-only insert policy stays untouched)
-- ---------------------------------------------------------------------------

create or replace function public.swivv_request_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  who text := coalesce(nullif(new.sender_name, ''), 'Un membre');
begin
  if tg_op = 'INSERT' then
    insert into public.swivv_notifications (user_id, type, title, message, link)
    values (
      new.recipient_id,
      'message_request',
      'Nouvelle demande de connexion',
      who || ' souhaite te contacter.',
      '/messagerie'
    );
    return new;
  end if;

  if new.status = 'accepted' and old.status = 'pending' then
    insert into public.swivv_notifications (user_id, type, title, message, link)
    values (new.sender_id, 'message_request_accepted', 'Demande acceptée',
            'Ta demande de connexion a été acceptée.', '/messagerie');
  elsif new.voice_requested and not old.voice_requested then
    insert into public.swivv_notifications (user_id, type, title, message, link)
    values (new.recipient_id, 'voice_request', 'Demande de vocaux',
            'Un membre souhaite échanger des vocaux avec toi.', '/messagerie');
  elsif new.files_requested and not old.files_requested then
    insert into public.swivv_notifications (user_id, type, title, message, link)
    values (new.recipient_id, 'files_request', 'Demande de pièces jointes',
            'Un membre souhaite échanger des pièces jointes avec toi.', '/messagerie');
  elsif new.voice_allowed is distinct from old.voice_allowed then
    insert into public.swivv_notifications (user_id, type, title, message, link)
    values (new.sender_id, 'voice_permission', 'Vocaux',
            case when new.voice_allowed then 'Les vocaux sont désormais autorisés.'
                 else 'Les vocaux ne sont plus autorisés.' end,
            '/messagerie');
  elsif new.files_allowed is distinct from old.files_allowed then
    insert into public.swivv_notifications (user_id, type, title, message, link)
    values (new.sender_id, 'files_permission', 'Pièces jointes',
            case when new.files_allowed then 'Les pièces jointes sont désormais autorisées.'
                 else 'Les pièces jointes ne sont plus autorisées.' end,
            '/messagerie');
  end if;
  return new;
end $$;

drop trigger if exists swivv_request_notify on public.swivv_message_requests;
create trigger swivv_request_notify
  after insert or update on public.swivv_message_requests
  for each row execute function public.swivv_request_notify();

-- ---------------------------------------------------------------------------
-- Enforce permissions on the existing delivery path + storage
-- ---------------------------------------------------------------------------

drop policy if exists "deliver to peer" on public.swivv_chats;
create policy "deliver to peer" on public.swivv_chats
  for insert to authenticated
  with check (
    auth.uid() <> user_id
    and sender = 'them'
    and peer_id = 'u:' || (auth.uid())::text
    and public.swivv_can_message(auth.uid(), user_id)
    and (audio_url is null or public.swivv_media_allowed(auth.uid(), user_id, 'voice'))
    and (image_url is null or public.swivv_media_allowed(auth.uid(), user_id, 'files'))
  );

-- Bucket: safe formats only; existing size limit kept.
update storage.buckets
set allowed_mime_types = array[
  'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif'
]
where id = 'swivv-voice';

-- Storage path is `${uid}/${peer}/...` (images under `${peer}/images/...`).
create or replace function public.swivv_storage_media_allowed(object_name text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  parts text[] := string_to_array(object_name, '/');
  peer text;
  peer_uuid uuid;
  kind text := case when object_name like '%/images/%' then 'files' else 'voice' end;
begin
  if auth.uid() is null or parts[1] is distinct from auth.uid()::text then
    return false;
  end if;
  peer := parts[2];
  if peer is null then return true; end if;
  peer := regexp_replace(peer, '^u:', '');
  if peer !~* '^[0-9a-f-]{36}$' then
    return true; -- seed/demo peer ids are not auth users
  end if;
  peer_uuid := peer::uuid;
  return public.swivv_media_allowed(auth.uid(), peer_uuid, kind);
end $$;
grant execute on function public.swivv_storage_media_allowed(text) to authenticated;

drop policy if exists "Swivv voice own upload" on storage.objects;
create policy "Swivv voice own upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'swivv-voice'
    and public.swivv_storage_media_allowed(name)
  );

drop policy if exists "Swivv voice own update" on storage.objects;
create policy "Swivv voice own update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'swivv-voice'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'swivv-voice'
    and public.swivv_storage_media_allowed(name)
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'swivv_message_requests'
  ) then
    alter publication supabase_realtime add table public.swivv_message_requests;
  end if;
end $$;
