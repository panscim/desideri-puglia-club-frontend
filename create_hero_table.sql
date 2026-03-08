-- SQL Script per creare la tabella per gestire lo Slider Principale (Hero) nella Dashboard.
-- Eseguire nel SQL Editor di Supabase.

CREATE TABLE public.dashboard_hero (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  title text NOT NULL,
  subtitle text,
  button_link text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Impostiamo la tabella come accessibile pubblicamente in lettura per abilitare lo slider a tutti.
ALTER TABLE public.dashboard_hero ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on dashboard_hero" 
ON public.dashboard_hero 
FOR SELECT 
USING (true);

-- Inserimento di due dati demo iniziali per testare lo scorrimento appena implementato
INSERT INTO public.dashboard_hero (image_url, title, subtitle, button_link, display_order)
VALUES 
(
  'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=1200&auto=format', 
  'Ricordi di viaggio indimenticabili', 
  'Esplora la Puglia come mai prima d''ora.', 
  '/missioni', 
  1
),
(
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1200&auto=format', 
  'Unici ed Autentici', 
  'Spegni il telefono, vivi la realtà. Unisciti ai nostri eventi esclusivi.', 
  '/eventi', 
  2
);
