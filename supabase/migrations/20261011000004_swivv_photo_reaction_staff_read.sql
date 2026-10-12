-- Photo reactions: staff read-backstop (member page is staff-gated; same pattern as swivv_likes_write_own).
-- ponytail: SELECT-only for staff — members keep exclusive write on their own rows; tighten to staff_level() >= 50 if support ever loses member-page access
CREATE POLICY swivv_photoreact_staff_read ON public.swivv_photo_reactions
  FOR SELECT TO authenticated USING (public.staff_level() >= 10);
CREATE POLICY swivv_photoreact_ev_staff_read ON public.swivv_photo_reaction_events
  FOR SELECT TO authenticated USING (public.staff_level() >= 10);
