import * as fs from 'node:fs';
import * as path from 'node:path';
import { env } from '../../config/env.js';
import { getSupabaseServiceRoleClient } from '../../lib/supabase.js';

type UploadDocumentFileInput = {
  userId: string;
  documentId: string;
  filePath: string;
  filename: string;
  mimeType: string;
};

function toSafeStorageSegment(value: string) {
  return (
    value
      .trim()
      .replace(/[/\\]/g, '-')
      .replace(/[^\w.\- ]+/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 120) || 'document.pdf'
  );
}

export async function uploadDocumentFileToStorage({
  userId,
  documentId,
  filePath,
  filename,
  mimeType,
}: UploadDocumentFileInput) {
  const fileBuffer = await fs.promises.readFile(filePath);
  const extension = path.extname(filename) || '.pdf';
  const safeFilename = toSafeStorageSegment(filename).endsWith(extension)
    ? toSafeStorageSegment(filename)
    : `${toSafeStorageSegment(filename)}${extension}`;
  const storagePath = `${userId}/${documentId}/${safeFilename}`;
  const { error } = await getSupabaseServiceRoleClient()
    .storage.from(env.supabaseStorageBucket)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to store uploaded PDF: ${error.message}`);
  }

  return storagePath;
}
