import type { Company } from '@/features/companies/types';
import { getAiRecordActions } from './actions';

function company(overrides: Partial<Company>): Company {
  return {
    id: 'company-1',
    name: 'People Assistant',
    domain: null,
    createdAt: '2026-06-14T00:00:00.000Z',
    updatedAt: '2026-06-14T00:00:00.000Z',
    role: 'MEMBER',
    setupStatus: 'READY',
    ...overrides,
  };
}

describe('dashboard AI record actions', () => {
  it('does not treat legacy Admin drafts as owner setup drafts', () => {
    expect(
      getAiRecordActions(company({ role: 'ADMIN', setupStatus: 'DRAFT' })),
    ).toEqual(['open-chat']);
  });

  it('does not expose management actions to Members', () => {
    expect(
      getAiRecordActions(
        company({
          role: 'MEMBER',
          setupStatus: 'READY',
          invitationCode: 'ABCD1234',
        }),
      ),
    ).toEqual(['open-chat']);
  });

  it('shows management actions for Owner ready AIs', () => {
    expect(
      getAiRecordActions(
        company({
          role: 'OWNER',
          setupStatus: 'READY',
          invitationCode: 'ABCD1234',
        }),
      ),
    ).toEqual(['open-chat', 'manage']);
  });
});
