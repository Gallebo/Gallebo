CREATE TABLE public.airfield_operator_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  airfield_name text NOT NULL,
  icao_code varchar(4) NOT NULL,
  location text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  status doc_review_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER airfield_operator_requests_updated_at
  BEFORE UPDATE ON public.airfield_operator_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
