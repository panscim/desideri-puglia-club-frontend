-- Tabella per le prenotazioni degli eventi (sia Club che Partner)
CREATE TABLE public.prenotazioni_eventi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.utenti(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL, -- Uso testuale perché l'ID potrebbe provenire o da eventi_club o da partner_events_created (uuid/string)
    is_guest_event BOOLEAN DEFAULT false, -- Specifica se è un evento partner per instradare le future logiche di admin
    status TEXT NOT NULL DEFAULT 'confermato', -- confermato | annullato
    num_ospiti INTEGER DEFAULT 1, -- Numero di posti bloccati in questo biglietto (default 1)
    note_aggiuntive TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creiamo un indice utile per ricerche veloci
CREATE INDEX idx_prenotazioni_eventi_user_id ON public.prenotazioni_eventi(user_id);
CREATE INDEX idx_prenotazioni_eventi_event_id ON public.prenotazioni_eventi(event_id);

-- Gestione Row Level Security
ALTER TABLE public.prenotazioni_eventi ENABLE ROW LEVEL SECURITY;

-- Gli utenti possono vedere solo le loro prenotazioni
CREATE POLICY "Gli utenti possono leggere le proprie prenotazioni"
ON public.prenotazioni_eventi FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Gli utenti possono inserire prenotazioni per loro stessi
CREATE POLICY "Gli utenti possono creare proprie prenotazioni"
ON public.prenotazioni_eventi FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Gli utenti possono aggiornare (es. annullare) le loro prenotazioni
CREATE POLICY "Gli utenti possono modificare le proprie prenotazioni"
ON public.prenotazioni_eventi FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
