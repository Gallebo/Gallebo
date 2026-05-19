ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS weight_kg,
  ADD COLUMN weight_encrypted bytea;
