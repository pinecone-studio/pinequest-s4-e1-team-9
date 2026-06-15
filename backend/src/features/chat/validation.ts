import { z } from 'zod';
import { env } from '../../config/env.js';
import { DocumentProcessingError } from '../documents/types.js';
import type { ChatMessage } from './types.js';

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(env.maxChatMessageChars),
});

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const chatRequestSchema = z.object({
  companyId: z.string().regex(uuidPattern),
  conversationId: z.string().regex(uuidPattern).nullable().optional(),
  messages: z
    .array(chatMessageSchema)
    .min(1)
    .max(env.maxChatHistoryMessages)
    .refine((messages) => messages[messages.length - 1]?.role === 'user'),
});

export type ValidatedChatRequest = {
  companyId: string;
  conversationId: string | null;
  messages: ChatMessage[];
};

export function validateChatRequestBody(body: unknown): ValidatedChatRequest {
  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new DocumentProcessingError(
      'Invalid chat request. A valid company id and non-empty messages are required.',
      400,
    );
  }

  return {
    companyId: parsed.data.companyId,
    conversationId: parsed.data.conversationId ?? null,
    messages: parsed.data.messages,
  };
}
