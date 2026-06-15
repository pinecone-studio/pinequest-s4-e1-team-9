import { clientEnv } from '@/config/env';
import { getAuthHeaders } from '@/features/auth/supabase';
import type { AiConfiguration, CompanyMember } from '@/features/companies/types';

export type InviteMetadata = {
  id: string;
  companyId: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  isActive: boolean;
};

export type InviteRedemption = {
  id: string;
  inviteId: string;
  companyId: string;
  userId: string;
  name?: string | null;
  redeemedAt: string;
};

export type InvitePreview = {
  invite: InviteMetadata;
  company: {
    id: string;
    name: string;
    description?: string | null;
    useCaseType?: string;
    aiConfiguration?: AiConfiguration | null;
    documentCount?: number;
    memberCount?: number;
  };
  ownerUserId?: string | null;
  ownerName?: string | null;
  error?: string;
};

export type InviteRedemptionResponse = {
  alreadyMember: boolean;
  membership: CompanyMember;
  redemption: InviteRedemption | null;
  company: InvitePreview['company'] & {
    setupStatus?: string;
  };
  error?: string;
};

export type ActiveInviteResponse = {
  activeInvite: InviteMetadata | null;
  recentRedemptions: InviteRedemption[];
  error?: string;
};

export type CreatedInviteResponse = {
  invite: InviteMetadata;
  code: string;
  link: string;
};

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

function companyInviteUrl(companyId: string) {
  return `${clientEnv.companiesApiUrl.replace(/\/+$/, '')}/${encodeURIComponent(companyId)}/invite`;
}

export async function getActiveInvite(companyId: string) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(companyInviteUrl(companyId), {
    method: 'GET',
    headers: authHeaders,
  });
  const data = await readJsonResponse<ActiveInviteResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to load invitation.');
  }

  return data;
}

export async function createInvite(companyId: string) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(companyInviteUrl(companyId), {
    method: 'POST',
    headers: authHeaders,
  });
  const data = await readJsonResponse<CreatedInviteResponse & ApiError>(
    response,
  );

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to generate invitation.');
  }

  return data;
}

export async function revokeInvite(companyId: string) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(companyInviteUrl(companyId), {
    method: 'DELETE',
    headers: authHeaders,
  });
  const data = await readJsonResponse<{ ok?: boolean; error?: string }>(
    response,
  );

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to revoke invitation.');
  }

  return data;
}

export async function previewInvite(code: string) {
  const response = await fetch(`${clientEnv.invitesApiUrl}/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });
  const data = await readJsonResponse<InvitePreview & ApiError>(response);

  if (!response.ok) {
    throw new Error(data.error ?? 'Invitation is unavailable.');
  }

  return data;
}

export async function redeemInvite(code: string) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${clientEnv.invitesApiUrl}/redeem`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });
  const data = await readJsonResponse<InviteRedemptionResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to join AI.');
  }

  return data;
}
