import type { IncomingMessage, ServerResponse } from 'node:http';
import { getAuthenticatedUserId } from '../features/auth/auth.service.js';
import { requireCompanyMember } from '../features/companies/authorization.service.js';
import { DocumentProcessingError } from '../features/documents/types.js';
import * as companiesRepo from '../db/repositories/companies.repo.js';
import { readJsonBody, sendJson } from '../server/errors.js';

const preferencesPath = '/api/me/preferences';
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeCompanyId(value: unknown) {
  if (value == null || value === '') {
    return null;
  }

  if (typeof value !== 'string' || !uuidPattern.test(value)) {
    throw new DocumentProcessingError('Invalid AI id.', 400);
  }

  return value;
}

async function getVerifiedPreference(userId: string) {
  const preference = await companiesRepo.getUserPreference(userId);
  const selectedId = preference.lastSelectedCompanyId;

  if (!selectedId) {
    return preference;
  }

  if (!uuidPattern.test(selectedId)) {
    return companiesRepo.setLastSelectedCompany(userId, null);
  }

  try {
    await requireCompanyMember(userId, selectedId);
    return preference;
  } catch {
    return companiesRepo.setLastSelectedCompany(userId, null);
  }
}

export async function handlePreferencesRoute(
  req: IncomingMessage,
  res: ServerResponse,
  headers: Record<string, string>,
) {
  const host = req.headers.host || 'localhost';
  const requestUrl = new URL(req.url || '/', `http://${host}`);

  if (requestUrl.pathname !== preferencesPath) {
    return false;
  }

  try {
    const userId = await getAuthenticatedUserId(req);

    if (req.method === 'GET') {
      sendJson(res, 200, await getVerifiedPreference(userId), headers);
      return true;
    }

    if (req.method === 'PATCH') {
      const body = await readJsonBody<{ lastSelectedCompanyId?: unknown }>(
        req,
        { maxBytes: 16 * 1024 },
      );
      const lastSelectedCompanyId = normalizeCompanyId(
        body.lastSelectedCompanyId,
      );

      if (lastSelectedCompanyId) {
        await requireCompanyMember(userId, lastSelectedCompanyId);
      }

      sendJson(
        res,
        200,
        await companiesRepo.setLastSelectedCompany(
          userId,
          lastSelectedCompanyId,
        ),
        headers,
      );
      return true;
    }

    sendJson(res, 405, { error: 'Method not allowed.' }, headers);
  } catch (error) {
    const statusCode =
      error instanceof DocumentProcessingError ? error.statusCode : 500;
    const clientMessage =
      error instanceof DocumentProcessingError
        ? error.message
        : 'Failed to update preferences.';

    if (statusCode >= 500) {
      console.error('Preferences route failure:', error);
    }

    sendJson(res, statusCode, { error: clientMessage }, headers);
  }

  return true;
}
