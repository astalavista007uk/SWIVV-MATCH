DROP POLICY "Anyone can create support requests" ON public.support_requests;

CREATE POLICY "Anyone can create support requests"
ON public.support_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  message IS NOT NULL
  AND length(message) BETWEEN 1 AND 4000
  AND (email IS NULL OR length(email) <= 320)
  AND (name IS NULL OR length(name) <= 120)
);