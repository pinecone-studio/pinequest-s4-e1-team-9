import type { DocumentChunk, Prisma } from '../../generated/prisma/client.js';
import prisma from '../prisma.js';

type DocumentChunkId = bigint | number | string;

type CreateDocumentChunkInput = {
  userId: string;
  documentId: string;
  content?: string | null;
  metadata?: Prisma.DocumentChunkUncheckedCreateInput['metadata'];
  chunkIndex?: number | null;
  pageNumber?: number | null;
};

type UpdateDocumentChunkInput = {
  content?: string | null;
  metadata?: Prisma.DocumentChunkUncheckedUpdateInput['metadata'];
  chunkIndex?: number | null;
  pageNumber?: number | null;
};

function toBigIntId(id: DocumentChunkId) {
  return typeof id === 'bigint' ? id : BigInt(id);
}

export const createDocumentChunk = async (input: CreateDocumentChunkInput) => {
  const chunk = await prisma.documentChunk.create({
    data: {
      userId: input.userId,
      documentId: input.documentId,
      content: input.content?.trim() || null,
      metadata: input.metadata,
      chunkIndex: input.chunkIndex ?? null,
      pageNumber: input.pageNumber ?? null,
    },
  });

  return chunk;
};

export const createDocumentChunks = async (
  inputs: CreateDocumentChunkInput[],
) => {
  if (!inputs.length) {
    return { count: 0 };
  }

  const result = await prisma.documentChunk.createMany({
    data: inputs.map((input) => ({
      userId: input.userId,
      documentId: input.documentId,
      content: input.content?.trim() || null,
      metadata: input.metadata,
      chunkIndex: input.chunkIndex ?? null,
      pageNumber: input.pageNumber ?? null,
    })),
  });

  return result;
};

export const getDocumentChunks = async (
  userId: string,
  documentId?: string,
) => {
  const chunks = await prisma.documentChunk.findMany({
    where: {
      userId,
      documentId,
    },
    orderBy: [{ documentId: 'asc' }, { chunkIndex: 'asc' }, { id: 'asc' }],
  });

  return chunks;
};

export const getDocumentChunkById = async (
  id: DocumentChunkId,
  userId: string,
) => {
  const chunk = await prisma.documentChunk.findFirst({
    where: {
      id: toBigIntId(id),
      userId,
    },
  });

  return chunk;
};

export const updateDocumentChunk = async (
  id: DocumentChunkId,
  data: UpdateDocumentChunkInput,
  userId: string,
) => {
  const existingChunk = await getDocumentChunkById(id, userId);

  if (!existingChunk) {
    return null;
  }

  const chunk = await prisma.documentChunk.update({
    where: { id: toBigIntId(id) },
    data: {
      content: data.content?.trim() || null,
      metadata: data.metadata,
      chunkIndex: data.chunkIndex ?? null,
      pageNumber: data.pageNumber ?? null,
    },
  });

  return chunk;
};

export const deleteDocumentChunk = async (
  id: DocumentChunkId,
  userId: string,
) => {
  const existingChunk = await getDocumentChunkById(id, userId);

  if (!existingChunk) {
    return null;
  }

  const chunk = await prisma.documentChunk.delete({
    where: { id: toBigIntId(id) },
  });

  return chunk;
};

export const deleteDocumentChunks = async (
  userId: string,
  documentId?: string,
) => {
  const result = await prisma.documentChunk.deleteMany({
    where: {
      userId,
      documentId,
    },
  });

  return result;
};

export const serializeDocumentChunk = (chunk: DocumentChunk) => {
  return {
    ...chunk,
    id: chunk.id.toString(),
  };
};
