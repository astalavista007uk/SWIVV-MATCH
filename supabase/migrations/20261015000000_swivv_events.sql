-- Forward analytics events (signup_completed first; sessions/funnel steps next).
-- History before this table is reconstructed from created_at timestamps and labelled as such.

CREATE TABLE IF NOT EXISTS public.swivv_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS swivv_events_type_at_idx ON public.swivv_events (type, created_at DESC);
CREATE INDEX IF NOT EXISTS swivv_events_user_idx ON public.swivv_events (user_id, created_at);

ALTER TABLE public.swivv_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY swivv_events_insert_own ON public.swivv_events
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY swivv_events_staff_read ON public.swivv_events
  FOR SELECT TO authenticated USING (public.is_staff());
