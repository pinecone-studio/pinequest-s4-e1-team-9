import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import * as dotenv from 'dotenv';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { getSupabaseRetriever, ingestPDF } from './ingest.ts';
import formidable from 'formidable';
import * as fs from 'node:fs';
import * as path from 'node:path';

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

  const userQuery = messages[messages.length - 1].content;
  const retriever = getSupabaseRetriever();

  let context = '';
  try {
    const retrievedDocs = await retriever.invoke(userQuery);
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

  const response = await model.invoke([
    augmentedSystemPrompt,
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
      const form = formidable({
        uploadDir,
        keepExtensions: true,
      });

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      form.parse(req, async (err, _fields, files) => {
        if (err) {
          console.error('Upload error:', err);
          sendJson(res, 500, { error: 'Failed to upload file.' }, corsHeaders);
          return;
        }

        const fileArray = files.file;
        const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

        if (!file || !('filepath' in file)) {
          sendJson(res, 400, { error: 'No file uploaded.' }, corsHeaders);
          return;
        }

        try {
          await ingestPDF(file.filepath);
          sendJson(res, 200, { ok: true }, corsHeaders);
        } catch (error) {
          console.error('Ingestion error:', error);
          sendJson(
            res,
            500,
            {
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to process PDF.',
            },
            corsHeaders,
          );
        } finally {
          try {
            if (file.filepath && fs.existsSync(file.filepath)) {
              fs.unlinkSync(file.filepath);
            }
          } catch (e) {
            // ignore
          }
        }
      });
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
