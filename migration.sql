-- =============================================
-- MIGRATION: Monetizzazione, PIN & Admin
-- Esegui in Supabase Dashboard → SQL Editor
-- =============================================

-- 1. PARTNERS: nuove colonne
ALTER TABLE partners ADD COLUMN IF NOT EXISTS saldo_punti INTEGER DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS verified_until TIMESTAMPTZ;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS pin_code CHAR(4);

-- 2. UTENTI: boost columns
ALTER TABLE utenti ADD COLUMN IF NOT EXISTS boost_multiplier NUMERIC(3,1) DEFAULT 1.0;
ALTER TABLE utenti ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMPTZ;

-- 3. LOGS TRANSAZIONI
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

ALTER TABLE logs_transazioni ENABLE ROW LEVEL SECURITY;

-- Policy: admin can do everything
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'logs_transazioni_admin_all') THEN
    CREATE POLICY logs_transazioni_admin_all ON logs_transazioni
      FOR ALL TO authenticated
      USING (
        EXISTS (SELECT 1 FROM utenti WHERE id = auth.uid() AND ruolo IN ('Admin', 'Moderatore'))
      );
  END IF;
END $$;

-- Policy: users can read their own logs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'logs_transazioni_user_read_own') THEN
    CREATE POLICY logs_transazioni_user_read_own ON logs_transazioni
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Policy: allow insert for authenticated (the RPC function uses SECURITY DEFINER anyway)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'logs_transazioni_insert_auth') THEN
    CREATE POLICY logs_transazioni_insert_auth ON logs_transazioni
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 4. RPC: validate_pin_visit
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
  IF COALESCE(v_partner.saldo_punti, 0) < v_punti_base THEN
    RETURN jsonb_build_object('success', false, 'message', 'Missioni esaurite per questo partner');
  END IF;

  -- 3. Check 24h cooldown
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

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_logs_transazioni_user ON logs_transazioni(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_transazioni_partner ON logs_transazioni(partner_id);
CREATE INDEX IF NOT EXISTS idx_logs_transazioni_tipo ON logs_transazioni(tipo);
CREATE INDEX IF NOT EXISTS idx_logs_transazioni_created ON logs_transazioni(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partners_is_verified ON partners(is_verified) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_partners_saldo_punti ON partners(saldo_punti);

-- ✅ DONE! Verify with:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'partners' ORDER BY column_name;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'utenti' AND column_name IN ('boost_multiplier', 'boost_expires_at');
-- SELECT * FROM information_schema.tables WHERE table_name = 'logs_transazioni';
