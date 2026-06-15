import type { IncomingMessage, ServerResponse } from 'node:http';
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

const getAuthenticatedUserId = jest.fn<() => Promise<string>>();
const requireCompanyMember = jest.fn<() => Promise<unknown>>();
const createDocumentPdfSignedUrl = jest.fn<() => Promise<unknown>>();
const getDocumentById = jest.fn<() => Promise<unknown>>();

let handleDocumentPdfUrlRoute: typeof import(
  './document.route.js'
).handleDocumentPdfUrlRoute;

const documentId = '00000000-0000-4000-8000-000000000002';

function createRequest(pathname: string): IncomingMessage {
  return {
    method: 'GET',
    url: pathname,
    headers: { host: 'localhost' },
  } as IncomingMessage;
}

function createResponse() {
  let body = '';
  const writeHead = jest.fn();
  const end = jest.fn((payload?: string) => {
    body = payload ?? '';
  });

  return {
    res: { writeHead, end } as unknown as ServerResponse,
    writeHead,
    get body() {
      return body;
    },
  };
}

describe('document PDF URL route', () => {
  beforeAll(async () => {
    jest.doMock('../features/auth/auth.service.js', () => ({
      getAuthenticatedUserId,
    }));
    jest.doMock('../features/companies/authorization.service.js', () => ({
      requireCompanyMember,
    }));
    jest.doMock('../features/documents/storage.service.js', () => ({
      createDocumentPdfSignedUrl,
    }));
    jest.doMock('../db/repositories/documents.repo.js', () => ({
      getDocumentById,
    }));
    ({ handleDocumentPdfUrlRoute } = await import('./document.route.js'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    getAuthenticatedUserId.mockResolvedValue('member-1');
    createDocumentPdfSignedUrl.mockResolvedValue({
      url: 'https://storage.test/signed.pdf',
      expiresIn: 60,
    });
  });

  it('allows any workspace member to access a company document PDF link', async () => {
    getDocumentById.mockResolvedValue({
      id: documentId,
      userId: 'uploader-1',
      companyId: 'company-1',
      storagePath: 'company-1/source.pdf',
    });
    requireCompanyMember.mockResolvedValue({});
    const response = createResponse();

    const handled = await handleDocumentPdfUrlRoute(
      createRequest(`/documents/${documentId}/pdf-url`),
      response.res,
      {},
    );

    expect(handled).toBe(true);
    expect(requireCompanyMember).toHaveBeenCalledWith('member-1', 'company-1');
    expect(createDocumentPdfSignedUrl).toHaveBeenCalledWith(
      'company-1/source.pdf',
    );
    expect(response.writeHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({ 'Content-Type': 'application/json' }),
    );
    expect(JSON.parse(response.body)).toEqual({
      url: 'https://storage.test/signed.pdf',
      expiresIn: 60,
    });
  });

  it('does not expose personal legacy documents owned by another user', async () => {
    getDocumentById.mockResolvedValue({
      id: documentId,
      userId: 'other-user',
      companyId: null,
      storagePath: 'legacy/source.pdf',
    });
    const response = createResponse();

    await handleDocumentPdfUrlRoute(
      createRequest(`/documents/${documentId}/pdf-url`),
      response.res,
      {},
    );

    expect(requireCompanyMember).not.toHaveBeenCalled();
    expect(createDocumentPdfSignedUrl).not.toHaveBeenCalled();
    expect(response.writeHead).toHaveBeenCalledWith(
      404,
      expect.objectContaining({ 'Content-Type': 'application/json' }),
    );
    expect(JSON.parse(response.body)).toEqual({
      error: 'Document not found.',
    });
  });
});
