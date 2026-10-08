CREATE TABLE public.kb_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.kb_articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kb_articles TO authenticated;
GRANT ALL ON public.kb_articles TO service_role;

ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published articles"
ON public.kb_articles FOR SELECT
TO anon, authenticated
USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert articles"
ON public.kb_articles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update articles"
ON public.kb_articles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete articles"
ON public.kb_articles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER kb_articles_set_updated_at
BEFORE UPDATE ON public.kb_articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.kb_articles (category, question, answer, tags) VALUES
('pet_sitting', 'How does pet sitting work on PET BASE?', 'You book a vetted sitter for in-home visits or overnight stays. The sitter feeds your pet, plays, handles walks or litter, and sends photo updates. Payment is held in escrow and released 24 hours after service ends.', ARRAY['booking','overview']),
('pet_sitting', 'Can the sitter stay overnight in my home?', 'Yes. When booking, choose an overnight or house-sitting service and confirm start/end times with your sitter in messages. Share access instructions only after the booking is confirmed.', ARRAY['overnight','house-sitting']),
('pet_sitting', 'What should I share with my sitter before the stay?', 'Feeding schedule, medications, vet contact, favorite toys, walk routine, house rules, and any behavioral quirks. You can attach a pet profile in your dashboard so it is included with every booking.', ARRAY['prep','profile']),
('dog_walking', 'How long is a standard dog walk?', 'Most walks are 30 or 60 minutes. You choose the duration and the number of walks per booking. Group walks are limited to keep every dog safe.', ARRAY['duration','walks']),
('dog_walking', 'What happens if it rains or the weather is unsafe?', 'Walkers use judgment — short bathroom breaks in bad weather, indoor enrichment for extreme heat, cold, or storms. They will message you if a walk is shortened or rescheduled.', ARRAY['weather','safety']),
('dog_walking', 'Are walkers insured?', 'Yes. Every booking through PET BASE is covered by our marketplace insurance, and verified walkers have completed background checks.', ARRAY['insurance','safety']),
('grooming', 'What does a standard grooming appointment include?', 'A full groom typically covers bath, blow-dry, brush-out, nail trim, ear cleaning, and a breed-appropriate haircut. Add-ons like teeth brushing or de-shedding are listed on the provider profile.', ARRAY['services','pricing']),
('grooming', 'How often should my dog be groomed?', 'Short-coat breeds: every 8–12 weeks. Double-coated or long-haired breeds: every 4–8 weeks with regular brushing between visits. Cats with long coats benefit from a groom every 6–8 weeks.', ARRAY['schedule']),
('grooming', 'My pet is anxious at the groomer — what can I do?', 'Book a low-stress groomer who offers short, split sessions. Share triggers in advance and consider a meet-and-greet visit. Never sedate your pet without your vet''s direction.', ARRAY['anxiety','handling']),
('veterinary', 'When should I take my pet to an emergency vet?', 'Immediately for: difficulty breathing, collapse, seizures, suspected poisoning, uncontrolled bleeding, bloated abdomen, severe vomiting or diarrhea, inability to urinate, or trauma. Call your nearest 24-hour emergency clinic first.', ARRAY['emergency','safety']),
('veterinary', 'How often do adult pets need a vet check-up?', 'Healthy adult dogs and cats: at least once a year. Senior pets (7+ years for dogs, 10+ for cats) or pets with chronic conditions: every 6 months.', ARRAY['wellness','schedule']),
('veterinary', 'Which vaccinations are considered core?', 'Dogs: rabies, distemper, parvovirus, adenovirus. Cats: rabies, feline viral rhinotracheitis, calicivirus, panleukopenia. Non-core vaccines (bordetella, leptospirosis, feline leukemia) depend on lifestyle — ask the vet.', ARRAY['vaccines']),
('policies', 'What is the cancellation and refund policy?', 'Free cancellation up to 48 hours before the booking start. Within 48 hours: 50% refund. After start time: no refund unless the provider cancels. Providers who cancel repeatedly may be delisted.', ARRAY['refund','cancellation']),
('policies', 'How are payments and tips handled?', 'Owner pays the service rate plus a 10% booking fee (capped at $/€45). Providers keep 82% of the service rate; the platform takes 18%. Tips go 100% to the provider — no commission. Funds are held in escrow and released 24 hours after service ends.', ARRAY['payments','fees','tips']),
('policies', 'Are providers verified?', 'Every provider completes ID verification. Providers displaying the Verified badge have also passed a background check. Every booking is insured.', ARRAY['safety','trust']);