import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  generateChatResponse,
  isChatMessage,
} from '../features/chat/chat.service.js';
import { getRequestUserId } from '../features/documents/document.service.js';
import { DocumentProcessingError } from '../features/documents/types.js';
import { readJsonBody, sendJson } from '../server/errors.js';

export async function handleChatRoute(
  req: IncomingMessage,
  res: ServerResponse,
  headers: Record<string, string>,
) {
  const host = req.headers.host || 'localhost';
  const requestUrl = new URL(req.url || '/', `http://${host}`);

  if (req.method !== 'POST' || requestUrl.pathname !== '/chat') {
    return false;
  }

  try {
    const userId = getRequestUserId(req);
    const body = await readJsonBody<{ messages?: unknown }>(req);
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (!messages.length || !messages.every(isChatMessage)) {
      sendJson(res, 400, { error: 'Invalid messages payload.' }, headers);
      return true;
    }

    const result = await generateChatResponse(messages, { userId });
    sendJson(res, 200, result, headers);
  } catch (error) {
    console.error(error);
    sendJson(
      res,
      error instanceof DocumentProcessingError ? error.statusCode : 500,
      {
        error:
          error instanceof DocumentProcessingError
            ? error.message
            : 'Failed to generate response.',
      },
      headers,
    );
  }

  return true;
}
