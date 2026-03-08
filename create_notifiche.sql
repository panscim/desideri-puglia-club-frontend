-- Tabella per gestire le notifiche in-app
CREATE TABLE public.notifiche (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.utenti(id) ON DELETE CASCADE,
    titolo TEXT NOT NULL,
    messaggio TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'sistema', -- es: 'prenotazione', 'annullamento', 'sistema'
    letta BOOLEAN DEFAULT false,
    link_azione TEXT, -- Opzionale: link dove la notifica dovrebbe portare l'utente
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX idx_notifiche_user_id_letta ON public.notifiche(user_id, letta);

-- Sicurezza (RLS)
ALTER TABLE public.notifiche ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gli utenti leggono le proprie notifiche"
ON public.notifiche FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Gli utenti aggiornano le proprie notifiche"
ON public.notifiche FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- La policy INSERT è lasciata al service account (backend) ma possiamo abilitarla temporaneamente in client per testing
CREATE POLICY "Inserimento notifiche"
ON public.notifiche FOR INSERT
TO authenticated
WITH CHECK (true);
