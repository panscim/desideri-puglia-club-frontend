-- Rimuoviamo le vecchie policy per evitare conflitti o sovrapposizioni errate
DROP POLICY IF EXISTS "Partner leggono prenotazioni dei propri eventi" ON public.prenotazioni_eventi;
DROP POLICY IF EXISTS "Partner aggiornano prenotazioni dei propri eventi" ON public.prenotazioni_eventi;
DROP POLICY IF EXISTS "Admin leggono tutte le prenotazioni" ON public.prenotazioni_eventi;
DROP POLICY IF EXISTS "Admin aggiornano tutte le prenotazioni" ON public.prenotazioni_eventi;

-- 1. Policy per la LETTURA (SELECT)
CREATE POLICY "Partner e Admin possono leggere le prenotazioni"
ON public.prenotazioni_eventi FOR SELECT
TO authenticated
USING (
  -- L'utente è un Admin
  (SELECT ruolo FROM public.utenti WHERE id = auth.uid()) = 'admin'
  OR 
  -- L'utente è il Partner proprietario dell'evento
  event_id IN (
    SELECT id::TEXT 
    FROM public.partner_events_created 
    WHERE partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
  )
);

-- 2. Policy per l'AGGIORNAMENTO (UPDATE) per "bruciare" il ticket
CREATE POLICY "Partner e Admin possono validare i ticket"
ON public.prenotazioni_eventi FOR UPDATE
TO authenticated
USING (
  -- L'utente è un Admin
  (SELECT ruolo FROM public.utenti WHERE id = auth.uid()) = 'admin'
  OR 
  -- L'utente è il Partner proprietario dell'evento
  event_id IN (
    SELECT id::TEXT 
    FROM public.partner_events_created 
    WHERE partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
  )
)
WITH CHECK (
  -- Permettiamo solo la modifica del campo 'status' e 'updated_at'
  -- Nota: in RLS standard non si può filtrare per colonna nel WITH CHECK, 
  -- quindi garantiamo che l'utente abbia ancora i permessi di accesso.
  (SELECT ruolo FROM public.utenti WHERE id = auth.uid()) = 'admin'
  OR 
  event_id IN (
    SELECT id::TEXT 
    FROM public.partner_events_created 
    WHERE partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
  )
);
