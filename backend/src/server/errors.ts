import type { IncomingMessage, ServerResponse } from 'node:http';

export async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
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
