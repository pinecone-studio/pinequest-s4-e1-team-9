import type {
  Company as CompanyBase,
  CompanyRole as CompanyRoleBase,
  CreateCompanyInput as CreateCompanyInputBase,
} from '@/features/companies/types';

export type CompanyRole = CompanyRoleBase;
export type Company = CompanyBase;
export type CreateCompanyInput = CreateCompanyInputBase;

export type AdminUploadResponse = {
  ok?: boolean;
  chunks?: number;
  document?: {
    id: string;
    filename: string;
    status: string;
  };
  error?: string;
};

export type CompanyPermissions = {
  isCompanyOwner: boolean;
  isCompanyAdmin: boolean;
  isCompanyMember: boolean;
  canManageCompany: boolean;
  canUploadCompanyDocuments: boolean;
  canInviteCompanyUsers: boolean;
  canPromoteCompanyUser: boolean;
};

export type CompanyAccess = {
  company: Company;
  membership: {
    id: string;
    companyId: string;
    userId: string;
    role: CompanyRole;
    createdAt: string;
    updatedAt: string;
  };
  permissions: CompanyPermissions;
  error?: string;
};
