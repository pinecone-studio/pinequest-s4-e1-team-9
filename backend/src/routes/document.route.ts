import type { IncomingMessage, ServerResponse } from 'node:http';
import { getAuthenticatedUserId } from '../features/auth/auth.service.js';
import { createDocumentPdfSignedUrl } from '../features/documents/storage.service.js';
import { DocumentProcessingError } from '../features/documents/types.js';
import { sendJson } from '../server/errors.js';

const documentPdfUrlPathPattern = /^\/documents\/([^/]+)\/pdf-url$/i;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getDocumentIdFromPath(pathname: string) {
  const documentId = documentPdfUrlPathPattern.exec(pathname)?.[1];
  return documentId ? decodeURIComponent(documentId) : null;
}

export async function handleDocumentPdfUrlRoute(
  req: IncomingMessage,
  res: ServerResponse,
  headers: Record<string, string>,
) {
  const host = req.headers.host || 'localhost';
  const requestUrl = new URL(req.url || '/', `http://${host}`);
  const documentId = getDocumentIdFromPath(requestUrl.pathname);

  if (req.method !== 'GET' || !documentId) {
    return false;
  }

  try {
    if (!uuidPattern.test(documentId)) {
      throw new DocumentProcessingError('Invalid document id.', 400);
    }

    const userId = await getAuthenticatedUserId(req);
    const { getUserDocument } = await import('../db/repositories/documents.repo.js');
    const document = await getUserDocument(userId, documentId);

    if (!document) {
      throw new DocumentProcessingError('Document not found.', 404);
    }

    if (!document.storagePath) {
      throw new DocumentProcessingError('The original PDF is not available for this document.', 404);
    }

    const signedUrl = await createDocumentPdfSignedUrl(document.storagePath);
    sendJson(res, 200, signedUrl, headers);
  } catch (error) {
    const statusCode = error instanceof DocumentProcessingError ? error.statusCode : 500;
    const clientMessage = error instanceof DocumentProcessingError ? error.message : 'Failed to create PDF link.';
    console.error('Document PDF URL route failure:', error);
    sendJson(res, statusCode, { error: clientMessage }, headers);
  }

  return true;
}
