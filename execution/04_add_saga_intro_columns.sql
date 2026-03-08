-- execution/04_add_saga_intro_columns.sql
-- Aggiunge colonne per la pagina di "Atmosfera" / Intro delle Saghe

ALTER TABLE public.quest_sets
ADD COLUMN IF NOT EXISTS estimated_time_min INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS estimated_steps INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS lore_text_it TEXT,
ADD COLUMN IF NOT EXISTS lore_text_en TEXT,
ADD COLUMN IF NOT EXISTS starting_point VARCHAR(200);

-- Seeding di default
UPDATE public.quest_sets
SET
    estimated_time_min = COALESCE(estimated_time_min, 90),
    estimated_steps = COALESCE(estimated_steps, (SELECT COUNT(*) FROM quest_set_steps WHERE set_id = quest_sets.id)),
    lore_text_it = COALESCE(lore_text_it, 'Preparati a vivere un''avventura unica attraverso i luoghi più suggestivi della Puglia. Ogni tappa nasconde una storia, una scoperta e una ricompensa esclusiva.'),
    lore_text_en = COALESCE(lore_text_en, 'Get ready for a unique adventure through the most evocative places in Puglia. Every step hides a story, a discovery, and an exclusive reward.'),
    starting_point = COALESCE(starting_point, city)
WHERE lore_text_it IS NULL;
