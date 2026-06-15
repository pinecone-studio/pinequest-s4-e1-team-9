import type {
  ChatMessage,
  Company,
  CompanyMember,
  InviteCode,
  InviteRedemption,
  Prisma,
  UserPreference,
  UserDocument,
} from '../../generated/prisma/client.js';
import prisma from '../prisma.js';
import * as profilesRepo from './profiles.repo.js';
import type {
  AiSetupStatus,
  CompanyRole,
  CreateCompanyInput,
  UpdateAiSetupInput,
} from '../../features/companies/types.js';
import { isCompanyManager } from '../../features/companies/roles.js';
import { createConfiguredAiBehavior } from '../../features/companies/ai-configuration.js';

type CompanyWithMembership = Company & {
  members: Pick<
    CompanyMember,
    'id' | 'userId' | 'role' | 'invitationId' | 'createdAt' | 'updatedAt'
  >[];
};

type CompanyMetricDocument = Pick<
  UserDocument,
  'status' | 'createdAt' | 'updatedAt'
>;

type CompanyWithMetrics = Company & {
  documents?: CompanyMetricDocument[];
  chatMessages?: Pick<ChatMessage, 'createdAt'>[];
  _count?: {
    members?: number;
    documents?: number;
  };
};

function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function getDocumentStatusCounts(documents: CompanyMetricDocument[] = []) {
  return documents.reduce(
    (counts, document) => {
      counts.documentCount += 1;

      if (document.status === 'ready') {
        counts.readyDocumentCount += 1;
      } else if (document.status === 'error') {
        counts.failedDocumentCount += 1;
      } else {
        counts.processingDocumentCount += 1;
      }

      return counts;
    },
    {
      documentCount: 0,
      readyDocumentCount: 0,
      processingDocumentCount: 0,
      failedDocumentCount: 0,
    },
  );
}

function getLatestActivityAt(company: CompanyWithMetrics) {
  const candidates = [
    company.updatedAt,
    company.chatMessages?.[0]?.createdAt,
    ...(company.documents ?? []).map((document) => document.updatedAt),
  ].filter((value): value is Date => value instanceof Date);

  if (!candidates.length) {
    return company.updatedAt;
  }

  return candidates.reduce((latest, value) =>
    value.getTime() > latest.getTime() ? value : latest,
  );
}

function serializeCompany(company: Company, role?: CompanyRole) {
  const companyWithMetrics = company as CompanyWithMetrics;
  const documentCounts = getDocumentStatusCounts(companyWithMetrics.documents);
  const behavior = createConfiguredAiBehavior(company);
  const archivedAt = toIsoString(company.archivedAt);

  return {
    id: company.id,
    name: company.name,
    domain: company.domain,
    description: company.description,
    useCaseType: company.useCaseType,
    setupStatus: (archivedAt ? 'ARCHIVED' : company.setupStatus) as AiSetupStatus,
    setupStep: company.setupStep,
    setupOwnerId: company.setupOwnerId,
    aiConfiguration: behavior.configuration,
    systemInstructions: isCompanyManager(role) ? behavior.systemInstructions : null,
    finalizedAt: toIsoString(company.finalizedAt),
    archivedAt,
    ...documentCounts,
    memberCount: companyWithMetrics._count?.members,
    lastActivityAt: toIsoString(getLatestActivityAt(companyWithMetrics)),
    invitationCode: null,
    createdAt: toIsoString(company.createdAt),
    updatedAt: toIsoString(company.updatedAt),
    role,
  };
}

function serializeMember(member: CompanyMember, name?: string | null) {
  return {
    id: member.id,
    companyId: member.companyId,
    userId: member.userId,
    name: name ?? null,
    role: member.role as CompanyRole,
    invitationId: member.invitationId,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  };
}

function serializeInvite(invite: InviteCode) {
  const now = Date.now();
  const expiresAt = invite.expiresAt.getTime();

  return {
    id: invite.id,
    companyId: invite.companyId,
    createdBy: invite.createdBy,
    createdAt: invite.createdAt.toISOString(),
    expiresAt: invite.expiresAt.toISOString(),
    revokedAt: toIsoString(invite.revokedAt),
    isActive: !invite.revokedAt && expiresAt > now,
  };
}

