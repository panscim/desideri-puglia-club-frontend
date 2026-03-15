// Migration: remove cards / album system
const { Client } = require('pg');

const DATABASE_URL =
  'postgresql://postgres.edzwtxatihiqyvqvqqqe:Desideridipuglia1@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

const SQL = `
-- ============================================================
-- DESIDERI DI PUGLIA — Rimozione sistema carte / album
-- ============================================================

-- 1. Rimuovi la colonna ricompensa_card_id da eventi_club
ALTER TABLE public.eventi_club
  DROP COLUMN IF EXISTS ricompensa_card_id;

-- 2. Elimina user_cards (dipende da cards)
DROP TABLE IF EXISTS public.user_cards CASCADE;

-- 3. Elimina cards
DROP TABLE IF EXISTS public.cards CASCADE;
`;

async function run() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log('✅ Connesso a Supabase');
  try {
    await client.query(SQL);
    console.log('✅ Migrazione completata: cards e user_cards eliminate, colonna ricompensa_card_id rimossa.');
  } catch (err) {
    console.error('❌ Errore:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
