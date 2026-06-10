import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson } from '../server/errors.js';

export function handleHealthRoute(
  req: IncomingMessage,
  res: ServerResponse,
  headers: Record<string, string>,
) {
  const host = req.headers.host || 'localhost';
  const requestUrl = new URL(req.url || '/', `http://${host}`);

  if (
    req.method === 'GET' &&
    (requestUrl.pathname === '/' || requestUrl.pathname === '/health')
  ) {
    sendJson(res, 200, { ok: true, service: 'backend' }, headers);
    return true;
  }

  return false;
}
