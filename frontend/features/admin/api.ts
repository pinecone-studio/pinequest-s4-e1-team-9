import { clientEnv } from '@/config/env';
import { getAuthHeaders } from '@/features/auth/supabase';
import type {
  AiDocumentsResponse,
  AdminUploadResponse,
  Company,
  CompanyAccess,
  CompanyMembersResponse,
  CreateCompanyInput,
  UpdateAiSetupInput,
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

function adminUrl(suffix = '') {
  return `${clientEnv.adminCompaniesApiUrl}${suffix}`;
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

export async function listAdminDocuments(companyId: string) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(companyUrl(companyId, '/documents'), {
    method: 'GET',
    headers: authHeaders,
  });

  const data = await readJsonResponse<AiDocumentsResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to load documents.');
  }

  return data.documents ?? [];
}

export async function deleteAdminDocument(
  companyId: string,
  documentId: string,
) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(
    companyUrl(
      companyId,
      `/documents/${encodeURIComponent(documentId)}`,
    ),
    {
      method: 'DELETE',
      headers: authHeaders,
    },
  );

  const data = await readJsonResponse<AdminUploadResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to remove document.');
  }

  return data.document ?? null;
}

export async function removeCompanyMember(
  companyId: string,
  userId: string,
) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(
    companyUrl(companyId, `/members/${encodeURIComponent(userId)}`),
    {
      method: 'DELETE',
      headers: authHeaders,
    },
  );

  const data = await readJsonResponse<{ ok?: boolean; error?: string }>(
    response,
  );

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to remove member.');
  }

  return data;
}

export async function archiveCompany(companyId: string) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(companyUrl(companyId), {
    method: 'DELETE',
    headers: authHeaders,
  });

  const data = await readJsonResponse<{ ok?: boolean; error?: string }>(
    response,
  );

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to archive AI.');
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

export async function listCompanyMembers(companyId: string) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(companyUrl(companyId, '/members'), {
    method: 'GET',
    headers: authHeaders,
  });

  const data = await readJsonResponse<CompanyMembersResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to load members.');
  }

  return data.members ?? [];
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

export async function createAiDraft() {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(adminUrl('/drafts'), {
    method: 'POST',
    headers: authHeaders,
  });

  const data = await readJsonResponse<Company | { error?: string }>(response);

  if (!response.ok || !('id' in data)) {
    throw new Error(
      'error' in data
        ? (data.error ?? 'Failed to create AI draft.')
        : 'Failed to create AI draft.',
    );
  }

  return data;
}

export async function getAiSetup(companyId: string) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(companyUrl(companyId, '/setup'), {
    method: 'GET',
    headers: authHeaders,
  });

  const data = await readJsonResponse<CompanyAccess | { error?: string }>(
    response,
  );

  if (!response.ok || !('company' in data)) {
    throw new Error(
      'error' in data
        ? (data.error ?? 'Failed to load AI setup.')
        : 'Failed to load AI setup.',
    );
  }

  return data;
}

export async function updateAiSetup(
  companyId: string,
  input: UpdateAiSetupInput,
) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(companyUrl(companyId, '/setup'), {
    method: 'PATCH',
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
        ? (data.error ?? 'Failed to save AI setup.')
        : 'Failed to save AI setup.',
    );
  }

  return data;
}

export async function finalizeAiSetup(
  companyId: string,
  options: { allowIncomplete?: boolean } = {},
) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(companyUrl(companyId, '/finalize'), {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  const data = await readJsonResponse<Company | { error?: string }>(response);

  if (!response.ok || !('id' in data)) {
    throw new Error(
      'error' in data
        ? (data.error ?? 'Failed to create AI.')
        : 'Failed to create AI.',
    );
  }

  return data;
}
