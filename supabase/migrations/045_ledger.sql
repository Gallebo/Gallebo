CREATE TYPE ledger_entry_type AS ENUM (
  'booking_payment',
  'platform_fee',
  'pilot_payout',
  'refund',
  'payout_failed'
);

CREATE TABLE public.ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  booking_id uuid REFERENCES public.flight_booking_requests (id) ON DELETE SET NULL,
  type ledger_entry_type NOT NULL,
  amount_eur numeric(12, 2) NOT NULL,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  stripe_refund_id text,
  stripe_transfer_id text,
  idempotency_key text NOT NULL UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now ()
);

CREATE INDEX ledger_booking_id_idx ON public.ledger (booking_id);

CREATE INDEX ledger_type_idx ON public.ledger (type);

ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY ledger_select_admin ON public.ledger
  FOR SELECT
  USING (public.is_admin());

-- Inserts only via service role (no authenticated insert policy)
