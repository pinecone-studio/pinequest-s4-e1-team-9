import { DocumentProcessingError } from '../documents/types.js';
import * as companiesRepo from '../../db/repositories/companies.repo.js';
import { isCompanyManager } from './roles.js';
import type { CompanyPermissions, CompanyRole } from './types.js';
export { isCompanyManager } from './roles.js';

function permissionsForRole(role: CompanyRole | null): CompanyPermissions {
  const isCompanyOwner = role === 'OWNER';
  const isCompanyAdmin = isCompanyManager(role);
  const isCompanyMember = Boolean(role);

  return {
    isCompanyOwner,
    isCompanyAdmin,
    isCompanyMember,
    canManageCompany: isCompanyAdmin,
    canUploadCompanyDocuments: isCompanyAdmin,
    canInviteCompanyUsers: isCompanyAdmin,
    canPromoteCompanyUser: false,
    canViewInvitationCode: isCompanyAdmin,
  };
}

export async function getCompanyAccess(userId: string, companyId: string) {
  const result = await companiesRepo.getCompanyWithMembership(
    userId,
    companyId,
  );

  if (!result) {
    return null;
  }

  return {
    ...result,
    permissions: permissionsForRole(result.membership.role),
  };
}

export async function isCompanyMember(userId: string, companyId: string) {
  const access = await getCompanyAccess(userId, companyId);
  return Boolean(access?.permissions.isCompanyMember);
}

export async function isCompanyAdmin(userId: string, companyId: string) {
  const access = await getCompanyAccess(userId, companyId);
  return Boolean(access?.permissions.isCompanyAdmin);
}

export async function isCompanyOwner(userId: string, companyId: string) {
  const access = await getCompanyAccess(userId, companyId);
  return Boolean(access?.permissions.isCompanyOwner);
}

export async function canManageCompany(userId: string, companyId: string) {
  const access = await getCompanyAccess(userId, companyId);
  return Boolean(access?.permissions.canManageCompany);
}

export async function canUploadCompanyDocuments(
  userId: string,
  companyId: string,
) {
  const access = await getCompanyAccess(userId, companyId);
  return Boolean(access?.permissions.canUploadCompanyDocuments);
}

export async function canInviteCompanyUsers(userId: string, companyId: string) {
  const access = await getCompanyAccess(userId, companyId);
  return Boolean(access?.permissions.canInviteCompanyUsers);
}

export async function canPromoteCompanyUser(userId: string, companyId: string) {
  const access = await getCompanyAccess(userId, companyId);
  return Boolean(access?.permissions.canPromoteCompanyUser);
}

export async function requireCompanyMember(userId: string, companyId: string) {
  const access = await getCompanyAccess(userId, companyId);

  if (!access?.permissions.isCompanyMember) {
    throw new DocumentProcessingError('AI membership required.', 403);
  }

  return access;
}

export async function requireCompanyAdmin(userId: string, companyId: string) {
  const access = await getCompanyAccess(userId, companyId);

  if (!access?.permissions.canManageCompany) {
    throw new DocumentProcessingError('AI owner access required.', 403);
  }

  return access;
}

export async function requireCompanyDocumentManager(
  userId: string,
  companyId: string,
) {
  const access = await getCompanyAccess(userId, companyId);

  if (!access?.permissions.canUploadCompanyDocuments) {
    throw new DocumentProcessingError(
      'AI owner document access required.',
      403,
    );
  }

  return access;
}

export async function requireCompanyUserInviter(
  userId: string,
  companyId: string,
) {
  const access = await getCompanyAccess(userId, companyId);

  if (!access?.permissions.canInviteCompanyUsers) {
    throw new DocumentProcessingError('AI owner invite access required.', 403);
  }

  return access;
}

export async function requireCompanyOwner(userId: string, companyId: string) {
  const access = await getCompanyAccess(userId, companyId);

  if (!access?.permissions.isCompanyOwner) {
    throw new DocumentProcessingError('AI owner access required.', 403);
  }

  return access;
}
