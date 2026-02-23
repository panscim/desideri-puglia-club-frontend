-- =============================================
-- SCRIPT DI PULIZIA: Rimozione Punti, Boost e Classifiche
-- Esegui questo script in Supabase Dashboard -> SQL Editor
-- ATTENZIONE: Effettua prima un backup del database!
-- =============================================

-- 1. RIMUOVI TABELLE OBSOLETE
-- Eliminiamo le tabelle legate alle classifiche mensili
DROP TABLE IF EXISTS public.vincitori_mensili CASCADE;
DROP TABLE IF EXISTS public.premi_mensili CASCADE;

-- 2. RIMUOVI FUNZIONI OBSOLETE
-- Eliminiamo le funzioni di reset mensile dei punteggi
DROP FUNCTION IF EXISTS public.reset_monthly_leaderboard() CASCADE;
DROP FUNCTION IF EXISTS public.handle_monthly_reset() CASCADE;
DROP FUNCTION IF EXISTS public.reset_monthly_leaderboard_manual() CASCADE;

-- 3. RIMUOVI COLONNE DA UTENTI
ALTER TABLE public.utenti 
  DROP COLUMN IF EXISTS punti_totali,
  DROP COLUMN IF EXISTS punti_mensili,
  DROP COLUMN IF EXISTS livello,
  DROP COLUMN IF EXISTS boost_multiplier,
  DROP COLUMN IF EXISTS boost_expires_at;

-- 4. RIMUOVI COLONNE DA MISSIONI CATALOGO
ALTER TABLE public.missioni_catalogo 
  DROP COLUMN IF EXISTS punti;

-- 5. RIMUOVI COLONNE DA MISSIONI INVIATE
ALTER TABLE public.missioni_inviate 
  DROP COLUMN IF EXISTS punti_approvati;

-- 6. RIMUOVI COLONNE DA PARTNERS
ALTER TABLE public.partners 
  DROP COLUMN IF EXISTS saldo_punti;

-- 7. RIMUOVI COLONNE DA LOGS TRANSAZIONI
ALTER TABLE public.logs_transazioni 
  DROP COLUMN IF EXISTS punti,
  DROP COLUMN IF EXISTS moltiplicatore,
  DROP COLUMN IF EXISTS punti_effettivi;

-- 8. AGGIORNA LA FUNZIONE RPC validate_pin_visit
-- Ora registra solo la visita senza sottrarre saldo o calcolare boost
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

  -- 2. Check 24h cooldown
  SELECT MAX(created_at) INTO v_last_visit
  FROM logs_transazioni
  WHERE user_id = p_user_id AND partner_id = p_partner_id AND tipo = 'visita_pin';

  IF v_last_visit IS NOT NULL AND v_last_visit > NOW() - INTERVAL '24 hours' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Hai già registrato una visita a questo partner nelle ultime 24 ore');
  END IF;

  -- 3. Log transaction (soltanto la presenza rispetto al backend points auth)
  INSERT INTO logs_transazioni (user_id, partner_id, tipo, note)
  VALUES (p_user_id, p_partner_id, 'visita_pin', 'Visita registrata tramite PIN Pad');

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Visita registrata con successo!'
  );
END;
$$;
