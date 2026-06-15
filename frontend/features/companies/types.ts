export type CompanyRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type AiSetupStatus =
  | 'DRAFT'
  | 'PROCESSING'
  | 'READY'
  | 'NEEDS_ATTENTION'
  | 'FAILED'
  | 'ARCHIVED';

export type AiConfiguration = {
  useCaseType: string;
  aiName: string;
  description: string;
  organizationName?: string;
  department?: string;
  subject?: string;
  educationLevel?: string;
  productName?: string;
  knowledgeScope?: string;
  purpose: string;
  audience: string;
  tone: string;
  language: string;
  responseLength: string;
  requireCitations: boolean;
  missingAnswerBehavior: string;
  restrictedTopics: string[];
  escalationBehavior?: string;
  welcomeMessage: string;
  suggestedQuestions: string[];
  shouldExplainStepByStep?: boolean;
  canGenerateExamples?: boolean;
  canCreateQuizzes?: boolean;
  avoidGradedAssignments?: boolean;
  answerMode?: string;
  visibility?: string;
};

export type Company = {
  id: string;
  name: string;
  domain: string | null;
  description?: string | null;
  useCaseType?: string;
  setupStatus?: AiSetupStatus;
  setupStep?: number;
  setupOwnerId?: string | null;
  aiConfiguration?: AiConfiguration | null;
  systemInstructions?: string | null;
  finalizedAt?: string | null;
  archivedAt?: string | null;
  documentCount?: number;
  readyDocumentCount?: number;
  processingDocumentCount?: number;
  failedDocumentCount?: number;
  memberCount?: number;
  lastActivityAt?: string | null;
  invitationCode?: string | null;
  createdAt: string;
  updatedAt: string;
  role: CompanyRole;
  invitationId?: string | null;
};

export type CompanyMember = {
  id: string;
  companyId: string;
  userId: string;
  name?: string | null;
  role: CompanyRole;
  invitationId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCompanyInput = {
  name: string;
  domain?: string;
};

export function isCompanyManagerRole(role: CompanyRole | null | undefined) {
  return role === 'OWNER';
}

export function formatCompanyRole(role: CompanyRole | null | undefined) {
  return role === 'OWNER' ? 'Owner' : 'Member';
}
