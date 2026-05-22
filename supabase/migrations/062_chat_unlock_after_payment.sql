-- Popravak 3: Chat se otključava tek nakon potvrđenog plaćanja (status = confirmed).
-- Spec faze 6 kaže: "Step 5 — Booking potvrdjen → chat se otkljucava".
-- "Booking potvrdjen" = Stripe webhook postavio status na 'confirmed'.
-- Prethodno se chat otključavao i pri 'accepted' (pilot prihvatio, ali nije plaćeno).

CREATE OR REPLACE FUNCTION public.booking_chat_unlocked (p_booking_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.flight_booking_requests b
    WHERE
      b.id = p_booking_id
      AND b.status IN ('confirmed', 'completed')
  );
$$;
