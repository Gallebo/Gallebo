CREATE OR REPLACE FUNCTION public.store_pilot_iban(p_user_id uuid, p_iban text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  secret_id uuid;
BEGIN
  -- NULL check allows service_role calls (auth.uid() is NULL for service_role)
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot store IBAN for another user';
  END IF;

  SELECT vault.create_secret(p_iban, 'iban_' || p_user_id::text, 'Pilot IBAN') INTO secret_id;
  UPDATE public.pilot_profiles
  SET iban_vault_secret_id = secret_id
  WHERE user_id = p_user_id;
  RETURN secret_id;
END;
$$;
