-- Ensure grooming and veterinary exist in the service_type enum.
-- The initial migration (20260712000000) also adds these but may not have been applied.
-- Using explicit schema qualification to avoid search-path issues.

ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'grooming';
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'veterinary';

-- Verify the current state of the enum
DO $$
DECLARE
  enum_values TEXT[];
BEGIN
  SELECT array_agg(e.enumlabel::text ORDER BY e.enumsortorder)
  INTO enum_values
  FROM pg_type t
  JOIN pg_enum e ON e.enumtypid = t.oid
  WHERE t.typname = 'service_type'
    AND t.typnamespace = 'public'::regnamespace;

  RAISE NOTICE 'service_type enum values: %', enum_values;
END $$;

-- Also ensure the kb_articles category enum or text constraints include these
-- (no change needed if it's a text field)
