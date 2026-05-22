-- Phase 6: web push subscriptions and per-user notification preferences

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_subscriptions_endpoint_unique UNIQUE (endpoint)
);

CREATE INDEX push_subscriptions_user_id_idx ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY push_subscriptions_select_own ON public.push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY push_subscriptions_insert_own ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY push_subscriptions_update_own ON public.push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY push_subscriptions_delete_own ON public.push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE public.user_notification_settings (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT true,
  in_app_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_notification_settings_select_own ON public.user_notification_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_notification_settings_insert_own ON public.user_notification_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_notification_settings_update_own ON public.user_notification_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, status)
  VALUES (NEW.id, 'registered');

  INSERT INTO public.user_notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Backfill settings for existing users
INSERT INTO public.user_notification_settings (user_id)
SELECT p.id
FROM public.profiles p
ON CONFLICT (user_id) DO NOTHING;
