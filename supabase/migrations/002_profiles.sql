CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  status user_status NOT NULL DEFAULT 'registered',
  role user_role,
  date_of_birth date,
  phone_encrypted bytea,
  weight_kg numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_age_18 CHECK (
    date_of_birth IS NULL
    OR date_of_birth <= (CURRENT_DATE - INTERVAL '18 years')
  )
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE VIEW public.profiles_public AS
SELECT
  id,
  first_name,
  last_name,
  status,
  role,
  created_at,
  updated_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;
