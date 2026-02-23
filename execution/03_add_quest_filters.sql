-- execution/03_add_quest_filters.sql
-- Aggiunge le colonne per il filtraggio delle Saghe (Quest Sets)

ALTER TABLE public.quest_sets
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS quest_type VARCHAR(50);

-- Seeding di base per le Saghe esistenti (Aggiorna quelle attuali con valori di test se necessario, o valori null)
UPDATE public.quest_sets
SET city = 'Bari', quest_type = 'Storico'
WHERE city IS NULL;
