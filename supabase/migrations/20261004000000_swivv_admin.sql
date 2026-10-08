-- SWIVV MATCH ADMIN backend: roles extension, moderation/support/verification/notes/
-- announcements/notifications/status/audit tables + RLS.
-- Reuses existing public.user_roles / app_role / has_role(). New role *checks* use
-- text comparison so this migration stays a single transaction (ALTER TYPE .. ADD
-- VALUE can't be used in the same txn that references the new values).
-- First super admin (via Studio SQL editor or service_role):
--   INSERT INTO public.user_roles (user_id, role) VALUES ('<auth-uuid>', 'super_admin');

-- 1. Extend role enum for future inserts (existing values untouched).
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'analyst';

-- 2. Staff helpers (SECURITY DEFINER so RLS can read user_roles).
CREATE OR REPLACE FUNCTION public.staff_level()
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(MAX(CASE ur.role::text
    WHEN 'super_admin' THEN 100 WHEN 'admin' THEN 80 WHEN 'moderator' THEN 50
    WHEN 'support' THEN 30 WHEN 'analyst' THEN 10 ELSE 0 END), 0)
  FROM public.user_roles ur WHERE ur.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.staff_level() > 0;
$$;

-- 3. Tables.
CREATE TABLE IF NOT EXISTS public.swivv_user_status (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','suspended','banned','deleted')),
  reason text, until timestamptz, updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.swivv_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL, description text, evidence_url text,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','investigating','waiting','resolved','dismissed')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','critical')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution text, resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS swivv_reports_status_idx ON public.swivv_reports (status);
CREATE INDEX IF NOT EXISTS swivv_reports_reported_idx ON public.swivv_reports (reported_user_id);

CREATE TABLE IF NOT EXISTS public.swivv_moderation_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id uuid REFERENCES public.swivv_reports(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','investigating','waiting','closed')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','critical')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_taken text, reason text, created_by uuid,
  closed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS swivv_cases_status_idx ON public.swivv_moderation_cases (status);
CREATE INDEX IF NOT EXISTS swivv_cases_subject_idx ON public.swivv_moderation_cases (subject_user_id);

CREATE TABLE IF NOT EXISTS public.swivv_internal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_kind text NOT NULL CHECK (target_kind IN ('user','report','case','ticket')),
  target_id text NOT NULL, author_id uuid, body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS swivv_notes_target_idx
  ON public.swivv_internal_notes (target_kind, target_id);

CREATE TABLE IF NOT EXISTS public.swivv_support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject text NOT NULL, category text NOT NULL DEFAULT 'other',
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','critical')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','assigned','waiting_user','waiting_internal','resolved','closed')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS swivv_tickets_status_idx ON public.swivv_support_tickets (status);
CREATE INDEX IF NOT EXISTS swivv_tickets_user_idx ON public.swivv_support_tickets (user_id);

CREATE TABLE IF NOT EXISTS public.swivv_support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.swivv_support_tickets(id) ON DELETE CASCADE,
  author_id uuid, is_staff boolean NOT NULL DEFAULT false,
  body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS swivv_support_msg_ticket_idx
  ON public.swivv_support_messages (ticket_id, created_at);

CREATE TABLE IF NOT EXISTS public.swivv_verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('email','phone','profile','identity')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','expired')),
  reviewed_by uuid, reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS swivv_verify_status_idx
  ON public.swivv_verification_requests (status);

CREATE TABLE IF NOT EXISTS public.swivv_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, body text NOT NULL,
  audience text NOT NULL DEFAULT 'all', target_country text,
  scheduled_for timestamptz, sent_at timestamptz,
  created_by uuid, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.swivv_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info', title text NOT NULL,
  message text, link text, read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS swivv_notif_user_idx
  ON public.swivv_notifications (user_id, read, created_at DESC);

-- ponytail: append-only audit (no UPDATE/DELETE policies at all) — super_admin purge via service_role if retention ever demands it
CREATE TABLE IF NOT EXISTS public.swivv_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid, action text NOT NULL,
  target_kind text, target_id text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS swivv_audit_actor_idx
  ON public.swivv_audit_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS swivv_audit_target_idx
  ON public.swivv_audit_log (target_kind, target_id);

