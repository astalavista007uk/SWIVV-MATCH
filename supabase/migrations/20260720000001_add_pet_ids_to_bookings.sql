-- Add pet_ids column to store multiple pets per booking
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pet_ids jsonb DEFAULT '[]'::jsonb;
