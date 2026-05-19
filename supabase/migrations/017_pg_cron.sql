-- pg_cron + pg_net must be enabled via Supabase dashboard (Extensions tab)
-- before this migration runs in production.
-- Locally: supabase db reset will apply this; pg_cron is pre-installed in the
-- supabase/postgres image but must be added to shared_preload_libraries.
--
-- LOCAL DEV: current_setting('app.supabase_url') and app.cron_secret require:
--   ALTER DATABASE postgres SET app.supabase_url = 'http://127.0.0.1:54321';
--   ALTER DATABASE postgres SET app.cron_secret = '<your-cron-secret>';
-- On hosted Supabase, use 019_pg_cron_vault.sql instead (Vault + hardcoded URL).

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Process notification_queue every hour on the hour
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

-- Check pilot document expiry every day at 06:00 UTC
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
