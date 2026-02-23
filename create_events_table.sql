-- =============================================
-- DESIDERI DI PUGLIA CLUB - EVENTI CLUB V2
-- Gestione eventi live/partner con rilascio Card, GPS & PIN
-- =============================================

-- 1. Eliminiamo la tabella precedente se esiste, per ricrearla pulita
DROP TABLE IF EXISTS public.eventi_club CASCADE;

-- 2. Creazione della tabella
CREATE TABLE public.eventi_club (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  titolo text NOT NULL,
  titolo_en text,
  descrizione text NOT NULL,
  descrizione_en text,
  luogo text NOT NULL,
  latitudine double precision,
  longitudine double precision,
  data_inizio timestamp with time zone NOT NULL,
  data_fine timestamp with time zone NOT NULL,
  immagine_url text,
  tipo_sblocco text DEFAULT 'gps' CHECK (tipo_sblocco IN ('gps', 'pin')),
  pin_code text,
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  ricompensa_card_id uuid REFERENCES public.cards(id) ON DELETE SET NULL,
  link_esterno text,
  disponibile boolean DEFAULT true,
  data_creazione timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Row Level Security
ALTER TABLE public.eventi_club ENABLE ROW LEVEL SECURITY;

-- Tutti possono vedere gli eventi (sempre)
CREATE POLICY "Public Read Access" 
  ON public.eventi_club 
  FOR SELECT 
  USING (true);

-- L'inserimento/modifica/patch viene delegata in backend o frontale con Auth
CREATE POLICY "Admin All Access" 
  ON public.eventi_club 
  FOR ALL 
  USING (true);

-- 4. Indice per ottimizzare la ricerca per data
CREATE INDEX idx_eventi_club_date ON public.eventi_club(data_inizio, data_fine);
