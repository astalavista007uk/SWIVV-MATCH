-- Fix: "permission denied for table notifications" when accepting/cancelling bookings.
--
-- Root cause:
--   1. The booking triggers (notify_booking_created / notify_booking_status_change)
--      are NOT SECURITY DEFINER, so they execute with the privileges of whichever
--      role performed the booking INSERT/UPDATE. If that role lacks INSERT/SELECT
--      on public.notifications, the whole statement fails.
--   2. The GRANT statements from 20260731000005_grant_notifications.sql were not
--      applied to the live database (they may have been skipped or lost).
--
-- This migration is idempotent and safe to re-run.

-- ─── 1. Table privileges on notifications ───
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT ON public.notifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO service_role;

-- ─── 2. Trigger functions → SECURITY DEFINER ───
-- They will execute as their owner (postgres), which owns the notifications
-- table, so the notification insert no longer depends on the calling role.
DO $$
BEGIN
  ALTER FUNCTION public.notify_booking_created() SECURITY DEFINER;
  ALTER FUNCTION public.notify_booking_created() SET search_path = public;
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'notify_booking_created does not exist yet — skipping';
END $$;

DO $$
BEGIN
  ALTER FUNCTION public.notify_booking_status_change() SECURITY DEFINER;
  ALTER FUNCTION public.notify_booking_status_change() SET search_path = public;
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'notify_booking_status_change does not exist yet — skipping';
END $$;

-- ─── 3. Make sure the triggers exist ───
-- (Re-assert in case 20260808000001 was partially applied.)
DROP TRIGGER IF EXISTS trg_notify_booking_created ON public.bookings;
CREATE TRIGGER trg_notify_booking_created
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_booking_created();

DROP TRIGGER IF EXISTS trg_notify_booking_status ON public.bookings;
CREATE TRIGGER trg_notify_booking_status
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_booking_status_change();
