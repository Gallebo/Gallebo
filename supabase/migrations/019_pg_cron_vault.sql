-- Hosted Supabase disallows custom database GUCs (app.cron_secret).
-- Cron jobs read CRON_SECRET from Vault and use the project URL directly.
-- NOTE: The project URL is hardcoded and environment-specific.
--       For a staging/other environment, update the URLs before applying.

SELECT cron.unschedule('process-notifications');
SELECT cron.unschedule('pilot-expiry');

SELECT cron.schedule(
  'process-notifications',
  '0 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://vdtprfojirdayvfwnver.supabase.co/functions/v1/process-notifications',
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

SELECT cron.schedule(
  'pilot-expiry',
  '0 6 * * *',
  $$
    SELECT net.http_post(
      url := 'https://vdtprfojirdayvfwnver.supabase.co/functions/v1/pilot-expiry',
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
