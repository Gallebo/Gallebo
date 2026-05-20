CREATE TABLE public.airfields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icao_code varchar(4) NOT NULL UNIQUE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  country text NOT NULL,
  contact_email text,
  contact_phone text,
  working_hours text,
  has_fuel boolean NOT NULL DEFAULT false,
  has_hangar boolean NOT NULL DEFAULT false,
  has_rental boolean NOT NULL DEFAULT false,
  description text,
  destination_info text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  operator_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX airfields_status_idx ON public.airfields (status);
CREATE INDEX airfields_country_idx ON public.airfields (country);
CREATE INDEX airfields_operator_user_id_idx ON public.airfields (operator_user_id);

CREATE TRIGGER airfields_updated_at
  BEFORE UPDATE ON public.airfields
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
