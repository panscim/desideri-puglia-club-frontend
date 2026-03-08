-- Alter cards table: Replace curiosity JSONB fields with 6 specific TEXT fields
ALTER TABLE cards
DROP COLUMN IF EXISTS curiosity,
DROP COLUMN IF EXISTS curiosity_en,
ADD COLUMN curiosity1_it TEXT,
ADD COLUMN curiosity2_it TEXT,
ADD COLUMN curiosity3_it TEXT,
ADD COLUMN curiosity1_en TEXT,
ADD COLUMN curiosity2_en TEXT,
ADD COLUMN curiosity3_en TEXT;

COMMENT ON COLUMN cards.curiosity1_it IS 'Italian Curiosity 1';
COMMENT ON COLUMN cards.curiosity2_it IS 'Italian Curiosity 2';
COMMENT ON COLUMN cards.curiosity3_it IS 'Italian Curiosity 3';
COMMENT ON COLUMN cards.curiosity1_en IS 'English Curiosity 1';
COMMENT ON COLUMN cards.curiosity2_en IS 'English Curiosity 2';
COMMENT ON COLUMN cards.curiosity3_en IS 'English Curiosity 3';
