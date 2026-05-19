CREATE TABLE public.pilot_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  onboarding_draft jsonb DEFAULT '{}'::jsonb,
  onboarding_step int NOT NULL DEFAULT 0,
  license_expires_at date,
  medical_expires_at date,
  tax_declaration_accepted_at timestamptz,
  iban_vault_secret_id uuid,
  account_holder_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER pilot_profiles_updated_at
  BEFORE UPDATE ON public.pilot_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
