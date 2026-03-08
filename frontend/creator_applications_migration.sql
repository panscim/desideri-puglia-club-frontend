-- ============================================================
-- MIGRATION: creator_applications
-- Eseguire in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.creator_applications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES public.utenti(id) ON DELETE CASCADE NOT NULL,
  instagram_url  text,
  perla_segreta  text NOT NULL,
  vibe_tags      text[] NOT NULL DEFAULT '{}',
  -- Regole d'oro (codice del creator)
  accetta_piano_b       boolean NOT NULL DEFAULT false,
  accetta_qualita       boolean NOT NULL DEFAULT false,
  accetta_aggiornamento boolean NOT NULL DEFAULT false,
  accetta_commissione   boolean NOT NULL DEFAULT false,
  -- Gestione stato candidatura
  stato          text NOT NULL DEFAULT 'pending'
                 CHECK (stato IN ('pending', 'approved', 'rejected')),
  note_admin     text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Indice per lookup rapido per utente
CREATE INDEX IF NOT EXISTS idx_creator_apps_user_id
  ON public.creator_applications (user_id);

-- RLS
ALTER TABLE public.creator_applications ENABLE ROW LEVEL SECURITY;

-- L'utente può inserire solo la propria candidatura
CREATE POLICY "creator_app_insert_own"
  ON public.creator_applications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- L'utente può leggere solo la propria candidatura
CREATE POLICY "creator_app_select_own"
  ON public.creator_applications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admin può vedere e modificare tutto
CREATE POLICY "creator_app_admin_all"
  ON public.creator_applications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.utenti
      WHERE id = auth.uid() AND ruolo IN ('Admin', 'Moderatore')
    )
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_creator_apps_updated_at ON public.creator_applications;
CREATE TRIGGER trg_creator_apps_updated_at
  BEFORE UPDATE ON public.creator_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- NOTA ADMIN: per approvare un creator cambiare manualmente:
--   UPDATE utenti SET ruolo = 'creator' WHERE id = '<user_id>';
--   UPDATE creator_applications SET stato = 'approved' WHERE user_id = '<user_id>';
-- ============================================================
