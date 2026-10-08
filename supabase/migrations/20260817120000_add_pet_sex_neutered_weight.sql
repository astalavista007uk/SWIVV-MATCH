-- Add sex, neutered/castrated/spayed status and weight to pets
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS sex TEXT
    CHECK (sex IN ('male', 'female')),
  ADD COLUMN IF NOT EXISTS neutered BOOLEAN,
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(6,2)
    CHECK (weight_kg IS NULL OR weight_kg > 0);
