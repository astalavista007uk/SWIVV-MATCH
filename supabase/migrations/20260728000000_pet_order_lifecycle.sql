-- ═══════════════════════════════════════════════════════════════
--  PET ORDER LIFECYCLE: escrow, confirmation, reviews, disputes
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Extend pet_offers with lifecycle columns ──────────────

ALTER TABLE public.pet_offers
  ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS payment_intent_id text,
  ADD COLUMN IF NOT EXISTS confirmed_by_buyer_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_by_seller_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancel_reason text;

-- Backfill seller_id from pet_listings where possible
UPDATE public.pet_offers po
   SET seller_id = pl.seller_id
  FROM public.pet_listings pl
 WHERE po.pet_listing_id = pl.id::text
   AND po.seller_id IS NULL;

-- Add status CHECK (allows the old 'pending' plus new lifecycle values)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'pet_offers' AND constraint_name = 'pet_offers_status_check'
  ) THEN
    ALTER TABLE public.pet_offers
      ADD CONSTRAINT pet_offers_status_check
      CHECK (status IN ('pending','accepted','in_escrow','completed','cancelled','disputed'));
  END IF;
END $$;

-- Seller can now view offers on their listings
CREATE POLICY "Sellers can view offers on their listings"
  ON public.pet_offers FOR SELECT TO authenticated
  USING (seller_id = auth.uid());

-- Sellers can update status of their offers
CREATE POLICY "Sellers can update their offers"
  ON public.pet_offers FOR UPDATE TO authenticated
  USING (seller_id = auth.uid());

-- Buyers can update their own offers
CREATE POLICY "Buyers can update their offers"
  ON public.pet_offers FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid());

-- ── 2. Pet reviews table ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pet_reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_order_id  uuid NOT NULL REFERENCES public.pet_offers(id) ON DELETE CASCADE,
  reviewer_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating        integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pet_order_id, reviewer_id)
);

GRANT SELECT, INSERT, UPDATE ON public.pet_reviews TO authenticated;
GRANT SELECT ON public.pet_reviews TO anon;
GRANT ALL ON public.pet_reviews TO service_role;

ALTER TABLE public.pet_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read pet reviews"
  ON public.pet_reviews FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create pet reviews"
  ON public.pet_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update own pet reviews"
  ON public.pet_reviews FOR UPDATE TO authenticated
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can delete own pet reviews"
  ON public.pet_reviews FOR DELETE TO authenticated
  USING (auth.uid() = reviewer_id);

CREATE TRIGGER update_pet_reviews_updated_at
  BEFORE UPDATE ON public.pet_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 3. Pet disputes table ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pet_disputes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_order_id      uuid NOT NULL REFERENCES public.pet_offers(id) ON DELETE CASCADE,
  buyer_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason            text NOT NULL,
  evidence_urls     jsonb NOT NULL DEFAULT '[]'::jsonb,
  status            text NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','resolved_buyer','resolved_seller','resolved_refund')),
  resolution_notes  text,
  resolved_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.pet_disputes TO authenticated;
GRANT SELECT ON public.pet_disputes TO anon;
GRANT ALL ON public.pet_disputes TO service_role;

ALTER TABLE public.pet_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view disputes"
  ON public.pet_disputes FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Buyers can create disputes"
  ON public.pet_disputes FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers can update their disputes"
  ON public.pet_disputes FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid());

CREATE TRIGGER update_pet_disputes_updated_at
  BEFORE UPDATE ON public.pet_disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 4. Storage bucket for dispute evidence ────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('dispute-evidence', 'dispute-evidence', true)
ON CONFLICT (id) DO NOTHING;

GRANT SELECT ON storage.objects TO authenticated;

-- RLS: users can manage their own dispute evidence
CREATE POLICY "Users can upload dispute evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'dispute-evidence'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can read dispute evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'dispute-evidence');

-- ── 5. RPCs for lifecycle transitions ─────────────────────────

-- Seller accepts an offer  → status = 'accepted'
CREATE OR REPLACE FUNCTION public.accept_pet_offer(_offer_id uuid)
RETURNS public.pet_offers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.pet_offers;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  UPDATE public.pet_offers
     SET status = 'accepted', updated_at = now()
   WHERE id = _offer_id
     AND seller_id = _uid
     AND status = 'pending'
  RETURNING * INTO _row;

  IF _row IS NULL THEN
    RAISE EXCEPTION 'Offer not found or cannot be accepted' USING ERRCODE = '42704';
  END IF;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_pet_offer(uuid) TO authenticated;

