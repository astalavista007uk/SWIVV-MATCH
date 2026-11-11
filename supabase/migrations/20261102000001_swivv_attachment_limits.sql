-- SWIVV MATCH: attachment limits, private storage quota, retention cascade.
-- Not applied automatically. Apply 20261102000000_swivv_message_requests.sql first.
--
-- Limits (re-checked by the validate-upload Edge Function):
--   attachment: 1 per message, 2 MB, JPG/JPEG/PNG/WebP/PDF/TXT
--   voice: 5 MB
-- Bucket allowed_mime_types is the backstop; the Edge Function verifies magic bytes.

alter table public.swivv_chats
  add column if not exists file_url text,
  add column if not exists file_name text,
  add column if not exists file_type text,
  add column if not exists file_size int;

-- Old rows may exceed the new caps; enforce on new writes only.
alter table public.swivv_chats
  drop constraint if exists swivv_chats_file_size_check;
alter table public.swivv_chats
  add constraint swivv_chats_file_size_check
  check (file_size is null or file_size between 0 and 2097152);

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp',
      'application/pdf', 'text/plain',
      'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg'
    ]
where id = 'swivv-voice';

-- Per-user storage ledger: quota + abuse monitoring.
create table if not exists public.swivv_storage_usage (
  user_id uuid primary key references auth.users (id) on delete cascade,
  bytes bigint not null default 0 check (bytes >= 0),
  updated_at timestamptz not null default now()
);

alter table public.swivv_storage_usage enable row level security;
grant select on public.swivv_storage_usage to authenticated;
grant all on public.swivv_storage_usage to service_role;

drop policy if exists swivv_storage_usage_staff on public.swivv_storage_usage;
create policy swivv_storage_usage_staff on public.swivv_storage_usage
  for select to authenticated using (public.is_staff());

create or replace function public.swivv_storage_owner(object_name text)
returns uuid language plpgsql immutable as $$
declare
  first text := split_part(object_name, '/', 1);
begin
  if first ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return first::uuid;
  end if;
  return null;
end $$;

create or replace function public.swivv_storage_usage_sync()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uid uuid;
  delta bigint;
  bucket text;
begin
  -- DELETE triggers cannot read NEW (42P17) — branch instead of a WHEN clause.
  if tg_op = 'DELETE' then
    bucket := old.bucket_id;
    uid := public.swivv_storage_owner(old.name);
    delta := -coalesce((old.metadata->>'size')::bigint, 0);
  elsif tg_op = 'UPDATE' then
    -- ponytail: owner moves (renames across folders) are not reattributed — chat
    -- objects are write-once; split into two ledger updates if paths ever move.
    bucket := new.bucket_id;
    uid := public.swivv_storage_owner(new.name);
    delta := coalesce((new.metadata->>'size')::bigint, 0) - coalesce((old.metadata->>'size')::bigint, 0);
  else
    bucket := new.bucket_id;
    uid := public.swivv_storage_owner(new.name);
    delta := coalesce((new.metadata->>'size')::bigint, 0);
  end if;

  if bucket is distinct from 'swivv-voice' or uid is null then
    return null;
  end if;

  insert into public.swivv_storage_usage (user_id, bytes, updated_at)
  values (uid, greatest(delta, 0), now())
  on conflict (user_id) do update
    set bytes = greatest(0, public.swivv_storage_usage.bytes + delta),
        updated_at = now();
  return null;
end $$;

drop trigger if exists swivv_storage_usage_sync on storage.objects;
create trigger swivv_storage_usage_sync
  after insert or delete or update of name, metadata on storage.objects
  for each row execute function public.swivv_storage_usage_sync();

-- Backfill current usage.
insert into public.swivv_storage_usage (user_id, bytes)
select public.swivv_storage_owner(name) as uid, sum(coalesce((metadata->>'size')::bigint, 0))
from storage.objects
where bucket_id = 'swivv-voice'
group by 1
having public.swivv_storage_owner(name) is not null
on conflict (user_id) do update set bytes = excluded.bytes, updated_at = now();

create or replace function public.swivv_storage_quota_ok(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  -- ponytail: 100 MB per user, fixed - per-plan caps if storage ever becomes a paid tier
  select coalesce((select bytes from public.swivv_storage_usage where user_id = uid), 0) < 104857600;
$$;
grant execute on function public.swivv_storage_quota_ok(uuid) to authenticated, service_role;

-- Uploads now go through the validate-upload Edge Function (service role, magic-byte
-- checks). Direct client writes would bypass that, so close them; reads stay private.
drop policy if exists "Swivv voice own upload" on storage.objects;
drop policy if exists "Swivv voice own update" on storage.objects;

-- Retention: the 90-day chat prune now removes media objects client-side (swivv-store).
-- ponytail: orphan sweep is a manual SQL job if objects ever outlive their rows:
--   delete from storage.objects where bucket_id = 'swivv-voice' and created_at < now() - interval '90 days';
