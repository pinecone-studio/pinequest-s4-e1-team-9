import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import type { DocumentInterface } from '@langchain/core/documents';
import type { BaseMessage } from '@langchain/core/messages';
import { ChatGroq } from '@langchain/groq';
import * as dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { getSupabaseRetriever, ingestPDF } from './ingest.ts';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Readable } from 'node:stream';

dotenv.config();

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

const model = new ChatGroq({
  model: process.env.GROQ_CHAT_MODEL || 'llama-3.3-70b-versatile',
  temperature: 0,
});

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

function createFetchHeaders(req: IncomingMessage) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }

  return headers;
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === 'object' &&
    value !== null &&
    'arrayBuffer' in value &&
    typeof value.arrayBuffer === 'function'
  );
}

async function saveUploadedFile(req: IncomingMessage, uploadDir: string) {
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const request = new Request(
    `http://${req.headers.host || 'localhost'}/upload`,
    {
      method: req.method,
      headers: createFetchHeaders(req),
      body: Readable.toWeb(req) as ReadableStream<Uint8Array>,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' },
  );

  const formData = await request.formData();
  const file = formData.get('file');

  if (!isUploadedFile(file)) {
    return null;
  }

  const extension = path.extname(file.name || '').toLowerCase() || '.pdf';
  const filepath = path.join(uploadDir, `${randomUUID()}${extension}`);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (!buffer.length) {
    return null;
  }

  await fs.promises.writeFile(filepath, buffer);
  return filepath;
}

export async function generateChatResponse(messages: ChatMessage[]) {
  if (!messages.length) {
    throw new Error('At least one message is required.');
  }

  const userQuery = messages[messages.length - 1].content;
  const retriever = getSupabaseRetriever();

  let context = '';
  try {
    const retrievedDocs = (await retriever.invoke(
      userQuery,
    )) as DocumentInterface[];
    context = retrievedDocs
      .map((doc, i) => `[Source ${i + 1}]: ${doc.pageContent}`)
      .join('\n\n');
  } catch (error) {
    console.error('Error retrieving documents:', error);
  }

  const augmentedSystemPrompt = new SystemMessage(
    `You are a helpful AI assistant for company documents. 
    Use the following pieces of retrieved context to answer the user's question.
    If you don't know the answer based on the context, just say that you don't know.
    
    Context:
    ${context || 'No relevant document context found.'}
    
    Please provide citations in your response using the [Source X] format when using the context.`,
  );

  try {
    const response = await model.invoke([
      augmentedSystemPrompt,
      ...toLangChainMessages(messages),
    ]);

    return contentToText(response.content);
  } catch (error) {
    console.error('Error generating chat response:', error);
    if (error instanceof Error && error.message.includes('429')) {
      return 'I am currently experiencing high demand and have exceeded my usage quota. Please try again in a moment.';
    }
    throw error;
  }
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
    const host = req.headers.host || 'localhost';
    const requestUrl = new URL(req.url || '/', `http://${host}`);

    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders);
      res.end();
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/health') {
      sendJson(res, 200, { ok: true }, corsHeaders);
      return;
    }

    if (req.method === 'POST' && requestUrl.pathname === '/upload') {
      const uploadDir = path.join(process.cwd(), 'uploads');
      let filepath: string | null = null;

      try {
        filepath = await saveUploadedFile(req, uploadDir);

        if (!filepath) {
          sendJson(res, 400, { error: 'No file uploaded.' }, corsHeaders);
          return;
        }

        await ingestPDF(filepath);
        sendJson(res, 200, { ok: true }, corsHeaders);
      } catch (error) {
        console.error('Upload or ingestion error:', error);
        sendJson(
          res,
          500,
          {
            error:
              error instanceof Error ? error.message : 'Failed to process PDF.',
          },
          corsHeaders,
        );
      } finally {
        if (filepath) {
          await fs.promises.unlink(filepath).catch(() => undefined);
        }
      }
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
      sendJson(
        res,
        500,
        { error: 'Failed to generate response.' },
        corsHeaders,
      );
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
