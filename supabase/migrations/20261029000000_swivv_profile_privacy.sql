-- Discovery must respect the hidden flag. The later USING(true) policy was OR'd with
-- the hidden-aware one (permissive policies OR), so "profileHidden" never hid anything.
DROP POLICY IF EXISTS profiles_public_read ON public.swivv_profiles;
DROP POLICY IF EXISTS "public readable" ON public.swivv_profiles;
CREATE POLICY "public readable" ON public.swivv_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR coalesce((data ->> 'profileHidden')::boolean, false) = false);

-- Exact date of birth is never displayed (age is) and should not sit in the blob every
-- member can read. Writes stop persisting it at the saveMyProfile choke point.
UPDATE public.swivv_profiles SET data = data - 'birthdate' WHERE data ? 'birthdate';

-- ponytail: the base table is still column-selectable by authenticated members (RLS gates
-- rows, not columns), so a hand-written query can still read income/ethnicity etc. — those
-- are shown on the profile by design. If the whole blob must close: revoke SELECT (data),
-- add get_my_profile()/get_public_profile() RPCs and a lean feed view.
