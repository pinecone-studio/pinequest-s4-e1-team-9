import { DocumentProcessingError } from '../documents/types.js';
import * as companiesRepo from '../../db/repositories/companies.repo.js';
import type { CompanyRole, CreateCompanyInput } from './types.js';

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

  return companiesRepo.createCompanyForOwner(ownerUserId, {
    name,
    domain: input.domain?.trim() || undefined,
  });
}

export async function listCompanyMembers(companyId: string) {
  return companiesRepo.listCompanyMembers(companyId);
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
