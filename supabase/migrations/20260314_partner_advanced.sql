-- =====================================================
-- DESIDERI DI PUGLIA — Advanced Partner Profile System
-- =====================================================

-- Extend partners table with advanced fields
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS subcategory              text,
  ADD COLUMN IF NOT EXISTS price_range              text CHECK (price_range IN ('low','medium','premium','luxury')),
  ADD COLUMN IF NOT EXISTS atmosphere               text[],
  ADD COLUMN IF NOT EXISTS ideal_moment             text[],
  ADD COLUMN IF NOT EXISTS ideal_target             text[],
  ADD COLUMN IF NOT EXISTS location_type            text[],
  ADD COLUMN IF NOT EXISTS features                 jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS languages                text[] DEFAULT '{it}',
  ADD COLUMN IF NOT EXISTS experience_duration      text,
  ADD COLUMN IF NOT EXISTS profile_score            smallint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advanced_profile_completed_at timestamptz;

-- Master tags table
CREATE TABLE IF NOT EXISTS master_tags (
  id         text PRIMARY KEY,
  label      text NOT NULL,
  group_name text NOT NULL,
  sort_order smallint DEFAULT 0
);

-- Partner ↔ Tags (many-to-many)
CREATE TABLE IF NOT EXISTS partner_tags (
  partner_id uuid REFERENCES partners(id) ON DELETE CASCADE,
  tag_id     text REFERENCES master_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (partner_id, tag_id)
);
CREATE INDEX IF NOT EXISTS partner_tags_tag_idx ON partner_tags(tag_id);

-- User saga sessions
CREATE TABLE IF NOT EXISTS user_saga_sessions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES utenti(id) ON DELETE SET NULL,
  intent      text[],
  companions  text,
  budget_pref text,
  atmosphere  text[],
  moment      text,
  interests   text[],
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS saga_user_idx ON user_saga_sessions(user_id);

-- RLS
ALTER TABLE master_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags_read_public" ON master_tags FOR SELECT USING (true);

ALTER TABLE partner_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ptags_read_public" ON partner_tags FOR SELECT USING (true);
CREATE POLICY "ptags_owner_insert" ON partner_tags FOR INSERT WITH CHECK (
  partner_id IN (SELECT id FROM partners WHERE owner_user_id = auth.uid())
);
CREATE POLICY "ptags_owner_delete" ON partner_tags FOR DELETE USING (
  partner_id IN (SELECT id FROM partners WHERE owner_user_id = auth.uid())
);

ALTER TABLE user_saga_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saga_own" ON user_saga_sessions FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "saga_anon_insert" ON user_saga_sessions FOR INSERT WITH CHECK (true);

-- Seed master tags
INSERT INTO master_tags (id, label, group_name, sort_order) VALUES
('autentico','Autentico','emozione',1),('locale','Locale','emozione',2),
('romantico','Romantico','emozione',3),('premium_feel','Premium','emozione',4),
('economico','Economico','emozione',5),('rilassante','Rilassante','emozione',6),
('avventuroso','Avventuroso','emozione',7),('instagrammabile','Instagrammabile','emozione',8),
('esclusivo','Esclusivo','emozione',9),('familiare','Familiare','emozione',10),
('sociale','Sociale','emozione',11),('culturale','Culturale','emozione',12),
('gastronomico','Gastronomico','emozione',13),('panoramico','Panoramico','emozione',14),
('tradizionale','Tradizionale','emozione',15),('moderno','Moderno','emozione',16),
('elegante_feel','Elegante','emozione',17),('informale','Informale','emozione',18),
('slow','Slow','emozione',19),('esperienziale','Esperienziale','emozione',20),
('centro_storico','Centro storico','contesto',1),('mare','Mare','contesto',2),
('campagna','Campagna','contesto',3),('borgo','Borgo','contesto',4),
('terrazza','Terrazza','contesto',5),('vista_mare','Vista mare','contesto',6),
('vista_tramonto','Vista tramonto','contesto',7),('loc_masseria','Masseria','contesto',8),
('outdoor','Outdoor','contesto',9),('indoor','Indoor','contesto',10),
('colazione','Colazione','occasione',1),('brunch','Brunch','occasione',2),
('pranzo','Pranzo','occasione',3),('aperitivo','Aperitivo','occasione',4),
('cena','Cena','occasione',5),('dopocena','Dopocena','occasione',6),
('serata','Serata','occasione',7),('weekend','Weekend','occasione',8),
('giornata_intera','Giornata intera','occasione',9),
('coppia','Coppia','target',1),('famiglia','Famiglia','target',2),
('amici','Amici','target',3),('solo_traveler','Solo traveler','target',4),
('business','Business traveler','target',5),('digital_nomad','Digital nomad','target',6),
('gruppi','Gruppi','target',7),('bambini','Con bambini','target',8),
('pet_friendly_tag','Pet-friendly','target',9),
('discovery','Discovery','stile',1),('food_lover','Food lover','stile',2),
('hidden_gems','Hidden gems','stile',3),('photo_spot','Photo spot','stile',4),
('shopping_loc','Shopping','stile',5),('wellness','Wellness','stile',6),
('nightlife','Nightlife','stile',7),('artigianato','Artigianato','stile',8),
('wine','Wine lover','stile',9),('tradizione','Tradizione','stile',10),
('spirituale','Spirituale','stile',11),('sportivo','Sportivo','stile',12)
ON CONFLICT (id) DO NOTHING;
