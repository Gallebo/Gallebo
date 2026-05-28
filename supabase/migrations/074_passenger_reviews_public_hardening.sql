-- Narrow passenger_reviews_public columns; document security_invoker model.

DROP VIEW IF EXISTS public.passenger_reviews_public;

CREATE VIEW public.passenger_reviews_public
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

GRANT SELECT ON public.passenger_reviews_public TO authenticated;

COMMENT ON VIEW public.passenger_reviews_public IS
  'Visible passenger reviews for aggregation and profile. security_invoker=FALSE matches pilot_reviews_public: RLS on passenger_reviews is participant-scoped and would block pilot batch reputation reads. Defense-in-depth: immutable WHERE is_visible=true in view definition; callers must use this view not base table for cross-user reads. Future hardening: pilot-scoped SELECT policy or SECURITY DEFINER batch RPC.';
