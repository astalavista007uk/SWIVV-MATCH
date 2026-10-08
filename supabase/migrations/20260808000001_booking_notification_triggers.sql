-- Database-level booking notification triggers.
-- These guarantee that in-app notification rows are created regardless of
-- what happens in application code. Web Push / email are still handled by
-- the server functions (notifyUser / sendEmail), but this ensures the
-- notification bell always shows the right thing.
--
-- Dedup: each trigger checks whether a notification of the same type was
-- already inserted in the last 10 seconds — if the application code already
-- fired one, the trigger skips to avoid duplicates.

-- ─── Booking created → notify provider + customer ───

CREATE OR REPLACE FUNCTION public.notify_booking_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify the service provider (skip if app code already did)
  IF NOT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = NEW.sitter_id AND type = 'new_booking'
      AND created_at > now() - interval '10 seconds'
  ) THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (NEW.sitter_id, 'new_booking', 'New booking request',
            'You have a new booking request to review.', '/bookings');
  END IF;

  -- Notify the customer (skip if app code already did)
  IF NOT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = NEW.owner_id AND type = 'booking_sent'
      AND created_at > now() - interval '10 seconds'
  ) THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (NEW.owner_id, 'booking_sent', 'Booking request sent',
            'Your booking request has been sent to the provider.', '/bookings');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_booking_created ON public.bookings;
CREATE TRIGGER trg_notify_booking_created
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_booking_created();

-- ─── Booking status changed → notify the other party ───

CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'confirmed' THEN
      IF NOT EXISTS (SELECT 1 FROM public.notifications
        WHERE user_id = NEW.owner_id AND type = 'booking_confirmed'
          AND created_at > now() - interval '10 seconds') THEN
        INSERT INTO public.notifications (user_id, type, title, message, link)
        VALUES (NEW.owner_id, 'booking_confirmed', 'Booking accepted!',
                'Your booking request has been accepted.', '/bookings');
      END IF;
    ELSIF NEW.status = 'completed' THEN
      IF NOT EXISTS (SELECT 1 FROM public.notifications
        WHERE user_id = NEW.owner_id AND type = 'booking_completed'
          AND created_at > now() - interval '10 seconds') THEN
        INSERT INTO public.notifications (user_id, type, title, message, link)
        VALUES (NEW.owner_id, 'booking_completed', 'Booking completed',
                'The booking has been marked as completed.', '/bookings');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.notifications
        WHERE user_id = NEW.sitter_id AND type = 'booking_completed'
          AND created_at > now() - interval '10 seconds') THEN
        INSERT INTO public.notifications (user_id, type, title, message, link)
        VALUES (NEW.sitter_id, 'booking_completed', 'Booking completed',
                'The booking has been marked as completed.', '/bookings');
      END IF;
    ELSIF NEW.status = 'cancelled' THEN
      IF NOT EXISTS (SELECT 1 FROM public.notifications
        WHERE user_id = NEW.owner_id AND type = 'booking_cancelled'
          AND created_at > now() - interval '10 seconds') THEN
        INSERT INTO public.notifications (user_id, type, title, message, link)
        VALUES (NEW.owner_id, 'booking_cancelled', 'Booking cancelled',
                'The booking has been cancelled.', '/bookings');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.notifications
        WHERE user_id = NEW.sitter_id AND type = 'booking_cancelled'
          AND created_at > now() - interval '10 seconds') THEN
        INSERT INTO public.notifications (user_id, type, title, message, link)
        VALUES (NEW.sitter_id, 'booking_cancelled', 'Booking cancelled',
                'The booking has been cancelled.', '/bookings');
      END IF;
    END IF;
  END IF;

  -- Payment status changed to paid → notify provider
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status AND NEW.payment_status = 'paid' THEN
    IF NOT EXISTS (SELECT 1 FROM public.notifications
      WHERE user_id = NEW.sitter_id AND type = 'payment_received'
        AND created_at > now() - interval '10 seconds') THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (NEW.sitter_id, 'payment_received', 'Payment received',
              'You have received a payment for a booking.', '/earnings');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_booking_status ON public.bookings;
CREATE TRIGGER trg_notify_booking_status
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_booking_status_change();
