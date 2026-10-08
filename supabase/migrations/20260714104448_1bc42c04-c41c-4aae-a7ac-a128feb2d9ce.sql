
-- Remove the earlier view approach
DROP VIEW IF EXISTS public.profiles_public;

-- Reset SELECT policies: allow authenticated to read profile rows,
-- but rely on column privileges below to hide sensitive fields from non-owners.
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;
CREATE POLICY "Authenticated can view profile rows"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Column-level: revoke read access to sensitive fields from ordinary signed-in users.
REVOKE SELECT (
  phone,
  phone_country_code,
  birthdate,
  gender,
  stripe_account_id,
  stripe_status,
  postal_street,
  postal_city,
  postal_code,
  postal_country,
  notification_prefs
) ON public.profiles FROM authenticated, anon;

-- Owner-only read of their own full profile via SECURITY DEFINER RPC.
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
