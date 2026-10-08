-- SWIVV real-to-real discovery: dating profiles are public to logged-in members (own writes unchanged).
alter table public.swivv_profiles enable row level security;

drop policy if exists profiles_public_read on public.swivv_profiles;
create policy profiles_public_read on public.swivv_profiles
  for select to authenticated
  using (true);
