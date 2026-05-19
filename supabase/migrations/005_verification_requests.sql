CREATE TABLE public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  requested_role user_role NOT NULL,
  didit_session_id text,
  didit_status text,
  auto_approved boolean NOT NULL DEFAULT false,
  reviewed_by uuid REFERENCES public.profiles (id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX verification_requests_user_id_idx ON public.verification_requests (user_id);
CREATE INDEX verification_requests_status_idx ON public.verification_requests (didit_status);
