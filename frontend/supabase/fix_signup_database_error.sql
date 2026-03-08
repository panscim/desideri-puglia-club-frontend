-- Fix "Database error saving new user" during auth.signUp
-- Run in Supabase SQL Editor

BEGIN;

-- 1) Ensure base columns exist in public.utenti
ALTER TABLE public.utenti ADD COLUMN IF NOT EXISTS id uuid;
ALTER TABLE public.utenti ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.utenti ADD COLUMN IF NOT EXISTS nome text;
ALTER TABLE public.utenti ADD COLUMN IF NOT EXISTS cognome text;
ALTER TABLE public.utenti ADD COLUMN IF NOT EXISTS nickname text;

-- 2) Ensure constraints/indexes are aligned
ALTER TABLE public.utenti
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN nome SET NOT NULL,
  ALTER COLUMN cognome SET DEFAULT '',
  ALTER COLUMN nickname SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'utenti_pkey'
      AND conrelid = 'public.utenti'::regclass
  ) THEN
    ALTER TABLE public.utenti ADD CONSTRAINT utenti_pkey PRIMARY KEY (id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS utenti_email_unique_idx ON public.utenti(email);
CREATE UNIQUE INDEX IF NOT EXISTS utenti_nickname_unique_idx ON public.utenti(nickname);

-- 3) Replace signup trigger function with robust nickname generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome text;
  v_cognome text;
  v_nickname_raw text;
  v_nickname text;
BEGIN
  v_nome := COALESCE(NULLIF(TRIM(new.raw_user_meta_data->>'nome'), ''), 'Utente');
  v_cognome := COALESCE(NULLIF(TRIM(new.raw_user_meta_data->>'cognome'), ''), '');
  v_nickname_raw := COALESCE(NULLIF(TRIM(new.raw_user_meta_data->>'nickname'), ''), 'user_' || SUBSTRING(new.id::text, 1, 8));
  v_nickname := regexp_replace(lower(v_nickname_raw), '[^a-z0-9_\\-]', '', 'g');

  IF v_nickname = '' THEN
    v_nickname := 'user_' || SUBSTRING(new.id::text, 1, 8);
  END IF;

  WHILE EXISTS (SELECT 1 FROM public.utenti u WHERE u.nickname = v_nickname) LOOP
    v_nickname := 'user_' || SUBSTRING(new.id::text, 1, 8) || '_' || SUBSTRING(md5(random()::text), 1, 4);
  END LOOP;

  INSERT INTO public.utenti (id, email, nome, cognome, nickname)
  VALUES (new.id, new.email, v_nome, v_cognome, v_nickname)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;

  RETURN new;
END;
$$;

-- 4) Recreate trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

COMMIT;
