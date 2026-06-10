import { clientEnv } from '@/config/env';
import { getAuthHeaders } from '@/features/auth/supabase';
import type {
  ChatApiMessage,
  ChatResponse,
  Message,
} from '@/shared/types/chat';

function toApiMessages(messages: Message[]): ChatApiMessage[] {
  return messages
    .slice(-clientEnv.maxChatHistoryMessages)
    .filter((message) => message.content.trim().length > 0)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

export async function sendChatMessages(
  messages: Message[],
  conversationId: string,
) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(clientEnv.chatApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({
      conversationId,
      messages: toApiMessages(messages),
    }),
  });

  const data = await readJsonResponse<ChatResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? 'Request failed.');
  }

  return data;
}
