-- Add country and province columns to services table
-- Used for country-specific certification filtering
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS province TEXT;
