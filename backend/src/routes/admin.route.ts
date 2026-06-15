import type { IncomingMessage, ServerResponse } from 'node:http';
import * as path from 'node:path';
import { env } from '../config/env.js';
import { getAuthenticatedUserId } from '../features/auth/auth.service.js';
import {
  getCompanyAccess,
  requireCompanyAdmin,
  requireCompanyDocumentManager,
} from '../features/companies/authorization.service.js';
import {
  createCompany,
  createAiSetupDraft,
  archiveCompany,
  finalizeAiSetup,
  getAiSetup,
  removeCompanyMember,
  listCompanyMembers,
  listAiDocuments,
  listUserCompanies,
  refreshAiSetupStatusAfterDocumentChange,
  removeAiDocument,
  updateAiSetup,
} from '../features/companies/company.service.js';
import { DocumentProcessingError } from '../features/documents/types.js';
import { ingestUploadedPdf } from '../features/documents/upload.service.js';
import { readJsonBody, sendJson } from '../server/errors.js';
import { enforceRateLimit } from '../server/rate-limit.js';
import type { UpdateAiSetupInput } from '../features/companies/types.js';

const adminCompaniesPath = '/admin/companies';
const adminDraftsPath = '/admin/companies/drafts';
const companyRootPathPattern = /^\/admin\/companies\/([^/]+)$/i;
const companyScopedPathPattern =
  /^\/admin\/companies\/([^/]+)\/(access|documents|members|setup|finalize)$/i;
const companyDocumentPathPattern =
  /^\/admin\/companies\/([^/]+)\/documents\/([^/]+)$/i;
const companyMemberPathPattern =
  /^\/admin\/companies\/([^/]+)\/members\/([^/]+)$/i;
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
  const companyRootMatch = companyRootPathPattern.exec(requestUrl.pathname);
  const documentMatch = companyDocumentPathPattern.exec(requestUrl.pathname);
  const memberMatch = companyMemberPathPattern.exec(requestUrl.pathname);
  const memberRoleMatch = companyMemberRolePathPattern.exec(
    requestUrl.pathname,
  );

  if (
    requestUrl.pathname !== adminCompaniesPath &&
    requestUrl.pathname !== adminDraftsPath &&
    !companyRootMatch &&
    !scopedMatch &&
    !documentMatch &&
    !memberMatch &&
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

    if (requestUrl.pathname === adminDraftsPath && req.method === 'POST') {
      const draft = await createAiSetupDraft(userId);
      sendJson(res, 201, draft, headers);
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

      if (action === 'setup' && req.method === 'GET') {
        const setup = await getAiSetup(userId, companyId);
        sendJson(res, 200, setup, headers);
        return true;
      }

      if (action === 'setup' && req.method === 'PATCH') {
        const body = await readJsonBody<UpdateAiSetupInput>(req, {
          maxBytes: 96 * 1024,
        });
        const setup = await updateAiSetup(userId, companyId, body);
        sendJson(res, 200, setup, headers);
        return true;
      }

      if (action === 'finalize' && req.method === 'POST') {
        const setup = await finalizeAiSetup(userId, companyId);
        sendJson(res, 200, setup, headers);
        return true;
      }

      if (action === 'documents' && req.method === 'POST') {
        await requireCompanyDocumentManager(userId, companyId);
        enforceRateLimit({
          key: `company-upload:${companyId}:${userId}`,
          limit: env.uploadRateLimitPerMinute,
          label: 'company upload',
        });

        let result: Awaited<ReturnType<typeof ingestUploadedPdf>>;

        try {
          result = await ingestUploadedPdf({
            req,
            uploadDir: path.join(process.cwd(), 'uploads'),
            userId,
            companyId,
          });
        } catch (uploadError) {
          await refreshAiSetupStatusAfterDocumentChange(companyId);
          throw uploadError;
        }

        await refreshAiSetupStatusAfterDocumentChange(companyId);

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

      if (action === 'documents' && req.method === 'GET') {
        const documents = await listAiDocuments(userId, companyId);
        sendJson(res, 200, { documents }, headers);
        return true;
      }

      if (action === 'members' && req.method === 'GET') {
        await requireCompanyAdmin(userId, companyId);
        const members = await listCompanyMembers(companyId);
        sendJson(res, 200, { members }, headers);
        return true;
      }

      if (action === 'members' && req.method === 'POST') {
        await requireCompanyAdmin(userId, companyId);
        sendJson(
          res,
          403,
          {
            error:
              'Direct member management is not supported. Share the invitation code instead.',
          },
          headers,
        );
        return true;
      }
    }

    if (documentMatch) {
      const companyId = assertUuid(
        decodePathPart(documentMatch[1]),
        'company id',
      );
      const documentId = assertUuid(
        decodePathPart(documentMatch[2]),
        'document id',
      );

      if (req.method === 'DELETE') {
        await requireCompanyDocumentManager(userId, companyId);
        const document = await removeAiDocument(userId, companyId, documentId);
        sendJson(res, 200, { ok: true, document }, headers);
        return true;
      }
    }

    if (memberMatch && req.method === 'DELETE') {
      const companyId = assertUuid(
        decodePathPart(memberMatch[1]),
        'company id',
      );
      const memberUserId = assertUuid(
        decodePathPart(memberMatch[2]),
        'user id',
      );
      const member = await removeCompanyMember(userId, companyId, memberUserId);
      sendJson(res, 200, { ok: true, member }, headers);
      return true;
    }

    if (companyRootMatch && req.method === 'DELETE') {
      const companyId = assertUuid(
        decodePathPart(companyRootMatch[1]),
        'company id',
      );
      const company = await archiveCompany(userId, companyId);
      sendJson(res, 200, { ok: true, company }, headers);
      return true;
    }

    if (memberRoleMatch && req.method === 'PATCH') {
      const companyId = assertUuid(
        decodePathPart(memberRoleMatch[1]),
        'company id',
      );
      assertUuid(decodePathPart(memberRoleMatch[2]), 'user id');
      await requireCompanyAdmin(userId, companyId);
      sendJson(
        res,
        403,
        { error: 'Company role changes are not supported.' },
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
        : 'Failed to process admin request.';

    if (statusCode >= 500) {
      console.error('Admin route failure:', error);
    }

    sendJson(res, statusCode, { error: clientMessage }, headers);
  }

  return true;
}
