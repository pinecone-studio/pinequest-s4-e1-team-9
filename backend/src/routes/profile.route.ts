import type { IncomingMessage, ServerResponse } from 'node:http';
import { getAuthenticatedUser } from '../features/auth/auth.service.js';
import {
  ensureUserProfile,
  updateCurrentUserProfile,
} from '../features/profiles/profile.service.js';
import { DocumentProcessingError } from '../features/documents/types.js';
import { readJsonBody, sendJson } from '../server/errors.js';

const profilePath = '/api/me/profile';

export async function handleProfileRoute(
  req: IncomingMessage,
  res: ServerResponse,
  headers: Record<string, string>,
) {
  const host = req.headers.host || 'localhost';
  const requestUrl = new URL(req.url || '/', `http://${host}`);

  if (requestUrl.pathname !== profilePath) {
    return false;
  }

  try {
    const user = await getAuthenticatedUser(req);

    if (req.method === 'GET') {
      const profile = await ensureUserProfile(user);
      sendJson(res, 200, { profile }, headers);
      return true;
    }

    if (req.method === 'PATCH') {
      const body = await readJsonBody<{ name?: unknown }>(req, {
        maxBytes: 16 * 1024,
      });
      const profile = await updateCurrentUserProfile(user, body.name);
      sendJson(res, 200, { profile }, headers);
      return true;
    }

    sendJson(res, 405, { error: 'Method not allowed.' }, headers);
  } catch (error) {
    const statusCode =
      error instanceof DocumentProcessingError ? error.statusCode : 500;
    const clientMessage =
      error instanceof DocumentProcessingError
        ? error.message
        : 'Failed to process profile request.';

    if (statusCode >= 500) {
      console.error('Profile route failure:', error);
    }

    sendJson(res, statusCode, { error: clientMessage }, headers);
  }

  return true;
}
