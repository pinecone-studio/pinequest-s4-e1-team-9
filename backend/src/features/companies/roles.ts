import type { CompanyRole } from './types.js';

export function isCompanyManager(role: CompanyRole | null | undefined) {
  return role === 'OWNER';
}

export function toCompanyRoleLabel(role: CompanyRole | null | undefined) {
  return role === 'OWNER' ? 'Owner' : 'Member';
}
