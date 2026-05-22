-- Popravak 8: Konzistentna cron URL konfiguracija.
-- Migracije 051 i 059 hardkodiraju Supabase project URL.
-- Ovdje se ti jobovi reschedule-iraju da koriste Vault secret za URL,
-- konzistentno s migration 049 pristupom.

SELECT cron.unschedule('booking-expiry');
SELECT cron.unschedule('process-payouts');
SELECT cron.unschedule('send-flight-reminders');

SELECT cron.schedule(
  'booking-expiry',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'supabase_url'
        LIMIT 1
      ) || '/functions/v1/booking-expiry',
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
  'process-payouts',
  '5 * * * *',
  $$
    SELECT net.http_post(
      url := (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'supabase_url'
        LIMIT 1
      ) || '/functions/v1/process-payouts',
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
  'send-flight-reminders',
  '0 10 * * *',
  $$
    SELECT net.http_post(
      url := (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'supabase_url'
        LIMIT 1
      ) || '/functions/v1/send-flight-reminders',
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
