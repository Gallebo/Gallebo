INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'aircraft-photos',
  'aircraft-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png']
),
(
  'profile-photos',
  'profile-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY storage_aircraft_photos_select ON storage.objects
  FOR SELECT
  USING (bucket_id = 'aircraft-photos');

CREATE POLICY storage_aircraft_photos_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'aircraft-photos'
    AND EXISTS (
      SELECT 1
      FROM public.aircraft a
      WHERE
        a.pilot_user_id = auth.uid()
        AND a.id::text = (storage.foldername (name))[1]
    )
  );

CREATE POLICY storage_aircraft_photos_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'aircraft-photos'
    AND EXISTS (
      SELECT 1
      FROM public.aircraft a
      WHERE
        a.pilot_user_id = auth.uid()
        AND a.id::text = (storage.foldername (name))[1]
    )
  );

CREATE POLICY storage_profile_photos_select ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY storage_profile_photos_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND auth.uid ()::text = (storage.foldername (name))[1]
  );

CREATE POLICY storage_profile_photos_update ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'profile-photos'
    AND auth.uid ()::text = (storage.foldername (name))[1]
  )
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND auth.uid ()::text = (storage.foldername (name))[1]
  );

CREATE POLICY storage_profile_photos_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'profile-photos'
    AND auth.uid ()::text = (storage.foldername (name))[1]
  );

CREATE TABLE public.aircraft_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  aircraft_id uuid NOT NULL REFERENCES public.aircraft (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now (),
  CONSTRAINT aircraft_photos_position_chk CHECK (
    position >= 0
  )
);

CREATE INDEX aircraft_photos_aircraft_id_idx ON public.aircraft_photos (aircraft_id);

ALTER TABLE public.aircraft_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY aircraft_photos_select_public ON public.aircraft_photos
  FOR SELECT
  USING (true);

CREATE POLICY aircraft_photos_insert_owner ON public.aircraft_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.aircraft a
      WHERE
        a.id = aircraft_id
        AND a.pilot_user_id = auth.uid()
    )
  );

CREATE POLICY aircraft_photos_update_owner ON public.aircraft_photos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.aircraft a
      WHERE
        a.id = aircraft_id
        AND a.pilot_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.aircraft a
      WHERE
        a.id = aircraft_id
        AND a.pilot_user_id = auth.uid()
    )
  );

CREATE POLICY aircraft_photos_delete_owner ON public.aircraft_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.aircraft a
      WHERE
        a.id = aircraft_id
        AND a.pilot_user_id = auth.uid()
    )
  );
