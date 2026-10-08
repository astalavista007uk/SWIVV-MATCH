-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Seed mock notifications for the demo user
INSERT INTO public.notifications (user_id, type, title, message, link, created_at)
SELECT
  id,
  unnest(ARRAY[
    'new_message',
    'booking_confirmed',
    'favourite_pet_sold',
    'new_feedback',
    'booking_reminder',
    'new_provider',
    'payment_received',
    'favourite_pet_sold'
  ]),
  unnest(ARRAY[
    'New message from Camille R.',
    'Pet sitting booking confirmed',
    'Milo has been adopted!',
    'Camille left you a 5-star review',
    'Dog walk with Alex starts in 2 hours',
    'New groomer in your area',
    'Payment of €45 received',
    'Luna the British Shorthair has been sold'
  ]),
  unnest(ARRAY[
    'Camille: "Thanks for watching Mittens, see you next week!"',
    'Your booking with Sofia M. for 3 days pet sitting is confirmed.',
    'The Golden Retriever puppy you liked has been adopted by another family.',
    '"Camille was wonderful with Mittens, very recommendable!"',
    'Reminder: Alex M. will pick up Max for a 45-min walk at 14:00.',
    'Julie''s Mobile Grooming is now offering services in Lyon.',
    'Your weekly payout of €45 has been transferred to your bank account.',
    'The British Shorthair kitten you had saved is no longer available.'
  ]),
  unnest(ARRAY[
    '/messages',
    '/bookings',
    '/pets',
    '/profile',
    '/bookings',
    '/browse',
    '/earnings',
    '/pets'
  ]),
  unnest(ARRAY[
    now() - interval '2 hours',
    now() - interval '5 hours',
    now() - interval '1 day',
    now() - interval '2 days',
    now() - interval '2 days',
    now() - interval '3 days',
    now() - interval '5 days',
    now() - interval '7 days'
  ])
FROM auth.users
WHERE raw_user_meta_data->>'email' = 'demo@petbase.app'
LIMIT 1
ON CONFLICT DO NOTHING;
