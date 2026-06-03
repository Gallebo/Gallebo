-- storage.move() requires UPDATE on storage.objects (rename path).
CREATE POLICY storage_flight_photos_move ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'flight-photos'
    AND auth.uid() = owner
    AND (
      (
        (storage.foldername(name))[1] = auth.uid()::text
        AND (storage.foldername(name))[2] = 'draft'
      )
      OR EXISTS (
        SELECT 1
        FROM public.flights f
        WHERE
          f.pilot_user_id = auth.uid()
          AND f.id::text = (storage.foldername(name))[1]
      )
    )
  )
  WITH CHECK (
    bucket_id = 'flight-photos'
    AND EXISTS (
      SELECT 1
      FROM public.flights f
      WHERE
        f.pilot_user_id = auth.uid()
        AND f.id::text = (storage.foldername(name))[1]
    )
  );
