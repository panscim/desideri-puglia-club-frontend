-- ============================================
-- FUNZIONE AZZERAMENTO CLASSIFICA MENSILE
-- ============================================
-- Da eseguire il 1° di ogni mese

-- Funzione per salvare i vincitori e azzerare i punti mensili
CREATE OR REPLACE FUNCTION reset_monthly_leaderboard()
RETURNS json AS $$
DECLARE
  current_month TEXT;
  winners_saved INTEGER;
  users_reset INTEGER;
BEGIN
  -- Calcola il mese precedente
  current_month := TO_CHAR(NOW() - INTERVAL '1 month', 'YYYY-MM');
  
  -- Salva i primi 3 vincitori del mese
  INSERT INTO vincitori_mensili (mese, posizione, id_utente, punti)
  SELECT 
    current_month,
    ROW_NUMBER() OVER (ORDER BY punti_mensili DESC)::INTEGER,
    id,
    punti_mensili
  FROM utenti
  WHERE punti_mensili > 0
  ORDER BY punti_mensili DESC
  LIMIT 3
  ON CONFLICT (mese, posizione) DO UPDATE 
  SET id_utente = EXCLUDED.id_utente, punti = EXCLUDED.punti;
  
  GET DIAGNOSTICS winners_saved = ROW_COUNT;
  
  -- Azzera i punti mensili per tutti
  UPDATE utenti 
  SET punti_mensili = 0 
  WHERE punti_mensili > 0;
  
  GET DIAGNOSTICS users_reset = ROW_COUNT;
  
  -- Restituisce un report
  RETURN json_build_object(
    'success', true,
    'month', current_month,
    'winners_saved', winners_saved,
    'users_reset', users_reset,
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- EDGE FUNCTION PER CHIAMATA HTTP
-- ============================================
-- Questa funzione può essere chiamata via HTTP per triggerare il reset

CREATE OR REPLACE FUNCTION handle_monthly_reset()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Verifica che sia effettivamente il primo giorno del mese
  IF EXTRACT(DAY FROM NOW()) = 1 THEN
    SELECT reset_monthly_leaderboard() INTO result;
    RETURN result;
  ELSE
    RETURN json_build_object(
      'success', false,
      'message', 'Can only run on the 1st day of the month',
      'current_day', EXTRACT(DAY FROM NOW())
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNZIONE MANUALE (per testing)
-- ============================================
-- Questa versione può essere eseguita in qualsiasi momento per test

CREATE OR REPLACE FUNCTION reset_monthly_leaderboard_manual()
RETURNS json AS $$
DECLARE
  current_month TEXT;
  winners_saved INTEGER;
  users_reset INTEGER;
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  INSERT INTO vincitori_mensili (mese, posizione, id_utente, punti)
  SELECT 
    current_month,
    ROW_NUMBER() OVER (ORDER BY punti_mensili DESC)::INTEGER,
    id,
    punti_mensili
  FROM utenti
  WHERE punti_mensili > 0
  ORDER BY punti_mensili DESC
  LIMIT 3
  ON CONFLICT (mese, posizione) DO UPDATE 
  SET id_utente = EXCLUDED.id_utente, punti = EXCLUDED.punti;
  
  GET DIAGNOSTICS winners_saved = ROW_COUNT;
  
  UPDATE utenti 
  SET punti_mensili = 0 
  WHERE punti_mensili > 0;
  
  GET DIAGNOSTICS users_reset = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'month', current_month,
    'winners_saved', winners_saved,
    'users_reset', users_reset,
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ISTRUZIONI PER L'USO
-- ============================================

-- TEST MANUALE (in qualsiasi momento):
-- SELECT reset_monthly_leaderboard_manual();

-- RESET AUTOMATICO (solo il 1° del mese):
-- SELECT handle_monthly_reset();

-- Per vedere i vincitori salvati:
-- SELECT * FROM vincitori_mensili ORDER BY mese DESC, posizione;
