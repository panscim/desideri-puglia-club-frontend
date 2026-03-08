-- Aggiungiamo eventuali policy mancanti in public.prenotazioni_eventi per la validazione Partner

-- 1. I Partner (organizzatori) devono poter leggere le prenotazioni dei loro eventi
-- In Supabase la tabella partner_events_created ha 'partner_id'. La tabella partners ha 'user_id'
CREATE POLICY "Partner leggono prenotazioni dei propri eventi"
ON public.prenotazioni_eventi FOR SELECT
TO authenticated
USING (
  event_id IN (
    SELECT id::TEXT 
    FROM public.partner_events_created 
    WHERE partner_id IN (
      SELECT id FROM public.partners WHERE user_id = auth.uid()
    )
  )
);

-- 2. I Partner devono poter aggiornare le prenotazioni per contrassegnarle come utilizzate
CREATE POLICY "Partner aggiornano prenotazioni dei propri eventi"
ON public.prenotazioni_eventi FOR UPDATE
TO authenticated
USING (
  event_id IN (
    SELECT id::TEXT 
    FROM public.partner_events_created 
    WHERE partner_id IN (
      SELECT id FROM public.partners WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  event_id IN (
    SELECT id::TEXT 
    FROM public.partner_events_created 
    WHERE partner_id IN (
      SELECT id FROM public.partners WHERE user_id = auth.uid()
    )
  )
);
