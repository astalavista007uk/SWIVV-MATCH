-- Users must read their own moderation status (drives the client lockout gate);
-- they may only delete it when it is an expired suspension (bans are never self-clearable).
CREATE POLICY swivv_status_own_read ON public.swivv_user_status
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY swivv_status_expired_self_clear ON public.swivv_user_status
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status = 'suspended' AND until IS NOT NULL AND until <= now());

GRANT SELECT, DELETE ON public.swivv_user_status TO authenticated;
