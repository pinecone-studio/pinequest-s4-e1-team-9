import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

const companyMemberFindMany = jest.fn<() => Promise<unknown[]>>();
const prismaMock = {
  companyMember: {
    findMany: companyMemberFindMany,
  },
};

let listUserCompanies: typeof import('./companies.repo.js').listUserCompanies;

describe('companies repository serialization', () => {
  beforeAll(async () => {
    jest.doMock('../prisma.js', () => ({
      __esModule: true,
      default: prismaMock,
      prisma: prismaMock,
    }));
    ({ listUserCompanies } = await import('./companies.repo.js'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps raw legacy invitation codes hidden from company lists', async () => {
    const createdAt = new Date('2026-06-14T00:00:00.000Z');
    const updatedAt = new Date('2026-06-14T01:00:00.000Z');

    companyMemberFindMany.mockResolvedValue([
      {
        role: 'OWNER',
        company: {
          id: 'company-admin',
          name: 'Admin AI',
          domain: 'admin.test',
          invitationCode: 'ADMIN123',
          createdAt,
          updatedAt,
        },
      },
      {
        role: 'ADMIN',
        company: {
          id: 'company-legacy-admin',
          name: 'Legacy Admin AI',
          domain: null,
          invitationCode: 'LEGACY123',
          createdAt,
          updatedAt,
        },
      },
      {
        role: 'MEMBER',
        company: {
          id: 'company-member',
          name: 'Member AI',
          domain: 'member.test',
          invitationCode: 'MEMBER123',
          createdAt,
          updatedAt,
        },
      },
    ]);

    const companies = await listUserCompanies('user-1');

    expect(companyMemberFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-1',
          company: { archivedAt: null },
        },
        include: expect.objectContaining({
          company: expect.objectContaining({
            include: expect.objectContaining({
              documents: expect.any(Object),
              chatMessages: expect.any(Object),
              _count: expect.any(Object),
            }),
          }),
        }),
        orderBy: { createdAt: 'desc' },
      }),
    );
    expect(companies).toEqual([
      expect.objectContaining({
        id: 'company-admin',
        invitationCode: null,
        role: 'OWNER',
      }),
      expect.objectContaining({
        id: 'company-legacy-admin',
        invitationCode: null,
        role: 'ADMIN',
      }),
      expect.objectContaining({
        id: 'company-member',
        invitationCode: null,
        role: 'MEMBER',
      }),
    ]);
  });
});
