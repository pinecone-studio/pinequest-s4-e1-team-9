import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import * as dotenv from 'dotenv';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

dotenv.config();

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash',
  temperature: 0,
});

const systemPrompt = new SystemMessage(
  'You are a helpful AI assistant. Answer clearly and concisely.',
);

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

function isChatMessage(value: unknown): value is ChatMessage {
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

export async function generateChatResponse(messages: ChatMessage[]) {
  if (!messages.length) {
    throw new Error('At least one message is required.');
  }

  const response = await model.invoke([
    systemPrompt,
    ...toLangChainMessages(messages),
  ]);

  return contentToText(response.content);
}

async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
}

function sendJson(
  res: ServerResponse,
  statusCode: number,
  body: unknown,
  headers: Record<string, string>,
) {
  res.writeHead(statusCode, {
    ...headers,
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(body));
}

export function startChatbotServer(port = Number(process.env.PORT || 4000)) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  const server = createServer(async (req, res) => {
    const requestUrl = new URL(req.url || '/', `http://${req.headers.host}`);

    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders);
      res.end();
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/health') {
      sendJson(res, 200, { ok: true }, corsHeaders);
      return;
    }

    if (req.method !== 'POST' || requestUrl.pathname !== '/chat') {
      sendJson(res, 404, { error: 'Not found.' }, corsHeaders);
      return;
    }

    try {
      const body = await readJsonBody<{ messages?: unknown }>(req);
      const messages = Array.isArray(body.messages) ? body.messages : [];

      if (!messages.length || !messages.every(isChatMessage)) {
        sendJson(res, 400, { error: 'Invalid messages payload.' }, corsHeaders);
        return;
      }

      const reply = await generateChatResponse(messages);
      sendJson(res, 200, { reply }, corsHeaders);
    } catch (error) {
      console.error(error);
      sendJson(res, 500, { error: 'Failed to generate response.' }, corsHeaders);
    }
  });

  server.listen(port, () => {
    console.log(`Chatbot backend listening on http://localhost:${port}`);
  });

  return server;
}

if (import.meta.main) {
  startChatbotServer();
}
