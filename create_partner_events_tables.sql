-- Esegui questo script nello SQL Editor di Supabase
-- Crea le tabelle per gli eventi dei partner e le partecipazioni

-- 1. Tabella Eventi Creati dai Partner
CREATE TABLE IF NOT EXISTS "public"."partner_events_created" (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id uuid REFERENCES "public"."partners"(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    location text,
    city text,
    starts_at timestamptz NOT NULL,
    ends_at timestamptz,
    interest_tags text[],
    is_active boolean DEFAULT true,
    registration_deadline timestamptz,
    available_spots integer,
    price numeric(10,2) DEFAULT 0,
    payment_methods text[],
    created_at timestamptz DEFAULT now()
);

-- RLS per partner_events_created (admin può vedere tutto, il frontend partner dashboard vedrà solo i suoi, ma mettiamo public per semplicità se serve, altrimenti aggiungi policy)
ALTER TABLE "public"."partner_events_created" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON "public"."partner_events_created"
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "public"."partner_events_created"
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON "public"."partner_events_created"
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON "public"."partner_events_created"
    FOR DELETE TO authenticated USING (true);

-- 2. Tabella Partecipazioni agli Eventi Partner
CREATE TABLE IF NOT EXISTS "public"."partner_event_attendances_created" (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid REFERENCES "public"."partner_events_created"(id) ON DELETE CASCADE,
    user_id uuid REFERENCES "public"."utenti"(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(event_id, user_id)
);

-- RLS per le partecipazioni
ALTER TABLE "public"."partner_event_attendances_created" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON "public"."partner_event_attendances_created"
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "public"."partner_event_attendances_created"
    FOR INSERT TO authenticated WITH CHECK (true);
