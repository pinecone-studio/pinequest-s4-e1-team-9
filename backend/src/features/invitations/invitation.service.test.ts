import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.INVITE_CODE_PEPPER = 'test-invite-pepper';
process.env.PUBLIC_APP_URL = 'https://app.test';

const requireCompanyOwner = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const createInviteCode = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const findInviteByTokenHash =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const redeemInviteRepo = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getActiveInviteForCompany =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const listRecentInviteRedemptions =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const revokeActiveInvite = jest.fn<(...args: unknown[]) => Promise<unknown>>();

let createInvitation: typeof import('./invitation.service.js').createInvitation;
let previewInvitation: typeof import('./invitation.service.js').previewInvitation;
let redeemInvitation: typeof import('./invitation.service.js').redeemInvitation;

function inviteResult(overrides: Record<string, unknown> = {}) {
  return {
    invite: {
      id: 'invite-1',
      companyId: 'company-1',
      createdBy: 'owner-1',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      revokedAt: null,
      isActive: true,
      ...overrides,
    },
    company: {
      id: 'company-1',
      name: 'Pinequest Rules',
      description: 'Hackathon rules assistant',
      useCaseType: 'custom',
      aiConfiguration: null,
      setupStatus: 'READY',
      archivedAt: null,
      documentCount: 2,
      memberCount: 1,
    },
    ownerUserId: 'owner-1',
  };
}

describe('invitation service', () => {
  beforeAll(async () => {
    jest.doMock('../companies/authorization.service.js', () => ({
      requireCompanyOwner,
    }));
    jest.doMock('../../db/repositories/companies.repo.js', () => ({
      createInviteCode,
      findInviteByTokenHash,
      redeemInvite: redeemInviteRepo,
      getActiveInviteForCompany,
      listRecentInviteRedemptions,
      revokeActiveInvite,
    }));

    ({ createInvitation, previewInvitation, redeemInvitation } = await import(
      './invitation.service.js'
    ));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    requireCompanyOwner.mockResolvedValue({});
    createInviteCode.mockImplementation(() =>
      Promise.resolve({
        id: 'invite-1',
        companyId: 'company-1',
        createdBy: 'owner-1',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        revokedAt: null,
        isActive: true,
      }),
    );
    findInviteByTokenHash.mockResolvedValue(inviteResult());
    redeemInviteRepo.mockResolvedValue({
      alreadyMember: false,
      membership: {
        id: 'membership-1',
        companyId: 'company-1',
        userId: 'member-1',
        role: 'MEMBER',
      },
      redemption: {
        id: 'redemption-1',
        inviteId: 'invite-1',
        companyId: 'company-1',
        userId: 'member-1',
      },
    });
  });

  it('generates a raw code while storing only its hash', async () => {
    const result = await createInvitation('owner-1', 'company-1');
    const storedInput = createInviteCode.mock.calls[0]?.[0] as {
      tokenHash: string;
      expiresAt: Date;
    };

    expect(requireCompanyOwner).toHaveBeenCalledWith('owner-1', 'company-1');
    expect(result.code).toMatch(/^PINE-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(result.link).toContain(`/join/${encodeURIComponent(result.code)}`);
    expect(storedInput.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(storedInput.tokenHash).not.toContain(result.code);
    expect(storedInput.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('previews an active invitation', async () => {
    await expect(previewInvitation('pine-aaaa-bbbb-cccc')).resolves.toEqual(
      expect.objectContaining({
        company: expect.objectContaining({ name: 'Pinequest Rules' }),
        invite: expect.objectContaining({ id: 'invite-1' }),
      }),
    );
  });

  it('rejects expired invitations', async () => {
    findInviteByTokenHash.mockResolvedValue(
      inviteResult({
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      }),
    );

    await expect(previewInvitation('expired')).rejects.toMatchObject({
      statusCode: 410,
    });
  });

  it('rejects revoked invitations', async () => {
    findInviteByTokenHash.mockResolvedValue(
      inviteResult({
        revokedAt: new Date().toISOString(),
      }),
    );

    await expect(previewInvitation('revoked')).rejects.toMatchObject({
      statusCode: 410,
    });
  });

  it('redeems valid invitations as members only', async () => {
    const result = await redeemInvitation('member-1', 'pine-aaaa-bbbb-cccc');

    expect(redeemInviteRepo).toHaveBeenCalledWith({
      inviteId: 'invite-1',
      companyId: 'company-1',
      userId: 'member-1',
    });
    expect(result.membership.role).toBe('MEMBER');
  });
});
