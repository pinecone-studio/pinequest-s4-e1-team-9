import { randomUUID } from 'node:crypto';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import { createChatModel } from '../../ai/groq.js';
import { env } from '../../config/env.js';
import { DocumentProcessingError } from '../documents/types.js';
import {
  buildRagContext,
  type RetrievedCitation,
} from '../retrieval/retriever.service.js';
import { getCompanyBehavior } from '../companies/company.service.js';
import {
  buildChatEventContext,
  type EventSource,
} from '../events/event.service.js';
import { createRagSystemMessage } from './prompt.js';
import type { ChatConversationSummary, ChatMessage } from './types.js';

type GenerateChatResponseOptions = {
  userId: string;
  companyId: string;
  userName: string;
  conversationId?: string | null;
};

export type ChatResponseResult = {
  conversationId: string;
  conversation: ChatConversationSummary | null;
  reply: string;
  citations: RetrievedCitation[];
  eventSources: EventSource[];
  retrieval: {
    sourceCount: number;
    eventSourceCount: number;
    retrievalFailed: boolean;
    contextTruncated: boolean;
  };
  warnings: string[];
};

function trimText(text: string, maxChars: number) {
  const normalized = text.trim();

  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxChars - 1)).trim()}...`;
}

function getBudgetedMessages(messages: ChatMessage[]) {
  return messages.slice(-env.maxChatHistoryMessages).map((message) => ({
    ...message,
    content: trimText(message.content, env.maxChatMessageChars),
  }));
}

function toLangChainMessages(messages: ChatMessage[]): BaseMessage[] {
  return messages.map((message) =>
    message.role === 'assistant'
      ? new AIMessage(message.content)
      : new HumanMessage(message.content),
  );
}

function contentToText(content: unknown) {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }

        if (part && typeof part === 'object' && 'text' in part) {
          return String((part as { text?: unknown }).text ?? '');
        }

        return '';
      })
      .join('');
  }

  return String(content ?? '');
}

function createResult(input: {
  conversationId: string;
  reply: string;
  citations?: RetrievedCitation[];
  eventSources?: EventSource[];
  sourceCount?: number;
  eventSourceCount?: number;
  retrievalFailed?: boolean;
  contextTruncated?: boolean;
  warnings?: string[];
}): ChatResponseResult {
  return {
    conversationId: input.conversationId,
    conversation: null,
    reply: input.reply,
    citations: input.citations ?? [],
    eventSources: input.eventSources ?? [],
    retrieval: {
      sourceCount: input.sourceCount ?? input.citations?.length ?? 0,
      eventSourceCount:
        input.eventSourceCount ?? input.eventSources?.length ?? 0,
      retrievalFailed: input.retrievalFailed ?? false,
      contextTruncated: input.contextTruncated ?? false,
    },
    warnings: input.warnings ?? [],
  };
}

async function assertConversationBelongsToUser(
  userId: string,
  companyId: string,
  conversationId: string,
) {
  const { conversationExistsForUser } =
    await import('../../db/repositories/chat-messages.repo.js');

  const exists = await conversationExistsForUser(
    userId,
    companyId,
    conversationId,
  );

  if (!exists) {
    throw new DocumentProcessingError('Conversation not found.', 404);
  }
}

async function persistChatExchange(input: {
  userId: string;
  companyId: string;
  conversationId: string;
  userMessage: ChatMessage | undefined;
  result: ChatResponseResult;
}): Promise<ChatConversationSummary | null> {
  if (!input.userMessage || input.userMessage.role !== 'user') {
    return null;
  }

  const { createChatMessages, getConversationSummary } =
    await import('../../db/repositories/chat-messages.repo.js');

  await createChatMessages([
    {
      userId: input.userId,
      companyId: input.companyId,
      conversationId: input.conversationId,
      role: 'user',
      content: input.userMessage.content,
    },
    {
      userId: input.userId,
      companyId: input.companyId,
      conversationId: input.conversationId,
      role: 'assistant',
      content: input.result.reply,
      metadata: {
        citations: input.result.citations,
        eventSources: input.result.eventSources,
        retrieval: input.result.retrieval,
        warnings: input.result.warnings,
      },
    },
  ]);

  return getConversationSummary(
    input.userId,
    input.companyId,
    input.conversationId,
  );
}

async function persistChatExchangeSafely(input: {
  userId: string;
  companyId: string;
  conversationId: string;
  userMessage: ChatMessage | undefined;
  result: ChatResponseResult;
}) {
  try {
    input.result.conversation = await persistChatExchange(input);
  } catch (error) {
    input.result.warnings.push('Chat history could not be saved.');
    console.error('Error saving chat messages:', error);
  }
}

export async function generateChatResponse(
  messages: ChatMessage[],
  options: GenerateChatResponseOptions,
): Promise<ChatResponseResult> {
  if (!messages.length) {
    throw new Error('At least one message is required.');
  }

  if (!options.userId.trim()) {
    throw new Error('Chat responses require a user id.');
  }

  if (!options.companyId.trim()) {
    throw new Error('Chat responses require a company id.');
  }

  if (!options.userName.trim()) {
    throw new Error('Chat responses require a verified user name.');
  }

  const conversationId = options.conversationId ?? randomUUID();
  const behavior = await getCompanyBehavior(options.companyId);

  if (options.conversationId) {
    await assertConversationBelongsToUser(
      options.userId,
      options.companyId,
      conversationId,
    );
  }

  const budgetedMessages = getBudgetedMessages(messages);
  const latestMessage = budgetedMessages[budgetedMessages.length - 1];
  const userQuery = latestMessage.content;
  let ragContext = {
    context: '',
    citations: [] as RetrievedCitation[],
    sourceCount: 0,
    truncated: false,
  };
  let retrievalFailed = false;
  const warnings: string[] = [];
  const now = new Date();
  let eventContext = {
    context: 'Structured event retrieval was unavailable for this response.',
    eventSources: [] as EventSource[],
    eventRelated: false,
  };

  try {
    eventContext = await buildChatEventContext(
      options.companyId,
      userQuery,
      now,
    );
  } catch (error) {
    warnings.push('Event retrieval was unavailable for this response.');
    console.error('Error retrieving events:', error);
  }

  try {
    ragContext = await buildRagContext(userQuery, {
      userId: options.userId,
      companyId: options.companyId,
    });
  } catch (error) {
    retrievalFailed = true;
    warnings.push('Document retrieval was unavailable for this response.');
    console.error('Error retrieving documents:', error);
  }

  try {
    const model = createChatModel();
    const response = await model.invoke([
      createRagSystemMessage({
        context: ragContext.context,
        sourceCount: ragContext.sourceCount,
        retrievalFailed,
        systemInstructions: behavior.systemInstructions,
        eventContext: eventContext.context,
        eventSourceCount: eventContext.eventSources.length,
        eventRelated: eventContext.eventRelated,
        userName: options.userName,
        currentDateTime: now.toISOString(),
        currentTimezone:
          eventContext.eventSources[0]?.timezone ?? env.defaultEventTimezone,
      }),
      ...toLangChainMessages(budgetedMessages),
    ]);

    const result = createResult({
      conversationId,
      reply: contentToText(response.content).trim() || 'No response.',
      citations: ragContext.citations,
      eventSources: eventContext.eventSources,
      sourceCount: ragContext.sourceCount,
      eventSourceCount: eventContext.eventSources.length,
      retrievalFailed,
      contextTruncated: ragContext.truncated,
      warnings,
    });

    await persistChatExchangeSafely({
      userId: options.userId,
      companyId: options.companyId,
      conversationId,
      userMessage: latestMessage,
      result,
    });

    return result;
  } catch (error) {
    console.error('Error generating chat response:', error);
    if (error instanceof Error && error.message.includes('429')) {
      const result = createResult({
        conversationId,
        reply:
          'I am currently experiencing high demand and have exceeded my usage quota. Please try again in a moment.',
        eventSources: eventContext.eventSources,
        retrievalFailed,
        warnings: [...warnings, 'The chat model rate limit was reached.'],
      });

      await persistChatExchangeSafely({
        userId: options.userId,
        companyId: options.companyId,
        conversationId,
        userMessage: latestMessage,
        result,
      });

      return result;
    }

    throw error;
  }
}
