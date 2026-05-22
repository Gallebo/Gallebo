-- Phase 6: internal booking chat

CREATE OR REPLACE FUNCTION public.is_booking_participant(p_booking_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.flight_booking_requests b
    JOIN public.flights f ON f.id = b.flight_id
    WHERE
      b.id = p_booking_id
      AND (
        b.passenger_user_id = auth.uid()
        OR f.pilot_user_id = auth.uid()
        OR public.is_admin()
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.booking_chat_unlocked(p_booking_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.flight_booking_requests b
    WHERE
      b.id = p_booking_id
      AND b.status IN ('accepted', 'confirmed', 'completed')
  );
$$;

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.flight_booking_requests (id) ON DELETE CASCADE,
  sender_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  content text NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 4000),
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_booking_id_created_at_idx ON public.chat_messages (booking_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY chat_messages_select ON public.chat_messages
  FOR SELECT
  USING (public.is_booking_participant(booking_id));

CREATE POLICY chat_messages_insert_user ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    public.is_booking_participant(booking_id)
    AND public.booking_chat_unlocked(booking_id)
    AND is_system = false
    AND sender_user_id = auth.uid()
  );

-- No UPDATE or DELETE policies — messages cannot be deleted (legal retention)
