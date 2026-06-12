export type CompanyRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export type Company = {
  id: string;
  name: string;
  domain: string | null;
  createdAt: string;
  updatedAt: string;
  role: CompanyRole;
};

export type CreateCompanyInput = {
  name: string;
  domain?: string;
};

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
