-- Phase 7: blind review timing + cron for revealing auto 5-star reviews

ALTER TABLE public.flight_booking_requests
  ADD COLUMN IF NOT EXISTS review_deadline_at timestamptz;

CREATE INDEX IF NOT EXISTS flight_booking_requests_review_deadline_at_idx
  ON public.flight_booking_requests (review_deadline_at);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-reviews') THEN
    PERFORM cron.unschedule('process-reviews');
  END IF;
END $$;

SELECT cron.schedule(
  'process-reviews',
  '0 * * * *',
  $$
    SELECT net.http_post(
      url := (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'supabase_url'
        LIMIT 1
      ) || '/functions/v1/process-reviews',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'cron_secret'
          LIMIT 1
        )
      ),
      body := '{}'::jsonb
    );
  $$
);
