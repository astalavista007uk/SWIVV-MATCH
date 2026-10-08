-- Add extended fields to services table for category-specific data
-- that is currently only present in mock data

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS services_offered JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS availability TEXT,
  ADD COLUMN IF NOT EXISTS price_min NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS price_max NUMERIC(10,2);
