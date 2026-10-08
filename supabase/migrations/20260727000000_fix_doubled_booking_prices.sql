BEGIN;

-- Fix pet_sitting bookings with 2+ days where agreedPrice was double-multiplied.
-- The form sent `price × days` as agreedPrice; the server multiplied by days AGAIN.
-- Reverse: divide providerGross by days, then recompute fees from the corrected base.
WITH affected AS (
  SELECT
    b.id,
    GREATEST(1, ROUND(EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 86400)) AS days,
    (b.total_price - b.owner_fee) AS wrong_provider_gross
  FROM bookings b
  JOIN services s ON b.service_id = s.id
  WHERE s.service_type = 'pet_sitting'
    AND b.payment_intent_id IS NULL
    AND EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 86400 >= 2
),
recalc AS (
  SELECT
    a.id,
    ROUND(a.wrong_provider_gross / a.days, 2) AS provider_gross,
    a.days
  FROM affected a
)
UPDATE bookings b
SET
  total_price = ROUND(r.provider_gross * 1.10, 2),
  provider_amount = ROUND(r.provider_gross * 0.82, 2),
  platform_commission = ROUND(r.provider_gross * 0.18, 2),
  owner_fee = ROUND(r.provider_gross * 0.10, 2)
FROM recalc r
WHERE b.id = r.id;

COMMIT;
