import { clientEnv } from '@/config/env';
import { getAuthHeaders } from '@/features/auth/supabase';

export type UserPreferences = {
  lastSelectedCompanyId: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  error?: string;
};

async function readJsonResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

export async function getUserPreferences() {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(clientEnv.preferencesApiUrl, {
    method: 'GET',
    headers: authHeaders,
  });
  const data = await readJsonResponse<UserPreferences>(response);

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to load preferences.');
  }

  return data;
}

export async function setLastSelectedCompanyId(
  lastSelectedCompanyId: string | null,
) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(clientEnv.preferencesApiUrl, {
    method: 'PATCH',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ lastSelectedCompanyId }),
  });
  const data = await readJsonResponse<UserPreferences>(response);

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to save preferences.');
  }

  return data;
}
