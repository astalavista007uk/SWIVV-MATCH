-- ID verification: a second badge next to the photo badge.
-- Automation = on-device face match between the ID portrait and the profile photos;
-- only doubtful cases reach the human queue. The document is stored privately until
-- the decision, then deleted by admin.verification (no retention).

ALTER TABLE public.swivv_verification_requests
  ADD COLUMN IF NOT EXISTS doc_path text,
  ADD COLUMN IF NOT EXISTS auto_score integer,
  ADD COLUMN IF NOT EXISTS auto_note text;

-- Self-filed requests are always pending: status/reviewed_by are trigger/staff-owned,
-- otherwise any client could self-approve an identity badge.
DROP POLICY IF EXISTS swivv_verify_own_file ON public.swivv_verification_requests;
CREATE POLICY swivv_verify_own_file ON public.swivv_verification_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND reviewed_by IS NULL
    AND (doc_path IS NULL OR doc_path LIKE auth.uid()::text || '/%')
  );

DROP POLICY IF EXISTS swivv_verify_own_read ON public.swivv_verification_requests;
CREATE POLICY swivv_verify_own_read ON public.swivv_verification_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Private ID documents: owner + staff only, never public.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('swivv-id', 'swivv-id', false, 8000000, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 8000000;

DROP POLICY IF EXISTS "Swivv id own read" ON storage.objects;
CREATE POLICY "Swivv id own read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'swivv-id' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_staff()));

DROP POLICY IF EXISTS "Swivv id own upload" ON storage.objects;
CREATE POLICY "Swivv id own upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'swivv-id' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Swivv id own delete" ON storage.objects;
CREATE POLICY "Swivv id own delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'swivv-id' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_staff()));

-- One decision, one badge: staff never write profiles directly (moderators are level 50).
CREATE OR REPLACE FUNCTION public.swivv_sync_id_badge() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.kind <> 'identity' OR NEW.user_id IS NULL OR NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  IF NEW.status = 'approved' THEN
    UPDATE public.swivv_profiles
      SET data = data || jsonb_build_object(
            'idVerified', true,
            'idVerifiedAt', to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD')),
          updated_at = now()
      WHERE user_id = NEW.user_id;
    INSERT INTO public.swivv_notifications (user_id, type, title, message, link)
      VALUES (NEW.user_id, 'account', 'Identité vérifiée',
              'Ton badge Identité est actif sur ton profil.', '/mon-profil');
  ELSIF NEW.status IN ('rejected', 'expired') THEN
    UPDATE public.swivv_profiles
      SET data = data || jsonb_build_object('idVerified', false), updated_at = now()
      WHERE user_id = NEW.user_id;
    INSERT INTO public.swivv_notifications (user_id, type, title, message, link)
      VALUES (NEW.user_id, 'account', 'Vérification d''identité refusée',
              COALESCE(NULLIF(NEW.review_note, ''), 'Ta pièce n''a pas pu être validée. Tu peux réessayer.'),
              '/verification');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS swivv_identity_badge ON public.swivv_verification_requests;
CREATE TRIGGER swivv_identity_badge
  AFTER UPDATE OF status ON public.swivv_verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.swivv_sync_id_badge();
