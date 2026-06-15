import type { IncomingMessage, ServerResponse } from 'node:http';
import { env } from '../config/env.js';
import { getAuthenticatedUserId } from '../features/auth/auth.service.js';
import {
  createInvitation,
  getActiveInvitation,
  previewInvitation,
  redeemInvitation,
  revokeInvitation,
} from '../features/invitations/invitation.service.js';
import { DocumentProcessingError } from '../features/documents/types.js';
import { readJsonBody, sendJson } from '../server/errors.js';
import { enforceRateLimit } from '../server/rate-limit.js';

const companyInvitePathPattern = /^\/api\/companies\/([^/]+)\/invite$/i;
const invitePreviewPath = '/api/invites/preview';
const inviteRedeemPath = '/api/invites/redeem';
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getRemoteKey(req: IncomingMessage) {
  return req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()
    || req.socket.remoteAddress
    || 'unknown';
}

function assertUuid(value: string | undefined) {
  const decoded = value ? decodeURIComponent(value) : '';

  if (!uuidPattern.test(decoded)) {
    throw new DocumentProcessingError('Invalid AI id.', 400);
  }

  return decoded;
}

async function readInviteCode(req: IncomingMessage) {
  const body = await readJsonBody<{ code?: string; invitationCode?: string }>(
    req,
    {
      maxBytes: 16 * 1024,
    },
  );
  const code = body.code ?? body.invitationCode ?? '';

  if (!code.trim()) {
    throw new DocumentProcessingError('Invitation code is required.', 400);
  }

  return code;
}

export async function handleInvitationRoute(
  req: IncomingMessage,
  res: ServerResponse,
  headers: Record<string, string>,
) {
  const host = req.headers.host || 'localhost';
  const requestUrl = new URL(req.url || '/', `http://${host}`);
  const companyInviteMatch = companyInvitePathPattern.exec(requestUrl.pathname);
  const isInvitePreview =
    requestUrl.pathname === invitePreviewPath && req.method === 'POST';
  const isInviteRedeem =
    requestUrl.pathname === inviteRedeemPath && req.method === 'POST';

  if (!companyInviteMatch && !isInvitePreview && !isInviteRedeem) {
    return false;
  }

  try {
    if (companyInviteMatch) {
      const userId = await getAuthenticatedUserId(req);
      const companyId = assertUuid(companyInviteMatch[1]);

      if (req.method === 'GET') {
        sendJson(
          res,
          200,
          await getActiveInvitation(userId, companyId),
          headers,
        );
        return true;
      }

      if (req.method === 'POST') {
        sendJson(res, 201, await createInvitation(userId, companyId), headers);
        return true;
      }

      if (req.method === 'DELETE') {
        sendJson(res, 200, await revokeInvitation(userId, companyId), headers);
        return true;
      }

      sendJson(res, 405, { error: 'Method not allowed.' }, headers);
      return true;
    }

    enforceRateLimit({
      key: `invite:${getRemoteKey(req)}`,
      limit: env.inviteRedeemRateLimitPerMinute,
      label: 'invite',
    });

    const code = await readInviteCode(req);

    if (isInvitePreview) {
      sendJson(res, 200, await previewInvitation(code), headers);
      return true;
    }

    const userId = await getAuthenticatedUserId(req);
    sendJson(res, 200, await redeemInvitation(userId, code), headers);
  } catch (error) {
    const statusCode =
      error instanceof DocumentProcessingError ? error.statusCode : 500;
    const clientMessage =
      error instanceof DocumentProcessingError
        ? error.message
        : 'Failed to process invitation.';

    if (statusCode >= 500) {
      console.error('Invitation route failure:', error);
    }

    sendJson(res, statusCode, { error: clientMessage }, headers);
  }

  return true;
}
