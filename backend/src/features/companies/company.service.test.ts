import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

const createCompanyDraftForOwner =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getCompanyWithMembership =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const updateCompanySetup =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getCompanyDocumentStatusCounts =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getCompanyById = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const listCompanyDocuments = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const deleteCompanyDocument =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getCompanyBehaviorRepo =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

let createAiSetupDraft: typeof import('./company.service.js').createAiSetupDraft;
let finalizeAiSetup: typeof import('./company.service.js').finalizeAiSetup;
let getAiSetup: typeof import('./company.service.js').getAiSetup;
let updateAiSetup: typeof import('./company.service.js').updateAiSetup;

function editableCompany(role: 'OWNER' | 'ADMIN' | 'MEMBER' = 'OWNER') {
  return {
    company: {
      id: 'company-1',
      name: 'Draft AI',
      domain: null,
      description: null,
      useCaseType: 'custom',
      setupStatus: 'DRAFT',
      setupStep: 2,
      setupOwnerId: 'user-1',
      aiConfiguration: {
        useCaseType: 'custom',
        aiName: 'Draft AI',
        description: 'Draft description',
        purpose: 'Answer document questions.',
        audience: 'Members',
        tone: 'Professional',
        language: 'Auto',
        responseLength: 'Balanced',
        requireCitations: true,
        missingAnswerBehavior: 'Say the documents do not answer.',
        restrictedTopics: [],
        welcomeMessage: 'Ask me about the documents.',
        suggestedQuestions: ['What is covered?'],
      },
      invitationCode: role === 'MEMBER' ? null : 'ABCD1234',
      createdAt: '2026-06-14T00:00:00.000Z',
      updatedAt: '2026-06-14T00:00:00.000Z',
      role,
    },
    membership: {
      id: 'membership-1',
      companyId: 'company-1',
      userId: 'user-1',
      role,
      createdAt: new Date('2026-06-14T00:00:00.000Z'),
      updatedAt: new Date('2026-06-14T00:00:00.000Z'),
    },
  };
}

describe('company setup service', () => {
  beforeAll(async () => {
    jest.doMock('../../db/repositories/companies.repo.js', () => ({
      createCompanyDraftForOwner,
      getCompanyWithMembership,
      updateCompanySetup,
      getCompanyDocumentStatusCounts,
      getCompanyById,
      listCompanyDocuments,
      deleteCompanyDocument,
      getCompanyBehavior: getCompanyBehaviorRepo,
    }));
    jest.doMock('../../db/repositories/documents.repo.js', () => ({
      serializeUserDocument: (document: unknown) => document,
    }));
    ({
      createAiSetupDraft,
      finalizeAiSetup,
      getAiSetup,
      updateAiSetup,
    } = await import('./company.service.js'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a setup draft for an authenticated user', async () => {
    createCompanyDraftForOwner.mockResolvedValue({
      id: 'company-1',
      setupStatus: 'DRAFT',
    });

    await expect(createAiSetupDraft('user-1')).resolves.toEqual({
      id: 'company-1',
      setupStatus: 'DRAFT',
    });
    expect(createCompanyDraftForOwner).toHaveBeenCalledWith(
      'user-1',
      expect.any(String),
    );
  });

  it('does not allow a user to read another user draft', async () => {
    getCompanyWithMembership.mockResolvedValue({
      ...editableCompany('OWNER'),
      company: {
        ...editableCompany('OWNER').company,
        setupOwnerId: 'other-user',
      },
    });

    await expect(getAiSetup('user-1', 'company-1')).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('persists structured configuration and derived instructions', async () => {
    getCompanyWithMembership.mockResolvedValue(editableCompany('OWNER'));
    updateCompanySetup.mockImplementation((_companyId, input) =>
      Promise.resolve({
        id: 'company-1',
        ...(input as Record<string, unknown>),
      }),
    );

    await updateAiSetup('user-1', 'company-1', {
      name: 'Acme HR Assistant',
      useCaseType: 'company_team',
      setupStep: 3,
      aiConfiguration: {
        organizationName: 'Acme',
        purpose: 'Explain HR policies.',
        audience: 'Employees',
      },
    });

    expect(updateCompanySetup).toHaveBeenCalledWith(
      'company-1',
      expect.objectContaining({
        name: 'Acme HR Assistant',
        setupStep: 3,
        aiConfiguration: expect.objectContaining({
          useCaseType: 'company_team',
          organizationName: 'Acme',
          purpose: 'Explain HR policies.',
        }),
        systemInstructions: expect.stringContaining('Acme HR Assistant'),
      }),
    );
  });

  it('finalizes the AI as ready only after a ready document exists', async () => {
    getCompanyWithMembership.mockResolvedValue(editableCompany('OWNER'));
    getCompanyDocumentStatusCounts.mockResolvedValue({
      documentCount: 1,
      readyDocumentCount: 1,
      processingDocumentCount: 0,
      failedDocumentCount: 0,
    });
    updateCompanySetup.mockResolvedValue({ id: 'company-1' });

    await finalizeAiSetup('user-1', 'company-1');

    expect(updateCompanySetup).toHaveBeenCalledWith(
      'company-1',
      expect.objectContaining({
        setupStatus: 'READY',
        finalizedAt: expect.any(Date),
      }),
    );
  });

  it('allows a documentless AI to finalize as ready', async () => {
    getCompanyWithMembership.mockResolvedValue(editableCompany('OWNER'));
    getCompanyDocumentStatusCounts.mockResolvedValue({
      documentCount: 0,
      readyDocumentCount: 0,
      processingDocumentCount: 0,
      failedDocumentCount: 0,
    });
    updateCompanySetup.mockResolvedValue({ id: 'company-1' });

    await finalizeAiSetup('user-1', 'company-1');

    expect(updateCompanySetup).toHaveBeenCalledWith(
      'company-1',
      expect.objectContaining({
        setupStatus: 'READY',
      }),
    );
  });

  it('finalizes failed processing into a recoverable failed state', async () => {
    getCompanyWithMembership.mockResolvedValue(editableCompany('OWNER'));
    getCompanyDocumentStatusCounts.mockResolvedValue({
      documentCount: 1,
      readyDocumentCount: 0,
      processingDocumentCount: 0,
      failedDocumentCount: 1,
    });
    updateCompanySetup.mockResolvedValue({ id: 'company-1' });

    await finalizeAiSetup('user-1', 'company-1');

    expect(updateCompanySetup).toHaveBeenCalledWith(
      'company-1',
      expect.objectContaining({
        setupStatus: 'FAILED',
      }),
    );
  });

  it('does not allow members to edit configuration', async () => {
    getCompanyWithMembership.mockResolvedValue(editableCompany('MEMBER'));

    await expect(
      updateAiSetup('user-1', 'company-1', {
        name: 'Member Edit',
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
