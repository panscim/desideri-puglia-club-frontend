-- =====================================================================
-- DESIDERI DI PUGLIA CLUB — LOCAL CONCIERGE: FULL DATABASE MIGRATION
-- =====================================================================
-- Version: 1.0.0
-- Date:    2026-02-28
-- Author:  Gravity (Senior DB Architect)
--
-- This migration creates the complete schema for:
--   1. Daily Plans Marketplace (daily_plans + plan_slots)
--   2. Purchase Tracking with 70/30 Revenue Split (plan_purchases)
--   3. Structured Reviews with Auto-Rating (plan_reviews)
--   4. Live Vibe Radar with 2h Auto-Expiry (vibe_reports)
--
-- RUN IN: Supabase Dashboard → SQL Editor
-- =====================================================================


-- ═══════════════════════════════════════════════════════════════════════
-- 1. ENUM TYPES
-- ═══════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE slot_type AS ENUM ('food', 'culture', 'nightlife', 'relax', 'shopping', 'nature', 'sport');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE plan_season AS ENUM ('primavera', 'estate', 'autunno', 'inverno', 'tutto_anno');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE plan_audience AS ENUM ('coppie', 'famiglie', 'giovani', 'solo', 'tutti');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- 2. TABLE: daily_plans (Il Prodotto)
-- ═══════════════════════════════════════════════════════════════════════
-- Each row is a complete day itinerary created by a Local Creator.
-- It is the "product" sold in the marketplace.

CREATE TABLE IF NOT EXISTS public.daily_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID NOT NULL REFERENCES public.utenti(id) ON DELETE CASCADE,

  -- Bilingual content
  title_it        TEXT NOT NULL,
  title_en        TEXT,
  description_it  TEXT NOT NULL,
  description_en  TEXT,

  -- Visuals
  cover_image_url TEXT,

  -- Pricing & Commerce
  price           DECIMAL(6,2) NOT NULL DEFAULT 2.50,
  is_premium      BOOLEAN NOT NULL DEFAULT TRUE,

  -- Categorization & Filtering
  city            TEXT NOT NULL,
  season          plan_season NOT NULL DEFAULT 'tutto_anno',
  target_audience plan_audience NOT NULL DEFAULT 'tutti',

  -- Aggregated Stats (denormalized, updated by triggers)
  rating_avg      FLOAT DEFAULT 0.0,
  rating_count    INTEGER DEFAULT 0,
  purchases_count INTEGER DEFAULT 0,

  -- Publishing
  is_published    BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can see published plans
CREATE POLICY "daily_plans_public_read" ON public.daily_plans
  FOR SELECT USING (is_published = TRUE);

-- Creators can see their own unpublished plans
CREATE POLICY "daily_plans_creator_read_own" ON public.daily_plans
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid());

-- Creators can insert their own plans
CREATE POLICY "daily_plans_creator_insert" ON public.daily_plans
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid());

-- Creators can update their own plans
CREATE POLICY "daily_plans_creator_update" ON public.daily_plans
  FOR UPDATE TO authenticated
  USING (creator_id = auth.uid());

-- Admin full access
CREATE POLICY "daily_plans_admin_all" ON public.daily_plans
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.utenti
      WHERE id = auth.uid() AND ruolo IN ('Admin', 'Moderatore')
    )
  );


-- ═══════════════════════════════════════════════════════════════════════
-- 3. TABLE: plan_slots (La Timeline Dinamica)
-- ═══════════════════════════════════════════════════════════════════════
-- Each plan has ordered "slots" (tappa + alternativa pioggia).
-- This is the heart of the "Smart Adaptation" feature.

CREATE TABLE IF NOT EXISTS public.plan_slots (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id                   UUID NOT NULL REFERENCES public.daily_plans(id) ON DELETE CASCADE,

  -- Ordering
  slot_order                INTEGER NOT NULL,

  -- Time Label (human-readable: '09:00', 'Pausa Pranzo', 'Tramonto')
  time_label                TEXT NOT NULL,

  -- Main Activity (piano A)
  activity_title_it         TEXT NOT NULL,
  activity_title_en         TEXT,
  activity_description_it   TEXT,
  activity_description_en   TEXT,
  activity_image_url        TEXT,

  -- Alternative Activity (piano B: pioggia / chiusura)
  alt_activity_title_it     TEXT,
  alt_activity_title_en     TEXT,
  alt_activity_description_it TEXT,
  alt_activity_description_en TEXT,
  alt_activity_image_url    TEXT,

  -- GPS
  latitude                  DOUBLE PRECISION,
  longitude                 DOUBLE PRECISION,

  -- Slot category
  type                      slot_type NOT NULL DEFAULT 'culture',

  -- Constraint: unique order per plan
  UNIQUE (plan_id, slot_order)
);

-- RLS
ALTER TABLE public.plan_slots ENABLE ROW LEVEL SECURITY;

-- Everyone can read slots of published plans
CREATE POLICY "plan_slots_public_read" ON public.plan_slots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.daily_plans
      WHERE id = plan_slots.plan_id AND is_published = TRUE
    )
  );

