import { embedDocumentChunks } from '../../ai/embeddings.js';
import {
  assertSupabaseServiceRoleConfigured,
  getSupabaseRetriever,
  storeDocumentChunksWithVectors,
} from '../retrieval/vector-store.js';
import { splitPdfDocuments } from './chunk.service.js';
import { loadPdfDocuments } from './pdf.service.js';
import type { IngestPdfInput } from './types.js';

export async function ingestPDF({
  filePath,
  userId,
  documentId,
  filename,
}: IngestPdfInput) {
  assertSupabaseServiceRoleConfigured();

  console.log('Loading local PDF document...');
  const docs = await loadPdfDocuments(filePath);

  console.log('Chunking text down to optimal sizes...');
  const splitDocs = await splitPdfDocuments(docs);

  console.log(`Generating embeddings for ${splitDocs.length} chunks...`);
  const vectors = await embedDocumentChunks(
    splitDocs.map((doc) => doc.pageContent),
  );

  console.log('Sending vectors to Supabase Vector Store...');
  const result = await storeDocumentChunksWithVectors({
    userId,
    documentId,
    filename,
    chunks: splitDocs,
    vectors,
  });

  console.log('Vector embeddings safely stored in Supabase.');

  return {
    retriever: getSupabaseRetriever(userId),
    chunkCount: result.count,
  };
}
