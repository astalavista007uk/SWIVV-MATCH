-- Add a flexible JSONB column for category-specific service attributes.
-- This stores fields like maxGroupSize, serviceRadiusKm, propertyType,
-- hasYard, facilityType, hasIndoor, mobile, halfDayPrice, etc.
-- without needing a separate column for each.

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS service_attributes jsonb DEFAULT '{}'::jsonb;
