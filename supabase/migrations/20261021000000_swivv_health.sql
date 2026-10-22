-- Technical health: client-side error log (admin UI coverage first).
-- No passwords, tokens, message bodies, or personal data in messages (enforced at write time, not by schema).

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
CREATE POLICY swivv_cerr_insert ON public.swivv_client_errors
  FOR INSERT TO authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY swivv_cerr_staff_read ON public.swivv_client_errors
  FOR SELECT TO authenticated USING (public.is_staff());
