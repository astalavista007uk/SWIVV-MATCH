-- Add duration_pricing column to services table
-- Stores JSONB array of { minutes, price, label } for duration-based pricing
-- Used by dog_walking, drop_in, grooming services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS duration_pricing JSONB DEFAULT '[]'::jsonb;
