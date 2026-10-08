-- Real member profiles must be readable by other members (discovery), unless hidden.
-- ponytail: authenticated-only, hidden flag respected — a masked public view if profiles ever hold sensitive fields
drop policy if exists "public readable" on public.swivv_profiles;
create policy "public readable" on public.swivv_profiles
  for select to authenticated
  using (auth.uid() = user_id or coalesce((data ->> 'profileHidden')::boolean, false) = false);
