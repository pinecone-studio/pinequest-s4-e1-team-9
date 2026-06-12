import type { IncomingMessage, ServerResponse } from 'node:http';
import * as path from 'node:path';
import { env } from '../config/env.js';
import { getAuthenticatedUserId } from '../features/auth/auth.service.js';
import {
  getCompanyAccess,
  requireCompanyAdmin,
  requireCompanyDocumentManager,
  requireCompanyOwner,
  requireCompanyUserInviter,
} from '../features/companies/authorization.service.js';
import {
  addCompanyMember,
  createCompany,
  listCompanyMembers,
  listUserCompanies,
  updateCompanyMemberRole,
} from '../features/companies/company.service.js';
import { DocumentProcessingError } from '../features/documents/types.js';
import { ingestUploadedPdf } from '../features/documents/upload.service.js';
import { readJsonBody, sendJson } from '../server/errors.js';
import { enforceRateLimit } from '../server/rate-limit.js';

const adminCompaniesPath = '/admin/companies';
const companyScopedPathPattern =
  /^\/admin\/companies\/([^/]+)\/(access|documents|members)$/i;
const companyMemberRolePathPattern =
  /^\/admin\/companies\/([^/]+)\/members\/([^/]+)\/role$/i;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function decodePathPart(value: string | undefined) {
  return value ? decodeURIComponent(value) : null;
}

function assertUuid(value: string | null, label: string) {
  if (!value || !uuidPattern.test(value)) {
    throw new DocumentProcessingError(`Invalid ${label}.`, 400);
  }

  return value;
}

export async function handleAdminRoute(
  req: IncomingMessage,
  res: ServerResponse,
  headers: Record<string, string>,
) {
  const host = req.headers.host || 'localhost';
  const requestUrl = new URL(req.url || '/', `http://${host}`);
  const scopedMatch = companyScopedPathPattern.exec(requestUrl.pathname);
  const memberRoleMatch = companyMemberRolePathPattern.exec(
    requestUrl.pathname,
  );

  if (
    requestUrl.pathname !== adminCompaniesPath &&
    !scopedMatch &&
    !memberRoleMatch
  ) {
    return false;
  }

  try {
    const userId = await getAuthenticatedUserId(req);

    if (requestUrl.pathname === adminCompaniesPath && req.method === 'GET') {
      const companies = await listUserCompanies(userId);
      sendJson(res, 200, companies, headers);
      return true;
    }

    if (requestUrl.pathname === adminCompaniesPath && req.method === 'POST') {
      const body = await readJsonBody<{ name?: string; domain?: string }>(req, {
        maxBytes: 16 * 1024,
      });
      const company = await createCompany(userId, {
        name: body.name ?? '',
        domain: body.domain,
      });

      sendJson(res, 201, company, headers);
      return true;
    }

    if (scopedMatch) {
      const companyId = assertUuid(
        decodePathPart(scopedMatch[1]),
        'company id',
      );
      const action = scopedMatch[2]?.toLowerCase();

      if (action === 'access' && req.method === 'GET') {
        const access = await getCompanyAccess(userId, companyId);

        if (!access) {
          throw new DocumentProcessingError(
            'Company membership required.',
            403,
          );
        }

        sendJson(res, 200, access, headers);
        return true;
      }

      if (action === 'documents' && req.method === 'POST') {
        await requireCompanyDocumentManager(userId, companyId);
        enforceRateLimit({
          key: `company-upload:${companyId}:${userId}`,
          limit: env.uploadRateLimitPerMinute,
          label: 'company upload',
        });

        const result = await ingestUploadedPdf({
          req,
          uploadDir: path.join(process.cwd(), 'uploads'),
          userId,
          companyId,
        });

        sendJson(
          res,
          200,
          {
            ok: true,
            document: result.document,
            chunks: result.chunks,
          },
          headers,
        );
        return true;
      }

      if (action === 'members' && req.method === 'GET') {
        await requireCompanyAdmin(userId, companyId);
        const members = await listCompanyMembers(companyId);
        sendJson(res, 200, { members }, headers);
        return true;
      }

      if (action === 'members' && req.method === 'POST') {
        await requireCompanyUserInviter(userId, companyId);
        const body = await readJsonBody<{ userId?: string }>(req, {
          maxBytes: 16 * 1024,
        });
        const memberUserId = assertUuid(body.userId ?? null, 'user id');
        const member = await addCompanyMember(companyId, memberUserId);

        sendJson(res, 201, member, headers);
        return true;
      }
    }

    if (memberRoleMatch && req.method === 'PATCH') {
      const companyId = assertUuid(
        decodePathPart(memberRoleMatch[1]),
        'company id',
      );
      const memberUserId = assertUuid(
        decodePathPart(memberRoleMatch[2]),
        'user id',
      );
      await requireCompanyOwner(userId, companyId);

      if (memberUserId === userId) {
        throw new DocumentProcessingError(
          'Users cannot change their own company role.',
          400,
        );
      }

      const body = await readJsonBody<{ role?: string }>(req, {
        maxBytes: 16 * 1024,
      });
      const role = body.role;

      if (role !== 'ADMIN' && role !== 'MEMBER') {
        throw new DocumentProcessingError('Invalid company role.', 400);
      }

      const member = await updateCompanyMemberRole(
        companyId,
        memberUserId,
        role,
      );

      sendJson(res, 200, member, headers);
      return true;
    }

    sendJson(res, 405, { error: 'Method not allowed.' }, headers);
  } catch (error) {
    const statusCode =
      error instanceof DocumentProcessingError ? error.statusCode : 500;
    const clientMessage =
      error instanceof DocumentProcessingError
        ? error.message
        : 'Failed to process admin request.';

    if (statusCode >= 500) {
      console.error('Admin route failure:', error);
    }

    sendJson(res, statusCode, { error: clientMessage }, headers);
  }

  return true;
}
