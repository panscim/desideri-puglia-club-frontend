-- Add English columns for bilingual support in cards
ALTER TABLE cards
ADD COLUMN title_en TEXT,
ADD COLUMN description_en TEXT,
ADD COLUMN history_en TEXT,
ADD COLUMN curiosity_en JSONB;

-- Note: We assume the existing columns (title, description, history, curiosity) 
-- will be used for Italian (the default language), or we can treat them as the Italian source.

COMMENT ON COLUMN cards.title IS 'Italian Title';
COMMENT ON COLUMN cards.title_en IS 'English Title';
COMMENT ON COLUMN cards.description IS 'Italian Description';
COMMENT ON COLUMN cards.description_en IS 'English Description';
COMMENT ON COLUMN cards.history IS 'Italian History';
COMMENT ON COLUMN cards.history_en IS 'English History';
COMMENT ON COLUMN cards.curiosity IS 'Italian Curiosity (JSONB array)';
COMMENT ON COLUMN cards.curiosity_en IS 'English Curiosity (JSONB array)';
