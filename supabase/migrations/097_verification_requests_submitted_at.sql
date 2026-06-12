-- When a user submits documents for admin review (pilot upgrade), distinct from row created_at.
ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

COMMENT ON COLUMN public.verification_requests.submitted_at IS
  'When the user completed submission for admin review (e.g. pilot upgrade documents).';
