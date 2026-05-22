-- Booking expiry every 5 minutes (local dev: app.supabase_url + app.cron_secret)
SELECT cron.schedule(
  'booking-expiry',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/booking-expiry',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.cron_secret')
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Process pilot payouts every hour
SELECT cron.schedule(
  'process-payouts',
  '5 * * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/process-payouts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.cron_secret')
      ),
      body := '{}'::jsonb
    );
  $$
);
