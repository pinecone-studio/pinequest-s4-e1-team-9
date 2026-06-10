-- Supabase Auth owns access decisions from this point forward.
-- Backend ingestion still uses the service role server-side.

REVOKE ALL ON TABLE public.user_documents FROM anon;
REVOKE ALL ON TABLE public.document_chunks FROM anon;
REVOKE ALL ON TABLE public.chat_messages FROM anon;
REVOKE ALL ON SEQUENCE public.document_chunks_id_seq FROM anon;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.document_chunks FROM authenticated;
REVOKE USAGE, SELECT ON SEQUENCE public.document_chunks_id_seq FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_documents TO authenticated;
GRANT SELECT ON TABLE public.document_chunks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_messages TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_documents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.document_chunks TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.document_chunks_id_seq TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_messages TO service_role;

REVOKE EXECUTE ON FUNCTION public.match_document_chunks(vector, integer, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.match_documents(vector, integer, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.match_document_chunks(vector, integer, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_documents(vector, integer, jsonb) TO authenticated, service_role;

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own documents" ON public.user_documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON public.user_documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.user_documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.user_documents;

CREATE POLICY "Users can read own documents"
  ON public.user_documents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents"
  ON public.user_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents"
  ON public.user_documents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own documents"
  ON public.user_documents
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can read chunks through owned documents" ON public.document_chunks;

CREATE POLICY "Users can read chunks through owned documents"
  ON public.document_chunks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_documents ud
      WHERE ud.id = document_chunks.document_id
        AND ud.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can read own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete own chat messages" ON public.chat_messages;

CREATE POLICY "Users can read own chat messages"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chat messages"
  ON public.chat_messages
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own chat messages"
  ON public.chat_messages
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = 'storage'
  ) THEN
    EXECUTE $storage$
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('user-documents', 'user-documents', false)
      ON CONFLICT (id) DO UPDATE SET public = false
    $storage$;

    EXECUTE 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Users can read own document files" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Users can upload own document files" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own document files" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own document files" ON storage.objects';

    EXECUTE $storage$
      CREATE POLICY "Users can read own document files"
        ON storage.objects
        FOR SELECT
        TO authenticated
        USING (
          bucket_id = 'user-documents'
          AND name LIKE auth.uid()::text || '/%'
        )
    $storage$;

    EXECUTE $storage$
      CREATE POLICY "Users can upload own document files"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (
          bucket_id = 'user-documents'
          AND name LIKE auth.uid()::text || '/%'
        )
    $storage$;

    EXECUTE $storage$
      CREATE POLICY "Users can update own document files"
        ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (
          bucket_id = 'user-documents'
          AND name LIKE auth.uid()::text || '/%'
        )
        WITH CHECK (
          bucket_id = 'user-documents'
          AND name LIKE auth.uid()::text || '/%'
        )
    $storage$;

    EXECUTE $storage$
      CREATE POLICY "Users can delete own document files"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (
          bucket_id = 'user-documents'
          AND name LIKE auth.uid()::text || '/%'
        )
    $storage$;
  END IF;
END
$$;
