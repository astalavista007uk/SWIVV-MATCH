-- Allow service providers to read the pet records referenced by their own
-- bookings (name, species, breed, age, weight, sex...) so the provider tab
-- and the pending-bookings reminder can display full animal details.
-- Owners keep full control via the existing "Owners manage their pets" policy.

CREATE POLICY "Providers can read pets of their bookings"
  ON public.pets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.sitter_id = auth.uid()
        AND (b.pet_id = pets.id OR (b.pet_ids ? pets.id::text))
    )
  );
