-- security_invoker = FALSE je namjerno na sva tri viewa.
-- Razlog: base tablice imaju GRANT SELECT TO authenticated i sadrže osjetljive stupce
-- (phone_encrypted, weight_encrypted, date_of_birth u profiles;
--  reviewer_user_id, booking_id u review tablicama).
-- Permisivna SELECT RLS policy bi ih eksponirala direktnim upitima na base tablice.
-- Svaki view sam filtrira stupce i retke (WHERE is_visible=true / WHERE role!='admin').
-- Detalji: docs/reviews-security.md, AGENTS.md.

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
'Javni profili (bez osjetljivih stupaca). security_invoker=FALSE je namjerno: '
'profiles base tablica ima GRANT SELECT TO authenticated i sadrži phone_encrypted, '
'weight_encrypted, date_of_birth — ti stupci nisu u ovom viewu. '
'Dodavanjem permisivne SELECT policy na base tablicu ne može se zamijeniti ovaj view '
'bez eksponiranja osjetljivih stupaca direktnim upitima. '
'Ne mijenjati u security_invoker=TRUE bez migracije osjetljivih stupaca u profiles_private tablicu.';

CREATE OR REPLACE VIEW public.pilot_reviews_public
  WITH (security_invoker = FALSE) AS
SELECT
  id,
  pilot_user_id,
  rating,
  communication_rating,
  accuracy_rating,
  experience_rating,
  comment,
  created_at
FROM public.pilot_reviews
WHERE is_visible = true;

COMMENT ON VIEW public.pilot_reviews_public IS
'Javno vidljive recenzije pilota (is_visible=true). security_invoker=FALSE je namjerno: '
'(1) pilot_reviews ima GRANT SELECT TO authenticated — permisivna policy bi eksponirala '
'reviewer_user_id (narušava blind-review anonimnost); '
'(2) cross-user reputation reads blokira participant-scoped RLS na base tablici. '
'Vidi docs/reviews-security.md. Ne mijenjati bez dodavanja pilot-scoped SELECT policy ili SECURITY DEFINER RPC-a.';

CREATE OR REPLACE VIEW public.passenger_reviews_public
  WITH (security_invoker = FALSE) AS
SELECT
  id,
  passenger_user_id,
  pilot_user_id,
  rating,
  accuracy_rating,
  behavior_rating,
  weight_accuracy_rating,
  comment,
  submitted_at
FROM public.passenger_reviews
WHERE is_visible = true;

COMMENT ON VIEW public.passenger_reviews_public IS
'Javno vidljive recenzije putnika (is_visible=true). security_invoker=FALSE je namjerno — '
'isti razlozi kao pilot_reviews_public. Vidi docs/reviews-security.md.';

-- GRANTs su idempotentni, postavljeni u prethodnim migracijama
GRANT SELECT ON public.profiles_public TO anon, authenticated;
GRANT SELECT ON public.pilot_reviews_public TO anon, authenticated;
GRANT SELECT ON public.passenger_reviews_public TO authenticated;
