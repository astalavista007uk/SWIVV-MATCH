-- Admin investigations need what normal RLS hides: staff read of chat copies
-- (harassment cases) and admin edit of profile data (photo removal).
-- ponytail: full-row UPDATE for admins (no column firewall) — column-level checks via trigger if PII edits ever need restricting
CREATE POLICY swivv_chats_staff_read ON public.swivv_chats
  FOR SELECT TO authenticated USING (public.staff_level() >= 50);

CREATE POLICY swivv_profiles_admin_write ON public.swivv_profiles
  FOR UPDATE TO authenticated USING (public.staff_level() >= 80)
  WITH CHECK (public.staff_level() >= 80);

GRANT SELECT ON public.swivv_chats TO authenticated;
GRANT UPDATE ON public.swivv_profiles TO authenticated;
