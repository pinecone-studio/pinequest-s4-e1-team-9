ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS company_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chat_messages_company_id_fkey'
  ) THEN
    ALTER TABLE public.chat_messages
      ADD CONSTRAINT chat_messages_company_id_fkey
      FOREIGN KEY (company_id)
      REFERENCES public.companies(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS chat_messages_company_id_idx
  ON public.chat_messages(company_id);

CREATE INDEX IF NOT EXISTS chat_messages_user_id_company_id_idx
  ON public.chat_messages(user_id, company_id);

CREATE INDEX IF NOT EXISTS chat_messages_user_id_company_id_conversation_id_created_at_idx
  ON public.chat_messages(user_id, company_id, conversation_id, created_at);

CREATE OR REPLACE FUNCTION public.match_document_chunks (
  query_embedding vector(3072),
  match_count int default 5,
  filter jsonb default '{}'
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.content,
    jsonb_strip_nulls(
      coalesce(dc.metadata, '{}'::jsonb) ||
      jsonb_build_object(
        'chunk_id', dc.id,
        'user_id', dc.user_id::text,
        'company_id', dc.company_id::text,
        'document_id', dc.document_id::text,
        'chunk_index', dc.chunk_index,
        'page_number', dc.page_number
      )
    ) AS metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks dc
  WHERE dc.embedding IS NOT NULL
    AND (filter->>'user_id' IS NULL OR dc.user_id::text = filter->>'user_id')
    AND (filter->>'company_id' IS NULL OR dc.company_id::text = filter->>'company_id')
    AND (filter->>'document_id' IS NULL OR dc.document_id::text = filter->>'document_id')
    AND coalesce(dc.metadata, '{}'::jsonb) @> (filter - 'user_id' - 'company_id' - 'document_id')
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.match_documents (
  query_embedding vector(3072),
  match_count int default 5,
  filter jsonb default '{}'
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.match_document_chunks(query_embedding, match_count, filter);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.match_document_chunks(vector, integer, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.match_documents(vector, integer, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.match_document_chunks(vector, integer, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_documents(vector, integer, jsonb) TO authenticated, service_role;