function serializeRedemption(
  redemption: InviteRedemption,
  name?: string | null,
) {
  return {
    id: redemption.id,
    inviteId: redemption.inviteId,
    companyId: redemption.companyId,
    userId: redemption.userId,
    name: name ?? null,
    redeemedAt: redemption.redeemedAt.toISOString(),
  };
}

function serializePreference(preference: UserPreference | null) {
  return {
    lastSelectedCompanyId: preference?.lastSelectedCompanyId ?? null,
    createdAt: toIsoString(preference?.createdAt),
    updatedAt: toIsoString(preference?.updatedAt),
  };
}

export async function createCompanyForOwner(
  ownerUserId: string,
  input: CreateCompanyInput,
  invitationCode: string,
) {
  const company = await prisma.$transaction(async (tx) => {
    const createdCompany = await tx.company.create({
      data: {
        name: input.name.trim(),
        domain: input.domain?.trim() || null,
        invitationCode,
        description: null,
        useCaseType: 'custom',
        setupStatus: 'READY',
        setupStep: 6,
        setupOwnerId: ownerUserId,
        finalizedAt: new Date(),
      },
    });

    await tx.companyMember.create({
      data: {
        companyId: createdCompany.id,
        userId: ownerUserId,
        role: 'OWNER',
      },
    });

    return createdCompany;
  });

  return serializeCompany(company, 'OWNER');
}

export async function createCompanyDraftForOwner(
  ownerUserId: string,
  invitationCode: string,
) {
  const company = await prisma.$transaction(async (tx) => {
    const createdCompany = await tx.company.create({
      data: {
        name: 'Untitled AI setup',
        domain: null,
        invitationCode,
        description: null,
        useCaseType: 'custom',
        setupStatus: 'DRAFT',
        setupStep: 0,
        setupOwnerId: ownerUserId,
      },
    });

    await tx.companyMember.create({
      data: {
        companyId: createdCompany.id,
        userId: ownerUserId,
        role: 'OWNER',
      },
    });

    return createdCompany;
  });

  return serializeCompany(company, 'OWNER');
}

