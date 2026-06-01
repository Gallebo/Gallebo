-- Distributed rate limiting (serverless-safe). Called only via service_role.

CREATE TABLE public.rate_limit_buckets (
  bucket_key text NOT NULL,
  window_start timestamptz NOT NULL,
  count int NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_key, window_start)
);

CREATE INDEX rate_limit_buckets_window_start_idx ON public.rate_limit_buckets (window_start);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_rate_limit (
  p_key text,
  p_limit int,
  p_window_seconds int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_count int;
  v_allowed boolean;
  v_retry_after int;
BEGIN
  IF p_key IS NULL OR length(trim(p_key)) = 0 OR p_limit < 1 OR p_window_seconds < 1 THEN
    RETURN jsonb_build_object('allowed', false, 'retry_after_seconds', 60);
  END IF;

  DELETE FROM public.rate_limit_buckets
  WHERE window_start < now() - interval '24 hours';

  v_window_start := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.rate_limit_buckets (bucket_key, window_start, count)
  VALUES (p_key, v_window_start, 1)
  ON CONFLICT (bucket_key, window_start)
  DO UPDATE
  SET count = public.rate_limit_buckets.count + 1
  RETURNING count INTO v_count;

  IF v_count > p_limit THEN
    v_allowed := false;
    v_retry_after := greatest(
      0,
      ceil(
        extract(
          epoch
          FROM (v_window_start + make_interval(secs => p_window_seconds) - now())
        )
      )::int
    );
  ELSE
    v_allowed := true;
    v_retry_after := NULL;
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'retry_after_seconds', v_retry_after
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit (text, int, int) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.check_rate_limit (text, int, int) FROM anon;

REVOKE ALL ON FUNCTION public.check_rate_limit (text, int, int) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.check_rate_limit (text, int, int) TO service_role;
