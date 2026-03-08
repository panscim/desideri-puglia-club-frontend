-- AGGIORNA LA FUNZIONE RPC validate_pin_visit
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

  -- 3. Log transaction
  INSERT INTO logs_transazioni (user_id, partner_id, tipo, note)
  VALUES (p_user_id, p_partner_id, 'visita_pin', 'Visita registrata tramite PIN Pad');

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Visita registrata con successo!'
  );
END;
$$;
