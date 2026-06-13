import { clientEnv } from '@/config/env';
import { getAuthHeaders } from '@/features/auth/supabase';
import type { Company, CompanyMember } from './types';

const companiesApiBaseUrl = clientEnv.companiesApiUrl.replace(/\/+$/, '');

type ApiError = {
  error?: string;
};

async function readJsonResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

export async function listUserCompanies() {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(companiesApiBaseUrl, {
    method: 'GET',
    headers: authHeaders,
  });

  const data = await readJsonResponse<Company[] | ApiError>(response);

  if (!response.ok || !Array.isArray(data)) {
    throw new Error(
      Array.isArray(data)
        ? 'Failed to fetch companies.'
        : (data.error ?? 'Failed to fetch companies.'),
    );
  }

  return data;
}

export async function joinCompanyByCode(invitationCode: string) {
  const code = invitationCode.trim();

  if (!code) {
    throw new Error('Invitation code is required.');
  }

  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${companiesApiBaseUrl}/join`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ invitationCode: code }),
  });

  const data = await readJsonResponse<CompanyMember | ApiError>(response);

  if (!response.ok || !('id' in data)) {
    throw new Error(
      'error' in data
        ? (data.error ?? 'Failed to join company.')
        : 'Failed to join company.',
    );
  }

  return data;
}
