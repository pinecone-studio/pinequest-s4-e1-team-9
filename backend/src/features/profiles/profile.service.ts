import type { User } from '@supabase/supabase-js';
import * as profilesRepo from '../../db/repositories/profiles.repo.js';
import { DocumentProcessingError } from '../documents/types.js';

const minNameChars = 2;
const maxNameChars = 80;

function compactWhitespace(value: string) {
  return value.replace(/\s+/gu, ' ').trim();
}

export function normalizeProfileName(value: unknown) {
  if (typeof value !== 'string') {
    throw new DocumentProcessingError('Name is required.', 400);
  }

  const name = compactWhitespace(value);

  if (name.length < minNameChars) {
    throw new DocumentProcessingError(
      'Name must be at least 2 characters.',
      400,
    );
  }

  if (name.length > maxNameChars) {
    throw new DocumentProcessingError(
      'Name must be 80 characters or fewer.',
      400,
    );
  }

  return name;
}

function maybeNormalizeName(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  try {
    return normalizeProfileName(value);
  } catch {
    return null;
  }
}

function titleizeFallbackName(value: string) {
  const compacted = compactWhitespace(
    value
      .replace(/[+].*$/u, '')
      .replace(/[._-]+/gu, ' ')
      .replace(/\d+/gu, ' '),
  );

  if (!compacted) {
    return 'New User';
  }

  return compacted
    .split(' ')
    .filter(Boolean)
    .map((part) => {
      const [first = '', ...rest] = Array.from(part);
      return `${first.toLocaleUpperCase()}${rest.join('').toLocaleLowerCase()}`;
    })
    .join(' ');
}

function getAuthMetadataName(user: User) {
  const metadata = user.user_metadata ?? {};
  return (
    maybeNormalizeName(metadata.name) ??
    maybeNormalizeName(metadata.full_name) ??
    maybeNormalizeName(metadata.display_name)
  );
}

function getEmailFallbackName(user: User) {
  const localPart = user.email?.split('@')[0] ?? '';
  const fallback = titleizeFallbackName(localPart);

  return maybeNormalizeName(fallback) ?? 'New User';
}

export async function ensureUserProfile(user: User) {
  const existing = await profilesRepo.getUserProfile(user.id);

  if (existing) {
    return {
      ...existing,
      email: user.email ?? null,
    };
  }

  const metadataName = getAuthMetadataName(user);
  const name = metadataName ?? getEmailFallbackName(user);
  const profile = await profilesRepo.upsertUserProfile({
    userId: user.id,
    name,
    requiresNameCompletion: !metadataName,
  });

  return {
    ...profile,
    email: user.email ?? null,
  };
}

export async function updateCurrentUserProfile(user: User, name: unknown) {
  const profile = await profilesRepo.updateUserProfile({
    userId: user.id,
    name: normalizeProfileName(name),
  });

  return {
    ...profile,
    email: user.email ?? null,
  };
}
