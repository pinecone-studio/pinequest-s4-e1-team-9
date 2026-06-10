import type { IncomingMessage, ServerResponse } from 'node:http';
import { env } from '../config/env.js';
import { getAuthenticatedUserId } from '../features/auth/auth.service.js';
import { generateChatResponse } from '../features/chat/chat.service.js';
import { validateChatRequestBody } from '../features/chat/validation.js';
import { DocumentProcessingError } from '../features/documents/types.js';
import { auditFailure } from '../server/audit.js';
import { readJsonBody, sendJson } from '../server/errors.js';
import { enforceRateLimit } from '../server/rate-limit.js';

function getMaxChatRequestBytes() {
  return Math.max(
    1_024,
    env.maxChatHistoryMessages * env.maxChatMessageChars * 2,
  );
}

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

  let userId: string | null = null;

  try {
    userId = await getAuthenticatedUserId(req);
    enforceRateLimit({
      key: `chat:${userId}`,
      limit: env.chatRateLimitPerMinute,
      label: 'chat',
    });

    const body = await readJsonBody(req, {
      maxBytes: getMaxChatRequestBytes(),
    });
    const { messages, conversationId } = validateChatRequestBody(body);

    const result = await generateChatResponse(messages, {
      userId,
      conversationId,
    });
    sendJson(res, 200, result, headers);
  } catch (error) {
    const statusCode =
      error instanceof DocumentProcessingError ? error.statusCode : 500;
    const reason =
      error instanceof Error ? error.message : 'Unknown chat failure.';

    auditFailure({
      action: 'chat.failure',
      route: '/chat',
      statusCode,
      userId,
      reason,
    });
    console.error('Chat route failure:', error);
    sendJson(
      res,
      statusCode,
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
