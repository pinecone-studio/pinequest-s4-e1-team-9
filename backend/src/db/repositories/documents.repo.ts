import type { UserDocument } from '../../generated/prisma/client.js';
import prisma from '../prisma.js';

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

type UserDocumentUpdateData = {
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

  const updateData: UserDocumentUpdateData = {};

  if (data.filename !== undefined) {
    updateData.filename = data.filename.trim();
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  if (Object.prototype.hasOwnProperty.call(data, 'errorMessage')) {
    updateData.errorMessage = data.errorMessage?.trim() || null;
  }

  if (Object.prototype.hasOwnProperty.call(data, 'storagePath')) {
    updateData.storagePath = data.storagePath?.trim() || null;
  }

  const userDocument = await prisma.userDocument.update({
    where: { id: documentId },
    data: updateData,
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
    id: document.id,
    filename: document.filename,
    fileSize: document.fileSize?.toString() ?? null,
    mimeType: document.mimeType,
    status: document.status,
    errorMessage: document.errorMessage,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
};
