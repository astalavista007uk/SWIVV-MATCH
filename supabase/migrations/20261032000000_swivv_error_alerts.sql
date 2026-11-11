-- Page crashes are the biggest failure we can ship, so every logged client error becomes a
-- critical alert in the ops centre (the UI already sorts critical first and notifies admins).
-- Dedupe reuses swivv_admin_alerts_live_dedupe: one live alert per message+url signature.
--
-- The error table was declared in 20261021000000_swivv_health.sql but never applied to this
-- project, so it is created here too (same shape, IF NOT EXISTS keeps both files safe to re-run).
--
-- ponytail: anonymous visitors may insert (they are exactly who hits a broken page first) —
-- that is an open write surface. Upgrade to a security-definer RPC with a per-IP bucket if the
-- table ever gets spammed. No user attribution is stored: the page is the signal, not the person.

CREATE TABLE IF NOT EXISTS public.swivv_client_errors (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message text NOT NULL,
  source text,
  url text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS swivv_cerr_at_idx ON public.swivv_client_errors (created_at DESC);

ALTER TABLE public.swivv_client_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS swivv_cerr_insert ON public.swivv_client_errors;
CREATE POLICY swivv_cerr_insert ON public.swivv_client_errors
  FOR INSERT TO authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS swivv_cerr_insert_anon ON public.swivv_client_errors;
CREATE POLICY swivv_cerr_insert_anon ON public.swivv_client_errors
  FOR INSERT TO anon WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS swivv_cerr_staff_read ON public.swivv_client_errors;
CREATE POLICY swivv_cerr_staff_read ON public.swivv_client_errors
  FOR SELECT TO authenticated USING (public.is_staff());

GRANT SELECT, INSERT ON public.swivv_client_errors TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.swivv_client_error_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sig text;
BEGIN
  sig := left(coalesce(NEW.url, '') || '|' || coalesce(NEW.message, ''), 180);
  INSERT INTO public.swivv_admin_alerts
    (dedupe_key, source, category, kind, severity, title, detail, ref_kind, ref_id)
  VALUES (
    'error:' || md5(sig), 'errors', 'page', 'client', 'critical',
    'Page en erreur — ' || left(coalesce(NEW.message, 'Erreur client'), 110),
    jsonb_build_object('url', NEW.url, 'source', NEW.source, 'at', NEW.created_at),
    'path', NEW.url
  )
  ON CONFLICT DO NOTHING;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS swivv_client_error_alert ON public.swivv_client_errors;
CREATE TRIGGER swivv_client_error_alert
  AFTER INSERT ON public.swivv_client_errors
  FOR EACH ROW EXECUTE FUNCTION public.swivv_client_error_alert();
