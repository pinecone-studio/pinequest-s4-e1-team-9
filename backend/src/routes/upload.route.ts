import type { IncomingMessage, ServerResponse } from 'node:http';
import * as path from 'node:path';
import { env } from '../config/env.js';
import { getAuthenticatedUserId } from '../features/auth/auth.service.js';
import {
  removeTempFile,
  saveUploadedPdfFile,
} from '../features/documents/document.service.js';
import { ingestPDF } from '../features/documents/ingest.service.js';
import { uploadDocumentFileToStorage } from '../features/documents/storage.service.js';
import { DocumentProcessingError } from '../features/documents/types.js';
import { auditFailure } from '../server/audit.js';
import { sendJson } from '../server/errors.js';
import { enforceRateLimit } from '../server/rate-limit.js';

type DocumentsRepository =
  typeof import('../db/repositories/documents.repo.js');

export async function handleUploadRoute(
  req: IncomingMessage,
  res: ServerResponse,
  headers: Record<string, string>,
) {
  const host = req.headers.host || 'localhost';
  const requestUrl = new URL(req.url || '/', `http://${host}`);

  if (req.method !== 'POST' || requestUrl.pathname !== '/upload') {
    return false;
  }

  const uploadDir = path.join(process.cwd(), 'uploads');
  let filepath: string | null = null;
  let documentsRepo: DocumentsRepository | null = null;
  let userDocument: Awaited<
    ReturnType<DocumentsRepository['createUserDocument']>
  > | null = null;
  let userId: string | null = null;

  try {
    userId = await getAuthenticatedUserId(req);
    enforceRateLimit({
      key: `upload:${userId}`,
      limit: env.uploadRateLimitPerMinute,
      label: 'upload',
    });

    documentsRepo = await import('../db/repositories/documents.repo.js');
    const uploadedFile = await saveUploadedPdfFile(req, uploadDir);

    if (!uploadedFile) {
      sendJson(res, 400, { error: 'No file uploaded.' }, headers);
      return true;
    }

    filepath = uploadedFile.filepath;
    userDocument = await documentsRepo.createUserDocument({
      userId,
      filename: uploadedFile.originalName,
      fileSize: uploadedFile.sizeBytes,
      mimeType: uploadedFile.mimeType,
    });

    const storagePath = await uploadDocumentFileToStorage({
      userId,
      documentId: userDocument.id,
      filePath: uploadedFile.filepath,
      mimeType: uploadedFile.mimeType,
    });

    userDocument =
      (await documentsRepo.updateUserDocument(userId, userDocument.id, {
        storagePath,
      })) ?? userDocument;

    const result = await ingestPDF({
      filePath: uploadedFile.filepath,
      userId,
      documentId: userDocument.id,
      filename: uploadedFile.originalName,
    });

    const readyDocument =
      (await documentsRepo.updateUserDocumentStatus(
        userId,
        userDocument.id,
        'ready',
      )) ?? userDocument;

    sendJson(
      res,
      200,
      {
        ok: true,
        document: documentsRepo.serializeUserDocument(readyDocument),
        chunks: result.chunkCount,
      },
      headers,
    );
  } catch (error) {
    const statusCode =
      error instanceof DocumentProcessingError ? error.statusCode : 500;
    const clientMessage =
      error instanceof DocumentProcessingError
        ? error.message
        : 'Failed to process PDF.';
    const auditReason =
      error instanceof Error ? error.message : 'Unknown upload failure.';

    auditFailure({
      action: 'upload.failure',
      route: '/upload',
      statusCode,
      userId,
      reason: auditReason,
    });
    console.error('Upload or ingestion error:', error);

    if (userDocument && userId && documentsRepo) {
      await documentsRepo
        .updateUserDocumentStatus(
          userId,
          userDocument.id,
          'error',
          clientMessage,
        )
        .catch((statusError) => {
          console.error('Failed to mark document as error:', statusError);
        });
    }

    sendJson(
      res,
      statusCode,
      {
        error: clientMessage,
      },
      headers,
    );
  } finally {
    await removeTempFile(filepath);
  }

  return true;
}
