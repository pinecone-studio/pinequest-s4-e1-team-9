ALTER TABLE public.document_chunks
  ADD COLUMN IF NOT EXISTS chunk_index integer,
  ADD COLUMN IF NOT EXISTS page_number integer,
  ADD COLUMN IF NOT EXISTS created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS document_chunks_user_id_idx
  ON public.document_chunks(user_id);

CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx
  ON public.document_chunks(document_id);

CREATE INDEX IF NOT EXISTS document_chunks_user_id_document_id_idx
  ON public.document_chunks(user_id, document_id);
