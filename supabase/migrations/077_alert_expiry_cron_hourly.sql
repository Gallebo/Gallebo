-- Hourly process-alert-expiry so "day before" warnings are not skipped for alerts expiring before 07:00 UTC

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-alert-expiry') THEN
    PERFORM cron.unschedule('process-alert-expiry');
  END IF;
END $$;

SELECT cron.schedule(
  'process-alert-expiry',
  '0 * * * *',
  $$
    SELECT net.http_post(
      url := (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'supabase_url'
        LIMIT 1
      ) || '/functions/v1/process-alert-expiry',
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
