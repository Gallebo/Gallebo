CREATE TABLE public.flight_publish_drafts (
  pilot_user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  step int NOT NULL DEFAULT 1,
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now ()
);

ALTER TABLE public.flight_publish_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY flight_publish_drafts_select ON public.flight_publish_drafts
  FOR SELECT
  USING (auth.uid() = pilot_user_id);

CREATE POLICY flight_publish_drafts_insert ON public.flight_publish_drafts
  FOR INSERT
  WITH CHECK (auth.uid() = pilot_user_id);

CREATE POLICY flight_publish_drafts_update ON public.flight_publish_drafts
  FOR UPDATE
  USING (auth.uid() = pilot_user_id)
  WITH CHECK (auth.uid() = pilot_user_id);

CREATE POLICY flight_publish_drafts_delete ON public.flight_publish_drafts
  FOR DELETE
  USING (auth.uid() = pilot_user_id);
