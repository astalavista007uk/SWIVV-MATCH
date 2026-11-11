-- Age assurance (18+): the birthdate lives in its own staff-only table, never in the
-- publicly readable profile row. The database, not the client, derives the age.
--
-- Statuses: SELF_DECLARED | VERIFICATION_PENDING | AGE_VERIFIED | UNDER_18 |
--           VERIFICATION_FAILED | MANUAL_REVIEW
--
-- No identity documents are collected here. A future external provider is expected to
-- return only ">= 18" (signed result, provider_ref) — never a document or document number.

create table if not exists public.swivv_age_assurance (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  birthdate    date not null,
  status       text not null default 'SELF_DECLARED'
               check (status in ('SELF_DECLARED', 'VERIFICATION_PENDING', 'AGE_VERIFIED',
                                 'UNDER_18', 'VERIFICATION_FAILED', 'MANUAL_REVIEW')),
  terms_version text,
  provider_ref  text,
  declared_at  timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.swivv_age_assurance enable row level security;

-- A member files their own declaration and can correct their birthdate; they can never
-- write a verified status. Only staff/service_role update status.
drop policy if exists age_own_insert on public.swivv_age_assurance;
create policy age_own_insert on public.swivv_age_assurance
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'SELF_DECLARED');

drop policy if exists age_own_update on public.swivv_age_assurance;
create policy age_own_update on public.swivv_age_assurance
  for update to authenticated
  using (user_id = auth.uid() and status = 'SELF_DECLARED')
  with check (user_id = auth.uid() and status = 'SELF_DECLARED');

drop policy if exists age_read on public.swivv_age_assurance;
create policy age_read on public.swivv_age_assurance
  for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

grant select, insert, update on public.swivv_age_assurance to authenticated;
grant all on public.swivv_age_assurance to service_role;

-- Server-side age check: impossible dates, future dates and under-18 are rejected, so a
-- forged request cannot create an underage account. The status is never client-set.
create or replace function public.swivv_age_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_age   int;
begin
  if new.birthdate is null then
    raise exception 'AGE_BIRTHDATE_REQUIRED';
  end if;
  if new.birthdate > v_today then
    raise exception 'AGE_BIRTHDATE_FUTURE';
  end if;
  if new.birthdate < date '1900-01-01' then
    raise exception 'AGE_BIRTHDATE_INVALID';
  end if;
  v_age := extract(year from age(v_today, new.birthdate))::int;
  if v_age < 18 then
    raise exception 'AGE_UNDER_18';
  end if;

  if coalesce(auth.role(), 'service_role') <> 'service_role' then
    if tg_op = 'UPDATE' and new.birthdate is not distinct from old.birthdate then
      new.status := old.status;
      new.declared_at := old.declared_at;
    else
      new.status := 'SELF_DECLARED';
      new.declared_at := now();
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists swivv_age_guard on public.swivv_age_assurance;
create trigger swivv_age_guard before insert or update on public.swivv_age_assurance
  for each row execute function public.swivv_age_guard();

-- The profile's data.age is always the server-derived value. Accounts created before this
-- migration have no assurance row and keep saving (legacy); new profiles require one.
create or replace function public.swivv_profile_age_sync() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_age int;
begin
  if coalesce(auth.role(), 'service_role') = 'service_role' then
    return new;
  end if;
  select extract(year from age((now() at time zone 'utc')::date, birthdate))::int
    into v_age
    from public.swivv_age_assurance
   where user_id = new.user_id;

  if v_age is null then
    if tg_op = 'INSERT' then
      raise exception 'AGE_BIRTHDATE_REQUIRED';
    end if;
    return new;
  end if;
  new.data := coalesce(new.data, '{}'::jsonb) || jsonb_build_object('age', v_age);
  return new;
end $$;

drop trigger if exists swivv_profile_age_sync on public.swivv_profiles;
create trigger swivv_profile_age_sync before insert or update on public.swivv_profiles
  for each row execute function public.swivv_profile_age_sync();
