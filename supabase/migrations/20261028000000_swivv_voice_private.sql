-- SWIVV chat media goes private: voice notes + shared photos readable only by
-- sender, thread participant, or staff — everyone else (incl. logged-out) gets 403.
-- Clients mint short-lived signed URLs (see signedMediaUrl in swivv-store.ts).
-- ponytail: participant match is a suffix strpos (no LIKE escaping, no index) — fine at chat scale; a dedicated path column if storage reads ever surface in slow-query logs
UPDATE storage.buckets SET public = false WHERE id = 'swivv-voice';

DROP POLICY IF EXISTS "Swivv voice public read" ON storage.objects;

CREATE POLICY "Swivv voice participant read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'swivv-voice'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_staff()
      OR EXISTS (
        SELECT 1 FROM public.swivv_chats c
        WHERE c.user_id = auth.uid()
          AND (strpos(c.audio_url, name) > 0 OR strpos(c.image_url, name) > 0)
      )
    )
  );
