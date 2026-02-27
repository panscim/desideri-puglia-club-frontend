-- ============================================================
-- Fix RLS su user_quest_sets
-- Esegui nel Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Abilita RLS se non è già attiva
ALTER TABLE public.user_quest_sets ENABLE ROW LEVEL SECURITY;

-- 2. Policy: utenti autenticati possono LEGGERE solo le proprie righe
DROP POLICY IF EXISTS "user_quest_sets_select_own" ON public.user_quest_sets;
CREATE POLICY "user_quest_sets_select_own"
  ON public.user_quest_sets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3. Policy: utenti autenticati possono INSERIRE solo le proprie righe
DROP POLICY IF EXISTS "user_quest_sets_insert_own" ON public.user_quest_sets;
CREATE POLICY "user_quest_sets_insert_own"
  ON public.user_quest_sets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 4. Policy: utenti autenticati possono AGGIORNARE solo le proprie righe
DROP POLICY IF EXISTS "user_quest_sets_update_own" ON public.user_quest_sets;
CREATE POLICY "user_quest_sets_update_own"
  ON public.user_quest_sets
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- 5. Stessa cosa per user_quest_set_steps
ALTER TABLE public.user_quest_set_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_quest_set_steps_select_own" ON public.user_quest_set_steps;
CREATE POLICY "user_quest_set_steps_select_own"
  ON public.user_quest_set_steps
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_quest_set_steps_insert_own" ON public.user_quest_set_steps;
CREATE POLICY "user_quest_set_steps_insert_own"
  ON public.user_quest_set_steps
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ✅ VERIFICA che le policy siano state create:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename IN ('user_quest_sets', 'user_quest_set_steps');
