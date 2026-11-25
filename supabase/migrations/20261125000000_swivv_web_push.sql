-- Browser push delivery plus offline-safe social notification creation.
-- A missing Supabase Vault configuration disables delivery only; in-app notifications still work.

CREATE EXTENSION IF NOT EXISTS pg_net;

ALTER TABLE public.swivv_notifications
  ADD COLUMN IF NOT EXISTS dedupe_key text;

CREATE INDEX IF NOT EXISTS swivv_notif_dedupe_idx
  ON public.swivv_notifications (user_id, type, dedupe_key, created_at DESC)
  WHERE dedupe_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.swivv_create_event_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_link text,
  p_dedupe_key text,
  p_window interval
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_user_id IS NULL OR p_dedupe_key IS NULL THEN
    RETURN;
  END IF;

  -- Serialize the per-recipient/event window so a live client and a DB trigger cannot race into duplicates.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_type || ':' || p_dedupe_key, 0));

  IF EXISTS (
    SELECT 1 FROM public.swivv_notifications
    WHERE user_id = p_user_id
      AND type = p_type
      AND dedupe_key = p_dedupe_key
      AND created_at >= now() - p_window
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.swivv_notifications (user_id, type, title, message, link, dedupe_key)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_dedupe_key);
END;
$$;

REVOKE ALL ON FUNCTION public.swivv_create_event_notification(uuid, text, text, text, text, text, interval)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.swivv_push_pair_blocked(a uuid, b uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.swivv_blocks
    WHERE (blocker_id = a AND blocked_id = b)
       OR (blocker_id = b AND blocked_id = a)
  );
$$;