-- Creators can manage slots of their own plans
CREATE POLICY "plan_slots_creator_read" ON public.plan_slots
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.daily_plans
      WHERE id = plan_slots.plan_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "plan_slots_creator_insert" ON public.plan_slots
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.daily_plans
      WHERE id = plan_slots.plan_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "plan_slots_creator_update" ON public.plan_slots
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.daily_plans
      WHERE id = plan_slots.plan_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "plan_slots_creator_delete" ON public.plan_slots
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.daily_plans
      WHERE id = plan_slots.plan_id AND creator_id = auth.uid()
    )
  );

-- Admin full access
CREATE POLICY "plan_slots_admin_all" ON public.plan_slots
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.utenti
      WHERE id = auth.uid() AND ruolo IN ('Admin', 'Moderatore')
    )
  );


-- ═══════════════════════════════════════════════════════════════════════
-- 4. TABLE: plan_purchases (Logica di Vendita — 70/30 Split)
-- ═══════════════════════════════════════════════════════════════════════
-- Each row is a completed purchase. The 70/30 split is calculated once
-- at insert time and stored immutably as a receipt.

CREATE TABLE IF NOT EXISTS public.plan_purchases (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.utenti(id) ON DELETE CASCADE,
  plan_id           UUID NOT NULL REFERENCES public.daily_plans(id) ON DELETE CASCADE,

  -- Financial Record (immutable receipt)
  amount_paid       DECIMAL(6,2) NOT NULL,
  creator_share     DECIMAL(6,2) NOT NULL,  -- 70%
  platform_share    DECIMAL(6,2) NOT NULL,  -- 30%

  -- Payment tracking
  stripe_payment_id TEXT,

  -- Timestamps
  purchased_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Prevent double purchases
  UNIQUE (user_id, plan_id)
);

-- RLS
ALTER TABLE public.plan_purchases ENABLE ROW LEVEL SECURITY;

-- Users can see their own purchases
CREATE POLICY "plan_purchases_user_read" ON public.plan_purchases
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Creators can see purchases of their plans (for earnings dashboard)
CREATE POLICY "plan_purchases_creator_read" ON public.plan_purchases
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.daily_plans
      WHERE id = plan_purchases.plan_id AND creator_id = auth.uid()
    )
  );

-- Insert via server/function only (authenticated user buys)
CREATE POLICY "plan_purchases_insert" ON public.plan_purchases
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admin can see everything
CREATE POLICY "plan_purchases_admin_all" ON public.plan_purchases
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.utenti
      WHERE id = auth.uid() AND ruolo IN ('Admin', 'Moderatore')
    )
  );


-- ═══════════════════════════════════════════════════════════════════════
-- 5. TABLE: plan_reviews (Recensioni Strutturate)
-- ═══════════════════════════════════════════════════════════════════════
-- Users who purchased a plan can rate it. A trigger recalculates
-- the denormalized rating_avg on daily_plans.

CREATE TABLE IF NOT EXISTS public.plan_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.utenti(id) ON DELETE CASCADE,
  plan_id     UUID NOT NULL REFERENCES public.daily_plans(id) ON DELETE CASCADE,

  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,

  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- One review per user per plan
  UNIQUE (user_id, plan_id)
);

-- RLS
ALTER TABLE public.plan_reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can read reviews
CREATE POLICY "plan_reviews_public_read" ON public.plan_reviews
  FOR SELECT USING (TRUE);

-- Only purchasers can leave a review
CREATE POLICY "plan_reviews_insert" ON public.plan_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.plan_purchases
      WHERE plan_purchases.user_id = auth.uid()
        AND plan_purchases.plan_id = plan_reviews.plan_id
    )
  );

-- Users can update their own review
CREATE POLICY "plan_reviews_update" ON public.plan_reviews
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════════════
-- 6. TABLE: vibe_reports (Radar della Movida — Live 2h)
-- ═══════════════════════════════════════════════════════════════════════
-- Crowd-sourced "vibe" reports that expire after 2 hours.
-- Levels: 1 = Calmo, 2 = Vivace, 3 = Pieno Murato

CREATE TABLE IF NOT EXISTS public.vibe_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.utenti(id) ON DELETE CASCADE,

  -- Location
  place_name  TEXT NOT NULL,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,

  -- Vibe Data
  vibe_level  SMALLINT NOT NULL CHECK (vibe_level BETWEEN 1 AND 3),
  note        TEXT,

  -- Timing
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 hours') NOT NULL
);

-- RLS
ALTER TABLE public.vibe_reports ENABLE ROW LEVEL SECURITY;

-- Everyone can read live vibes (not expired)
CREATE POLICY "vibe_reports_public_read" ON public.vibe_reports
  FOR SELECT USING (expires_at > NOW());

-- Any authenticated user can report
CREATE POLICY "vibe_reports_insert" ON public.vibe_reports
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own reports
CREATE POLICY "vibe_reports_delete_own" ON public.vibe_reports
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════════════
-- 7. FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════

