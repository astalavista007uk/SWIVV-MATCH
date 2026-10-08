-- Fix: Add INSERT policy on notifications table
-- Without this, all client-side notification inserts are silently denied by RLS
-- (service_role bypasses RLS, but the user/anon client does not)
CREATE POLICY "Anyone can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Add index for the notification bell query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, read, created_at DESC);
