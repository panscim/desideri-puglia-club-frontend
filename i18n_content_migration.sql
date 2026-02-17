-- Add English columns to 'missioni_catalogo'
ALTER TABLE missioni_catalogo 
ADD COLUMN IF NOT EXISTS titolo_en text,
ADD COLUMN IF NOT EXISTS descrizione_en text;

-- Add English columns to 'premi_mensili'
ALTER TABLE premi_mensili 
ADD COLUMN IF NOT EXISTS titolo_en text,
ADD COLUMN IF NOT EXISTS descrizione_en text,
ADD COLUMN IF NOT EXISTS termini_en text;
