-- Fix: make service-photos bucket public so getPublicUrl() works
-- The bucket was originally created with public=false, which caused
-- uploaded photos to be inaccessible via <img src="..."> tags.
-- pet-photos was already public=true; this aligns service-photos to match.
UPDATE storage.buckets SET public = true WHERE id = 'service-photos';

-- Verify the bucket exists (create if missing, e.g. on fresh DBs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-photos', 'service-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;
