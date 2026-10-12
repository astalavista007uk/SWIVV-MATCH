-- Member stats page: let members read their OWN received activity.
-- ponytail: additive SELECT-only policies (existing write-own policies untouched) — likes/views received + own reports; never who-blocked-me or others' report text (no policy grants those)
CREATE POLICY swivv_likes_read_received ON public.swivv_likes
  FOR SELECT TO authenticated USING (auth.uid() = liked_id);
CREATE POLICY swivv_views_read_received ON public.swivv_profile_views
  FOR SELECT TO authenticated USING (auth.uid() = viewed_id);
CREATE POLICY swivv_reports_own_read ON public.swivv_reports
  FOR SELECT TO authenticated USING (reporter_id = auth.uid());
