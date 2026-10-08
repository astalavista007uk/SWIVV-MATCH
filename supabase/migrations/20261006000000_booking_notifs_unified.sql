-- Unify in-app notifications on public.swivv_notifications (the table the
-- bell + /notifications page actually read). The booking triggers wrote to
-- public.notifications, which nothing reads, so booking alerts never showed.
-- Old rows stay in public.notifications as history.
-- ponytail: sed-style replace, not rewritten functions — new types/columns still go through the original migration files

CREATE OR REPLACE FUNCTION public.notify_booking_created()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.swivv_notifications
    WHERE user_id = NEW.sitter_id AND type = 'new_booking'
      AND created_at > now() - interval '10 seconds'
  ) THEN
    INSERT INTO public.swivv_notifications (user_id, type, title, message, link)
    VALUES (NEW.sitter_id, 'new_booking', 'New booking request',
            'You have a new booking request to review.', '/bookings');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.swivv_notifications
    WHERE user_id = NEW.owner_id AND type = 'booking_sent'
      AND created_at > now() - interval '10 seconds'
  ) THEN
    INSERT INTO public.swivv_notifications (user_id, type, title, message, link)
    VALUES (NEW.owner_id, 'booking_sent', 'Booking request sent',
            'Your booking request has been sent to the provider.', '/bookings');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'confirmed' THEN
      IF NOT EXISTS (SELECT 1 FROM public.swivv_notifications
        WHERE user_id = NEW.owner_id AND type = 'booking_confirmed'
          AND created_at > now() - interval '10 seconds') THEN
        INSERT INTO public.swivv_notifications (user_id, type, title, message, link)
        VALUES (NEW.owner_id, 'booking_confirmed', 'Booking accepted!',
                'Your booking request has been accepted.', '/bookings');
      END IF;
    ELSIF NEW.status = 'completed' THEN
      IF NOT EXISTS (SELECT 1 FROM public.swivv_notifications
        WHERE user_id = NEW.owner_id AND type = 'booking_completed'
          AND created_at > now() - interval '10 seconds') THEN
        INSERT INTO public.swivv_notifications (user_id, type, title, message, link)
        VALUES (NEW.owner_id, 'booking_completed', 'Booking completed',
                'The booking has been marked as completed.', '/bookings');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.swivv_notifications
        WHERE user_id = NEW.sitter_id AND type = 'booking_completed'
          AND created_at > now() - interval '10 seconds') THEN
        INSERT INTO public.swivv_notifications (user_id, type, title, message, link)
        VALUES (NEW.sitter_id, 'booking_completed', 'Booking completed',
                'The booking has been marked as completed.', '/bookings');
      END IF;
    ELSIF NEW.status = 'cancelled' THEN
      IF NOT EXISTS (SELECT 1 FROM public.swivv_notifications
        WHERE user_id = NEW.owner_id AND type = 'booking_cancelled'
          AND created_at > now() - interval '10 seconds') THEN
        INSERT INTO public.swivv_notifications (user_id, type, title, message, link)
        VALUES (NEW.owner_id, 'booking_cancelled', 'Booking cancelled',
                'The booking has been cancelled.', '/bookings');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.swivv_notifications
        WHERE user_id = NEW.sitter_id AND type = 'booking_cancelled'
          AND created_at > now() - interval '10 seconds') THEN
        INSERT INTO public.swivv_notifications (user_id, type, title, message, link)
        VALUES (NEW.sitter_id, 'booking_cancelled', 'Booking cancelled',
                'The booking has been cancelled.', '/bookings');
      END IF;
    END IF;
  END IF;

  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status AND NEW.payment_status = 'paid' THEN
    IF NOT EXISTS (SELECT 1 FROM public.swivv_notifications
      WHERE user_id = NEW.sitter_id AND type = 'payment_received'
        AND created_at > now() - interval '10 seconds') THEN
      INSERT INTO public.swivv_notifications (user_id, type, title, message, link)
      VALUES (NEW.sitter_id, 'payment_received', 'Payment received',
              'You have received a payment for a booking.', '/earnings');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bell badge subscribes to this table; without the publication entry the
-- subscription silently does nothing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'swivv_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.swivv_notifications;
  END IF;
END $$;
