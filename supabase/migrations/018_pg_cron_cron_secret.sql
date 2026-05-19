-- Reschedule cron jobs to use CRON_SECRET instead of service_role_key.
-- Note: custom GUCs (app.cron_secret) are not allowed on hosted Supabase.
-- Use 019_pg_cron_vault.sql for production (Vault + hardcoded project URL).

SELECT cron.unschedule('process-notifications');
SELECT cron.unschedule('pilot-expiry');

SELECT cron.schedule(
  'process-notifications',
  '0 * * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/process-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.cron_secret')
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
      url := current_setting('app.supabase_url') || '/functions/v1/pilot-expiry',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.cron_secret')
      ),
      body := '{}'::jsonb
    );
  $$
);
