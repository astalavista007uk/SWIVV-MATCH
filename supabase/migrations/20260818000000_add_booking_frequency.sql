-- Add frequency to bookings for recurring services (dog walking, daycare, drop-in visits).
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS frequency TEXT;
