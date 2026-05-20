INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'airfield-photos',
  'airfield-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY storage_airfield_photos_select ON storage.objects
  FOR SELECT
  USING (bucket_id = 'airfield-photos');

CREATE POLICY storage_airfield_photos_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'airfield-photos'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.airfields
        WHERE operator_user_id = auth.uid()
          AND id::text = (storage.foldername(name))[1]
      )
    )
  );

CREATE POLICY storage_airfield_photos_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'airfield-photos'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.airfields
        WHERE operator_user_id = auth.uid()
          AND id::text = (storage.foldername(name))[1]
      )
    )
  );
