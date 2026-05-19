CREATE OR REPLACE FUNCTION public.store_pilot_iban(p_user_id uuid, p_iban text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  secret_id uuid;
BEGIN
  SELECT vault.create_secret(p_iban, 'iban_' || p_user_id::text, 'Pilot IBAN') INTO secret_id;
  UPDATE public.pilot_profiles
  SET iban_vault_secret_id = secret_id
  WHERE user_id = p_user_id;
  RETURN secret_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_pilot_iban(p_secret_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = vault
AS $$
BEGIN
  PERFORM vault.delete_secret(p_secret_id);
END;
$$;

REVOKE ALL ON FUNCTION public.store_pilot_iban(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_pilot_iban(uuid) FROM PUBLIC;
