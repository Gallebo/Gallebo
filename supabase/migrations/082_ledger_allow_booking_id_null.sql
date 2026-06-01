-- Allow FK ON DELETE SET NULL on ledger.booking_id (GDPR account deletion / retention).
-- All other ledger mutations remain blocked.

CREATE OR REPLACE FUNCTION public.deny_ledger_mutation ()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.booking_id IS NOT NULL
     AND NEW.booking_id IS NULL
     AND (to_jsonb(NEW) - 'booking_id') IS NOT DISTINCT FROM (to_jsonb(OLD) - 'booking_id')
  THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'ledger rows are immutable';
END;
$$;
