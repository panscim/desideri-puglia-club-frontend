-- Migrazione: Aggiunta delle colonne per l'esperienza Mappa Premium (Mappa.jsx)
-- Tabella: quest_sets

-- 1. Aggiungo le colonne geografiche alla tabella principale delle Saghe
ALTER TABLE public.quest_sets 
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC,
ADD COLUMN IF NOT EXISTS map_marker_color VARCHAR(50);

-- Commenti descrittivi
COMMENT ON COLUMN public.quest_sets.latitude IS 'Latitudine del punto di partenza o centro della Saga per la mappa';
COMMENT ON COLUMN public.quest_sets.longitude IS 'Longitudine del punto di partenza o centro della Saga per la mappa';
COMMENT ON COLUMN public.quest_sets.map_marker_color IS 'Colore esadecimale o Tailwind per personalizzare l''icona della mappa (opzionale)';

-- 2. Popolamento Dati Base (Esempio per le principali città pugliesi citate)
-- Aggiorna con coordinate approssimative basate sul nome della città
UPDATE public.quest_sets SET latitude = 41.1171, longitude = 16.8719 WHERE city ILIKE '%Bari%';
UPDATE public.quest_sets SET latitude = 41.2721, longitude = 16.4168 WHERE city ILIKE '%Trani%';
UPDATE public.quest_sets SET latitude = 41.2268, longitude = 16.2979 WHERE city ILIKE '%Andria%';
UPDATE public.quest_sets SET latitude = 40.7928, longitude = 17.1012 WHERE city ILIKE '%Polignano%';
UPDATE public.quest_sets SET latitude = 40.3533, longitude = 18.1746 WHERE city ILIKE '%Lecce%';
UPDATE public.quest_sets SET latitude = 40.8306, longitude = 17.3361 WHERE city ILIKE '%Alberobello%';

-- 3. Aggiunta tipologie per le Demo Mappa in modo da variare i colori dei pin
UPDATE public.quest_sets SET quest_type = 'Natura' WHERE city = 'Trani';
UPDATE public.quest_sets SET quest_type = 'Gastronomia' WHERE city = 'Andria';

-- ----------------------------------------------------------------------------------
-- MANTENGO LE MODIFICHE PRECEDENTI PER L'ESPERIENZA NARRATIVA:
-- Tabella: quest_set_steps

ALTER TABLE public.quest_set_steps 
ADD COLUMN IF NOT EXISTS narrative_hint_it TEXT,
ADD COLUMN IF NOT EXISTS narrative_hint_en TEXT,
ADD COLUMN IF NOT EXISTS unlock_radius_m INTEGER DEFAULT 50;

COMMENT ON COLUMN public.quest_set_steps.narrative_hint_it IS 'Un indovinello o frase poetica che guida l''utente alla tappa senza svelarne subito il nome.';
COMMENT ON COLUMN public.quest_set_steps.unlock_radius_m IS 'Raggio in metri entro il quale l''utente deve trovarsi col GPS per poter sbloccare la tappa.';
