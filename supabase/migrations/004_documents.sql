CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type document_type NOT NULL,
  storage_path text NOT NULL,
  review_status doc_review_status NOT NULL DEFAULT 'pending',
  expires_at date,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX documents_user_id_idx ON public.documents (user_id);
