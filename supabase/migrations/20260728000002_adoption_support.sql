-- Allow 0-amount offers for adoptions
ALTER TABLE public.pet_offers DROP CONSTRAINT IF EXISTS pet_offers_offer_amount_cents_check;
ALTER TABLE public.pet_offers DROP CONSTRAINT IF EXISTS pet_offers_listed_price_cents_check;
ALTER TABLE public.pet_offers
  ADD CONSTRAINT pet_offers_offer_amount_cents_check CHECK (offer_amount_cents >= 0),
  ADD CONSTRAINT pet_offers_listed_price_cents_check CHECK (listed_price_cents >= 0);

-- is_adoption flag for quick filtering
ALTER TABLE public.pet_offers ADD COLUMN IF NOT EXISTS is_adoption boolean NOT NULL DEFAULT false;

-- Update create_pet_offer to allow adoption (0 amount)
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
AS $func$
DECLARE
  _uid uuid := auth.uid();
  _min integer;
  _count integer;
  _row public.pet_offers;
  _actual_seller_id uuid;
  _is_adoption boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  _is_adoption := (_listed_price_cents = 0 AND _offer_amount_cents = 0);

  IF NOT _is_adoption THEN
    IF _listed_price_cents <= 0 OR _offer_amount_cents <= 0 THEN
      RAISE EXCEPTION 'Invalid amount';
    END IF;
    _min := ceil(_listed_price_cents * 0.70)::int;
    IF _offer_amount_cents < _min THEN
      RAISE EXCEPTION 'Offer below minimum (%.2f)', _min / 100.0 USING ERRCODE = '22023';
    END IF;
  END IF;

  SELECT COUNT(*) INTO _count FROM public.pet_offers WHERE created_at > (now() - interval '24 hours');
  IF _count >= 20 THEN
    RAISE EXCEPTION 'Daily offer limit reached — please try again tomorrow' USING ERRCODE = '54000';
  END IF;

  _actual_seller_id := _seller_id;
  IF _actual_seller_id IS NULL THEN
    SELECT seller_id INTO _actual_seller_id FROM public.pet_listings WHERE id::text = _pet_listing_id;
  END IF;

  INSERT INTO public.pet_offers (
    buyer_id, seller_id, pet_listing_id, pet_name, seller_name,
    listed_price_cents, offer_amount_cents, currency, is_adoption
  ) VALUES (
    _uid, _actual_seller_id, _pet_listing_id, _pet_name, _seller_name,
    _listed_price_cents, _offer_amount_cents, COALESCE(_currency, 'EUR'), _is_adoption
  )
  RETURNING * INTO _row;

  RETURN _row;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.create_pet_offer(text, text, text, integer, integer, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_pet_offer(text, text, text, integer, integer, text) TO authenticated;

-- For adoptions: accept → immediately eligible for collection (skip escrow)
CREATE OR REPLACE FUNCTION public.accept_pet_offer(_offer_id uuid)
RETURNS public.pet_offers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  _uid uuid := auth.uid();
  _row public.pet_offers;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  -- For adoption: go straight to 'accepted' (buyer can confirm collection immediately)
  -- For paid: go to 'accepted' (buyer must pay into escrow next)
  UPDATE public.pet_offers
     SET status = 'accepted', updated_at = now()
   WHERE id = _offer_id AND seller_id = _uid AND status = 'pending'
  RETURNING * INTO _row;

  IF _row IS NULL THEN
    RAISE EXCEPTION 'Offer not found or cannot be accepted' USING ERRCODE = '42704';
  END IF;

  RETURN _row;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.accept_pet_offer(uuid) TO authenticated;

-- Allow confirm_pet_received from 'accepted' too (for adoptions with no escrow)
CREATE OR REPLACE FUNCTION public.confirm_pet_received(_offer_id uuid)
RETURNS public.pet_offers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
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
     AND status IN ('in_escrow', 'accepted')
  RETURNING * INTO _row;

  IF _row IS NULL THEN
    RAISE EXCEPTION 'Offer not found or cannot be confirmed' USING ERRCODE = '42704';
  END IF;

  UPDATE public.pet_listings
     SET status = 'sold', updated_at = now()
   WHERE id::text = _row.pet_listing_id AND status = 'active';

  RETURN _row;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.confirm_pet_received(uuid) TO authenticated;
