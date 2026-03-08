-- Esempio di come aggiungere gli "step" per una specifica Saga Storica (Quest Set)
-- Esegui questo script nel "SQL Editor" del tuo pannello Supabase

-- Popoliamo gli step della saga "⚔️ L'Arco della Disfida"
INSERT INTO public.quest_set_steps (
    set_id,
    step_order,
    description_it,
    reference_table,
    reference_id
)
SELECT 
    id,
    1,
    'Prima Tappa: Incontro con la guida' as description_it,
    'cards',
    NULL  -- (Mettiamo NULL se non è associato a un monumento specifico o inseriamo l'ID di una Card se vogliamo collegarlo alla Card)
FROM public.quest_sets WHERE title_it = '⚔️ L''Arco della Disfida';

INSERT INTO public.quest_set_steps (
    set_id,
    step_order,
    description_it,
    reference_table,
    reference_id
)
SELECT 
    id,
    2,
    'Seconda Tappa: Visita al Castello' as description_it,
    'cards',
    NULL
FROM public.quest_sets WHERE title_it = '⚔️ L''Arco della Disfida';

INSERT INTO public.quest_set_steps (
    set_id,
    step_order,
    description_it,
    reference_table,
    reference_id
)
SELECT 
    id,
    3,
    'Terza Tappa: Aperitivo sotto le mura' as description_it,
    'cards',
    NULL
FROM public.quest_sets WHERE title_it = '⚔️ L''Arco della Disfida';
