import { clientEnv } from '@/config/env';
import { getAuthHeaders } from '@/features/auth/supabase';

export type UserProfile = {
  userId: string;
  name: string;
  email: string | null;
  requiresNameCompletion: boolean;
  createdAt: string;
  updatedAt: string;
};

type ProfileResponse = {
  profile?: UserProfile;
  error?: string;
};

async function readJsonResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

function normalizeProfileApiUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, '');

  if (!trimmed) {
    return '/api/me/profile';
  }

  return trimmed.endsWith('/api/me/profile')
    ? trimmed
    : `${trimmed}/api/me/profile`;
}

function getProfileApiUrl() {
  return normalizeProfileApiUrl(clientEnv.profileApiUrl);
}

async function getProfileAuthHeaders(accessToken?: string) {
  if (accessToken) {
    return { Authorization: `Bearer ${accessToken}` };
  }

  return getAuthHeaders();
}

function profileErrorMessage(
  response: Response,
  data: ProfileResponse,
  fallback: string,
) {
  return data.error ?? `${fallback} (${response.status}).`;
}

export async function getCurrentProfile(accessToken?: string) {
  const authHeaders = await getProfileAuthHeaders(accessToken);
  const response = await fetch(getProfileApiUrl(), {
    method: 'GET',
    headers: authHeaders,
  });
  const data = await readJsonResponse<ProfileResponse>(response);

  if (!response.ok || !data.profile) {
    throw new Error(profileErrorMessage(response, data, 'Failed to load profile'));
  }

  return data.profile;
}

export async function updateCurrentProfile(name: string, accessToken?: string) {
  const authHeaders = await getProfileAuthHeaders(accessToken);
  const response = await fetch(getProfileApiUrl(), {
    method: 'PATCH',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  const data = await readJsonResponse<ProfileResponse>(response);

  if (!response.ok || !data.profile) {
    throw new Error(profileErrorMessage(response, data, 'Failed to update profile'));
  }

  return data.profile;
}
