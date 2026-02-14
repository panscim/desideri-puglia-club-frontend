-- ============================================
-- STORAGE PER FOTO PROFILO
-- ============================================

-- Crea bucket per le foto profilo (esegui manualmente su Supabase)
-- Vai su Storage → Create Bucket → Nome: "avatars" → Public: true

-- Politiche di accesso per il bucket avatars
-- (Da impostare su Supabase → Storage → avatars → Policies)

-- Policy 1: Gli utenti possono caricare solo le proprie foto
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Tutti possono vedere le foto (bucket pubblico)
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy 3: Gli utenti possono aggiornare solo le proprie foto
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Gli utenti possono eliminare solo le proprie foto
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- FUNZIONE HELPER PER GENERARE URL FOTO
-- ============================================

CREATE OR REPLACE FUNCTION get_avatar_url(user_id uuid)
RETURNS text AS $$
DECLARE
  avatar_path text;
  public_url text;
BEGIN
  -- Ottiene il percorso dell'avatar dall'utente
  SELECT foto_profilo INTO avatar_path
  FROM utenti
  WHERE id = user_id;
  
  IF avatar_path IS NOT NULL THEN
    -- Costruisce l'URL pubblico
    public_url := current_setting('app.settings.supabase_url', true) || 
                  '/storage/v1/object/public/avatars/' || avatar_path;
    RETURN public_url;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ISTRUZIONI MANUALI PER SUPABASE
-- ============================================

/*
STEP 1: Crea il bucket
1. Vai su Supabase Dashboard → Storage
2. Click "New Bucket"
3. Nome: avatars
4. Public bucket: YES (spunta)
5. File size limit: 2 MB
6. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

STEP 2: Configura le policies
Le policies sopra verranno create automaticamente se esegui questo script.

STEP 3: Test
Prova a caricare un'immagine dalla UI e verifica che venga salvata in:
avatars/USER_ID/avatar.jpg
*/
