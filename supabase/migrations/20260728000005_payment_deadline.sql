-- Add payment deadline column
ALTER TABLE public.pet_offers ADD COLUMN IF NOT EXISTS payment_deadline timestamptz;

-- Update accept_pet_offer to set a 7-day payment deadline (for non-adoption)
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

  UPDATE public.pet_offers
     SET status = 'accepted',
         payment_deadline = CASE WHEN is_adoption THEN NULL ELSE now() + interval '7 days' END,
         updated_at = now()
   WHERE id = _offer_id AND seller_id = _uid AND status = 'pending'
  RETURNING * INTO _row;

  IF _row IS NULL THEN
    RAISE EXCEPTION 'Offer not found or cannot be accepted' USING ERRCODE = '42704';
  END IF;

  RETURN _row;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.accept_pet_offer(uuid) TO authenticated;

-- Seller can cancel an accepted offer if buyer hasn't paid (and relist)
CREATE OR REPLACE FUNCTION public.cancel_unpaid_offer(_offer_id uuid)
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
     SET status = 'cancelled',
         cancelled_at = now(),
         cancelled_by = _uid,
         cancel_reason = 'Payment not received within deadline',
         updated_at = now()
   WHERE id = _offer_id
     AND seller_id = _uid
     AND status = 'accepted'
     AND is_adoption = false
  RETURNING * INTO _row;

  IF _row IS NULL THEN
    RAISE EXCEPTION 'Cannot cancel this offer' USING ERRCODE = '42704';
  END IF;

  RETURN _row;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.cancel_unpaid_offer(uuid) TO authenticated;
