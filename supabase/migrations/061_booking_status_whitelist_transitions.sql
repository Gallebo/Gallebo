-- Popravak 2: Whitelist pristup za status prijelaze bookinga.
-- Prethodni trigger koristio je blacklist — blokirao je prijelaze IZ finalnih
-- stanja, ali nije blokirao npr. confirmed → expired direktno od pilota.
-- Novi trigger eksplicitno definira svaki dozvoljen prijelaz.

CREATE OR REPLACE FUNCTION public.check_booking_status_transition ()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Isti status — uvijek OK (npr. ažuriranje ostalih stupaca)
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Dozvoljeni prijelazi (whitelist)
  IF (OLD.status = 'pending'   AND NEW.status IN ('accepted', 'rejected', 'expired', 'cancelled'))
  OR (OLD.status = 'accepted'  AND NEW.status IN ('confirmed', 'expired', 'cancelled'))
  OR (OLD.status = 'confirmed' AND NEW.status IN ('completed', 'cancelled'))
  THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Invalid booking status transition: % → %', OLD.status, NEW.status;
END;
$$;

DROP TRIGGER IF EXISTS booking_status_transition ON public.flight_booking_requests;

CREATE TRIGGER booking_status_transition
  BEFORE UPDATE OF status ON public.flight_booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_booking_status_transition ();
