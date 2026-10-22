-- SWIVV ops centre, stage 1: admin alerts table + server-side audit triggers
-- for consequential sanctions (user status) and verification decisions.
-- Client audit() stays for UI-only views; triggers cannot be dropped or spoofed.

-- 1. Alerts inbox for the Centre d'alertes page.
CREATE TABLE IF NOT EXISTS public.swivv_admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  severity text NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info', 'warning', 'critical')),
  title text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'acknowledged', 'resolved')),
  ack_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ack_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS swivv_alerts_status_idx
  ON public.swivv_admin_alerts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS swivv_alerts_kind_idx
  ON public.swivv_admin_alerts (kind, status);

ALTER TABLE public.swivv_admin_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY swivv_alerts_select ON public.swivv_admin_alerts
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY swivv_alerts_insert ON public.swivv_admin_alerts
  FOR INSERT TO authenticated WITH CHECK (public.staff_level() >= 50);
CREATE POLICY swivv_alerts_ack ON public.swivv_admin_alerts
  FOR UPDATE TO authenticated USING (public.staff_level() >= 30)
  WITH CHECK (public.staff_level() >= 30);

-- 2. Trigger-written audit for sanctions (insert = new sanction, update = change).
CREATE OR REPLACE FUNCTION public.swivv_audit_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.swivv_audit_log (actor_id, action, target_kind, target_id, metadata)
    VALUES (auth.uid(), 'user_status.' || NEW.status, 'user', NEW.user_id::text,
      jsonb_build_object('reason', NEW.reason, 'until', NEW.until));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS swivv_user_status_audit ON public.swivv_user_status;
CREATE TRIGGER swivv_user_status_audit
  AFTER INSERT OR UPDATE ON public.swivv_user_status
  FOR EACH ROW EXECUTE FUNCTION public.swivv_audit_status_change();

-- 3. Trigger-written audit for verification decisions.
CREATE OR REPLACE FUNCTION public.swivv_audit_verification_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.swivv_audit_log (actor_id, action, target_kind, target_id, metadata)
    VALUES (auth.uid(), 'verification.' || NEW.status, 'verification', NEW.id::text,
      jsonb_build_object('user_id', NEW.user_id, 'kind', NEW.kind));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS swivv_verification_audit ON public.swivv_verification_requests;
CREATE TRIGGER swivv_verification_audit
  AFTER UPDATE ON public.swivv_verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.swivv_audit_verification_change();
