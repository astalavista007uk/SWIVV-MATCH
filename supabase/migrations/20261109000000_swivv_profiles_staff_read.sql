-- Admin directory reads swivv_profiles with the signed-in client, so the hidden-aware
-- member policy also hid every test/demo profile (profileHidden = true) from staff.
drop policy if exists profiles_staff_read on public.swivv_profiles;
create policy profiles_staff_read on public.swivv_profiles
  for select to authenticated
  using (public.is_staff());
