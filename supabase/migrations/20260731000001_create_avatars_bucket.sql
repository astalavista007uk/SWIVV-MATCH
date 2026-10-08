-- Create the avatars storage bucket (the RLS policies already exist in
-- 20260705174458_d9452563-...sql but the bucket itself was never created).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880,
        ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'])
ON CONFLICT (id) DO NOTHING;
