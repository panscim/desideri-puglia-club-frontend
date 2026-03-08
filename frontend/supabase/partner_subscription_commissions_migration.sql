-- Partner Subscription + Dynamic Commissions + Refund Tracking
-- Run in Supabase SQL editor.

-- 1) PARTNERS: subscription and Stripe fields
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS plan_tier text;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS commission_rate numeric(5,2) DEFAULT 25;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS stripe_product_id text;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS stripe_account_id text;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS must_choose_plan_once boolean DEFAULT false;

-- subscription_status is expected to exist already; enforce default fallback
ALTER TABLE public.partners ALTER COLUMN subscription_status SET DEFAULT 'inactive';

-- 2) BOOKING PAYMENTS: supports gross/net metrics and automatic refunds
CREATE TABLE IF NOT EXISTS public.booking_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.prenotazioni_eventi(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.utenti(id) ON DELETE SET NULL,
  event_id text NOT NULL,
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  stripe_checkout_session_id text UNIQUE NOT NULL,
  stripe_payment_intent_id text UNIQUE,
  stripe_refund_id text,
  amount_total_cents integer NOT NULL DEFAULT 0,
  application_fee_amount integer NOT NULL DEFAULT 0,
  commission_rate numeric(5,2) NOT NULL DEFAULT 25,
  currency text NOT NULL DEFAULT 'eur',
  status text NOT NULL DEFAULT 'paid',
  refunded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'booking_payments' AND policyname = 'booking_payments_user_read_own'
  ) THEN
    CREATE POLICY booking_payments_user_read_own
      ON public.booking_payments
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'booking_payments' AND policyname = 'booking_payments_partner_read_own'
  ) THEN
    CREATE POLICY booking_payments_partner_read_own
      ON public.booking_payments
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.partners p
          WHERE p.id = booking_payments.partner_id
          AND p.owner_user_id = auth.uid()
        )
      );
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_booking_payments_partner_id_created_at ON public.booking_payments(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_payments_user_id_created_at ON public.booking_payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partners_subscription_status ON public.partners(subscription_status);
