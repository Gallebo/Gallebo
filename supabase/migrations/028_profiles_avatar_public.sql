ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_path text;

DROP VIEW IF EXISTS public.profiles_public CASCADE;

CREATE VIEW public.profiles_public AS
SELECT
  id,
  first_name,
  last_name,
  status,
  role,
  avatar_path,
  created_at,
  updated_at
FROM
  public.profiles
WHERE
  role IS NULL
  OR role != 'admin';

GRANT SELECT ON public.profiles_public TO anon,
authenticated;
