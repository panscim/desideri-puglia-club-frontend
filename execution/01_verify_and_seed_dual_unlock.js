/**
 * EXECUTION SCRIPT: 01_verify_and_seed_dual_unlock.js
 * 
 * SCOPO:
 * Questo script isolato e deterministico serve a validare lo schema del database
 * in Supabase e a popolare l'ambiente con dati mock specifici per testare la
 * logica di Dual-Unlock (GPS < 50m e Inserimento PIN Segreto), come da
 * architettura DOE (Directive 01 e 03).
 * 
 * ESECUZIONE:
 * node execution/01_verify_and_seed_dual_unlock.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carica variabili d'ambiente due directory sopra (../frontend/.env)
dotenv.config({ path: path.resolve(__dirname, '../frontend/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERRORE: Chiavi Supabase mancanti. Verifica il file frontend/.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runExecution() {
    console.log('🔄 INIZIO EXECUTION: 01_verify_and_seed_dual_unlock');

    try {
        // 1. VERIFICA SCHEMA (Tentiamo una lettura delle colonne chiave)
        console.log('⏳ Verifica integrità colonne Dual-Unlock (tipo_sblocco, latitudine, longitudine, pin_code)...');
        const { error: schemaError } = await supabase
            .from('eventi_club')
            .select('id, tipo_sblocco, latitudine, longitudine, pin_code, ricompensa_card_id')
            .limit(1);

        if (schemaError) {
            console.error('❌ ERRORE SCHEMA: La tabella eventi_club non possiede i campi richiesti per il Dual-Unlock.');
            console.error('Dettagli:', schemaError.message);
            console.log('💡 AZIONE CORRETTIVA AUTO-HEALING: Esegui la migrazione SQL di create_events_table.sql');
            process.exit(1);
        }
        console.log('✅ Schema validato con successo.');

        // 2. RECUPERA DIPENDENZE (Troviamo una card per assegnarla come premio)
        const { data: cards, error: cardsError } = await supabase.from('cards').select('id').limit(1);
        if (cardsError || !cards || cards.length === 0) {
            console.error('❌ ERRORE: Nessuna Card presente nel DB. Necessaria almeno una card per le ricompense.');
            process.exit(1);
        }
        const testCardId = cards[0].id;

        // 3. SEEDING DATI DI TEST (Generazione dei due casi d'uso Blueprints)
        console.log('⏳ Inserimento eventi mock per test Dual-Unlock...');

        const mockEvents = [
            {
                titolo: 'Mock Evento Culturale (GPS)',
                titolo_en: 'Mock Cultural Event (GPS)',
                descrizione: 'Evento di test sbloccabile solo via GPS (< 50 metri).',
                descrizione_en: 'Test event unlockable only via GPS (< 50 meters).',
                luogo: 'Castello Svevo, Bari',
                latitudine: 41.1293, // Coordinate reali Castello Svevo
                longitudine: 16.8667,
                data_inizio: new Date().toISOString(),
                data_fine: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 Giorni
                immagine_url: 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8',
                tipo_sblocco: 'gps',
                pin_code: null,
                ricompensa_card_id: testCardId,
                disponibile: false // Manteniamo false in produzione per non inquinare la dashboard reale
            },
            {
                titolo: 'Mock Evento Partner (PIN)',
                titolo_en: 'Mock Partner Event (PIN)',
                descrizione: 'Evento di test presso partner sbloccabile solo con PIN (12345).',
                descrizione_en: 'Test partner event unlockable only via PIN (12345).',
                luogo: 'Ristorante Test',
                latitudine: 41.1200,
                longitudine: 16.8600,
                data_inizio: new Date().toISOString(),
                data_fine: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                immagine_url: 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8',
                tipo_sblocco: 'pin',
                pin_code: '12345',
                ricompensa_card_id: testCardId,
                disponibile: false
            }
        ];

        // Pulizia preventiva dei mock data (idempotenza)
        await supabase.from('eventi_club').delete().in('titolo', mockEvents.map(e => e.titolo));

        const { error: insertError } = await supabase
            .from('eventi_club')
            .insert(mockEvents);

        if (insertError) {
            console.error('❌ ERRORE SEEDING: Impossibile iniettare i mock data.', insertError);
            process.exit(1);
        }

        console.log('✅ Eventi mock Dual-Unlock inseriti correttamente su Supabase.');
        console.log('🏁 EXECUTION COMPLETATA CON SUCCESSO.');

    } catch (e) {
        console.error('❌ ECCEZIONE NON GESTITA:', e);
        process.exit(1);
    }
}

runExecution();
