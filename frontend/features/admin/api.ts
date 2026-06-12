import { clientEnv } from '@/config/env';
import { getAuthHeaders } from '@/features/auth/supabase';
import type {
  AdminUploadResponse,
  Company,
  CompanyAccess,
  CreateCompanyInput,
} from './types';

async function readJsonResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

function companyUrl(companyId: string, suffix = '') {
  return `${clientEnv.adminCompaniesApiUrl}/${encodeURIComponent(companyId)}${suffix}`;
}

export async function uploadAdminDocument(file: File, companyId: string) {
  const formData = new FormData();
  formData.append('file', file);
  const authHeaders = await getAuthHeaders();

  const response = await fetch(companyUrl(companyId, '/documents'), {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  });

  const data = await readJsonResponse<AdminUploadResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to upload PDF.');
  }

  return data;
}

export async function getCompanyAccess(companyId: string) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(companyUrl(companyId, '/access'), {
    method: 'GET',
    headers: authHeaders,
  });

  const data = await readJsonResponse<CompanyAccess>(response);

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to check company access.');
  }

  return data;
}

export async function listCompanies() {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(clientEnv.adminCompaniesApiUrl, {
    method: 'GET',
    headers: authHeaders,
  });

  const data = await readJsonResponse<Company[] | { error?: string }>(response);

  if (!response.ok || !Array.isArray(data)) {
    throw new Error(
      Array.isArray(data)
        ? 'Failed to fetch companies.'
        : (data.error ?? 'Failed to fetch companies.'),
    );
  }

  return data;
}

export async function createCompany(input: CreateCompanyInput) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(clientEnv.adminCompaniesApiUrl, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data = await readJsonResponse<Company | { error?: string }>(response);

  if (!response.ok || !('id' in data)) {
    throw new Error(
      'error' in data
        ? (data.error ?? 'Failed to create company.')
        : 'Failed to create company.',
    );
  }

  return data;
}
