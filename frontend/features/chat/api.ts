import { clientEnv } from '@/config/env';
import { getAuthHeaders } from '@/features/auth/supabase';
import type {
  ChatConversationApi,
  ChatConversationsResponse,
  ChatHistoryMessageApi,
  ChatApiMessage,
  ChatMessagesResponse,
  ChatResponse,
  Conversation,
  DeleteConversationResponse,
  Message,
} from '@/shared/types/chat';

const chatApiBaseUrl = clientEnv.chatApiUrl.replace(/\/+$/, '');
const conversationIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidConversationId(value: unknown): value is string {
  return typeof value === 'string' && conversationIdPattern.test(value);
}

function toApiMessages(messages: Message[]): ChatApiMessage[] {
  return messages
    .slice(-clientEnv.maxChatHistoryMessages)
    .filter((message) => message.content.trim().length > 0)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

function toTimestamp(value: string) {
  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : Date.now();
}

function toConversation(
  conversation: ChatConversationApi,
): Conversation | null {
  if (!isValidConversationId(conversation.id)) {
    return null;
  }

  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: toTimestamp(conversation.createdAt),
    updatedAt: toTimestamp(conversation.updatedAt),
    latestMessagePreview: conversation.latestMessagePreview,
    document: conversation.document ?? null,
    messages: [],
  };
}

function toMessage(message: ChatHistoryMessageApi): Message {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    citations: message.citations ?? [],
  };
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
): Promise<ChatResponse> {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(clientEnv.chatApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({
      conversationId: conversationId || null,
      messages: toApiMessages(messages),
    }),
  });

  const rawData = await readJsonResponse<any>(response);

  if (!response.ok) {
    throw new Error(rawData?.error ?? 'Request failed.');
  }

  return {
    reply: rawData.reply || 'Хариулт олдсонгүй.',
    citations: rawData.citations ?? [],
    retrieval: rawData.retrieval,
    warnings: rawData.warnings ?? [],
  } as ChatResponse;
}
