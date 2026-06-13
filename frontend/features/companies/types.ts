export type CompanyRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export type Company = {
  id: string;
  name: string;
  domain: string | null;
  invitationCode: string;
  createdAt: string;
  updatedAt: string;
  role: CompanyRole;
};

export type CompanyMember = {
  id: string;
  companyId: string;
  userId: string;
  role: CompanyRole;
  createdAt: string;
  updatedAt: string;
};

export type CreateCompanyInput = {
  name: string;
  domain?: string;
};
