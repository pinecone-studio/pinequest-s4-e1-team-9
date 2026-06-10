DELETE FROM public.document_chunks dc
WHERE dc.user_id IS NULL
  OR dc.document_id IS NULL
  OR NOT EXISTS (
    SELECT 1
    FROM public.user_documents ud
    WHERE ud.id = dc.document_id
      AND ud.user_id = dc.user_id
  );

ALTER TABLE public.document_chunks
  DROP CONSTRAINT IF EXISTS document_chunks_document_id_fkey;

ALTER TABLE public.document_chunks
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN document_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_documents_id_user_id_key'
  ) THEN
    ALTER TABLE public.user_documents
      ADD CONSTRAINT user_documents_id_user_id_key UNIQUE (id, user_id);
  END IF;
END
$$;

ALTER TABLE public.document_chunks
  ADD CONSTRAINT document_chunks_document_id_user_id_fkey
  FOREIGN KEY (document_id, user_id)
  REFERENCES public.user_documents(id, user_id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;
