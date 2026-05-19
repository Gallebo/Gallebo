INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'identity-documents',
    'identity-documents',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
  ),
  (
    'pilot-documents',
    'pilot-documents',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
  ),
  (
    'airfield-documents',
    'airfield-documents',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
  )
ON CONFLICT (id) DO NOTHING;

CREATE POLICY storage_identity_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'identity-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

CREATE POLICY storage_identity_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'identity-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY storage_identity_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'identity-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

CREATE POLICY storage_pilot_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'pilot-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

CREATE POLICY storage_pilot_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'pilot-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY storage_pilot_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'pilot-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

CREATE POLICY storage_airfield_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'airfield-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

CREATE POLICY storage_airfield_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'airfield-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY storage_airfield_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'airfield-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );
