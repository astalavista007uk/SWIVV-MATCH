ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS listing_page_url TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pet_names_display TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS provider_display_title TEXT;
