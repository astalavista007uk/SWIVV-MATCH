
-- Drop permissive SELECT policies
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;

-- Owner-or-admin SELECT on base table
CREATE POLICY "Users can view own profile or admins can view all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- Public view with only safe fields (runs as view owner, bypasses base-table RLS)
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = off) AS
SELECT
  id,
  full_name,
  avatar_url,
  username,
  bio,
  location,
  provider_categories,
  user_type,
  last_seen_at,
  created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated;
