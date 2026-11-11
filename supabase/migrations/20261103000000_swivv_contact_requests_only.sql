-- SWIVV MATCH: contact requests are the only way to open a conversation.
-- Text, voice notes and files are three separate permissions the recipient grants.
-- A mutual match is announced to both members but grants nothing.

alter table public.swivv_message_requests
  add column if not exists text_allowed boolean not null default false,
  add column if not exists text_changed_at timestamptz;

-- Existing accepted threads were implicitly text-approved; keep them working.
-- ponytail: the member-scoped guard/notify triggers reject the migration role and would spam members; disable user triggers for this backfill, re-enable immediately.
alter table public.swivv_message_requests disable trigger user;
update public.swivv_message_requests set text_allowed = true where status = 'accepted';
alter table public.swivv_message_requests enable trigger user;

create or replace function public.swivv_can_message(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select a <> b
    and not public.is_blocked(a, b)
    and exists (
      select 1 from public.swivv_message_requests r
      where r.conversation_key = public.swivv_pair_key(a, b)
        and r.status = 'accepted'
        and r.text_allowed
    );
$$;

create or replace function public.swivv_media_allowed(a uuid, b uuid, kind text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.swivv_can_message(a, b)
    and exists (
      select 1 from public.swivv_message_requests r
      where r.conversation_key = public.swivv_pair_key(a, b)
        and r.status = 'accepted'
        and case kind
          when 'voice' then r.voice_allowed
          when 'files' then r.files_allowed
          else false
        end
    );
$$;

create or replace function public.swivv_can_request(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select a <> b
    and not public.is_blocked(a, b)
    and not exists (
      select 1 from public.swivv_message_requests r
      where r.conversation_key = public.swivv_pair_key(a, b)
        and r.status = 'accepted'
    )
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

create or replace function public.swivv_request_defaults()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  snap jsonb;
begin
  new.status := 'pending';
  new.text_allowed := false;
  new.text_changed_at := null;
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

  -- Recipient decides the request; sender may only ask for media or cancel.
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

  -- Text is a permission like the others: the recipient grants it, either side may revoke.
  if new.text_allowed is distinct from old.text_allowed then
    if new.text_allowed and (
      not is_recipient
      or (old.status <> 'accepted' and new.status <> 'accepted')
    ) then
      raise exception 'only the recipient can grant text' using errcode = '42501';
    end if;
    new.text_changed_at := now();
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
  elsif new.text_allowed is distinct from old.text_allowed then
    insert into public.swivv_notifications (user_id, type, title, message, link)
    values (new.sender_id, 'text_permission', 'Messagerie',
            case when new.text_allowed then 'Les messages texte sont désormais autorisés.'
                 else 'Les messages texte ne sont plus autorisés.' end,
            '/messagerie');
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

drop trigger if exists swivv_request_defaults on public.swivv_message_requests;
create trigger swivv_request_defaults
  before insert on public.swivv_message_requests
  for each row execute function public.swivv_request_defaults();

drop trigger if exists swivv_request_guard on public.swivv_message_requests;
create trigger swivv_request_guard
  before update on public.swivv_message_requests
  for each row execute function public.swivv_request_guard();

drop trigger if exists swivv_request_notify on public.swivv_message_requests;
create trigger swivv_request_notify
  after insert or update on public.swivv_message_requests
  for each row execute function public.swivv_request_notify();
