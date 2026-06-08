import type { ChatMessage, Prisma } from '../generated/prisma/client.js';
import prisma from './prisma.js';

export type ChatMessageRole = 'user' | 'assistant';

type CreateChatMessageInput = {
  userId: string;
  conversationId?: string | null;
  role: ChatMessageRole;
  content: string;
  metadata?: unknown;
};

type GetChatMessagesOptions = {
  conversationId?: string | null;
  limit?: number;
};

export const createChatMessage = async (input: CreateChatMessageInput) => {
  const message = await prisma.chatMessage.create({
    data: {
      userId: input.userId,
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
  options: GetChatMessagesOptions = {},
) => {
  const messages = await prisma.chatMessage.findMany({
    where: {
      userId,
      conversationId: options.conversationId ?? undefined,
    },
    orderBy: { createdAt: 'desc' },
    take: options.limit ?? 12,
  });

  return messages.reverse();
};

export const deleteConversationMessages = async (
  userId: string,
  conversationId?: string | null,
) => {
  const result = await prisma.chatMessage.deleteMany({
    where: {
      userId,
      conversationId: conversationId ?? undefined,
    },
  });

  return result;
};

export const serializeChatMessage = (message: ChatMessage) => {
  return {
    ...message,
    createdAt: message.createdAt.toISOString(),
  };
};
