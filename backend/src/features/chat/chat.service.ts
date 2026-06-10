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
  userId?: string;
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

export function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const message = value as Partial<ChatMessage>;

  return (
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    message.content.trim().length > 0
  );
}

export async function generateChatResponse(
  messages: ChatMessage[],
  options: GenerateChatResponseOptions = {},
): Promise<ChatResponseResult> {
  if (!messages.length) {
    throw new Error('At least one message is required.');
  }

  const budgetedMessages = getBudgetedMessages(messages);
  const userQuery = budgetedMessages[budgetedMessages.length - 1].content;
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

    return createResult({
      reply: contentToText(response.content).trim() || 'No response.',
      citations: ragContext.citations,
      sourceCount: ragContext.sourceCount,
      retrievalFailed,
      contextTruncated: ragContext.truncated,
      warnings,
    });
  } catch (error) {
    console.error('Error generating chat response:', error);
    if (error instanceof Error && error.message.includes('429')) {
      return createResult({
        reply:
          'I am currently experiencing high demand and have exceeded my usage quota. Please try again in a moment.',
        retrievalFailed,
        warnings: [...warnings, 'The chat model rate limit was reached.'],
      });
    }

    throw error;
  }
}
