-- Change favorites.target_id from UUID to TEXT
-- Reason: mock/demo listings use short string IDs (s1, g1, p1) that aren't UUIDs.
-- This caused every heart-count query to fail with HTTP 400 because Postgres
-- refused to coerce "s1" to UUID. Since there is no foreign-key constraint on
-- target_id (it's a polymorphic column pointing to services, pet_listings, or
-- profiles), TEXT is the correct type and supports both real UUIDs and demo IDs.

ALTER TABLE public.favorites
  ALTER COLUMN target_id TYPE TEXT USING target_id::text,
  ALTER COLUMN target_id DROP DEFAULT;

-- Drop the old trigger that may reference UUID-specific behavior (if any)
-- and recreate updated_at handling if needed (favorites has no updated_at
-- column, so nothing else to do).
