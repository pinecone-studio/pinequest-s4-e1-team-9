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

const backendUnavailableMessage =
  'The application server could not be reached. Please retry shortly.';

async function readJsonResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

function getProfileApiUrl() {
  if (!clientEnv.profileApiUrl) {
    throw new Error(
      'The application server is not configured. Set NEXT_PUBLIC_API_URL to the deployed HTTPS backend origin and redeploy the frontend.',
    );
  }

  return clientEnv.profileApiUrl;
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
  if (response.status === 401 || response.status === 403) {
    return data.error ?? 'Your session could not be authorized. Please sign in again.';
  }

  if (response.status === 404) {
    return data.error ?? 'Profile was not found. Please retry to recreate it.';
  }

  if (response.status >= 500) {
    return data.error ?? 'The application server returned an error. Please retry shortly.';
  }

  return data.error ?? `${fallback} (${response.status}).`;
}

async function fetchProfile(input: RequestInfo | URL, init: RequestInit) {
  try {
    return await fetch(input, init);
  } catch {
    throw new Error(backendUnavailableMessage);
  }
}

export async function getCurrentProfile(accessToken?: string) {
  const authHeaders = await getProfileAuthHeaders(accessToken);
  const response = await fetchProfile(getProfileApiUrl(), {
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
  const response = await fetchProfile(getProfileApiUrl(), {
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
