/**
 * Migration script: Monetizzazione, PIN & Admin
 * Esegui con: node migrate.mjs
 */
import pg from 'pg'
const { Client } = pg

const client = new Client({
    connectionString: 'postgresql://postgres.edzwtxatihiqyvqvqqqe:Desideridipuglia1@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
})

async function run() {
    await client.connect()
    console.log('✅ Connected to Supabase DB')

    // 1) Check which PIN column exists
    const { rows: pinCols } = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name LIKE '%pin%'
  `)
    console.log('📌 Existing PIN columns:', pinCols.map(r => r.column_name))

    // 2) ALTER TABLE partners — add new columns (IF NOT EXISTS)
    await client.query(`
    ALTER TABLE partners ADD COLUMN IF NOT EXISTS saldo_punti INTEGER DEFAULT 0;
    ALTER TABLE partners ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
    ALTER TABLE partners ADD COLUMN IF NOT EXISTS verified_until TIMESTAMPTZ;
    ALTER TABLE partners ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
  `)
    console.log('✅ partners: saldo_punti, is_verified, verified_until, whatsapp_number added')

    // Ensure pin_code column exists (this is the canonical one)
    const hasPinCode = pinCols.some(r => r.column_name === 'pin_code')
    if (!hasPinCode) {
        await client.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS pin_code CHAR(4);`)
        console.log('✅ partners: pin_code column added')
    }

    // 3) ALTER TABLE utenti — boost columns
    await client.query(`
    ALTER TABLE utenti ADD COLUMN IF NOT EXISTS boost_multiplier NUMERIC(3,1) DEFAULT 1.0;
    ALTER TABLE utenti ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMPTZ;
  `)
    console.log('✅ utenti: boost_multiplier, boost_expires_at added')

    // 4) CREATE TABLE logs_transazioni
    await client.query(`
    CREATE TABLE IF NOT EXISTS logs_transazioni (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES utenti(id),
      partner_id UUID REFERENCES partners(id),
      tipo TEXT NOT NULL,
      punti INTEGER NOT NULL DEFAULT 0,
      moltiplicatore NUMERIC(3,1) DEFAULT 1.0,
      punti_effettivi INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `)
    console.log('✅ logs_transazioni table created')

    // Enable RLS
    await client.query(`ALTER TABLE logs_transazioni ENABLE ROW LEVEL SECURITY;`)

    // RLS policies
    await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'logs_transazioni_admin_all') THEN
        CREATE POLICY logs_transazioni_admin_all ON logs_transazioni
          FOR ALL TO authenticated
          USING (
            EXISTS (SELECT 1 FROM utenti WHERE id = auth.uid() AND ruolo IN ('Admin', 'Moderatore'))
          );
      END IF;
    END $$;
  `)

    await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'logs_transazioni_user_read_own') THEN
        CREATE POLICY logs_transazioni_user_read_own ON logs_transazioni
          FOR SELECT TO authenticated
          USING (user_id = auth.uid());
      END IF;
    END $$;
  `)
    console.log('✅ RLS policies for logs_transazioni created')

    // 5) CREATE FUNCTION validate_pin_visit
    await client.query(`
    CREATE OR REPLACE FUNCTION validate_pin_visit(
      p_user_id UUID,
      p_partner_id UUID,
      p_pin TEXT
    )
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      v_partner RECORD;
      v_user RECORD;
      v_punti_base INTEGER := 100;
      v_moltiplicatore NUMERIC(3,1);
      v_punti_effettivi INTEGER;
      v_last_visit TIMESTAMPTZ;
    BEGIN
      -- 1. Get partner and verify PIN
      SELECT * INTO v_partner FROM partners WHERE id = p_partner_id AND is_active = TRUE;
      IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Partner non trovato o non attivo');
      END IF;

      IF COALESCE(v_partner.pin_code, '') = '' THEN
        RETURN jsonb_build_object('success', false, 'message', 'PIN non configurato per questo partner');
      END IF;

      IF TRIM(v_partner.pin_code) != TRIM(p_pin) THEN
        RETURN jsonb_build_object('success', false, 'message', 'PIN errato');
      END IF;

      -- 2. Check saldo
      IF v_partner.saldo_punti < v_punti_base THEN
        RETURN jsonb_build_object('success', false, 'message', 'Missioni esaurite per questo partner');
      END IF;

      -- 3. Check if user already visited this partner in the last 24h
      SELECT MAX(created_at) INTO v_last_visit
      FROM logs_transazioni
      WHERE user_id = p_user_id AND partner_id = p_partner_id AND tipo = 'visita_pin';

      IF v_last_visit IS NOT NULL AND v_last_visit > NOW() - INTERVAL '24 hours' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Hai già ottenuto punti da questo partner nelle ultime 24 ore');
      END IF;

      -- 4. Get user boost multiplier
      SELECT * INTO v_user FROM utenti WHERE id = p_user_id;
      IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Utente non trovato');
      END IF;

      v_moltiplicatore := CASE
        WHEN v_user.boost_expires_at IS NOT NULL AND v_user.boost_expires_at > NOW()
        THEN COALESCE(v_user.boost_multiplier, 1.0)
        ELSE 1.0
      END;

      v_punti_effettivi := FLOOR(v_punti_base * v_moltiplicatore);

      -- 5. Deduct from partner
      UPDATE partners SET saldo_punti = saldo_punti - v_punti_base WHERE id = p_partner_id;

      -- 6. Add to user
      UPDATE utenti SET punti_totali = COALESCE(punti_totali, 0) + v_punti_effettivi WHERE id = p_user_id;

      -- 7. Log transaction
      INSERT INTO logs_transazioni (user_id, partner_id, tipo, punti, moltiplicatore, punti_effettivi)
      VALUES (p_user_id, p_partner_id, 'visita_pin', v_punti_base, v_moltiplicatore, v_punti_effettivi);

      RETURN jsonb_build_object(
        'success', true,
        'punti_assegnati', v_punti_effettivi,
        'moltiplicatore', v_moltiplicatore,
        'saldo_partner_rimanente', v_partner.saldo_punti - v_punti_base,
        'message', 'Punti accreditati con successo!'
      );
    END;
    $$;
  `)
    console.log('✅ validate_pin_visit RPC function created')

    // Verify columns were added
    const { rows: newCols } = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name IN ('saldo_punti', 'is_verified', 'verified_until', 'whatsapp_number', 'pin_code')
    ORDER BY column_name
  `)
    console.log('\n📊 Verification — partners columns:', newCols)

    const { rows: utentiCols } = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'utenti' AND column_name IN ('boost_multiplier', 'boost_expires_at', 'punti_totali')
    ORDER BY column_name
  `)
    console.log('📊 Verification — utenti columns:', utentiCols)

    const { rows: logTable } = await client.query(`
    SELECT table_name FROM information_schema.tables WHERE table_name = 'logs_transazioni'
  `)
    console.log('📊 Verification — logs_transazioni exists:', logTable.length > 0)

    await client.end()
    console.log('\n🎉 Migration complete!')
}

run().catch(e => { console.error('❌ Migration failed:', e); process.exit(1) })
