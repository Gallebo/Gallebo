-- Realtime postgres_changes filter on booking_id requires full row image.
-- Without REPLICA IDENTITY FULL, filtered subscriptions may not receive INSERT events.

ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
