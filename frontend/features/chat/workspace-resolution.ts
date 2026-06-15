import type { Company } from '@/features/companies/types';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ChatWorkspaceResolution =
  | {
      status: 'selected';
      company: Company;
      shouldPersist: boolean;
      shouldClearStaleSelection: boolean;
    }
  | {
      status: 'none';
      shouldClearStaleSelection: boolean;
    };

export function isValidCompanyId(value: string | null | undefined) {
  return typeof value === 'string' && uuidPattern.test(value);
}

function companyTime(company: Company) {
  const value = company.lastActivityAt ?? company.updatedAt ?? company.createdAt;
  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : 0;
}

function isAccessibleActiveCompany(company: Company) {
  return Boolean(company.id) && company.setupStatus !== 'ARCHIVED';
}

export function resolveChatWorkspace(
  companies: Company[],
  lastSelectedCompanyId: string | null,
): ChatWorkspaceResolution {
  const activeCompanies = companies.filter(isAccessibleActiveCompany);
  const saved =
    lastSelectedCompanyId && isValidCompanyId(lastSelectedCompanyId)
      ? activeCompanies.find((company) => company.id === lastSelectedCompanyId)
      : null;

  if (saved) {
    return {
      status: 'selected',
      company: saved,
      shouldPersist: false,
      shouldClearStaleSelection: false,
    };
  }

  const fallback =
    [...activeCompanies].sort(
      (left, right) => companyTime(right) - companyTime(left),
    )[0] ?? null;

  if (fallback) {
    return {
      status: 'selected',
      company: fallback,
      shouldPersist: fallback.id !== lastSelectedCompanyId,
      shouldClearStaleSelection: Boolean(lastSelectedCompanyId),
    };
  }

  return {
    status: 'none',
    shouldClearStaleSelection: Boolean(lastSelectedCompanyId),
  };
}
