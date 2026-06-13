import type { Company, CompanyMember } from '../../generated/prisma/client.js';
import prisma from '../prisma.js';
import type {
  CompanyRole,
  CreateCompanyInput,
} from '../../features/companies/types.js';

type CompanyWithMembership = Company & {
  members: Pick<
    CompanyMember,
    'id' | 'userId' | 'role' | 'createdAt' | 'updatedAt'
  >[];
};

function serializeCompany(company: Company, role?: CompanyRole) {
  return {
    id: company.id,
    name: company.name,
    domain: company.domain,
    invitationCode: company.invitationCode,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
    role,
  };
}

function serializeMember(member: CompanyMember) {
  return {
    id: member.id,
    companyId: member.companyId,
    userId: member.userId,
    role: member.role as CompanyRole,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
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
    where: { userId },
    include: { company: true },
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
          createdAt: true,
          updatedAt: true,
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
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
    },
  };
}

export async function listCompanyMembers(companyId: string) {
  const members = await prisma.companyMember.findMany({
    where: { companyId },
    orderBy: { createdAt: 'asc' },
  });

  return members.map(serializeMember);
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
