-- Phase 6: in-app notification feed

CREATE TABLE public.in_app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  booking_id uuid REFERENCES public.flight_booking_requests (id) ON DELETE SET NULL,
  flight_id uuid REFERENCES public.flights (id) ON DELETE SET NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX in_app_notifications_user_id_created_at_idx ON public.in_app_notifications (user_id, created_at DESC);

CREATE INDEX in_app_notifications_user_unread_idx ON public.in_app_notifications (user_id)
WHERE
  read_at IS NULL;

ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY in_app_notifications_select_own ON public.in_app_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY in_app_notifications_update_own ON public.in_app_notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
