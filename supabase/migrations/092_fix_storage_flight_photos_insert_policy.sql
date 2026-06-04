-- Publish fallback upload() uses INSERT; same flights visibility issue as storage.move WITH CHECK.

DROP POLICY IF EXISTS storage_flight_photos_insert ON storage.objects;

CREATE POLICY storage_flight_photos_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'flight-photos'
    AND (
      (
        (storage.foldername(name))[1] = (select auth.uid()::text)
        AND (storage.foldername(name))[2] = 'draft'
      )
      OR (select auth.uid()) IS NOT NULL
    )
  );
