-- Ledger rows are append-only; pilots may read entries for their flights.

CREATE OR REPLACE FUNCTION public.deny_ledger_mutation ()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'ledger rows are immutable';
END;
$$;

DROP TRIGGER IF EXISTS ledger_no_update_delete ON public.ledger;

CREATE TRIGGER ledger_no_update_delete
  BEFORE UPDATE OR DELETE ON public.ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.deny_ledger_mutation ();

CREATE POLICY ledger_select_pilot ON public.ledger
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.flight_booking_requests b
      INNER JOIN public.flights f ON f.id = b.flight_id
      WHERE b.id = ledger.booking_id
        AND f.pilot_user_id = auth.uid ()
    )
    OR (metadata ->> 'pilot_user_id')::uuid = auth.uid ()
  );

GRANT SELECT ON public.ledger TO authenticated;
