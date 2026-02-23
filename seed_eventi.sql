-- =============================================
-- SEED EVENTI - Dati di Test
-- =============================================

-- Ti serviranno due UUID validi di cards esistenti nel tuo DB.
-- Dato che non li conosco a priori, questo script usa (SELECT id FROM cards LIMIT 1) per testare.
-- Lo stesso vale per partner_id.

DO $$
DECLARE
    card_id_1 uuid;
    card_id_2 uuid;
    partner_id_1 uuid;
BEGIN
    -- Preleva la prima carta disponibile
    SELECT id INTO card_id_1 FROM public.cards LIMIT 1;
    -- Preleva la seconda carta disponibile (se esiste)
    SELECT id INTO card_id_2 FROM public.cards OFFSET 1 LIMIT 1;
    -- Preleva un partner a caso (se esiste)
    SELECT id INTO partner_id_1 FROM public.partners LIMIT 1;

    -- EVENTO 1: Sagra Locale (Sblocco GPS)
    INSERT INTO public.eventi_club (
        titolo, titolo_en, 
        descrizione, descrizione_en, 
        luogo, latitudine, longitudine, 
        data_inizio, data_fine, 
        immagine_url, tipo_sblocco, 
        ricompensa_card_id, link_esterno, disponibile
    ) VALUES (
        'Festa di San Nicola a Bari', 'St. Nicholas Feast in Bari',
        'Vivi la magia delle celebrazioni storiche nel cuore di Bari. Ottieni questa card esclusiva raggiungendo la Basilica.', 'Experience the magic of historical celebrations in the heart of Bari. Get this exclusive card by reaching the Basilica.',
        'Basilica di San Nicola, Bari', 41.1300, 16.8719,
        timezone('utc'::text, now() - interval '1 day'), timezone('utc'::text, now() + interval '5 days'),
        'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=800', 'gps',
        card_id_1, 'https://www.comune.bari.it', true
    );

    -- EVENTO 2: Release Party da un Partner (Sblocco PIN)
    INSERT INTO public.eventi_club (
        titolo, titolo_en, 
        descrizione, descrizione_en, 
        luogo, latitudine, longitudine, 
        data_inizio, data_fine, 
        immagine_url, tipo_sblocco, pin_code,
        partner_id, ricompensa_card_id, disponibile
    ) VALUES (
        'Wine Tasting Esclusivo Cantele', 'Exclusive Wine Tasting Cantele',
        'Partecipa alla degustazione di vini pugliesi presso la vineria. Chiedi il PIN all''oste per sbloccare la tua ricompensa.', 'Join the Apulian wine tasting at the winery. Ask the host for the PIN to unlock your reward.',
        'Lecce Centro', 40.3524, 18.1691,
        timezone('utc'::text, now() + interval '2 days'), timezone('utc'::text, now() + interval '3 days'),
        'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=800', 'pin', 'WINE2024',
        partner_id_1, COALESCE(card_id_2, card_id_1), true
    );

    RAISE NOTICE 'Seed degli Eventi completato!';
END $$;
