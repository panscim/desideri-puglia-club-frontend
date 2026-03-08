-- 1. Aggiungiamo le colonne
ALTER TABLE public.quest_sets 
    ADD COLUMN IF NOT EXISTS distance_km NUMERIC(5, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS difficulty VARCHAR(50) DEFAULT 'MEDIUM',
    ADD COLUMN IF NOT EXISTS completions_count INTEGER DEFAULT 0;

-- 2. Popoliamo con dati indicativi
UPDATE public.quest_sets
SET 
    -- Genera un numero intero random tra 300 e 897
    completions_count = floor(random() * (897 - 300 + 1) + 300),
    distance_km = 3.5 + floor(random() * 5),
    difficulty = 'MEDIUM';
