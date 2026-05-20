CREATE TABLE public.airfield_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airfield_id uuid NOT NULL REFERENCES public.airfields (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX airfield_photos_airfield_id_idx ON public.airfield_photos (airfield_id, sort_order);

CREATE TABLE public.airfield_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airfield_id uuid NOT NULL REFERENCES public.airfields (id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX airfield_notices_airfield_id_idx ON public.airfield_notices (airfield_id, created_at DESC);

CREATE TABLE public.airfield_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airfield_id uuid NOT NULL REFERENCES public.airfields (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX airfield_events_airfield_id_idx ON public.airfield_events (airfield_id, event_date);
