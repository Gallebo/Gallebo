ALTER TABLE public.pilot_profiles
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id text;
