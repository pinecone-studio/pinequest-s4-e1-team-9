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
const chatConversationsUrl = `${chatApiBaseUrl}/conversations`;
const conversationIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ChatResponseApi = Omit<ChatResponse, 'conversation'> & {
  conversation?: ChatConversationApi | null;
  error?: string;
};

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
    eventSources: message.eventSources ?? [],
  };
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

function getConversationUrl(conversationId: string) {
  return `${chatConversationsUrl}/${encodeURIComponent(conversationId)}`;
}

function withCompanyId(url: string, companyId: string) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}companyId=${encodeURIComponent(companyId)}`;
}

export async function fetchChatConversations(
  companyId: string,
): Promise<Conversation[]> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(withCompanyId(chatConversationsUrl, companyId), {
    method: 'GET',
    headers: authHeaders,
  });

  const data = await readJsonResponse<ChatConversationsResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to load chat history.');
  }

  return (data.conversations ?? []).flatMap((conversation) => {
    const nextConversation = toConversation(conversation);

    return nextConversation ? [nextConversation] : [];
  });
}

export async function fetchConversationMessages(
  companyId: string,
  conversationId: string,
): Promise<Message[]> {
  if (!isValidConversationId(conversationId)) {
    throw new Error('Invalid conversation id.');
  }

  const authHeaders = await getAuthHeaders();
  const response = await fetch(
    withCompanyId(`${getConversationUrl(conversationId)}/messages`, companyId),
    {
      method: 'GET',
      headers: authHeaders,
    },
  );

  const data = await readJsonResponse<ChatMessagesResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to load conversation.');
  }

  return (data.messages ?? []).map(toMessage);
}

export async function deleteChatConversation(
  companyId: string,
  conversationId: string,
): Promise<DeleteConversationResponse> {
  if (!isValidConversationId(conversationId)) {
    throw new Error('Invalid conversation id.');
  }

  const authHeaders = await getAuthHeaders();
  const response = await fetch(
    withCompanyId(getConversationUrl(conversationId), companyId),
    {
      method: 'DELETE',
      headers: authHeaders,
    },
  );

  const data = await readJsonResponse<DeleteConversationResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to delete conversation.');
  }

  return data;
}

export async function sendChatMessages(
  companyId: string,
  messages: Message[],
  conversationId: string | null,
): Promise<ChatResponse> {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(clientEnv.chatApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({
      companyId,
      conversationId: conversationId || null,
      messages: toApiMessages(messages),
    }),
  });

  const rawData = await readJsonResponse<ChatResponseApi>(response);

  if (!response.ok) {
    throw new Error(rawData?.error ?? 'Request failed.');
  }

  const conversation = rawData.conversation
    ? toConversation(rawData.conversation)
    : null;
  const nextConversationId = isValidConversationId(rawData.conversationId)
    ? rawData.conversationId
    : conversation?.id;

  return {
    conversationId: nextConversationId,
    conversation,
    reply: rawData.reply || 'Хариулт олдсонгүй.',
    citations: rawData.citations ?? [],
    eventSources: rawData.eventSources ?? [],
    retrieval: rawData.retrieval,
    warnings: rawData.warnings ?? [],
  };
}
