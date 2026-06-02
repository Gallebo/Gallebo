-- Document profiles_public security_invoker model (consistent with review public views).

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = FALSE) AS
SELECT
  id,
  first_name,
  last_name,
  status,
  role,
  avatar_path,
  created_at,
  updated_at
FROM public.profiles
WHERE role IS NULL OR role != 'admin';

COMMENT ON VIEW public.profiles_public IS
'Public profile view. security_invoker = FALSE is intentional: RLS on profiles restricts access to own row only; this view exposes non-sensitive columns (no phone, weight, DOB, IBAN) filtered by WHERE role != admin for public read by anon and authenticated.';
