-- SWIVV dating profiles: one row per auth user, full profile as JSONB.
-- ponytail: jsonb over 40 columns, split out matchable columns if queries filter server-side
create table if not exists public.swivv_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.swivv_profiles enable row level security;

grant select, insert, update, delete on public.swivv_profiles to authenticated;

drop policy if exists "own row" on public.swivv_profiles;
create policy "own row" on public.swivv_profiles
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
