-- ============================================================
-- "Cosa faccio adesso?" — tabella sessioni utente
-- Salva i momenti generati per analytics e funzione "Salva"
-- ============================================================

CREATE TABLE IF NOT EXISTS user_now_sessions (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  -- risposte wizard
  intent              text        NOT NULL,   -- mangiare | vedere | tappa | relax | serata
  companions          text        NOT NULL,   -- solo | coppia | amici | famiglia
  time_available      text        NOT NULL,   -- short | medium | half_day | any
  atmosphere          text        NOT NULL,   -- autentica | romantica | easy | curata | vivace | slow
  -- risultati restituiti
  result_partner_ids  uuid[]      DEFAULT '{}',
  -- stato
  saved               boolean     DEFAULT false,
  created_at          timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE user_now_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own now sessions"
  ON user_now_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anonimo: solo INSERT (senza user_id, analytics)
CREATE POLICY "Anon insert now sessions"
  ON user_now_sessions FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- ============================================================
-- Vista analytics: quanti utenti per intent + piano partner
-- Utile per capire quali partner vengono consigliati di più
-- ============================================================

CREATE OR REPLACE VIEW now_session_analytics AS
SELECT
  s.intent,
  s.companions,
  s.atmosphere,
  count(*)           AS session_count,
  count(*) FILTER (WHERE s.saved) AS saved_count
FROM user_now_sessions s
GROUP BY s.intent, s.companions, s.atmosphere
ORDER BY session_count DESC;

-- ============================================================
-- NOTA: i campi partner già presenti dopo 20260314_partner_advanced.sql
-- sono SUFFICIENTI per far girare il matching (non servono nuove colonne):
--   partners.category, subcategory, price_range, atmosphere[],
--   ideal_moment[], ideal_target[], experience_duration,
--   profile_score, plan_tier
-- ============================================================
