-- 06_wipe_legacy_features.sql
-- Eseguire questo script nel SQL Editor di Supabase per eliminare definitivamente
-- le tabelle afferenti alle funzionalità dismesse come richiesto in fase MVP

BEGIN;

-- 1. Rimozione Tabelle Eventi
DROP TABLE IF EXISTS public.eventi_club CASCADE;
DROP TABLE IF EXISTS public.eventi_partecipanti CASCADE;
DROP TABLE IF EXISTS public.eventi CASCADE;

-- 2. Rimozione Tabelle Missioni
DROP TABLE IF EXISTS public.missioni_inviate CASCADE;
DROP TABLE IF EXISTS public.missioni CASCADE;

-- 3. (Opzionale) Tabelle relative a Prenotazioni Soggiorno / BAD se presenti
DROP TABLE IF EXISTS public.prenotazioni_soggiorno CASCADE;
DROP TABLE IF EXISTS public.booking_bad CASCADE;
DROP TABLE IF EXISTS public.assistenza_ticket CASCADE;

-- Revoca permessi e policy per sicurezza anche se il cascade dovrebbe bastare
COMMIT;

-- Le tabelle user_cards e profiles rimangono intatte come concordato 
-- per l'alimentazione del Passaporto Digitale.
