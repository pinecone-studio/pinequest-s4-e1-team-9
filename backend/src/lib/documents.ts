import type {
  Prisma,
  DocumentChunk as Document,
} from '../generated/prisma/client.js';
import prisma from './prisma.js';

type DocumentId = bigint | number;

type CreateDocumentInput = {
  userId: string;
  documentId: string;
  content?: string | null;
  metadata?: Prisma.DocumentChunkUncheckedCreateInput['metadata'];
};

type UpdateDocumentInput = {
  content?: string | null;
  metadata?: Prisma.DocumentChunkUncheckedUpdateInput['metadata'];
};

export const createDocument = async (input: CreateDocumentInput) => {
  const document = await prisma.documentChunk.create({
    data: {
      userId: input.userId,
      documentId: input.documentId,
      content: input.content?.trim() || null,
      metadata: input.metadata,
    },
  });

  return document;
};

export const getDocuments = async (userId: string, documentId?: string) => {
  const documents = await prisma.documentChunk.findMany({
    where: {
      userId,
      documentId,
    },
    orderBy: { id: 'asc' },
  });

  return documents;
};

export const getDocumentById = async (userId: string, id: DocumentId) => {
  const document = await prisma.documentChunk.findFirst({
    where: {
      id: BigInt(id),
      userId,
    },
  });

  return document;
};

export const updateDocument = async (
  userId: string,
  id: DocumentId,
  data: UpdateDocumentInput,
) => {
  const existingDocument = await getDocumentById(userId, id);

  if (!existingDocument) {
    return null;
  }

  const document = await prisma.documentChunk.update({
    where: { id: BigInt(id) },
    data: {
      content: data.content?.trim() || null,
      metadata: data.metadata,
    },
  });

  return document;
};

export const deleteDocument = async (userId: string, id: DocumentId) => {
  const existingDocument = await getDocumentById(userId, id);

  if (!existingDocument) {
    return null;
  }

  const document = await prisma.documentChunk.delete({
    where: { id: BigInt(id) },
  });

  return document;
};

export const deleteDocuments = async (userId: string, documentId?: string) => {
  const documents = await prisma.documentChunk.deleteMany({
    where: {
      userId,
      documentId,
    },
  });

  return documents;
};

export const serializeDocument = (document: Document) => {
  return {
    ...document,
    id: document.id.toString(),
  };
};
