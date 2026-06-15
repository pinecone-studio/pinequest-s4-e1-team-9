import type {
  AiConfiguration,
  AiSetupStatus,
  Company as CompanyBase,
  CompanyRole as CompanyRoleBase,
  CreateCompanyInput as CreateCompanyInputBase,
} from '@/features/companies/types';

export type CompanyRole = CompanyRoleBase;
export type Company = CompanyBase;
export type CreateCompanyInput = CreateCompanyInputBase;
export type { AiConfiguration, AiSetupStatus };

export type AdminUploadResponse = {
  ok?: boolean;
  chunks?: number;
  document?: {
    id: string;
    filename: string;
    companyId?: string | null;
    fileSize?: string | null;
    mimeType?: string | null;
    status: string;
    errorMessage?: string | null;
    createdAt?: string;
    updatedAt?: string;
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
  canViewInvitationCode: boolean;
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

export type CompanyMemberRecord = {
  id: string;
  companyId: string;
  userId: string;
  name?: string | null;
  role: CompanyRole;
  invitationId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompanyMembersResponse = {
  members?: CompanyMemberRecord[];
  error?: string;
};

export type AiDocument = {
  id: string;
  filename: string;
  companyId: string | null;
  fileSize: string | null;
  mimeType: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AiDocumentsResponse = {
  documents?: AiDocument[];
  error?: string;
};

export type UpdateAiSetupInput = {
  name?: string;
  description?: string | null;
  domain?: string | null;
  useCaseType?: string;
  setupStep?: number;
  aiConfiguration?: Partial<AiConfiguration>;
};