REVOKE ALL ON FUNCTION public.swivv_push_pair_blocked(uuid, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.swivv_notify_chat_for_push()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_peer uuid;
  v_name text;
  v_audio text;
  v_image text;
  v_title text;
  v_message text;
BEGIN
  IF NEW.sender <> 'them' THEN RETURN NEW; END IF;
  BEGIN
    v_peer := regexp_replace(NEW.peer_id, '^u:', '')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN NEW;
  END;
  IF v_peer = NEW.user_id OR public.swivv_push_pair_blocked(NEW.user_id, v_peer) THEN RETURN NEW; END IF;
  IF COALESCE((SELECT (prefs->>'rtMessages')::boolean FROM public.swivv_notif_prefs WHERE user_id = NEW.user_id), true) IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(data->>'name', 'Quelqu''un') INTO v_name
  FROM public.swivv_profiles WHERE user_id = v_peer;
  v_name := COALESCE(v_name, 'Quelqu''un');
  v_audio := to_jsonb(NEW)->>'audio_url';
  v_image := to_jsonb(NEW)->>'image_url';
  v_title := CASE WHEN NULLIF(v_audio, '') IS NOT NULL THEN 'Nouveau message vocal'
                  WHEN NULLIF(v_image, '') IS NOT NULL THEN 'Nouvelle photo'
                  ELSE 'Nouveau message' END;
  v_message := CASE WHEN NULLIF(v_audio, '') IS NOT NULL THEN v_name || ' t''a envoyé un message vocal.'
                    WHEN NULLIF(v_image, '') IS NOT NULL THEN v_name || ' t''a envoyé une photo.'
                    ELSE v_name || ' t''a écrit.' END;

  PERFORM public.swivv_create_event_notification(
    NEW.user_id, 'message', v_title, v_message,
    '/messagerie?peer=' || NEW.peer_id,
    'message:' || v_peer::text, interval '10 minutes'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.swivv_notify_like_for_push()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text;
BEGIN
  IF NEW.liker_id = NEW.liked_id OR public.swivv_push_pair_blocked(NEW.liked_id, NEW.liker_id) THEN RETURN NEW; END IF;
  IF COALESCE((SELECT (prefs->>'rtLiked')::boolean FROM public.swivv_notif_prefs WHERE user_id = NEW.liked_id), true) IS NOT TRUE THEN
    RETURN NEW;
  END IF;
  SELECT COALESCE(data->>'name', 'Quelqu''un') INTO v_name
  FROM public.swivv_profiles WHERE user_id = NEW.liker_id;
  PERFORM public.swivv_create_event_notification(
    NEW.liked_id, 'like', 'Nouveau like', COALESCE(v_name, 'Quelqu''un') || ' s''intéresse à ton profil.',
    '/member/' || NEW.liker_id::text, 'like:' || NEW.liker_id::text, interval '24 hours'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.swivv_notify_match_for_push()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_a_name text; v_b_name text;
BEGIN
  IF public.swivv_push_pair_blocked(NEW.user_a, NEW.user_b) THEN RETURN NEW; END IF;
  SELECT COALESCE(data->>'name', 'Quelqu''un') INTO v_a_name FROM public.swivv_profiles WHERE user_id = NEW.user_a;
  SELECT COALESCE(data->>'name', 'Quelqu''un') INTO v_b_name FROM public.swivv_profiles WHERE user_id = NEW.user_b;
  IF COALESCE((SELECT (prefs->>'rtLiked')::boolean FROM public.swivv_notif_prefs WHERE user_id = NEW.user_a), true) IS TRUE THEN
    PERFORM public.swivv_create_event_notification(
      NEW.user_a, 'match', 'C''est un match !', 'Toi et ' || COALESCE(v_b_name, 'Quelqu''un') || ' vous êtes plu.',
      '/messagerie?match=' || NEW.user_b::text, 'match:' || NEW.user_b::text, interval '365 days'
    );
  END IF;
  IF COALESCE((SELECT (prefs->>'rtLiked')::boolean FROM public.swivv_notif_prefs WHERE user_id = NEW.user_b), true) IS TRUE THEN
    PERFORM public.swivv_create_event_notification(
      NEW.user_b, 'match', 'C''est un match !', 'Toi et ' || COALESCE(v_a_name, 'Quelqu''un') || ' vous êtes plu.',
      '/messagerie?match=' || NEW.user_a::text, 'match:' || NEW.user_a::text, interval '365 days'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.swivv_notify_profile_view_for_push()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text;
BEGIN
  IF NEW.viewer_id = NEW.viewed_id OR public.swivv_push_pair_blocked(NEW.viewed_id, NEW.viewer_id) THEN RETURN NEW; END IF;
  IF COALESCE((SELECT (prefs->>'rtViewed')::boolean FROM public.swivv_notif_prefs WHERE user_id = NEW.viewed_id), true) IS NOT TRUE THEN
    RETURN NEW;
  END IF;
  SELECT COALESCE(data->>'name', 'Quelqu''un') INTO v_name
  FROM public.swivv_profiles WHERE user_id = NEW.viewer_id;
  PERFORM public.swivv_create_event_notification(
    NEW.viewed_id, 'view', 'Visite de profil', COALESCE(v_name, 'Quelqu''un') || ' a consulté ton profil.',
    '/member/' || NEW.viewer_id::text, 'view:' || NEW.viewer_id::text, interval '24 hours'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.swivv_notify_photo_reaction_for_push()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_photos jsonb;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.reaction IS NOT DISTINCT FROM OLD.reaction THEN RETURN NEW; END IF;
  IF public.swivv_push_pair_blocked(NEW.owner_id, NEW.reactor_id) THEN RETURN NEW; END IF;
  IF COALESCE((SELECT (prefs->>'rtReactions')::boolean FROM public.swivv_notif_prefs WHERE user_id = NEW.owner_id), true) IS NOT TRUE THEN
    RETURN NEW;
  END IF;
  SELECT data->'photos' INTO v_photos FROM public.swivv_profiles WHERE user_id = NEW.owner_id;
  IF jsonb_typeof(v_photos) <> 'array' OR NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(
      CASE WHEN jsonb_typeof(v_photos) = 'array' THEN v_photos ELSE '[]'::jsonb END
    ) AS photo(value) WHERE photo.value = NEW.photo
  ) THEN
    RETURN NEW;
  END IF;
  PERFORM public.swivv_create_event_notification(
    NEW.owner_id, 'reaction', 'Réaction à ta photo', 'Un membre a réagi à l''une de tes photos.',
    '/statistiques?tab=likes', 'reaction:' || NEW.reactor_id::text, interval '24 hours'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS swivv_push_notify_chat ON public.swivv_chats;
CREATE TRIGGER swivv_push_notify_chat AFTER INSERT ON public.swivv_chats
  FOR EACH ROW EXECUTE FUNCTION public.swivv_notify_chat_for_push();

DROP TRIGGER IF EXISTS swivv_push_notify_like ON public.swivv_likes;
CREATE TRIGGER swivv_push_notify_like AFTER INSERT ON public.swivv_likes
  FOR EACH ROW EXECUTE FUNCTION public.swivv_notify_like_for_push();

DROP TRIGGER IF EXISTS swivv_push_notify_match ON public.swivv_matches;
CREATE TRIGGER swivv_push_notify_match AFTER INSERT ON public.swivv_matches
  FOR EACH ROW EXECUTE FUNCTION public.swivv_notify_match_for_push();

DROP TRIGGER IF EXISTS swivv_push_notify_profile_view ON public.swivv_profile_views;
CREATE TRIGGER swivv_push_notify_profile_view AFTER INSERT ON public.swivv_profile_views
  FOR EACH ROW EXECUTE FUNCTION public.swivv_notify_profile_view_for_push();

DROP TRIGGER IF EXISTS swivv_push_notify_photo_reaction ON public.swivv_photo_reactions;
CREATE TRIGGER swivv_push_notify_photo_reaction AFTER INSERT OR UPDATE ON public.swivv_photo_reactions
  FOR EACH ROW EXECUTE FUNCTION public.swivv_notify_photo_reaction_for_push();

-- Every persisted notification (including requests, moderation, announcements and admin alerts) is queued for Web Push.
-- Secrets are stored in Supabase Vault; the HTTP request is asynchronous and must never block in-app notification writes.
CREATE OR REPLACE FUNCTION public.swivv_dispatch_web_push()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_url text; v_secret text;
BEGIN
  BEGIN
    SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'swivv_push_function_url' LIMIT 1;
    SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'swivv_push_webhook_secret' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
  END;
  IF COALESCE(v_url, '') = '' OR COALESCE(v_secret, '') = '' THEN RETURN NEW; END IF;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-swivv-push-secret', v_secret),
    body := jsonb_build_object('id', NEW.id),
    timeout_milliseconds := 5000
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'SWIVV Web Push dispatch failed for notification %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS swivv_web_push_dispatch ON public.swivv_notifications;
CREATE TRIGGER swivv_web_push_dispatch AFTER INSERT ON public.swivv_notifications
  FOR EACH ROW EXECUTE FUNCTION public.swivv_dispatch_web_push();
