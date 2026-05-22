-- Migration 067: Stripe Express refactor
-- Prelazak s Stripe Connect Custom + Vault IBAN na Connect Express
-- Stripe sada upravlja IBAN-om, KYC-om i SEPA transferima.
-- Mi čuvamo samo stripe_account_id i stripe_onboarding_complete.

-- 1. Vault cleanup PRIJE dropa kolone (ostaci bi ostali kao orphan records u vault.secrets)
DELETE FROM vault.secrets
  WHERE id IN (
    SELECT iban_vault_secret_id FROM public.pilot_profiles
    WHERE iban_vault_secret_id IS NOT NULL
  );

-- 2. Makni IBAN Vault kolone
ALTER TABLE public.pilot_profiles
  DROP COLUMN IF EXISTS iban_vault_secret_id,
  DROP COLUMN IF EXISTS account_holder_name;

-- 3. Preimenuj stripe_connect_account_id → stripe_account_id (konzistentnije ime)
ALTER TABLE public.pilot_profiles
  RENAME COLUMN stripe_connect_account_id TO stripe_account_id;

-- 4. Dodaj Express onboarding flag (BEZ stripe_onboarding_url — link se generira fresh svaki put jer istječe za 24h)
ALTER TABLE public.pilot_profiles
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT false;

-- 5. Kreiraj payout_status enum (konzistentno s ledger_entry_type i ostalim enumima u projektu)
CREATE TYPE public.payout_status_type AS ENUM ('pending', 'paid', 'failed', 'not_applicable');

-- 6. Dodaj charge tracking i payout_status na bookinge
ALTER TABLE public.flight_booking_requests
  ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT,
  ADD COLUMN IF NOT EXISTS payout_status public.payout_status_type NOT NULL DEFAULT 'pending';

-- 7. Backfill: bookingovi koji su već isplaćeni (paid_out_at IS NOT NULL)
UPDATE public.flight_booking_requests
  SET payout_status = 'paid'
  WHERE paid_out_at IS NOT NULL;

-- 8. Backfill: bookingovi koji nikad neće biti isplaćeni (terminalni statusi bez uplate)
UPDATE public.flight_booking_requests
  SET payout_status = 'not_applicable'
  WHERE status IN ('cancelled', 'rejected', 'expired')
    AND payout_status = 'pending';

-- 9. Index za payout cron job query
CREATE INDEX IF NOT EXISTS idx_bookings_payout_status
  ON public.flight_booking_requests(payout_status);
