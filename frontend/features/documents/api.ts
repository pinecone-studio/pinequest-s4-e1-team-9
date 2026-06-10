import { clientEnv } from '@/config/env';
import { getAuthHeaders } from '@/features/auth/supabase';
import type { UploadDocumentResponse } from '@/shared/types/documents';

async function readJsonResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const authHeaders = await getAuthHeaders();

  const response = await fetch(clientEnv.uploadApiUrl, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  });

  const data = await readJsonResponse<UploadDocumentResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to upload PDF.');
  }

  return data;
}
