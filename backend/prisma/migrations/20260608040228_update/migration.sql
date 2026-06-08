-- Preserve already-ingested vectors while renaming the table to its real role.
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_document_id_fkey";
ALTER TABLE "documents" RENAME TO "document_chunks";
ALTER SEQUENCE IF EXISTS "documents_id_seq" RENAME TO "document_chunks_id_seq";
ALTER TABLE "document_chunks" RENAME CONSTRAINT "documents_pkey" TO "document_chunks_pkey";
ALTER INDEX IF EXISTS "documents_user_id_idx" RENAME TO "document_chunks_user_id_idx";
ALTER INDEX IF EXISTS "documents_document_id_idx" RENAME TO "document_chunks_document_id_idx";
ALTER INDEX IF EXISTS "documents_user_id_document_id_idx" RENAME TO "document_chunks_user_id_document_id_idx";

ALTER TABLE "document_chunks"
  ADD COLUMN IF NOT EXISTS "chunk_index" INTEGER,
  ADD COLUMN IF NOT EXISTS "page_number" INTEGER,
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "embedding" TYPE vector(1536);

CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "conversation_id" UUID,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "document_chunks_user_id_idx" ON "document_chunks"("user_id");
CREATE INDEX IF NOT EXISTS "document_chunks_document_id_idx" ON "document_chunks"("document_id");
CREATE INDEX IF NOT EXISTS "document_chunks_user_id_document_id_idx" ON "document_chunks"("user_id", "document_id");
CREATE INDEX IF NOT EXISTS "document_chunks_embedding_idx" ON "document_chunks" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);
CREATE INDEX "chat_messages_user_id_idx" ON "chat_messages"("user_id");
CREATE INDEX "chat_messages_user_id_created_at_idx" ON "chat_messages"("user_id", "created_at");
CREATE INDEX "chat_messages_user_id_conversation_id_created_at_idx" ON "chat_messages"("user_id", "conversation_id", "created_at");

ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "user_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(1536),
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
  FROM document_chunks dc
  WHERE dc.embedding IS NOT NULL
    AND (filter->>'user_id' IS NULL OR dc.user_id::text = filter->>'user_id')
    AND (filter->>'document_id' IS NULL OR dc.document_id::text = filter->>'document_id')
    AND coalesce(dc.metadata, '{}'::jsonb) @> (filter - 'user_id' - 'document_id')
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
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
  FROM match_document_chunks(query_embedding, match_count, filter);
END;
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.document_chunks TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.document_chunks_id_seq TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_messages TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_document_chunks(vector, integer, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_documents(vector, integer, jsonb) TO anon, authenticated;
