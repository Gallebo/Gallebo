DROP POLICY IF EXISTS storage_flight_photos_insert ON storage.objects;

CREATE POLICY storage_flight_photos_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'flight-photos'
    AND (
      (
        (storage.foldername (name))[1] = auth.uid ()::text
        AND (storage.foldername (name))[2] = 'draft'
      )
      OR EXISTS (
        SELECT 1
        FROM public.flights f
        WHERE
          f.pilot_user_id = auth.uid ()
          AND f.id::text = (storage.foldername (name))[1]
      )
    )
  );
