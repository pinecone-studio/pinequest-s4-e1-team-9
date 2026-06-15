import type { UserProfile } from '../../generated/prisma/client.js';
import prisma from '../prisma.js';

export type SerializedUserProfile = {
  userId: string;
  name: string;
  requiresNameCompletion: boolean;
  createdAt: string;
  updatedAt: string;
};

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

export function serializeUserProfile(
  profile: UserProfile,
): SerializedUserProfile {
  return {
    userId: profile.userId,
    name: profile.name,
    requiresNameCompletion: profile.requiresNameCompletion,
    createdAt: toIsoString(profile.createdAt),
    updatedAt: toIsoString(profile.updatedAt),
  };
}

export async function getUserProfile(userId: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  return profile ? serializeUserProfile(profile) : null;
}

export async function upsertUserProfile(input: {
  userId: string;
  name: string;
  requiresNameCompletion: boolean;
}) {
  const profile = await prisma.userProfile.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      name: input.name,
      requiresNameCompletion: input.requiresNameCompletion,
    },
    update: {
      name: input.name,
      requiresNameCompletion: input.requiresNameCompletion,
    },
  });

  return serializeUserProfile(profile);
}

export async function updateUserProfile(input: {
  userId: string;
  name: string;
}) {
  const profile = await prisma.userProfile.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      name: input.name,
      requiresNameCompletion: false,
    },
    update: {
      name: input.name,
      requiresNameCompletion: false,
    },
  });

  return serializeUserProfile(profile);
}

export async function listProfilesByUserIds(userIds: string[]) {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];

  if (!uniqueUserIds.length) {
    return new Map<string, SerializedUserProfile>();
  }

  const profiles = await prisma.userProfile.findMany({
    where: {
      userId: { in: uniqueUserIds },
    },
  });

  return new Map(
    profiles.map((profile) => [
      profile.userId,
      serializeUserProfile(profile),
    ]),
  );
}
