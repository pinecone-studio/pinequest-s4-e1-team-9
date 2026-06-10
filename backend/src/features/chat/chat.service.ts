import { AIMessage, HumanMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import { createChatModel } from '../../ai/groq.js';
import { env } from '../../config/env.js';
import {
  buildRagContext,
  type RetrievedCitation,
} from '../retrieval/retriever.service.js';
import { createRagSystemMessage } from './prompt.js';
import type { ChatMessage } from './types.js';

type GenerateChatResponseOptions = {
  userId: string;
  conversationId?: string | null;
};

export type ChatResponseResult = {
  reply: string;
  citations: RetrievedCitation[];
  retrieval: {
    sourceCount: number;
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
  reply: string;
  citations?: RetrievedCitation[];
  sourceCount?: number;
  retrievalFailed?: boolean;
  contextTruncated?: boolean;
  warnings?: string[];
}): ChatResponseResult {
  return {
    reply: input.reply,
    citations: input.citations ?? [],
    retrieval: {
      sourceCount: input.sourceCount ?? input.citations?.length ?? 0,
      retrievalFailed: input.retrievalFailed ?? false,
      contextTruncated: input.contextTruncated ?? false,
    },
    warnings: input.warnings ?? [],
  };
}

async function persistChatExchange(input: {
  userId: string;
  conversationId?: string | null;
  userMessage: ChatMessage | undefined;
  result: ChatResponseResult;
}) {
  if (!input.userMessage || input.userMessage.role !== 'user') {
    return;
  }

  const { createChatMessages } =
    await import('../../db/repositories/chat-messages.repo.js');

  await createChatMessages([
    {
      userId: input.userId,
      conversationId: input.conversationId,
      role: 'user',
      content: input.userMessage.content,
    },
    {
      userId: input.userId,
      conversationId: input.conversationId,
      role: 'assistant',
      content: input.result.reply,
      metadata: {
        citations: input.result.citations,
        retrieval: input.result.retrieval,
        warnings: input.result.warnings,
      },
    },
  ]);
}

async function persistChatExchangeSafely(input: {
  userId: string;
  conversationId?: string | null;
  userMessage: ChatMessage | undefined;
  result: ChatResponseResult;
}) {
  try {
    await persistChatExchange(input);
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

  try {
    ragContext = await buildRagContext(userQuery, {
      userId: options.userId,
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
      }),
      ...toLangChainMessages(budgetedMessages),
    ]);

    const result = createResult({
      reply: contentToText(response.content).trim() || 'No response.',
      citations: ragContext.citations,
      sourceCount: ragContext.sourceCount,
      retrievalFailed,
      contextTruncated: ragContext.truncated,
      warnings,
    });

    await persistChatExchangeSafely({
      userId: options.userId,
      conversationId: options.conversationId,
      userMessage: latestMessage,
      result,
    });

    return result;
  } catch (error) {
    console.error('Error generating chat response:', error);
    if (error instanceof Error && error.message.includes('429')) {
      const result = createResult({
        reply:
          'I am currently experiencing high demand and have exceeded my usage quota. Please try again in a moment.',
        retrievalFailed,
        warnings: [...warnings, 'The chat model rate limit was reached.'],
      });

      await persistChatExchangeSafely({
        userId: options.userId,
        conversationId: options.conversationId,
        userMessage: latestMessage,
        result,
      });

      return result;
    }

    throw error;
  }
}
