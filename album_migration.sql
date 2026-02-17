-- Create 'cards' table (Le Figurine)
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT,
    type TEXT NOT NULL CHECK (type IN ('monument', 'partner')),
    rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'legendary')),
    city TEXT,
    gps_lat DOUBLE PRECISION,
    gps_lng DOUBLE PRECISION,
    gps_radius INTEGER DEFAULT 100, -- meters
    pin_code TEXT,
    description TEXT,
    points_value INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on cards
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read cards
CREATE POLICY "Everyone can read cards" ON public.cards FOR SELECT USING (true);
-- Policy: Service role only can write (for now)

-- Create 'user_cards' table (Collezione Utente)
CREATE TABLE IF NOT EXISTS public.user_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_favorite BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, card_id) -- Prevent duplicates
);

-- Enable RLS on user_cards
ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own cards
CREATE POLICY "Users can read own cards" ON public.user_cards FOR SELECT USING (auth.uid() = user_id);
-- Policy: Service role can insert (triggered by backend/edge function) or strict policy for authenticated users if we do client-side unlock (not recommended for PIN/GPS but we might need it for now)
-- Let's allow insert for authenticated users for now to make the prototype work, but in production this should be via RPC functions to verify PIN/GPS.
CREATE POLICY "Users can insert own cards" ON public.user_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cards" ON public.user_cards FOR UPDATE USING (auth.uid() = user_id);

-- Update 'utenti' table
ALTER TABLE public.utenti ADD COLUMN IF NOT EXISTS last_quiz_at TIMESTAMP WITH TIME ZONE;
