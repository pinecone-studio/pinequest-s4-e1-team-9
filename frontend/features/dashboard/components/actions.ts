import type { Company } from '@/features/companies/types';
import { isAdminRole } from './presentation';

export type AiRecordAction =
  | 'continue-setup'
  | 'open-chat'
  | 'manage';

export function getAiRecordActions(company: Company): AiRecordAction[] {
  const admin = isAdminRole(company);
  const draft = company.setupStatus === 'DRAFT';
  const actions: AiRecordAction[] = [];

  if (draft && admin) {
    actions.push('continue-setup');
  } else {
    actions.push('open-chat');
  }

  if (admin && !draft) {
    actions.push('manage');
  }

  return actions;
}
