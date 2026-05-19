CREATE OR REPLACE VIEW public.profiles_public AS
SELECT
  id,
  first_name,
  last_name,
  status,
  role,
  created_at,
  updated_at
FROM public.profiles
WHERE role IS NULL OR role != 'admin';

GRANT SELECT ON public.profiles_public TO anon, authenticated;
