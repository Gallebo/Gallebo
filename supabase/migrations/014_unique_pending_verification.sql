CREATE UNIQUE INDEX verification_requests_user_pending_idx
  ON public.verification_requests (user_id)
  WHERE reviewed_at IS NULL;
