import * as crypto from 'node:crypto';
import { DocumentProcessingError } from '../documents/types.js';
import * as companiesRepo from '../../db/repositories/companies.repo.js';
import { serializeUserDocument } from '../../db/repositories/documents.repo.js';
import { deleteDocumentFileFromStorage } from '../documents/storage.service.js';
import {
  buildAiSystemInstructions,
  normalizeAiConfiguration,
} from './ai-configuration.js';
import { isCompanyManager } from './roles.js';
import type {
  AiConfiguration,
  AiSetupStatus,
  CompanyRole,
  CreateCompanyInput,
  UpdateAiSetupInput,
} from './types.js';

function generateInvitationCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export async function listUserCompanies(userId: string) {
  return companiesRepo.listUserCompanies(userId);
}

export async function createCompany(
  ownerUserId: string,
  input: CreateCompanyInput,
) {
  const name = input.name?.trim();

  if (!name) {
    throw new DocumentProcessingError('Company name is required.', 400);
  }

  const invitationCode = generateInvitationCode();

  return companiesRepo.createCompanyForOwner(
    ownerUserId,
    {
      name,
      domain: input.domain?.trim() || undefined,
    },
    invitationCode,
  );
}

export async function createAiSetupDraft(ownerUserId: string) {
  return companiesRepo.createCompanyDraftForOwner(
    ownerUserId,
    generateInvitationCode(),
  );
}

async function getEditableCompany(userId: string, companyId: string) {
  const result = await companiesRepo.getCompanyWithMembership(
    userId,
    companyId,
  );

  if (!result || !isCompanyManager(result.membership.role)) {
    throw new DocumentProcessingError('AI admin access required.', 403);
  }

  const setupOwnerId = result.company.setupOwnerId;

  if (
    result.company.setupStatus === 'DRAFT' &&
    setupOwnerId &&
    setupOwnerId !== userId
  ) {
    throw new DocumentProcessingError('Draft owner access required.', 403);
  }

  return result;
}

async function getAccessibleCompany(userId: string, companyId: string) {
  const result = await companiesRepo.getCompanyWithMembership(
    userId,
    companyId,
  );

  if (!result) {
    throw new DocumentProcessingError('AI membership required.', 403);
  }

  return result;
}

function normalizeSetupStep(step: number | undefined) {
  if (step === undefined) {
    return undefined;
  }

  if (!Number.isInteger(step) || step < 0 || step > 6) {
    throw new DocumentProcessingError('Invalid setup step.', 400);
  }

  return step;
}

function normalizeName(name: string | undefined, fallback: string) {
  const normalized = name?.replace(/\s+/g, ' ').trim();
  return normalized || fallback;
}

function mergeConfiguration(
  existing: AiConfiguration | null | undefined,
  input: UpdateAiSetupInput,
  fallbackName: string,
) {
  const merged = {
    ...(existing ?? {}),
    ...(input.aiConfiguration ?? {}),
    ...(input.useCaseType ? { useCaseType: input.useCaseType } : {}),
    ...(input.name ? { aiName: input.name } : {}),
    ...(input.description ? { description: input.description } : {}),
  };
  const companyLike = {
    name: normalizeName(input.name, fallbackName),
    description: input.description ?? null,
    useCaseType:
      input.useCaseType ??
      input.aiConfiguration?.useCaseType ??
      existing?.useCaseType ??
      'custom',
  };

  return normalizeAiConfiguration(merged, companyLike);
}

function statusFromDocuments(
  counts: Awaited<
    ReturnType<typeof companiesRepo.getCompanyDocumentStatusCounts>
  >,
): AiSetupStatus {
  if (counts.readyDocumentCount > 0 && counts.processingDocumentCount === 0) {
    return counts.failedDocumentCount > 0 ? 'NEEDS_ATTENTION' : 'READY';
  }

  if (counts.processingDocumentCount > 0) {
    return 'PROCESSING';
  }

  if (counts.failedDocumentCount > 0) {
    return 'FAILED';
  }

  return 'READY';
}

export async function getAiSetup(userId: string, companyId: string) {
  return getEditableCompany(userId, companyId);
}

export async function updateAiSetup(
  userId: string,
  companyId: string,
  input: UpdateAiSetupInput,
) {
  const { company } = await getEditableCompany(userId, companyId);
  const configuration = mergeConfiguration(
    company.aiConfiguration,
    input,
    company.name,
  );
  const systemInstructions = buildAiSystemInstructions(configuration);
  const nextName = normalizeName(input.name, configuration.aiName);

  if (!nextName) {
    throw new DocumentProcessingError('AI name is required.', 400);
  }

  const updated = await companiesRepo.updateCompanySetup(companyId, {
    name: nextName,
    description: configuration.description,
    domain: input.domain,
    useCaseType: configuration.useCaseType,
    setupStep: normalizeSetupStep(input.setupStep),
    aiConfiguration: configuration,
    systemInstructions,
  });

  return updated;
}

