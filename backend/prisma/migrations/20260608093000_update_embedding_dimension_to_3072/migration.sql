DROP INDEX IF EXISTS public.document_chunks_embedding_idx;

ALTER TABLE public.document_chunks
  ALTER COLUMN embedding TYPE vector(3072);

DROP FUNCTION IF EXISTS public.match_documents(vector(768), integer, jsonb);
DROP FUNCTION IF EXISTS public.match_document_chunks(vector(768), integer, jsonb);

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
        'document_id', dc.document_id::text,
        'chunk_index', dc.chunk_index,
        'page_number', dc.page_number
      )
    ) AS metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks dc
  WHERE dc.embedding IS NOT NULL
    AND (filter->>'user_id' IS NULL OR dc.user_id::text = filter->>'user_id')
    AND (filter->>'document_id' IS NULL OR dc.document_id::text = filter->>'document_id')
    AND coalesce(dc.metadata, '{}'::jsonb) @> (filter - 'user_id' - 'document_id')
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

GRANT EXECUTE ON FUNCTION public.match_document_chunks(vector, integer, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_documents(vector, integer, jsonb) TO anon, authenticated, service_role;
