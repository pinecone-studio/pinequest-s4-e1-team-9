import * as crypto from 'node:crypto';
import { env } from '../../config/env.js';
import * as companiesRepo from '../../db/repositories/companies.repo.js';
import { requireCompanyOwner } from '../companies/authorization.service.js';
import { DocumentProcessingError } from '../documents/types.js';

const inviteExpiresInMs = 15 * 60 * 1000;
const inviteAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function getInvitePepper() {
  if (!env.inviteCodePepper.trim()) {
    throw new DocumentProcessingError(
      'Invitation code secret is not configured.',
      500,
    );
  }

  return env.inviteCodePepper;
}

function randomInviteGroup(length = 4) {
  return Array.from({ length }, () =>
    inviteAlphabet[crypto.randomInt(0, inviteAlphabet.length)],
  ).join('');
}

function generateInviteCode() {
  return `PINE-${randomInviteGroup()}-${randomInviteGroup()}-${randomInviteGroup()}`;
}

function normalizeInviteCode(code: string) {
  return code.replace(/[^a-z0-9]/gi, '').toUpperCase();
}

function hashInviteCode(code: string) {
  const normalized = normalizeInviteCode(code);

  if (!normalized) {
    throw new DocumentProcessingError('Invitation code is required.', 400);
  }

  return crypto
    .createHmac('sha256', getInvitePepper())
    .update(normalized)
    .digest('hex');
}

function buildInviteLink(rawCode: string) {
  return `${env.publicAppUrl.replace(/\/+$/, '')}/join/${encodeURIComponent(rawCode)}`;
}

function assertInviteUsable(
  result: Awaited<ReturnType<typeof companiesRepo.findInviteByTokenHash>>,
) {
  if (!result) {
    throw new DocumentProcessingError('Invitation code was not found.', 404);
  }

  if (result.invite.revokedAt) {
    throw new DocumentProcessingError('Invitation code has been revoked.', 410);
  }

  if (new Date(result.invite.expiresAt).getTime() <= Date.now()) {
    throw new DocumentProcessingError('Invitation code has expired.', 410);
  }

  if (result.company.archivedAt || result.company.setupStatus === 'ARCHIVED') {
    throw new DocumentProcessingError('This AI is archived.', 410);
  }

  return result;
}

export function getInviteExpiryDate() {
  return new Date(Date.now() + inviteExpiresInMs);
}

export async function getActiveInvitation(userId: string, companyId: string) {
  await requireCompanyOwner(userId, companyId);
  const [activeInvite, recentRedemptions] = await Promise.all([
    companiesRepo.getActiveInviteForCompany(companyId),
    companiesRepo.listRecentInviteRedemptions(companyId),
  ]);

  return {
    activeInvite,
    recentRedemptions,
  };
}

export async function createInvitation(userId: string, companyId: string) {
  await requireCompanyOwner(userId, companyId);
  const rawCode = generateInviteCode();
  const invite = await companiesRepo.createInviteCode({
    companyId,
    createdBy: userId,
    tokenHash: hashInviteCode(rawCode),
    expiresAt: getInviteExpiryDate(),
  });

  return {
    invite,
    code: rawCode,
    link: buildInviteLink(rawCode),
  };
}

export async function revokeInvitation(userId: string, companyId: string) {
  await requireCompanyOwner(userId, companyId);
  const revoked = await companiesRepo.revokeActiveInvite(companyId);

  return { ok: true, revoked };
}

export async function previewInvitation(code: string) {
  const result = assertInviteUsable(
    await companiesRepo.findInviteByTokenHash(hashInviteCode(code)),
  );

  return {
    invite: result.invite,
    company: {
      id: result.company.id,
      name: result.company.name,
      description: result.company.description,
      useCaseType: result.company.useCaseType,
      aiConfiguration: result.company.aiConfiguration,
      documentCount: result.company.documentCount ?? 0,
      memberCount: result.company.memberCount ?? 0,
    },
    ownerUserId: result.ownerUserId,
    ownerName: result.ownerName,
  };
}

export async function redeemInvitation(userId: string, code: string) {
  const result = assertInviteUsable(
    await companiesRepo.findInviteByTokenHash(hashInviteCode(code)),
  );
  const redemption = await companiesRepo.redeemInvite({
    inviteId: result.invite.id,
    companyId: result.company.id,
    userId,
  });

  return {
    ...redemption,
    company: {
      id: result.company.id,
      name: result.company.name,
      description: result.company.description,
      useCaseType: result.company.useCaseType,
      aiConfiguration: result.company.aiConfiguration,
      setupStatus: result.company.setupStatus,
    },
  };
}
