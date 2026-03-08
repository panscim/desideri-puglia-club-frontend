-- ============================================================
-- Migration: Add is_original column to quest_sets
-- ============================================================

-- 1. Add the column
ALTER TABLE public.quest_sets 
ADD COLUMN IF NOT EXISTS is_original BOOLEAN DEFAULT FALSE;

-- 2. Set 'Barletta: Il Cuore della Disfida' as original for demo
UPDATE public.quest_sets 
SET is_original = TRUE 
WHERE title_it = 'Barletta: Il Cuore della Disfida';

-- 3. Comment on column
COMMENT ON COLUMN public.quest_sets.is_original IS 'If true, this mission is an official Desideri di Puglia Original';
