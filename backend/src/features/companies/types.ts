export type CompanyRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export type Company = {
  id: string;
  name: string;
  domain: string | null;
  createdAt: string;
  updatedAt?: string;
  role?: CompanyRole;
};

export type CreateCompanyInput = {
  name: string;
  domain?: string;
};

export type CompanyMember = {
  id: string;
  companyId: string;
  userId: string;
  role: CompanyRole;
  createdAt: string;
  updatedAt: string;
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