-- Seller declines an offer  → status = 'cancelled'
CREATE OR REPLACE FUNCTION public.decline_pet_offer(_offer_id uuid)
RETURNS public.pet_offers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.pet_offers;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  UPDATE public.pet_offers
     SET status = 'cancelled', cancelled_at = now(), cancelled_by = _uid, updated_at = now()
   WHERE id = _offer_id
     AND seller_id = _uid
     AND status = 'pending'
  RETURNING * INTO _row;

  IF _row IS NULL THEN
    RAISE EXCEPTION 'Offer not found or cannot be declined' USING ERRCODE = '42704';
  END IF;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decline_pet_offer(uuid) TO authenticated;

-- Buyer pays → money goes to escrow → status = 'in_escrow'
CREATE OR REPLACE FUNCTION public.escrow_pet_offer(_offer_id uuid, _payment_intent_id text)
RETURNS public.pet_offers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.pet_offers;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  UPDATE public.pet_offers
     SET status = 'in_escrow',
         payment_intent_id = _payment_intent_id,
         updated_at = now()
   WHERE id = _offer_id
     AND buyer_id = _uid
     AND status = 'accepted'
  RETURNING * INTO _row;

  IF _row IS NULL THEN
    RAISE EXCEPTION 'Offer not found or cannot be paid' USING ERRCODE = '42704';
  END IF;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.escrow_pet_offer(uuid, text) TO authenticated;

-- Buyer confirms receipt of pet → releases funds → status = 'completed'
CREATE OR REPLACE FUNCTION public.confirm_pet_received(_offer_id uuid)
RETURNS public.pet_offers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.pet_offers;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  UPDATE public.pet_offers
     SET status = 'completed',
         confirmed_by_buyer_at = now(),
         updated_at = now()
   WHERE id = _offer_id
     AND buyer_id = _uid
     AND status = 'in_escrow'
  RETURNING * INTO _row;

  IF _row IS NULL THEN
    RAISE EXCEPTION 'Offer not found or cannot be confirmed' USING ERRCODE = '42704';
  END IF;

  -- Mark the pet listing as sold
  UPDATE public.pet_listings
     SET status = 'sold', updated_at = now()
   WHERE id::text = _row.pet_listing_id
     AND status = 'active';

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_pet_received(uuid) TO authenticated;

-- Buyer or seller cancels (before escrow) → status = 'cancelled'
CREATE OR REPLACE FUNCTION public.cancel_pet_offer(_offer_id uuid, _reason text DEFAULT NULL)
RETURNS public.pet_offers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.pet_offers;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  UPDATE public.pet_offers
     SET status = 'cancelled',
         cancelled_at = now(),
         cancelled_by = _uid,
         cancel_reason = _reason,
         updated_at = now()
   WHERE id = _offer_id
     AND (buyer_id = _uid OR seller_id = _uid)
     AND status IN ('pending','accepted')
  RETURNING * INTO _row;

  IF _row IS NULL THEN
    RAISE EXCEPTION 'Offer not found or cannot be cancelled' USING ERRCODE = '42704';
  END IF;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_pet_offer(uuid, text) TO authenticated;

-- Buyer opens a dispute → status = 'disputed'
CREATE OR REPLACE FUNCTION public.open_pet_dispute(
  _offer_id uuid,
  _reason text,
  _evidence_urls jsonb DEFAULT '[]'::jsonb
)
RETURNS public.pet_disputes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _offer public.pet_offers;
  _dispute public.pet_disputes;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO _offer FROM public.pet_offers WHERE id = _offer_id AND buyer_id = _uid;
  IF _offer IS NULL THEN
    RAISE EXCEPTION 'Offer not found' USING ERRCODE = '42704';
  END IF;

  IF _offer.status NOT IN ('in_escrow','completed') THEN
    RAISE EXCEPTION 'Cannot dispute an offer in this state' USING ERRCODE = '22023';
  END IF;

  -- Mark offer as disputed
  UPDATE public.pet_offers
     SET status = 'disputed', updated_at = now()
   WHERE id = _offer_id;

  -- Create dispute record
  INSERT INTO public.pet_disputes (pet_order_id, buyer_id, seller_id, reason, evidence_urls)
  VALUES (_offer_id, _uid, _offer.seller_id, _reason, COALESCE(_evidence_urls, '[]'::jsonb))
  RETURNING * INTO _dispute;

  RETURN _dispute;
END;
$$;

GRANT EXECUTE ON FUNCTION public.open_pet_dispute(uuid, text, jsonb) TO authenticated;