export async function finalizeAiSetup(
  userId: string,
  companyId: string,
) {
  const { company } = await getEditableCompany(userId, companyId);
  const configuration = normalizeAiConfiguration(company.aiConfiguration, {
    name: company.name,
    description: company.description ?? null,
    useCaseType: company.useCaseType ?? 'custom',
  });
  const documentCounts =
    await companiesRepo.getCompanyDocumentStatusCounts(companyId);
  const setupStatus = statusFromDocuments(documentCounts);
  const systemInstructions = buildAiSystemInstructions(configuration);

  return companiesRepo.updateCompanySetup(companyId, {
    name: configuration.aiName,
    description: configuration.description,
    useCaseType: configuration.useCaseType,
    setupStep: 6,
    setupStatus,
    aiConfiguration: configuration,
    systemInstructions,
    finalizedAt: new Date(),
  });
}

export async function refreshAiSetupStatusAfterDocumentChange(
  companyId: string,
) {
  const company = await companiesRepo.getCompanyById(companyId);

  if (!company || company.setupStatus === 'DRAFT') {
    return null;
  }

  const counts = await companiesRepo.getCompanyDocumentStatusCounts(companyId);
  const setupStatus = statusFromDocuments(counts);

  return companiesRepo.updateCompanySetup(companyId, {
    setupStatus,
  });
}

export async function listAiDocuments(userId: string, companyId: string) {
  await getAccessibleCompany(userId, companyId);
  const documents = await companiesRepo.listCompanyDocuments(companyId);
  return documents.map(serializeUserDocument);
}

export async function removeAiDocument(
  userId: string,
  companyId: string,
  documentId: string,
) {
  await getEditableCompany(userId, companyId);
  const document = await companiesRepo.deleteCompanyDocument(
    companyId,
    documentId,
  );

  if (!document) {
    throw new DocumentProcessingError('Document not found.', 404);
  }

  await deleteDocumentFileFromStorage(document.storagePath).catch((error) => {
    console.warn('Failed to delete document storage object:', error);
  });
  await refreshAiSetupStatusAfterDocumentChange(companyId);

  return serializeUserDocument(document);
}

export async function getCompanyBehavior(companyId: string) {
  const behavior = await companiesRepo.getCompanyBehavior(companyId);

  if (!behavior) {
    throw new DocumentProcessingError('AI not found.', 404);
  }

  return behavior;
}

export async function listCompanyMembers(companyId: string) {
  return companiesRepo.listCompanyMembers(companyId);
}

export async function removeCompanyMember(
  ownerUserId: string,
  companyId: string,
  memberUserId: string,
) {
  await getEditableCompany(ownerUserId, companyId);

  if (ownerUserId === memberUserId) {
    throw new DocumentProcessingError('Owners cannot leave their own AI.', 400);
  }

  const removed = await companiesRepo.removeCompanyMember(
    companyId,
    memberUserId,
  );

  if (!removed) {
    throw new DocumentProcessingError('Member not found.', 404);
  }

  return removed;
}

export async function leaveCompany(userId: string, companyId: string) {
  const access = await getAccessibleCompany(userId, companyId);

  if (access.membership.role === 'OWNER') {
    throw new DocumentProcessingError('Owners cannot leave their own AI.', 400);
  }

  const removed = await companiesRepo.removeCompanyMember(companyId, userId);

  if (!removed) {
    throw new DocumentProcessingError('Membership not found.', 404);
  }

  return removed;
}

export async function archiveCompany(ownerUserId: string, companyId: string) {
  await getEditableCompany(ownerUserId, companyId);
  return companiesRepo.archiveCompany(companyId);
}

export async function joinCompanyByCode(
  userId: string,
  invitationCode: string,
) {
  if (!invitationCode?.trim()) {
    throw new DocumentProcessingError('Invitation code is required.', 400);
  }

  const normalizedInvitationCode = invitationCode.trim().toUpperCase();

  try {
    return await companiesRepo.joinCompanyByCode(
      userId,
      normalizedInvitationCode,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Invalid invitation code.'
    ) {
      throw new DocumentProcessingError(error.message, 404);
    }
    throw error;
  }
}

export async function addCompanyMember(companyId: string, userId: string) {
  if (!userId?.trim()) {
    throw new DocumentProcessingError('User id is required.', 400);
  }

  return companiesRepo.addCompanyMember(companyId, userId.trim());
}

export async function updateCompanyMemberRole(
  companyId: string,
  userId: string,
  role: CompanyRole,
) {
  if (role === 'OWNER') {
    throw new DocumentProcessingError(
      'Owner role cannot be assigned from this endpoint.',
      400,
    );
  }

  if (role !== 'ADMIN' && role !== 'MEMBER') {
    throw new DocumentProcessingError('Invalid company role.', 400);
  }

  return companiesRepo.updateCompanyMemberRole(companyId, userId, role);
}
