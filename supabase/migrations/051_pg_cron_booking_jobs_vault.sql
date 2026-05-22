-- Hosted Supabase: schedule booking-expiry and process-payouts (update URL if not production)

SELECT cron.unschedule('booking-expiry');
SELECT cron.unschedule('process-payouts');

SELECT cron.schedule(
  'booking-expiry',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://vdtprfojirdayvfwnver.supabase.co/functions/v1/booking-expiry',
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
      url := 'https://vdtprfojirdayvfwnver.supabase.co/functions/v1/process-payouts',
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
