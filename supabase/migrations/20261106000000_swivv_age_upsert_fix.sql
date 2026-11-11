-- Fix: profile upserts (INSERT ... ON CONFLICT) fire the before-insert trigger even for
-- existing legacy accounts, so every save failed with AGE_BIRTHDATE_REQUIRED.
-- Existing rows keep saving without a birthdate; a genuinely new profile still needs one.

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
    -- ponytail: the trigger cannot see ON CONFLICT, so a true insert is "no row yet".
    -- Existing accounts stay legacy until they declare a birthdate; new ones are gated.
    if tg_op = 'INSERT' and not exists (
      select 1 from public.swivv_profiles p where p.user_id = new.user_id
    ) then
      raise exception 'AGE_BIRTHDATE_REQUIRED';
    end if;
    return new;
  end if;
  new.data := coalesce(new.data, '{}'::jsonb) || jsonb_build_object('age', v_age);
  return new;
end $$;
