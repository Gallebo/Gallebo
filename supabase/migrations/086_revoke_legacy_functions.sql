-- Revoke public execute on auth trigger and legacy vault IBAN helpers.

-- 1) Auth trigger — not callable from client
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;

-- 2) Legacy IBAN vault functions — Stripe Express is the active path
REVOKE EXECUTE ON FUNCTION public.store_pilot_iban(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_pilot_iban(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_pilot_iban_for_payout(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_pilot_iban_last_four() FROM authenticated;
