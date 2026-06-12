import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import type { DocumentInterface } from '@langchain/core/documents';
import { getQueryEmbeddings } from '../../ai/embeddings.js';
import { env, getSupabaseVectorConfig } from '../../config/env.js';
import { getSupabaseServiceRoleClient } from '../../lib/supabase.js';

type StoreDocumentChunksInput = {
  userId: string;
  documentId: string;
  filename: string;
  chunks: DocumentInterface[];
  vectors: number[][];
};

type DocumentChunkInsertRow = {
  user_id: string;
  document_id: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[];
  chunk_index: number;
  page_number: number | null;
};

export function assertSupabaseServiceRoleConfigured() {
  getSupabaseVectorConfig();
}

export function getSupabaseClient() {
  return getSupabaseServiceRoleClient();
}

export function getVectorStore() {
  return new SupabaseVectorStore(getQueryEmbeddings(), {
    client: getSupabaseClient(),
    tableName: 'document_chunks',
    queryName: 'match_documents',
  });
}

function getPageNumber(metadata: Record<string, unknown>) {
  const loc = metadata.loc;

  if (loc && typeof loc === 'object' && 'pageNumber' in loc) {
    const pageNumber = Number((loc as { pageNumber?: unknown }).pageNumber);

    if (Number.isInteger(pageNumber) && pageNumber > 0) {
      return pageNumber;
    }
  }

  return null;
}

function toMetadataObject(metadata: unknown) {
  return metadata && typeof metadata === 'object'
    ? ({ ...(metadata as Record<string, unknown>) } as Record<string, unknown>)
    : {};
}

export async function storeDocumentChunksWithVectors({
  userId,
  documentId,
  filename,
  chunks,
  vectors,
}: StoreDocumentChunksInput) {
  if (chunks.length !== vectors.length) {
    throw new Error(
      `Chunk/vector count mismatch. Got ${chunks.length} chunks and ${vectors.length} vectors.`,
    );
  }

  const rows: DocumentChunkInsertRow[] = chunks.map((chunk, index) => {
    const sourceMetadata = toMetadataObject(chunk.metadata);
    const pageNumber = getPageNumber(sourceMetadata);

    return {
      user_id: userId,
      document_id: documentId,
      content: chunk.pageContent,
      metadata: {
        ...sourceMetadata,
        source: filename,
        filename,
        user_id: userId,
        document_id: documentId,
        chunk_index: index,
        page_number: pageNumber,
      },
      embedding: vectors[index],
      chunk_index: index,
      page_number: pageNumber,
    };
  });

  const { error } = await getSupabaseClient().from('document_chunks').insert(rows);

  if (error) {
    throw new Error(`Failed to store document chunks: ${error.message}`);
  }

  return { count: rows.length };
}
