INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'flight-photos',
  'flight-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.flight_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  flight_id uuid NOT NULL REFERENCES public.flights (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now (),
  CONSTRAINT flight_photos_position_chk CHECK (position >= 0)
);

CREATE INDEX flight_photos_flight_id_idx ON public.flight_photos (flight_id);

ALTER TABLE public.flight_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY flight_photos_select ON public.flight_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.flights f
      WHERE
        f.id = flight_id
        AND (
          f.status = 'published'
          OR f.pilot_user_id = auth.uid()
          OR public.is_admin()
        )
    )
  );

CREATE POLICY flight_photos_insert ON public.flight_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.flights f
      WHERE
        f.id = flight_id
        AND f.pilot_user_id = auth.uid()
    )
  );

CREATE POLICY flight_photos_update ON public.flight_photos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.flights f
      WHERE
        f.id = flight_id
        AND f.pilot_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.flights f
      WHERE
        f.id = flight_id
        AND f.pilot_user_id = auth.uid()
    )
  );

CREATE POLICY flight_photos_delete ON public.flight_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.flights f
      WHERE
        f.id = flight_id
        AND f.pilot_user_id = auth.uid()
    )
  );

CREATE POLICY storage_flight_photos_select ON storage.objects
  FOR SELECT
  USING (bucket_id = 'flight-photos');

CREATE POLICY storage_flight_photos_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'flight-photos'
    AND (
      (storage.foldername (name))[1] = auth.uid ()::text
      OR EXISTS (
        SELECT 1
        FROM public.flights f
        WHERE
          f.pilot_user_id = auth.uid()
          AND f.id::text = (storage.foldername (name))[1]
      )
    )
  );

CREATE POLICY storage_flight_photos_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'flight-photos'
    AND (
      (storage.foldername (name))[1] = auth.uid ()::text
      OR EXISTS (
        SELECT 1
        FROM public.flights f
        WHERE
          f.pilot_user_id = auth.uid()
          AND f.id::text = (storage.foldername (name))[1]
      )
    )
  );