-- 7a. calculate_creator_share: 70/30 revenue split
-- Called when a purchase is made. Returns the creator's 70% share.
CREATE OR REPLACE FUNCTION public.calculate_creator_share(amount DECIMAL)
RETURNS DECIMAL
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN ROUND(amount * 0.70, 2);
END;
$$;

-- 7b. purchase_daily_plan: Full purchase flow (atomic)
CREATE OR REPLACE FUNCTION public.purchase_daily_plan(
  p_user_id UUID,
  p_plan_id UUID,
  p_stripe_payment_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan RECORD;
  v_creator_share DECIMAL;
  v_platform_share DECIMAL;
  v_existing RECORD;
BEGIN
  -- 1. Get the plan
  SELECT * INTO v_plan FROM public.daily_plans WHERE id = p_plan_id AND is_published = TRUE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Piano non trovato o non pubblicato.');
  END IF;

  -- 2. Check if already purchased
  SELECT * INTO v_existing FROM public.plan_purchases
    WHERE user_id = p_user_id AND plan_id = p_plan_id;
  IF FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Hai già acquistato questo piano!');
  END IF;

  -- 3. Calculate split
  v_creator_share := public.calculate_creator_share(v_plan.price);
  v_platform_share := v_plan.price - v_creator_share;

  -- 4. Insert purchase
  INSERT INTO public.plan_purchases (user_id, plan_id, amount_paid, creator_share, platform_share, stripe_payment_id)
  VALUES (p_user_id, p_plan_id, v_plan.price, v_creator_share, v_platform_share, p_stripe_payment_id);

  -- 5. Increment purchases_count on the plan
  UPDATE public.daily_plans
  SET purchases_count = COALESCE(purchases_count, 0) + 1,
      updated_at = NOW()
  WHERE id = p_plan_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Acquisto completato!',
    'amount_paid', v_plan.price,
    'creator_share', v_creator_share,
    'platform_share', v_platform_share
  );
END;
$$;


-- 7c. Trigger: auto-update rating_avg on daily_plans
CREATE OR REPLACE FUNCTION public.update_plan_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.daily_plans
  SET rating_avg = (
        SELECT COALESCE(AVG(rating)::FLOAT, 0)
        FROM public.plan_reviews
        WHERE plan_id = COALESCE(NEW.plan_id, OLD.plan_id)
      ),
      rating_count = (
        SELECT COUNT(*)
        FROM public.plan_reviews
        WHERE plan_id = COALESCE(NEW.plan_id, OLD.plan_id)
      ),
      updated_at = NOW()
  WHERE id = COALESCE(NEW.plan_id, OLD.plan_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_rating ON public.plan_reviews;
CREATE TRIGGER trigger_update_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.plan_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_plan_rating();


-- 7d. cleanup_expired_vibes: Purge stale vibe reports
-- Schedule this with pg_cron or call it periodically.
CREATE OR REPLACE FUNCTION public.cleanup_expired_vibes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.vibe_reports WHERE expires_at < NOW();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════
-- 8. INDEXES (Performance)
-- ═══════════════════════════════════════════════════════════════════════

-- daily_plans: marketplace queries
CREATE INDEX IF NOT EXISTS idx_daily_plans_city ON public.daily_plans(city);
CREATE INDEX IF NOT EXISTS idx_daily_plans_season ON public.daily_plans(season);
CREATE INDEX IF NOT EXISTS idx_daily_plans_audience ON public.daily_plans(target_audience);
CREATE INDEX IF NOT EXISTS idx_daily_plans_published ON public.daily_plans(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_daily_plans_rating ON public.daily_plans(rating_avg DESC);
CREATE INDEX IF NOT EXISTS idx_daily_plans_purchases ON public.daily_plans(purchases_count DESC);
CREATE INDEX IF NOT EXISTS idx_daily_plans_creator ON public.daily_plans(creator_id);

-- plan_slots: timeline ordering
CREATE INDEX IF NOT EXISTS idx_plan_slots_plan ON public.plan_slots(plan_id, slot_order);

-- plan_purchases: user & creator dashboards
CREATE INDEX IF NOT EXISTS idx_plan_purchases_user ON public.plan_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_purchases_plan ON public.plan_purchases(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_purchases_date ON public.plan_purchases(purchased_at DESC);

-- plan_reviews: rating calculation
CREATE INDEX IF NOT EXISTS idx_plan_reviews_plan ON public.plan_reviews(plan_id);

-- vibe_reports: live heatmap queries
CREATE INDEX IF NOT EXISTS idx_vibe_reports_expires ON public.vibe_reports(expires_at);
CREATE INDEX IF NOT EXISTS idx_vibe_reports_location ON public.vibe_reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_vibe_reports_created ON public.vibe_reports(created_at DESC);


-- ═══════════════════════════════════════════════════════════════════════
-- ✅ VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════
-- Run these after the migration to verify everything is in place:

-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   AND table_name IN ('daily_plans', 'plan_slots', 'plan_purchases', 'plan_reviews', 'vibe_reports');

-- SELECT public.calculate_creator_share(2.50);  -- Should return 1.75

-- SELECT public.calculate_creator_share(10.00); -- Should return 7.00
