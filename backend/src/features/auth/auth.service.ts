import type { IncomingMessage } from 'node:http';
import { getSupabaseAuthClient } from '../../lib/supabase.js';
import { DocumentProcessingError } from '../documents/types.js';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getSingleHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getBearerToken(req: IncomingMessage) {
  const authorization = getSingleHeaderValue(req.headers.authorization)?.trim();

  if (!authorization) {
    throw new DocumentProcessingError('Authentication required.', 401);
  }

  const [scheme, token] = authorization.split(/\s+/, 2);

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw new DocumentProcessingError(
      'Authentication must use a Bearer token.',
      401,
    );
  }

  return token;
}

export async function getAuthenticatedUserId(req: IncomingMessage) {
  const token = getBearerToken(req);
  const { data, error } = await getSupabaseAuthClient().auth.getUser(token);
  const userId = data.user?.id;

  if (error || !userId) {
    throw new DocumentProcessingError('Invalid or expired session.', 401);
  }

  if (!uuidPattern.test(userId)) {
    throw new DocumentProcessingError('Invalid authenticated user id.', 401);
  }

  return userId;
}
