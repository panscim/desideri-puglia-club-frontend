-- Esegui questo script nell'editor SQL del DB Supabase
-- Aggiunge i nuovi campi per gli eventi partner

ALTER TABLE "public"."partner_events_created"
ADD COLUMN IF NOT EXISTS "registration_deadline" timestamptz,
ADD COLUMN IF NOT EXISTS "available_spots" integer,
ADD COLUMN IF NOT EXISTS "price" numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "payment_methods" text[];
