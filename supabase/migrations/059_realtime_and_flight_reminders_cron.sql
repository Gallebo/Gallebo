-- Phase 6: Realtime publications and daily flight reminder cron

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

ALTER PUBLICATION supabase_realtime ADD TABLE public.in_app_notifications;

SELECT cron.schedule(
  'send-flight-reminders',
  '0 10 * * *',
  $$
    SELECT net.http_post(
      -- DEPRECATED: hardcoded URL overridden by 063_fix_cron_urls.sql which uses Vault
      url := 'https://vdtprfojirdayvfwnver.supabase.co/functions/v1/send-flight-reminders',
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
