CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilot_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airfield_operator_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY profiles_select_own_or_admin ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- pilot_profiles
CREATE POLICY pilot_profiles_select ON public.pilot_profiles
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY pilot_profiles_insert ON public.pilot_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY pilot_profiles_update ON public.pilot_profiles
  FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- documents
CREATE POLICY documents_select ON public.documents
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY documents_insert ON public.documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY documents_update_admin ON public.documents
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- verification_requests
CREATE POLICY verification_requests_select ON public.verification_requests
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY verification_requests_insert ON public.verification_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY verification_requests_update_admin ON public.verification_requests
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- airfield_operator_requests
CREATE POLICY airfield_requests_select ON public.airfield_operator_requests
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY airfield_requests_insert ON public.airfield_operator_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY airfield_requests_update_admin ON public.airfield_operator_requests
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- notification_queue (admin read only; inserts via service role)
CREATE POLICY notification_queue_select_admin ON public.notification_queue
  FOR SELECT
  USING (public.is_admin());
