-- Restrict client updates on in_app_notifications to read_at only

CREATE OR REPLACE FUNCTION public.check_notification_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id != OLD.user_id
     OR NEW.type != OLD.type
     OR NEW.title != OLD.title
     OR NEW.body != OLD.body
     OR NEW.booking_id IS DISTINCT FROM OLD.booking_id
     OR NEW.flight_id IS DISTINCT FROM OLD.flight_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Only read_at can be updated on in_app_notifications';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_notification_read_at_only ON public.in_app_notifications;

CREATE TRIGGER enforce_notification_read_at_only
  BEFORE UPDATE ON public.in_app_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.check_notification_update();
