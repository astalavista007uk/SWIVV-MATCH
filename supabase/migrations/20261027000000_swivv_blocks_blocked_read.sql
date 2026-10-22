-- Blocked-side visibility: a blocked member can see blocks held against them.
-- ponytail: deliberate disclosure (the blocked user learns the blocker's id — powers the blocked banner/icon + unblock-restore) — drop this policy if blocks ever need to go silent again
DROP POLICY IF EXISTS swivv_blocks_blocked_read ON public.swivv_blocks;
CREATE POLICY swivv_blocks_blocked_read ON public.swivv_blocks
  FOR SELECT TO authenticated USING (blocked_id = auth.uid());
