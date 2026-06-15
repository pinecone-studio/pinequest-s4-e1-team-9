import type { IncomingMessage, ServerResponse } from 'node:http';
import { getAuthenticatedUserId } from '../features/auth/auth.service.js';
import { redeemInvitation } from '../features/invitations/invitation.service.js';
import { readJsonBody, sendJson } from '../server/errors.js';
import { DocumentProcessingError } from '../features/documents/types.js';

import {
  leaveCompany,
  listUserCompanies,
} from '../features/companies/company.service.js';

const joinCompanyPath = '/api/companies/join';
const listUserCompaniesPath = '/api/companies';
const leaveCompanyPathPattern = /^\/api\/companies\/([^/]+)\/leave$/i;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function handleCompanyRoute(
  req: IncomingMessage,
  res: ServerResponse,
  headers: Record<string, string>,
) {
  const host = req.headers.host || 'localhost';
  const requestUrl = new URL(req.url || '/', `http://${host}`);
  const leaveMatch = leaveCompanyPathPattern.exec(requestUrl.pathname);

  if (requestUrl.pathname === listUserCompaniesPath && req.method === 'GET') {
    try {
      const userId = await getAuthenticatedUserId(req);
      const companies = await listUserCompanies(userId);
      sendJson(res, 200, companies, headers);
    } catch (error) {
      const statusCode =
        error instanceof DocumentProcessingError ? error.statusCode : 500;
      const clientMessage =
        error instanceof DocumentProcessingError
          ? error.message
          : 'Failed to list companies.';

      if (statusCode >= 500) {
        console.error('Company list failure:', error);
      }

      sendJson(res, statusCode, { error: clientMessage }, headers);
    }
    return true;
  }

  if (leaveMatch) {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed.' }, headers);
      return true;
    }

    try {
      const companyId = decodeURIComponent(leaveMatch[1] ?? '');

      if (!uuidPattern.test(companyId)) {
        throw new DocumentProcessingError('Invalid AI id.', 400);
      }

      const userId = await getAuthenticatedUserId(req);
      const membership = await leaveCompany(userId, companyId);
      sendJson(res, 200, { ok: true, membership }, headers);
    } catch (error) {
      const statusCode =
        error instanceof DocumentProcessingError ? error.statusCode : 500;
      const clientMessage =
        error instanceof DocumentProcessingError
          ? error.message
          : 'Failed to leave AI.';

      if (statusCode >= 500) {
        console.error('Company leave failure:', error);
      }

      sendJson(res, statusCode, { error: clientMessage }, headers);
    }

    return true;
  }

  if (requestUrl.pathname === joinCompanyPath) {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed.' }, headers);
      return true;
    }

    try {
      const userId = await getAuthenticatedUserId(req);
      const body = await readJsonBody<{ invitationCode?: string }>(req, {
        maxBytes: 16 * 1024,
      });

      if (!body.invitationCode) {
        throw new DocumentProcessingError('Invitation code is required.', 400);
      }

      const redemption = await redeemInvitation(userId, body.invitationCode);
      sendJson(res, redemption.alreadyMember ? 200 : 201, redemption, headers);
    } catch (error) {
      const statusCode =
        error instanceof DocumentProcessingError ? error.statusCode : 500;
      const clientMessage =
        error instanceof DocumentProcessingError
          ? error.message
          : 'Failed to join company.';

      if (statusCode >= 500) {
        console.error('Company route failure:', error);
      }

      sendJson(res, statusCode, { error: clientMessage }, headers);
    }

    return true;
  }

  return false;
}
