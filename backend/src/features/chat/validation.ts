import { z } from 'zod';
import { env } from '../../config/env.js';
import { DocumentProcessingError } from '../documents/types.js';
import type { ChatMessage } from './types.js';

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(env.maxChatMessageChars),
});

const chatRequestSchema = z.object({
  conversationId: z.string().uuid().nullable().optional(),
  messages: z
    .array(chatMessageSchema)
    .min(1)
    .max(env.maxChatHistoryMessages)
    .refine((messages) => messages[messages.length - 1]?.role === 'user'),
});

export type ValidatedChatRequest = {
  conversationId: string | null;
  messages: ChatMessage[];
};

export function validateChatRequestBody(body: unknown): ValidatedChatRequest {
  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new DocumentProcessingError(
      'Invalid chat request. Messages must be non-empty, within length limits, and use a valid conversation id.',
      400,
    );
  }

  return {
    conversationId: parsed.data.conversationId ?? null,
    messages: parsed.data.messages,
  };
}
