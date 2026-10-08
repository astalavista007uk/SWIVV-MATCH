-- Add slot_duration and working_hours to services table
-- Used by Grooming (and optionally other appointment-based services) for dynamic time slot generation
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS slot_duration integer DEFAULT 60,
  ADD COLUMN IF NOT EXISTS working_hours jsonb DEFAULT '{}'::jsonb;

-- Backfill existing grooming services with default working hours (Mon-Fri 9-17, Sat 10-15)
UPDATE public.services
SET slot_duration = 60,
    working_hours = '{"mon":{"start":"09:00","end":"17:00"},"tue":{"start":"09:00","end":"17:00"},"wed":{"start":"09:00","end":"17:00"},"thu":{"start":"09:00","end":"17:00"},"fri":{"start":"09:00","end":"17:00"},"sat":{"start":"10:00","end":"15:00"},"sun":null}'::jsonb
WHERE service_type = 'grooming' AND (working_hours IS NULL OR working_hours = '{}'::jsonb);