-- 4. RLS.
ALTER TABLE public.swivv_user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swivv_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swivv_moderation_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swivv_internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swivv_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swivv_support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swivv_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swivv_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swivv_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swivv_audit_log ENABLE ROW LEVEL SECURITY;

-- Staff read-all (analysts included: SELECT only, no writes below).
CREATE POLICY swivv_admin_select ON public.swivv_user_status
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY swivv_admin_select ON public.swivv_reports
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY swivv_admin_select ON public.swivv_moderation_cases
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY swivv_admin_select ON public.swivv_internal_notes
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY swivv_admin_select ON public.swivv_support_tickets
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY swivv_admin_select ON public.swivv_support_messages
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY swivv_admin_select ON public.swivv_verification_requests
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY swivv_admin_select ON public.swivv_announcements
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY swivv_admin_select ON public.swivv_audit_log
  FOR SELECT TO authenticated USING (public.is_staff());

-- User account actions: admin+ only (level 80).
CREATE POLICY swivv_status_write ON public.swivv_user_status
  FOR ALL TO authenticated USING (public.staff_level() >= 80)
  WITH CHECK (public.staff_level() >= 80);

-- Reports moderation workflow: moderator+ (50). Anyone authed can file one.
CREATE POLICY swivv_reports_file ON public.swivv_reports
  FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY swivv_reports_moderate ON public.swivv_reports
  FOR UPDATE TO authenticated USING (public.staff_level() >= 50)
  WITH CHECK (public.staff_level() >= 50);

-- Cases + verification: moderator+ (50).
CREATE POLICY swivv_cases_write ON public.swivv_moderation_cases
  FOR ALL TO authenticated USING (public.staff_level() >= 50)
  WITH CHECK (public.staff_level() >= 50);
CREATE POLICY swivv_verify_write ON public.swivv_verification_requests
  FOR ALL TO authenticated USING (public.staff_level() >= 50)
  WITH CHECK (public.staff_level() >= 50);

-- Notes, tickets, announcements: support+ (30); announcements create admin+ (80).
CREATE POLICY swivv_notes_write ON public.swivv_internal_notes
  FOR ALL TO authenticated USING (public.staff_level() >= 30)
  WITH CHECK (public.staff_level() >= 30);
CREATE POLICY swivv_tickets_write ON public.swivv_support_tickets
  FOR ALL TO authenticated USING (public.staff_level() >= 30)
  WITH CHECK (public.staff_level() >= 30);
CREATE POLICY swivv_announce_write ON public.swivv_announcements
  FOR ALL TO authenticated USING (public.staff_level() >= 80)
  WITH CHECK (public.staff_level() >= 80);

-- Ticket owners: file tickets, read own, reply on own open tickets.
CREATE POLICY swivv_tickets_own_read ON public.swivv_support_tickets
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY swivv_tickets_own_file ON public.swivv_support_tickets
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY swivv_ticket_msg_own_read ON public.swivv_support_messages
  FOR SELECT TO authenticated USING (
    author_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.swivv_support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()));
CREATE POLICY swivv_ticket_msg_own_reply ON public.swivv_support_messages
  FOR INSERT TO authenticated WITH CHECK (
    is_staff = false AND author_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.swivv_support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()));
CREATE POLICY swivv_ticket_msg_staff ON public.swivv_support_messages
  FOR INSERT TO authenticated WITH CHECK (public.staff_level() >= 30);

-- Reporters can file verification requests for themselves.
CREATE POLICY swivv_verify_own_file ON public.swivv_verification_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- In-app notifications: user reads/acks own; staff sends.
CREATE POLICY swivv_notif_own ON public.swivv_notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY swivv_notif_own_ack ON public.swivv_notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY swivv_notif_staff_send ON public.swivv_notifications
  FOR INSERT TO authenticated WITH CHECK (public.staff_level() >= 30);

-- Audit: staff append (no update/delete by design).
CREATE POLICY swivv_audit_append ON public.swivv_audit_log
  FOR INSERT TO authenticated WITH CHECK (public.staff_level() >= 30);

GRANT SELECT, INSERT, UPDATE ON public.swivv_user_status TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.swivv_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.swivv_moderation_cases TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.swivv_internal_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.swivv_support_tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.swivv_support_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.swivv_verification_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.swivv_announcements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.swivv_notifications TO authenticated;
GRANT SELECT, INSERT ON public.swivv_audit_log TO authenticated;
