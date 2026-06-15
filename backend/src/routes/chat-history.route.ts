import type { IncomingMessage, ServerResponse } from 'node:http';
import { getAuthenticatedUserId } from '../features/auth/auth.service.js';
import { requireCompanyMember } from '../features/companies/authorization.service.js';
import { DocumentProcessingError } from '../features/documents/types.js';
import { sendJson } from '../server/errors.js';

const conversationsPath = '/chat/conversations';
const conversationMessagesPathPattern =
  /^\/chat\/conversations\/([^/]+)\/messages$/i;
const conversationPathPattern = /^\/chat\/conversations\/([^/]+)$/i;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getConversationId(match: RegExpExecArray | null) {
  const conversationId = match?.[1];

  return conversationId ? decodeURIComponent(conversationId) : null;
}

function assertValidConversationId(conversationId: string | null) {
  if (!conversationId || !uuidPattern.test(conversationId)) {
    throw new DocumentProcessingError('Invalid conversation id.', 400);
  }

  return conversationId;
}

function assertValidCompanyId(companyId: string | null) {
  if (!companyId || !uuidPattern.test(companyId)) {
    throw new DocumentProcessingError('Invalid company id.', 400);
  }

  return companyId;
}

export async function handleChatHistoryRoute(
  req: IncomingMessage,
  res: ServerResponse,
  headers: Record<string, string>,
) {
  const host = req.headers.host || 'localhost';
  const requestUrl = new URL(req.url || '/', `http://${host}`);
  const pathname = requestUrl.pathname;
  const isConversationList =
    req.method === 'GET' && pathname === conversationsPath;
  const messagesMatch = conversationMessagesPathPattern.exec(pathname);
  const conversationMatch = conversationPathPattern.exec(pathname);
  const isConversationMessages = req.method === 'GET' && Boolean(messagesMatch);
  const isConversationDelete =
    req.method === 'DELETE' && Boolean(conversationMatch);

  if (!isConversationList && !isConversationMessages && !isConversationDelete) {
    return false;
  }

  try {
    const userId = await getAuthenticatedUserId(req);
    const companyId = assertValidCompanyId(
      requestUrl.searchParams.get('companyId'),
    );

    await requireCompanyMember(userId, companyId);

    const chatMessagesRepo =
      await import('../db/repositories/chat-messages.repo.js');

    if (isConversationList) {
      const conversations =
        await chatMessagesRepo.listUserConversations(userId, companyId);

      sendJson(res, 200, { conversations }, headers);
      return true;
    }

    if (isConversationMessages) {
      const conversationId = assertValidConversationId(
        getConversationId(messagesMatch),
      );
      const messages = await chatMessagesRepo.getConversationMessages(
        userId,
        companyId,
        conversationId,
      );

      if (!messages.length) {
        throw new DocumentProcessingError('Conversation not found.', 404);
      }

      sendJson(res, 200, { conversationId, messages }, headers);
      return true;
    }

    const conversationId = assertValidConversationId(
      getConversationId(conversationMatch),
    );
    const exists = await chatMessagesRepo.conversationExistsForUser(
      userId,
      companyId,
      conversationId,
    );

    if (!exists) {
      throw new DocumentProcessingError('Conversation not found.', 404);
    }

    const result = await chatMessagesRepo.deleteConversationMessages(
      userId,
      companyId,
      conversationId,
    );

    sendJson(
      res,
      200,
      {
        ok: true,
        deleted: result.count,
      },
      headers,
    );
  } catch (error) {
    const statusCode =
      error instanceof DocumentProcessingError ? error.statusCode : 500;
    const clientMessage =
      error instanceof DocumentProcessingError
        ? error.message
        : 'Failed to process chat history.';

    if (statusCode >= 500) {
      console.error('Chat history route failure:', error);
    } else {
      console.warn(
        JSON.stringify({
          level: 'warn',
          route: pathname,
          statusCode,
          reason: clientMessage,
        }),
      );
    }

    sendJson(res, statusCode, { error: clientMessage }, headers);
  }

  return true;
}
