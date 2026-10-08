-- Store display info so bookings page shows the same name/photo the user saw when booking
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS provider_display_name text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS provider_display_photo text;
