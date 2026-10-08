-- Voice notes + chat images bucket (code already uploads here; bucket never existed).
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('swivv-voice', 'swivv-voice', true, 15000000)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 15000000;

-- Anyone (incl. anon <audio>/<img> tags) can read; users write only under their own uid folder.
CREATE POLICY "Swivv voice public read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'swivv-voice');

CREATE POLICY "Swivv voice own upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'swivv-voice' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Swivv voice own update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'swivv-voice' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Swivv voice own delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'swivv-voice' AND auth.uid()::text = (storage.foldername(name))[1]);

GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
