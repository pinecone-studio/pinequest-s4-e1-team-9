import type { DocumentInterface } from '@langchain/core/documents';
import { env } from '../../config/env.js';
import { getVectorStore } from './vector-store.js';

type RetrievalOptions = {
  userId: string;
  documentId?: string;
};

export type RetrievedCitation = {
  sourceId: string;
  label: string;
  documentId: string | null;
  chunkId: string | null;
  chunkIndex: number | null;
  pageNumber: number | null;
  filename: string | null;
  preview: string;
};

export type RagContext = {
  context: string;
  citations: RetrievedCitation[];
  sourceCount: number;
  truncated: boolean;
};

function asMetadata(metadata: unknown) {
  return metadata && typeof metadata === 'object'
    ? (metadata as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function trimText(text: string, maxChars: number) {
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxChars - 1)).trim()}...`;
}

function toCitation(doc: DocumentInterface, index: number): RetrievedCitation {
  const metadata = asMetadata(doc.metadata);
  const sourceId = `Source ${index + 1}`;
  const preview = trimText(doc.pageContent, 260);

  return {
    sourceId,
    label: `[${sourceId}]`,
    documentId: stringValue(metadata.document_id),
    chunkId:
      stringValue(metadata.chunk_id) ??
      (metadata.chunk_id == null ? null : String(metadata.chunk_id)),
    chunkIndex: numberValue(metadata.chunk_index),
    pageNumber: numberValue(metadata.page_number),
    filename: stringValue(metadata.filename) ?? stringValue(metadata.source),
    preview,
  };
}

function buildContextFromDocuments(docs: DocumentInterface[]) {
  let remainingBudget = env.maxRetrievedContextChars;
  let truncated = false;
  const contextParts: string[] = [];
  const citations: RetrievedCitation[] = [];

  for (const [index, doc] of docs.entries()) {
    if (remainingBudget <= 0) {
      truncated = true;
      break;
    }

    const citation = toCitation(doc, index);
    const sourceHeader = `${citation.label}${citation.filename ? ` ${citation.filename}` : ''}${citation.pageNumber ? ` page ${citation.pageNumber}` : ''}`;
    const sourceText = trimText(
      doc.pageContent,
      Math.min(env.maxRetrievedSourceChars, remainingBudget),
    );
    const sourceBlock = `${sourceHeader}\n${sourceText}`;

    if (sourceBlock.length > remainingBudget) {
      truncated = true;
    }

    contextParts.push(sourceBlock.slice(0, remainingBudget));
    citations.push(citation);
    remainingBudget -= sourceBlock.length + 2;
  }

  return {
    context: contextParts.join('\n\n'),
    citations,
    sourceCount: citations.length,
    truncated,
  };
}

export async function retrieveRelevantDocuments(
  query: string,
  options: RetrievalOptions,
) {
  if (!options.userId.trim()) {
    throw new Error('Retrieval requires a user id.');
  }

  const filter = {
    user_id: options.userId,
    ...(options.documentId ? { document_id: options.documentId } : {}),
  };

  return (await getVectorStore().similaritySearch(
    query,
    env.retrievalMatchCount,
    filter,
  )) as DocumentInterface[];
}

export async function buildRagContext(
  query: string,
  options: RetrievalOptions,
): Promise<RagContext> {
  const retrievedDocs = await retrieveRelevantDocuments(query, options);

  return buildContextFromDocuments(retrievedDocs);
}
