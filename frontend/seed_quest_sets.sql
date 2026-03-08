-- SQL Script per popolare un Set Finto (L'Eredità degli Svevi) come da Mockup

-- 1. Inserisci il Quest Set Principale (riceverai indietro l'ID generato automaticamente)
INSERT INTO public.quest_sets (
    title_it,
    description_it,
    image_url,
    is_active
) VALUES (
    'L''Eredità degli Svevi',
    'Esplora i segreti celati nell''architettura federiciana e sblocca la carta esclusiva di Castel del Monte.',
    'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=600&auto=format',
    true
)
-- Restituiamo l'id per comodità se volessimo associarlo in uno script, 
-- ma qui ci basta che esista nella tabella per testare la UI!
RETURNING id;
