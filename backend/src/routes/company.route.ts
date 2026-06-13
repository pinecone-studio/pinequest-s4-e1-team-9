import type { IncomingMessage, ServerResponse } from 'node:http';
import { getAuthenticatedUserId } from '../features/auth/auth.service.js';
import { joinCompanyByCode } from '../features/companies/company.service.js';
import { readJsonBody, sendJson } from '../server/errors.js';
import { DocumentProcessingError } from '../features/documents/types.js';

import { listUserCompanies } from '../features/companies/company.service.js';

const joinCompanyPath = '/api/companies/join';
const listUserCompaniesPath = '/api/companies';

export async function handleCompanyRoute(
  req: IncomingMessage,
  res: ServerResponse,
  headers: Record<string, string>,
) {
  const host = req.headers.host || 'localhost';
  const requestUrl = new URL(req.url || '/', `http://${host}`);

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

      const membership = await joinCompanyByCode(userId, body.invitationCode);
      sendJson(res, 201, membership, headers);
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
