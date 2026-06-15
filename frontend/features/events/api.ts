import { clientEnv } from '@/config/env';
import { getAuthHeaders } from '@/features/auth/supabase';

export type AiEventStatus = 'scheduled' | 'cancelled';

export type AiEvent = {
  id: string;
  companyId: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  location: string | null;
  meetingUrl: string | null;
  status: AiEventStatus;
  createdBy: string;
  creatorName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EventInput = {
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  timezone: string;
  location?: string | null;
  meetingUrl?: string | null;
  status?: AiEventStatus;
};

type EventsResponse = {
  events?: AiEvent[];
  event?: AiEvent;
  ok?: boolean;
  error?: string;
};

async function readJsonResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

function eventsUrl(companyId: string, eventId?: string, suffix = '') {
  const encodedCompanyId = encodeURIComponent(companyId);
  const base = `${clientEnv.eventsApiBaseUrl.replace(/\/+$/, '')}/${encodedCompanyId}/events`;

  return eventId ? `${base}/${encodeURIComponent(eventId)}${suffix}` : base;
}

export async function listAiEvents(companyId: string) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(eventsUrl(companyId), {
    method: 'GET',
    headers: authHeaders,
  });
  const data = await readJsonResponse<EventsResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to load events.');
  }

  return data.events ?? [];
}

export async function createAiEvent(companyId: string, input: EventInput) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(eventsUrl(companyId), {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const data = await readJsonResponse<EventsResponse>(response);

  if (!response.ok || !data.event) {
    throw new Error(data.error ?? 'Failed to create event.');
  }

  return data.event;
}

export async function updateAiEvent(
  companyId: string,
  eventId: string,
  input: Partial<EventInput>,
) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(eventsUrl(companyId, eventId), {
    method: 'PATCH',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const data = await readJsonResponse<EventsResponse>(response);

  if (!response.ok || !data.event) {
    throw new Error(data.error ?? 'Failed to update event.');
  }

  return data.event;
}

export async function cancelAiEvent(companyId: string, eventId: string) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(eventsUrl(companyId, eventId, '/cancel'), {
    method: 'POST',
    headers: authHeaders,
  });
  const data = await readJsonResponse<EventsResponse>(response);

  if (!response.ok || !data.event) {
    throw new Error(data.error ?? 'Failed to cancel event.');
  }

  return data.event;
}

export async function deleteAiEvent(companyId: string, eventId: string) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(eventsUrl(companyId, eventId), {
    method: 'DELETE',
    headers: authHeaders,
  });
  const data = await readJsonResponse<EventsResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to delete event.');
  }

  return data.event ?? null;
}
