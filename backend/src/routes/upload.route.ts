import type { IncomingMessage, ServerResponse } from 'node:http';
import * as path from 'node:path';
import { env } from '../config/env.js';
import { getAuthenticatedUserId } from '../features/auth/auth.service.js';
import { DocumentProcessingError } from '../features/documents/types.js';
import { ingestUploadedPdf } from '../features/documents/upload.service.js';
import { auditFailure } from '../server/audit.js';
import { sendJson } from '../server/errors.js';
import { enforceRateLimit } from '../server/rate-limit.js';

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
  let userId: string | null = null;

  try {
    userId = await getAuthenticatedUserId(req);
    enforceRateLimit({
      key: `upload:${userId}`,
      limit: env.uploadRateLimitPerMinute,
      label: 'upload',
    });

    const result = await ingestUploadedPdf({
      req,
      userId,
      uploadDir,
    });

    sendJson(
      res,
      200,
      {
        ok: true,
        document: result.document,
        chunks: result.chunks,
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

    sendJson(
      res,
      statusCode,
      {
        error: clientMessage,
      },
      headers,
    );
  }

  return true;
}
