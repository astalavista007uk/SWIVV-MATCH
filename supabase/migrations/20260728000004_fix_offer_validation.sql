-- Fix create_pet_offer: validate against ACTUAL listing price, not client-provided value
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
  _count integer;
  _row public.pet_offers;
  _actual_seller_id uuid;
  _actual_listing public.pet_listings;
  _actual_price_cents integer;
  _actual_is_free boolean;
  _is_adoption boolean;
  _min integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  -- ── Fetch the ACTUAL listing to validate against ──
  SELECT * INTO _actual_listing FROM public.pet_listings WHERE id::text = _pet_listing_id;
  IF _actual_listing IS NULL THEN
    RAISE EXCEPTION 'Listing not found' USING ERRCODE = '42704';
  END IF;

  -- Only active listings can receive offers
  IF _actual_listing.status NOT IN ('active') THEN
    RAISE EXCEPTION 'This listing is no longer accepting offers' USING ERRCODE = '22023';
  END IF;

  -- Use the ACTUAL price from the listing, not what the client sent
  _actual_price_cents := COALESCE(_actual_listing.price, 0) * 100;
  _actual_is_free := COALESCE(_actual_listing.is_free, false) OR _actual_price_cents = 0;
  _is_adoption := _actual_is_free;

  -- Resolve seller from the listing
  _actual_seller_id := COALESCE(_seller_id, _actual_listing.seller_id);

  -- Can't make an offer on your own listing
  IF _actual_seller_id = _uid THEN
    RAISE EXCEPTION 'You cannot make an offer on your own listing' USING ERRCODE = '22023';
  END IF;

  -- ── Adoption (free listing): only 0-amount offers allowed ──
  IF _is_adoption THEN
    IF _offer_amount_cents != 0 THEN
      RAISE EXCEPTION 'This is an adoption listing — no payment required' USING ERRCODE = '22023';
    END IF;
  ELSE
    -- ── Paid listing: validate offer against actual price ──
    IF _offer_amount_cents <= 0 THEN
      RAISE EXCEPTION 'Invalid offer amount' USING ERRCODE = '22023';
    END IF;

    -- Enforce 30% maximum discount (offer must be >= 70% of listed price)
    _min := ceil(_actual_price_cents * 0.70)::int;
    IF _offer_amount_cents < _min THEN
      RAISE EXCEPTION 'Offer too low. Minimum acceptable offer is %.2f (30%% below listed price)', _min / 100.0
        USING ERRCODE = '22023';
    END IF;
  END IF;

  -- ── Rate limit ──
  SELECT COUNT(*) INTO _count FROM public.pet_offers WHERE created_at > (now() - interval '24 hours');
  IF _count >= 20 THEN
    RAISE EXCEPTION 'Daily offer limit reached — please try again tomorrow' USING ERRCODE = '54000';
  END IF;

  -- ── Insert with validated values ──
  INSERT INTO public.pet_offers (
    buyer_id, seller_id, pet_listing_id, pet_name, seller_name,
    listed_price_cents, offer_amount_cents, currency, is_adoption
  ) VALUES (
    _uid, _actual_seller_id, _pet_listing_id,
    COALESCE(_actual_listing.title, _pet_name),
    COALESCE(_seller_name, ''),
    _actual_price_cents,
    CASE WHEN _is_adoption THEN 0 ELSE _offer_amount_cents END,
    COALESCE(_currency, 'EUR'),
    _is_adoption
  )
  RETURNING * INTO _row;

  RETURN _row;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.create_pet_offer(text, text, text, integer, integer, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_pet_offer(text, text, text, integer, integer, text) TO authenticated;
