import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

const getCompanyWithMembership = jest.fn<() => Promise<unknown>>();

let canPromoteCompanyUser: typeof import(
  './authorization.service.js'
).canPromoteCompanyUser;
let getCompanyAccess: typeof import('./authorization.service.js').getCompanyAccess;
let requireCompanyOwner: typeof import(
  './authorization.service.js'
).requireCompanyOwner;

function membershipResult(role: 'OWNER' | 'ADMIN' | 'MEMBER') {
  return {
    company: {
      id: 'company-1',
      name: 'Workspace AI',
      domain: null,
      invitationCode: role === 'MEMBER' ? null : 'ADMIN123',
      createdAt: new Date('2026-06-14T00:00:00.000Z'),
      updatedAt: new Date('2026-06-14T00:00:00.000Z'),
      role,
    },
    membership: {
      id: 'membership-1',
      companyId: 'company-1',
      userId: 'user-1',
      role,
      createdAt: new Date('2026-06-14T00:00:00.000Z'),
      updatedAt: new Date('2026-06-14T00:00:00.000Z'),
    },
  };
}

describe('company authorization service', () => {
  beforeAll(async () => {
    jest.doMock('../../db/repositories/companies.repo.js', () => ({
      getCompanyWithMembership,
    }));
    ({
      canPromoteCompanyUser,
      getCompanyAccess,
      requireCompanyOwner,
    } = await import('./authorization.service.js'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('treats owners as workspace managers without enabling role promotion', async () => {
    getCompanyWithMembership.mockResolvedValue(membershipResult('OWNER'));

    const access = await getCompanyAccess('user-1', 'company-1');

    expect(access?.permissions).toEqual(
      expect.objectContaining({
        isCompanyAdmin: true,
        canManageCompany: true,
        canInviteCompanyUsers: true,
        canUploadCompanyDocuments: true,
        canPromoteCompanyUser: false,
        canViewInvitationCode: true,
      }),
    );
  });

  it('treats legacy admins as members without owner permissions', async () => {
    getCompanyWithMembership.mockResolvedValue(membershipResult('ADMIN'));

    const access = await getCompanyAccess('user-1', 'company-1');

    expect(access?.permissions).toEqual(
      expect.objectContaining({
        isCompanyMember: true,
        isCompanyAdmin: false,
        canManageCompany: false,
        canInviteCompanyUsers: false,
        canUploadCompanyDocuments: false,
        canPromoteCompanyUser: false,
        canViewInvitationCode: false,
      }),
    );
  });

  it('treats members as chat-capable users without admin permissions', async () => {
    getCompanyWithMembership.mockResolvedValue(membershipResult('MEMBER'));

    const access = await getCompanyAccess('user-1', 'company-1');

    expect(access?.permissions).toEqual(
      expect.objectContaining({
        isCompanyMember: true,
        isCompanyAdmin: false,
        canManageCompany: false,
        canInviteCompanyUsers: false,
        canUploadCompanyDocuments: false,
        canPromoteCompanyUser: false,
        canViewInvitationCode: false,
      }),
    );
  });

  it('keeps role promotion disabled even for owners', async () => {
    getCompanyWithMembership.mockResolvedValue(membershipResult('OWNER'));

    await expect(canPromoteCompanyUser('user-1', 'company-1')).resolves.toBe(
      false,
    );
    await expect(requireCompanyOwner('user-1', 'company-1')).resolves.toEqual(
      expect.objectContaining({
        permissions: expect.objectContaining({ isCompanyOwner: true }),
      }),
    );
  });
});
