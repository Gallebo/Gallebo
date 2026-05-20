CREATE TABLE public.aircraft (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  pilot_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  model text NOT NULL,
  registration text NOT NULL UNIQUE,
  seats smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT aircraft_seats_check CHECK (
    seats >= 2
    AND seats <= 6
  )
);

CREATE INDEX aircraft_pilot_user_id_idx ON public.aircraft (pilot_user_id);

CREATE TRIGGER aircraft_updated_at
  BEFORE UPDATE ON public.aircraft
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at ();

ALTER TABLE public.aircraft ENABLE ROW LEVEL SECURITY;

CREATE POLICY aircraft_select_public ON public.aircraft
  FOR SELECT
  USING (true);

CREATE POLICY aircraft_insert_owner ON public.aircraft
  FOR INSERT
  WITH CHECK (
    auth.uid() = pilot_user_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE
        p.id = pilot_user_id
        AND p.role = 'pilot'
        AND p.status = 'verified'
    )
  );

CREATE POLICY aircraft_update_owner ON public.aircraft
  FOR UPDATE
  USING (auth.uid() = pilot_user_id)
  WITH CHECK (auth.uid() = pilot_user_id);

CREATE POLICY aircraft_delete_owner ON public.aircraft
  FOR DELETE
  USING (auth.uid() = pilot_user_id);
