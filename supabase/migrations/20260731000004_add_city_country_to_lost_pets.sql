-- Add city and country columns to lost_pets for reliable city/distance search
ALTER TABLE lost_pets ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE lost_pets ADD COLUMN IF NOT EXISTS country TEXT;