export async function listUserCompanies(userId: string) {
  const memberships = await prisma.companyMember.findMany({
    where: {
      userId,
      company: {
        archivedAt: null,
      },
    },
    include: {
      company: {
        include: {
          documents: {
            select: {
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          chatMessages: {
            select: { createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              members: true,
              documents: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return memberships.map((membership) =>
    serializeCompany(membership.company, membership.role as CompanyRole),
  );
}

export async function getCompanyMembership(userId: string, companyId: string) {
  const membership = await prisma.companyMember.findUnique({
    where: {
      companyId_userId: {
        companyId,
        userId,
      },
    },
  });

  return membership ? serializeMember(membership) : null;
}

export async function getCompanyWithMembership(
  userId: string,
  companyId: string,
) {
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      archivedAt: null,
      members: {
        some: { userId },
      },
    },
    include: {
      members: {
        where: { userId },
        select: {
          id: true,
          userId: true,
          role: true,
          invitationId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      documents: {
        select: {
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      chatMessages: {
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: {
        select: {
          members: true,
          documents: true,
        },
      },
    },
  });

  if (!company) {
    return null;
  }

  const typedCompany = company as CompanyWithMembership;
  const membership = typedCompany.members[0];

  if (!membership) {
    return null;
  }

  return {
    company: serializeCompany(typedCompany, membership.role as CompanyRole),
    membership: {
      id: membership.id,
      companyId: typedCompany.id,
      userId: membership.userId,
      role: membership.role as CompanyRole,
      invitationId: membership.invitationId,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
    },
  };
}

export async function getCompanyById(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  return company;
}

export async function getCompanyBehavior(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      name: true,
      description: true,
      useCaseType: true,
      aiConfiguration: true,
      systemInstructions: true,
      archivedAt: true,
    },
  });

  if (!company || company.archivedAt) {
    return null;
  }

  return createConfiguredAiBehavior(company);
}

export async function updateCompanySetup(
  companyId: string,
  input: UpdateAiSetupInput & {
    setupStatus?: AiSetupStatus;
    systemInstructions?: string | null;
    finalizedAt?: Date | null;
  },
) {
  const data: Prisma.CompanyUpdateInput = {};

  if (input.name !== undefined) {
    data.name = input.name.trim();
  }

  if (input.description !== undefined) {
    data.description = input.description?.trim() || null;
  }

  if (input.domain !== undefined) {
    data.domain = input.domain?.trim() || null;
  }

  if (input.useCaseType !== undefined) {
    data.useCaseType = input.useCaseType.trim() || 'custom';
  }

  if (input.setupStep !== undefined) {
    data.setupStep = input.setupStep;
  }

  if (input.setupStatus !== undefined) {
    data.setupStatus = input.setupStatus;
  }

  if (input.aiConfiguration !== undefined) {
    data.aiConfiguration =
      input.aiConfiguration as Prisma.CompanyUpdateInput['aiConfiguration'];
  }

  if (input.systemInstructions !== undefined) {
    data.systemInstructions = input.systemInstructions;
  }

  if (input.finalizedAt !== undefined) {
    data.finalizedAt = input.finalizedAt;
  }

  const company = await prisma.company.update({
    where: { id: companyId },
    data,
  });

  return serializeCompany(company);
}

export async function getCompanyDocumentStatusCounts(companyId: string) {
  const documents = await prisma.userDocument.findMany({
    where: { companyId },
    select: {
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return getDocumentStatusCounts(documents);
}

export async function listCompanyDocuments(companyId: string) {
  const documents = await prisma.userDocument.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
  });

  return documents;
}

export async function deleteCompanyDocument(
  companyId: string,
  documentId: string,
) {
  const existingDocument = await prisma.userDocument.findFirst({
    where: {
      id: documentId,
      companyId,
    },
  });

  if (!existingDocument) {
    return null;
  }

  return prisma.userDocument.delete({
    where: { id: existingDocument.id },
  });
}

export async function listCompanyMembers(companyId: string) {
  const members = await prisma.companyMember.findMany({
    where: { companyId },
    orderBy: { createdAt: 'asc' },
  });
  const profiles = await profilesRepo.listProfilesByUserIds(
    members.map((member) => member.userId),
  );

  return members.map((member) =>
    serializeMember(member, profiles.get(member.userId)?.name ?? null),
  );
}

export async function joinCompanyByCode(
  userId: string,
  invitationCode: string,
) {
  const company = await prisma.company.findUnique({
    where: { invitationCode: invitationCode.trim().toUpperCase() },
  });

  if (!company) {
    throw new Error('Invalid invitation code.');
  }

  const existingMember = await prisma.companyMember.findUnique({
    where: {
      companyId_userId: {
        companyId: company.id,
        userId,
      },
    },
  });

  if (existingMember) {
    return serializeMember(existingMember);
  }

  const member = await prisma.companyMember.create({
    data: {
      companyId: company.id,
      userId,
      role: 'MEMBER',
    },
  });

  return serializeMember(member);
}

export async function addCompanyMember(companyId: string, userId: string) {
  const member = await prisma.companyMember.create({
    data: {
      companyId,
      userId,
      role: 'MEMBER',
    },
  });

  return serializeMember(member);
}

export async function updateCompanyMemberRole(
  companyId: string,
  userId: string,
  role: Exclude<CompanyRole, 'OWNER'>,
) {
  const member = await prisma.companyMember.update({
    where: {
      companyId_userId: {
        companyId,
        userId,
      },
    },
    data: { role },
  });

  return serializeMember(member);
}

export async function removeCompanyMember(companyId: string, userId: string) {
  const member = await prisma.companyMember.findUnique({
    where: {
      companyId_userId: {
        companyId,
        userId,
      },
    },
  });

  if (!member || member.role === 'OWNER') {
    return null;
  }

  const deleted = await prisma.companyMember.delete({
    where: {
      companyId_userId: {
        companyId,
        userId,
      },
    },
  });

  return serializeMember(deleted);
}

export async function archiveCompany(companyId: string) {
  const company = await prisma.company.update({
    where: { id: companyId },
    data: {
      archivedAt: new Date(),
      setupStatus: 'ARCHIVED',
    },
  });

  return serializeCompany(company, 'OWNER');
}

export async function getActiveInviteForCompany(companyId: string) {
  const invite = await prisma.inviteCode.findFirst({
    where: {
      companyId,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return invite ? serializeInvite(invite) : null;
}

export async function createInviteCode(input: {
  companyId: string;
  createdBy: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  const invite = await prisma.$transaction(async (tx) => {
    await tx.inviteCode.updateMany({
      where: {
        companyId: input.companyId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return tx.inviteCode.create({
      data: {
        companyId: input.companyId,
        createdBy: input.createdBy,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    });
  });

  return serializeInvite(invite);
}

export async function revokeActiveInvite(companyId: string) {
  const result = await prisma.inviteCode.updateMany({
    where: {
      companyId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return result.count;
}

export async function findInviteByTokenHash(tokenHash: string) {
  const invite = await prisma.inviteCode.findUnique({
    where: { tokenHash },
    include: {
      company: {
        include: {
          members: {
            where: { role: 'OWNER' },
            take: 1,
          },
          _count: {
            select: {
              documents: true,
              members: true,
            },
          },
        },
      },
    },
  });

  if (!invite) {
    return null;
  }
  const ownerUserId = invite.company.members[0]?.userId ?? null;
  const ownerProfiles = ownerUserId
    ? await profilesRepo.listProfilesByUserIds([ownerUserId])
    : new Map();

  return {
    invite: serializeInvite(invite),
    company: serializeCompany(invite.company),
    ownerUserId,
    ownerName: ownerUserId ? ownerProfiles.get(ownerUserId)?.name ?? null : null,
  };
}

export async function redeemInvite(input: {
  inviteId: string;
  companyId: string;
  userId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const existingMember = await tx.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId: input.companyId,
          userId: input.userId,
        },
      },
    });

    if (existingMember) {
      return {
        alreadyMember: true,
        membership: serializeMember(existingMember),
        redemption: null,
      };
    }

    const membership = await tx.companyMember.create({
      data: {
        companyId: input.companyId,
        userId: input.userId,
        role: 'MEMBER',
        invitationId: input.inviteId,
      },
    });

    const redemption = await tx.inviteRedemption.upsert({
      where: {
        inviteId_userId: {
          inviteId: input.inviteId,
          userId: input.userId,
        },
      },
      create: {
        inviteId: input.inviteId,
        companyId: input.companyId,
        userId: input.userId,
      },
      update: {},
    });

    return {
      alreadyMember: false,
      membership: serializeMember(membership),
      redemption: serializeRedemption(redemption),
    };
  });
}

export async function listRecentInviteRedemptions(companyId: string, limit = 10) {
  const redemptions = await prisma.inviteRedemption.findMany({
    where: { companyId },
    orderBy: { redeemedAt: 'desc' },
    take: limit,
  });
  const profiles = await profilesRepo.listProfilesByUserIds(
    redemptions.map((redemption) => redemption.userId),
  );

  return redemptions.map((redemption) =>
    serializeRedemption(
      redemption,
      profiles.get(redemption.userId)?.name ?? null,
    ),
  );
}

export async function getUserPreference(userId: string) {
  const preference = await prisma.userPreference.findUnique({
    where: { userId },
  });

  return serializePreference(preference);
}

export async function setLastSelectedCompany(
  userId: string,
  lastSelectedCompanyId: string | null,
) {
  const preference = await prisma.userPreference.upsert({
    where: { userId },
    create: {
      userId,
      lastSelectedCompanyId,
    },
    update: {
      lastSelectedCompanyId,
    },
  });

  return serializePreference(preference);
}
