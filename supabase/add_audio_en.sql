-- Add audio_track_en to cards table
ALTER TABLE cards
ADD COLUMN IF NOT EXISTS audio_track_en TEXT;

COMMENT ON COLUMN cards.audio_track_en IS 'URL of the English audio track for bilingual support';
