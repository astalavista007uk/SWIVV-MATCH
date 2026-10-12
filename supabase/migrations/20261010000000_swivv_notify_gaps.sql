-- Notification gaps: realtime for social events, member-owned notif rows, server prefs, email outbox.
-- ponytail: additive only (existing notif table/policies untouched) — push/email cron workers if realtime ever needs a fallback
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'swivv_likes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.swivv_likes;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'swivv_matches') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.swivv_matches;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'swivv_profile_views') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.swivv_profile_views;
  END IF;
END $$;

-- Members create their own inbox rows from realtime events (recipient-side creation: senders can never write someone else's inbox).
CREATE POLICY swivv_notif_own_insert ON public.swivv_notifications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY swivv_notif_own_delete ON public.swivv_notifications
  FOR DELETE TO authenticated USING (user_id = auth.uid());
GRANT DELETE ON public.swivv_notifications TO authenticated;

-- Server-side prefs (localStorage stays as offline fallback) + marketing consent record.
CREATE TABLE IF NOT EXISTS public.swivv_notif_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  prefs JSONB NOT NULL DEFAULT '{}'::jsonb,
  marketing BOOLEAN NOT NULL DEFAULT false,
  marketing_at TIMESTAMPTZ,
  digest TEXT NOT NULL DEFAULT 'daily',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.swivv_notif_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY swivv_prefs_own ON public.swivv_notif_prefs
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.swivv_notif_prefs TO authenticated;
GRANT ALL ON public.swivv_notif_prefs TO service_role;

-- Email outbox: idempotency key dedupes retries/webhooks; service-role only (server fns bypass RLS, clients see nothing).
CREATE TABLE IF NOT EXISTS public.swivv_email_log (
  key TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);
ALTER TABLE public.swivv_email_log ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.swivv_email_log TO service_role;
CREATE INDEX IF NOT EXISTS idx_email_log_user ON public.swivv_email_log(user_id, created_at DESC);
