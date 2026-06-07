import type { UserDocument } from '../generated/prisma/client.js';
import prisma from './prisma.js';

export type UserDocumentStatus = 'processing' | 'ready' | 'error';

type CreateUserDocumentInput = {
  userId: string;
  filename: string;
  fileSize?: bigint | number | null;
  mimeType?: string | null;
  storagePath?: string | null;
};

type UpdateUserDocumentInput = {
  filename?: string;
  status?: UserDocumentStatus;
  errorMessage?: string | null;
  storagePath?: string | null;
};

export const createUserDocument = async (input: CreateUserDocumentInput) => {
  const userDocument = await prisma.userDocument.create({
    data: {
      userId: input.userId,
      filename: input.filename.trim(),
      fileSize: input.fileSize == null ? null : BigInt(input.fileSize),
      mimeType: input.mimeType?.trim() || null,
      storagePath: input.storagePath?.trim() || null,
      status: 'processing',
    },
  });

  return userDocument;
};

export const getUserDocuments = async (userId: string) => {
  const userDocuments = await prisma.userDocument.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return userDocuments;
};

export const getUserDocument = async (userId: string, documentId: string) => {
  const userDocument = await prisma.userDocument.findFirst({
    where: {
      id: documentId,
      userId,
    },
  });

  return userDocument;
};

export const updateUserDocument = async (
  userId: string,
  documentId: string,
  data: UpdateUserDocumentInput,
) => {
  const existingDocument = await getUserDocument(userId, documentId);

  if (!existingDocument) {
    return null;
  }

  const userDocument = await prisma.userDocument.update({
    where: { id: documentId },
    data: {
      filename: data.filename?.trim(),
      status: data.status,
      errorMessage: data.errorMessage?.trim() || null,
      storagePath: data.storagePath?.trim() || null,
    },
  });

  return userDocument;
};

export const updateUserDocumentStatus = async (
  userId: string,
  documentId: string,
  status: UserDocumentStatus,
  errorMessage?: string | null,
) => {
  return updateUserDocument(userId, documentId, {
    status,
    errorMessage: errorMessage ?? null,
  });
};

export const deleteUserDocument = async (
  userId: string,
  documentId: string,
) => {
  const existingDocument = await getUserDocument(userId, documentId);

  if (!existingDocument) {
    return null;
  }

  const userDocument = await prisma.userDocument.delete({
    where: { id: documentId },
  });

  return userDocument;
};

export const serializeUserDocument = (document: UserDocument) => {
  return {
    ...document,
    fileSize: document.fileSize?.toString() ?? null,
  };
};
