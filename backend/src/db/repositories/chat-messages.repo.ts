import type { ChatMessage, Prisma } from '../../generated/prisma/client.js';
import type {
  ChatConversationSummary,
  ChatMessageHistoryItem,
  ChatRole,
} from '../../features/chat/types.js';
import prisma from '../prisma.js';

export type ChatMessageRole = ChatRole;

type CreateChatMessageInput = {
  userId: string;
  companyId: string;
  conversationId?: string | null;
  role: ChatMessageRole;
  content: string;
  metadata?: unknown;
};

type GetChatMessagesOptions = {
  companyId: string;
  conversationId?: string | null;
  limit?: number;
};

const CONVERSATION_TITLE_CHARS = 60;
const MESSAGE_PREVIEW_CHARS = 120;

function compactText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function trimPreview(text: string, maxChars: number) {
  const normalized = compactText(text);

  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxChars - 1)).trim()}...`;
}

function normalizeRole(role: string): ChatRole {
  return role === 'user' ? 'user' : 'assistant';
}

function getCitations(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object' || !('citations' in metadata)) {
    return undefined;
  }

  const citations = (metadata as { citations?: unknown }).citations;

  return Array.isArray(citations) ? citations : undefined;
}

function getEventSources(metadata: unknown) {
  if (
    !metadata ||
    typeof metadata !== 'object' ||
    !('eventSources' in metadata)
  ) {
    return undefined;
  }

  const eventSources = (metadata as { eventSources?: unknown }).eventSources;

  return Array.isArray(eventSources) ? eventSources : undefined;
}

function getDocumentReference(messages: ChatMessage[]) {
  for (const message of [...messages].reverse()) {
    const citations = getCitations(message.metadata);
    const citation = citations?.find(
      (item) =>
        item &&
        typeof item === 'object' &&
        'documentId' in item &&
        typeof (item as { documentId?: unknown }).documentId === 'string',
    );

    if (!citation || typeof citation !== 'object') {
      continue;
    }

    const documentId = (citation as { documentId: string }).documentId;
    const filename = (citation as { filename?: unknown }).filename;

    return {
      id: documentId,
      filename: typeof filename === 'string' ? filename : null,
    };
  }

  return null;
}

function summarizeConversation(
  conversationId: string,
  messages: ChatMessage[],
): ChatConversationSummary | null {
  if (!messages.length) {
    return null;
  }

  const firstMessage = messages[0];
  const latestMessage = messages[messages.length - 1];
  const firstUserMessage =
    messages.find((message) => message.role === 'user') ?? firstMessage;

  return {
    id: conversationId,
    title:
      trimPreview(firstUserMessage.content, CONVERSATION_TITLE_CHARS) ||
      'New chat',
    createdAt: firstMessage.createdAt.toISOString(),
    updatedAt: latestMessage.createdAt.toISOString(),
    latestMessagePreview: trimPreview(
      latestMessage.content,
      MESSAGE_PREVIEW_CHARS,
    ),
    document: getDocumentReference(messages),
  };
}

export const createChatMessage = async (input: CreateChatMessageInput) => {
  const message = await prisma.chatMessage.create({
    data: {
      userId: input.userId,
      companyId: input.companyId,
      conversationId: input.conversationId ?? null,
      role: input.role,
      content: input.content.trim(),
      metadata:
        input.metadata as Prisma.ChatMessageUncheckedCreateInput['metadata'],
    },
  });

  return message;
};

export const createChatMessages = async (inputs: CreateChatMessageInput[]) => {
  if (!inputs.length) {
    return { count: 0 };
  }

  const result = await prisma.chatMessage.createMany({
    data: inputs.map((input) => ({
      userId: input.userId,
      companyId: input.companyId,
      conversationId: input.conversationId ?? null,
      role: input.role,
      content: input.content.trim(),
      metadata:
        input.metadata as Prisma.ChatMessageUncheckedCreateInput['metadata'],
    })),
  });

  return result;
};

export const getRecentChatMessages = async (
  userId: string,
  options: GetChatMessagesOptions,
) => {
  const messages = await prisma.chatMessage.findMany({
    where: {
      userId,
      companyId: options.companyId,
      conversationId: options.conversationId ?? undefined,
    },
    orderBy: { createdAt: 'desc' },
    take: options.limit ?? 12,
  });

  return messages.reverse();
};

export const conversationExistsForUser = async (
  userId: string,
  companyId: string,
  conversationId: string,
) => {
  const count = await prisma.chatMessage.count({
    where: {
      userId,
      companyId,
      conversationId,
    },
  });

  return count > 0;
};

export const getConversationMessages = async (
  userId: string,
  companyId: string,
  conversationId: string,
): Promise<ChatMessageHistoryItem[]> => {
  const messages = await prisma.chatMessage.findMany({
    where: {
      userId,
      companyId,
      conversationId,
    },
    orderBy: { createdAt: 'asc' },
  });

  return messages.map(serializeChatMessage);
};

export const getConversationSummary = async (
  userId: string,
  companyId: string,
  conversationId: string,
) => {
  const messages = await prisma.chatMessage.findMany({
    where: {
      userId,
      companyId,
      conversationId,
    },
    orderBy: { createdAt: 'asc' },
  });

  return summarizeConversation(conversationId, messages);
};

export const listUserConversations = async (
  userId: string,
  companyId: string,
  limit = 100,
): Promise<ChatConversationSummary[]> => {
  // Get the most recent conversations for the user
  const recentGroups = await prisma.chatMessage.groupBy({
    by: ['conversationId'],
    where: {
      userId,
      companyId,
      conversationId: { not: null },
    },
    _max: {
      createdAt: true,
    },
    orderBy: {
      _max: {
        createdAt: 'desc',
      },
    },
    take: limit,
  });

  const ids = recentGroups
    .map((g) => g.conversationId)
    .filter((id): id is string => id !== null);

  if (ids.length === 0) {
    return [];
  }

  // Fetch messages for these specific conversations only
  const messages = await prisma.chatMessage.findMany({
    where: {
      userId,
      companyId,
      conversationId: { in: ids },
    },
    orderBy: { createdAt: 'asc' },
  });

  const groupedMessages = new Map<string, ChatMessage[]>();

  for (const message of messages) {
    if (!message.conversationId) {
      continue;
    }

    const conversationMessages = groupedMessages.get(message.conversationId);

    if (conversationMessages) {
      conversationMessages.push(message);
    } else {
      groupedMessages.set(message.conversationId, [message]);
    }
  }

  return ids
    .flatMap((conversationId) => {
      const conversationMessages = groupedMessages.get(conversationId);
      if (!conversationMessages) return [];

      const summary = summarizeConversation(
        conversationId,
        conversationMessages,
      );

      return summary ? [summary] : [];
    })
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() -
        new Date(left.updatedAt).getTime(),
    );
};

export const deleteConversationMessages = async (
  userId: string,
  companyId: string,
  conversationId?: string | null,
) => {
  const result = await prisma.chatMessage.deleteMany({
    where: {
      userId,
      companyId,
      conversationId: conversationId ?? undefined,
    },
  });

  return result;
};

export const serializeChatMessage = (
  message: ChatMessage,
): ChatMessageHistoryItem => {
  return {
    id: message.id,
    role: normalizeRole(message.role),
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    citations: getCitations(message.metadata),
    eventSources: getEventSources(message.metadata),
  };
};
