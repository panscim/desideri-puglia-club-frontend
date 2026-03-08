-- ============================================================
-- Migration: Add user_quest_favorites table
-- ============================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.user_quest_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    set_id UUID NOT NULL REFERENCES public.quest_sets(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, set_id)
);

-- 2. Enable RLS
ALTER TABLE public.user_quest_favorites ENABLE ROW LEVEL SECURITY;

-- 3. Policies for users to manage their own favorites
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.user_quest_favorites;
CREATE POLICY "Users can view their own favorites"
    ON public.user_quest_favorites FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.user_quest_favorites;
CREATE POLICY "Users can insert their own favorites"
    ON public.user_quest_favorites FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.user_quest_favorites;
CREATE POLICY "Users can delete their own favorites"
    ON public.user_quest_favorites FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
