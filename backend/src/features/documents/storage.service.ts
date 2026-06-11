import * as fs from 'node:fs';
import { env } from '../../config/env.js';
import { getSupabaseServiceRoleClient } from '../../lib/supabase.js';
import { DocumentProcessingError } from './types.js';

type UploadDocumentFileInput = {
  userId: string;
  documentId: string;
  filePath: string;
  mimeType: string;
};

const originalPdfFilename = 'original.pdf';
const signedUrlExpiresInSeconds = 10 * 60;

function getOriginalPdfStoragePath(userId: string, documentId: string) {
  return `${userId}/${documentId}/${originalPdfFilename}`;
}

export async function uploadDocumentFileToStorage({
  userId,
  documentId,
  filePath,
  mimeType,
}: UploadDocumentFileInput) {
  const fileBuffer = await fs.promises.readFile(filePath);
  const storagePath = getOriginalPdfStoragePath(userId, documentId);
  const { error } = await getSupabaseServiceRoleClient()
    .storage.from(env.supabaseStorageBucket)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType || 'application/pdf',
      upsert: false,
    });

  if (error) {
    console.error('Failed to store uploaded PDF:', error);
    throw new DocumentProcessingError(
      'We could not save the original PDF. Please try again.',
      502,
    );
  }

  return storagePath;
}

export async function createDocumentPdfSignedUrl(storagePath: string) {
  const normalizedStoragePath = storagePath.trim();

  if (!normalizedStoragePath) {
    throw new DocumentProcessingError(
      'The original PDF is not available for this document.',
      404,
    );
  }

  const { data, error } = await getSupabaseServiceRoleClient()
    .storage.from(env.supabaseStorageBucket)
    .createSignedUrl(normalizedStoragePath, signedUrlExpiresInSeconds);

  if (error || !data?.signedUrl) {
    console.error('Failed to create document PDF signed URL:', error);
    throw new DocumentProcessingError(
      'We could not create a secure PDF link. Please try again.',
      502,
    );
  }

  return {
    signedUrl: data.signedUrl,
  };
}
