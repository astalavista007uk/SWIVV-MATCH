CREATE TABLE IF NOT EXISTS lost_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  pet_id UUID REFERENCES pets(id),
  pet_name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  last_seen_location TEXT NOT NULL,
  last_seen_lat DOUBLE PRECISION,
  last_seen_lon DOUBLE PRECISION,
  last_seen_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  reward_amount NUMERIC(12,2),
  reward_currency TEXT DEFAULT 'usd',
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','reunited','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reunited_at TIMESTAMPTZ,
  close_reason TEXT,
  closed_at TIMESTAMPTZ
);

ALTER TABLE lost_pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lost_pets_select_active" ON lost_pets
  FOR SELECT USING (status = 'active');

CREATE POLICY "lost_pets_select_own" ON lost_pets
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "lost_pets_insert" ON lost_pets
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "lost_pets_update_own" ON lost_pets
  FOR UPDATE USING (owner_id = auth.uid());

CREATE TABLE IF NOT EXISTS lost_pet_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lost_pet_id UUID REFERENCES lost_pets(id) NOT NULL,
  finder_id UUID REFERENCES profiles(id) NOT NULL,
  message TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','contacted','reunited')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE lost_pet_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lost_pet_claims_insert" ON lost_pet_claims
  FOR INSERT WITH CHECK (finder_id = auth.uid());

CREATE POLICY "lost_pet_claims_select_owner" ON lost_pet_claims
  FOR SELECT USING (
    lost_pet_id IN (SELECT id FROM lost_pets WHERE owner_id = auth.uid())
    OR finder_id = auth.uid()
  );

CREATE POLICY "lost_pet_claims_update_owner" ON lost_pet_claims
  FOR UPDATE USING (
    lost_pet_id IN (SELECT id FROM lost_pets WHERE owner_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_lost_pets_status ON lost_pets(status);
CREATE INDEX IF NOT EXISTS idx_lost_pets_owner ON lost_pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_lost_pets_created ON lost_pets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lost_pet_claims_lost_pet ON lost_pet_claims(lost_pet_id);

GRANT ALL ON lost_pets TO anon, authenticated, service_role;
GRANT ALL ON lost_pet_claims TO anon, authenticated, service_role;
