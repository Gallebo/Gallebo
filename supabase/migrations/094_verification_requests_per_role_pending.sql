-- Allow one open verification request per (user, requested_role) so identity
-- passenger rows can coexist with pilot upgrade rows.
DROP INDEX IF EXISTS public.verification_requests_user_pending_idx;

CREATE UNIQUE INDEX verification_requests_user_role_pending_idx
  ON public.verification_requests (user_id, requested_role)
  WHERE reviewed_at IS NULL;
