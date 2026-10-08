-- Let super_admin manage staff roles from the admin UI (all other roles: read-only as before).
CREATE POLICY swivv_roles_super_write ON public.user_roles
  FOR ALL TO authenticated USING (public.staff_level() = 100)
  WITH CHECK (public.staff_level() = 100);
