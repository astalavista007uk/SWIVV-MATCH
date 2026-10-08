-- Add photo support + soft-delete to services
ALTER TABLE services ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS gallery jsonb DEFAULT '[]'::jsonb;
ALTER TABLE services ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_services_sitter_deleted ON services (sitter_id, deleted_at);

-- Add soft-delete to pet_listings
ALTER TABLE pet_listings ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_pet_listings_seller_deleted ON pet_listings (seller_id, deleted_at);

-- Create service-photos storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service-photos', 'service-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Service photos: allow public viewing
CREATE POLICY "Service photos public viewing" ON storage.objects
  FOR SELECT USING (bucket_id = 'service-photos');

-- Service photos: allow authenticated upload
CREATE POLICY "Service photos upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'service-photos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service photos: allow authenticated update
CREATE POLICY "Service photos update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'service-photos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service photos: allow authenticated delete
CREATE POLICY "Service photos delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'service-photos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
