CREATE TABLE public.pilot_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  pilot_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  reviewer_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  rating smallint NOT NULL,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now (),
  CONSTRAINT pilot_reviews_rating_chk CHECK (
    rating >= 1
    AND rating <= 5
  ),
  CONSTRAINT pilot_reviews_no_self CHECK (pilot_user_id <> reviewer_user_id),
  CONSTRAINT pilot_reviews_unique_reviewer UNIQUE (pilot_user_id, reviewer_user_id)
);

CREATE INDEX pilot_reviews_pilot_user_id_idx ON public.pilot_reviews (pilot_user_id);

ALTER TABLE public.pilot_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY pilot_reviews_insert_auth ON public.pilot_reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_user_id
    AND pilot_user_id <> auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE
        p.id = pilot_user_id
        AND p.role = 'pilot'
        AND p.status = 'verified'
    )
  );

CREATE POLICY pilot_reviews_select_own_or_admin ON public.pilot_reviews
  FOR SELECT
  USING (
    public.is_admin()
    OR auth.uid() = reviewer_user_id
  );

REVOKE SELECT ON TABLE public.pilot_reviews FROM anon;

CREATE VIEW public.pilot_reviews_public WITH (security_invoker = FALSE) AS
SELECT
  id,
  pilot_user_id,
  rating,
  comment,
  created_at
FROM
  public.pilot_reviews;

GRANT SELECT ON public.pilot_reviews_public TO anon,
authenticated;

CREATE OR REPLACE FUNCTION public.get_pilot_iban_last_four ()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_uid uuid;
  v_secret_id uuid;
  v_full text;
  v_trimmed text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT iban_vault_secret_id INTO v_secret_id
  FROM public.pilot_profiles
  WHERE user_id = v_uid;

  IF v_secret_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO v_full
  FROM vault.decrypted_secrets
  WHERE id = v_secret_id
  LIMIT 1;

  IF v_full IS NULL THEN
    RETURN NULL;
  END IF;

  v_trimmed := regexp_replace(v_full, '\s', '', 'g');

  IF length(v_trimmed) < 4 THEN
    RETURN '****';
  END IF;

  RETURN right(v_trimmed, 4);
END;
$$;

REVOKE ALL ON FUNCTION public.get_pilot_iban_last_four () FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_pilot_iban_last_four () TO authenticated;

GRANT INSERT ON public.pilot_reviews TO authenticated;

GRANT SELECT ON public.pilot_reviews TO authenticated;
