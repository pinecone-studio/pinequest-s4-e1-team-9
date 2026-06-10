import type { IncomingMessage, ServerResponse } from 'node:http';
import { DocumentProcessingError } from '../features/documents/types.js';

type ReadJsonBodyOptions = {
  maxBytes?: number;
};

export async function readJsonBody<T>(
  req: IncomingMessage,
  options: ReadJsonBodyOptions = {},
): Promise<T> {
  const chunks: Buffer[] = [];
  let sizeBytes = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    sizeBytes += buffer.length;

    if (options.maxBytes && sizeBytes > options.maxBytes) {
      throw new DocumentProcessingError('Request body is too large.', 413);
    }

    chunks.push(buffer);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
  } catch {
    throw new DocumentProcessingError('Invalid JSON request body.', 400);
  }
}

export function sendJson(
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
