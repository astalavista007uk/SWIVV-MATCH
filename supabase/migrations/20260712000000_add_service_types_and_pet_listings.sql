-- Extend service_type enum with grooming and veterinary
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'grooming';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'veterinary';

-- Add columns to pet_listings for the Sell or Offer a Pet flow
ALTER TABLE public.pet_listings
  ADD COLUMN IF NOT EXISTS age TEXT,
  ADD COLUMN IF NOT EXISTS child_friendly BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS good_with_dogs BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS good_with_cats BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS temperament TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS certificates JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS vaccinations JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create pet-photos storage bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('pet-photos', 'pet-photos', true, false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif', 'image/bmp', 'image/tiff'])
ON CONFLICT (id) DO NOTHING;

-- Anyone can view pet photos
CREATE POLICY "pet_photos_read_all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pet-photos');

-- Authenticated users can upload their own pet photos
CREATE POLICY "pet_photos_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pet-photos'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Owners can update their uploaded pet photos
CREATE POLICY "pet_photos_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'pet-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Owners can delete their uploaded pet photos
CREATE POLICY "pet_photos_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'pet-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
