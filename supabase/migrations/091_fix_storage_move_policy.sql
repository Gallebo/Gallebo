-- Fix storage.move() failing on publish: WITH CHECK no longer depends on flights row visibility.

DROP POLICY IF EXISTS storage_flight_photos_move ON storage.objects;

CREATE POLICY storage_flight_photos_move ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'flight-photos'
    AND (
      -- Source: pilot may move own draft files
      (storage.foldername(name))[1] = (select auth.uid()::text)
      OR
      -- Or files in a folder for a flight they own
      EXISTS (
        SELECT 1
        FROM public.flights f
        WHERE
          f.pilot_user_id = (select auth.uid())
          AND f.id::text = (storage.foldername(name))[1]
      )
    )
  )
  WITH CHECK (
    bucket_id = 'flight-photos'
    AND (
      -- Destination: own draft folder
      (storage.foldername(name))[1] = (select auth.uid()::text)
      OR
      -- Or any flight folder while authenticated (flight id = first path segment)
      (select auth.uid()) IS NOT NULL
    )
  );