-- Admin/moderator resolves a dispute
CREATE OR REPLACE FUNCTION public.resolve_pet_dispute(
  _dispute_id uuid,
  _status text,
  _notes text DEFAULT NULL
)
RETURNS public.pet_disputes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _dispute public.pet_disputes;
  _is_staff boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role IN ('admin','moderator')
  ) INTO _is_staff;

  IF NOT _is_staff THEN
    RAISE EXCEPTION 'Only staff can resolve disputes' USING ERRCODE = '42501';
  END IF;

  IF _status NOT IN ('resolved_buyer','resolved_seller','resolved_refund') THEN
    RAISE EXCEPTION 'Invalid resolution status' USING ERRCODE = '22023';
  END IF;

  UPDATE public.pet_disputes
     SET status = _status,
         resolution_notes = _notes,
         resolved_by = _uid,
         resolved_at = now(),
         updated_at = now()
   WHERE id = _dispute_id AND status = 'open'
  RETURNING * INTO _dispute;

  IF _dispute IS NULL THEN
    RAISE EXCEPTION 'Dispute not found or already resolved' USING ERRCODE = '42704';
  END IF;

  -- Update the pet offer status based on resolution
  IF _status = 'resolved_buyer' THEN
    UPDATE public.pet_offers SET status = 'completed', confirmed_by_buyer_at = now(), updated_at = now()
     WHERE id = _dispute.pet_order_id;
  ELSIF _status = 'resolved_seller' THEN
    UPDATE public.pet_offers SET status = 'completed', confirmed_by_buyer_at = now(), updated_at = now()
     WHERE id = _dispute.pet_order_id;
  ELSIF _status = 'resolved_refund' THEN
    UPDATE public.pet_offers SET status = 'cancelled', cancelled_at = now(), cancel_reason = 'Dispute resolved: refund to buyer', updated_at = now()
     WHERE id = _dispute.pet_order_id;
  END IF;

  RETURN _dispute;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_pet_dispute(uuid, text, text) TO authenticated;

-- ── 6. Update create_pet_offer to accept seller_id ────────────

CREATE OR REPLACE FUNCTION public.create_pet_offer(
  _pet_listing_id text,
  _pet_name text,
  _seller_name text,
  _listed_price_cents integer,
  _offer_amount_cents integer,
  _currency text DEFAULT 'EUR',
  _seller_id uuid DEFAULT NULL
)
RETURNS public.pet_offers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _min integer;
  _count integer;
  _row public.pet_offers;
  _actual_seller_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF _listed_price_cents <= 0 OR _offer_amount_cents <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  _min := ceil(_listed_price_cents * 0.70)::int;
  IF _offer_amount_cents < _min THEN
    RAISE EXCEPTION 'Offer below minimum (%.2f)', _min / 100.0
      USING ERRCODE = '22023';
  END IF;

  SELECT COUNT(*) INTO _count FROM public.pet_offers
   WHERE created_at > (now() - interval '24 hours');
  IF _count >= 20 THEN
    RAISE EXCEPTION 'Daily offer limit reached — please try again tomorrow'
      USING ERRCODE = '54000';
  END IF;

  -- Resolve seller_id
  _actual_seller_id := _seller_id;
  IF _actual_seller_id IS NULL THEN
    SELECT seller_id INTO _actual_seller_id FROM public.pet_listings
     WHERE id::text = _pet_listing_id;
  END IF;

  INSERT INTO public.pet_offers (
    buyer_id, seller_id, pet_listing_id, pet_name, seller_name,
    listed_price_cents, offer_amount_cents, currency
  ) VALUES (
    _uid, _actual_seller_id, _pet_listing_id, _pet_name, _seller_name,
    _listed_price_cents, _offer_amount_cents, COALESCE(_currency, 'EUR')
  )
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_pet_offer(text, text, text, integer, integer, text, uuid) TO authenticated;
-- Re-grant old signature for backwards compatibility during transition
GRANT EXECUTE ON FUNCTION public.create_pet_offer(text, text, text, integer, integer, text) TO authenticated;

-- ── 7. Indexes for performance ────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_pet_offers_seller_id ON public.pet_offers(seller_id);
CREATE INDEX IF NOT EXISTS idx_pet_offers_buyer_id ON public.pet_offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_pet_offers_status ON public.pet_offers(status);
CREATE INDEX IF NOT EXISTS idx_pet_reviews_order_id ON public.pet_reviews(pet_order_id);
CREATE INDEX IF NOT EXISTS idx_pet_reviews_reviewee_id ON public.pet_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_pet_disputes_pet_order_id ON public.pet_disputes(pet_order_id);
CREATE INDEX IF NOT EXISTS idx_pet_disputes_status ON public.pet_disputes(status);
