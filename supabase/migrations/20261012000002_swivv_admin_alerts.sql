-- Admin alert centre backing table (the /admin/alerts UI already reads/writes it —
-- it was simply never created). Live-status partial unique index is the dedupe the
-- page relies on: re-fire allowed after resolve/dismiss. Moderator+ (50) manages,
-- any staff reads — same split as swivv_moderation_cases.
-- ponytail: no DELETE grant (the UI never deletes) and no FK on ref_id (alerts point
-- at users/reports/tickets across tables) — hard-delete or FKs if retention ever needs them.
-- The earlier ops-centre migration created an older shape of this table; the
-- alert centre needs the dedupe/source schema below. It holds no rows.
DROP TABLE IF EXISTS public.swivv_admin_alerts CASCADE;
CREATE TABLE IF NOT EXISTS public.swivv_admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  dedupe_key text NOT NULL,
  source text NOT NULL,
  category text NOT NULL,
  kind text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  detail text NOT NULL DEFAULT '',
  ref_kind text,
  ref_id text,
  status text NOT NULL DEFAULT 'open',
  assignee uuid,
  ack_by uuid,
  ack_at timestamptz,
  reason text
);
CREATE UNIQUE INDEX IF NOT EXISTS swivv_admin_alerts_live_dedupe
  ON public.swivv_admin_alerts (dedupe_key)
  WHERE status IN ('open', 'acknowledged', 'in_progress', 'escalated');
ALTER TABLE public.swivv_admin_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS swivv_alerts_select ON public.swivv_admin_alerts;
CREATE POLICY swivv_alerts_select ON public.swivv_admin_alerts
  FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS swivv_alerts_write ON public.swivv_admin_alerts;
CREATE POLICY swivv_alerts_write ON public.swivv_admin_alerts
  FOR ALL TO authenticated USING (public.staff_level() >= 50)
  WITH CHECK (public.staff_level() >= 50);
GRANT SELECT, INSERT, UPDATE ON public.swivv_admin_alerts TO authenticated;
