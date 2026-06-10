import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { env } from '../config/env.js';
import { handleChatRoute } from '../routes/chat.route.js';
import { handleHealthRoute } from '../routes/health.route.js';
import { handleUploadRoute } from '../routes/upload.route.js';
import { createCorsHeaders, isAllowedCorsOrigin } from './cors.js';
import { sendJson } from './errors.js';

type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  headers: Record<string, string>,
) => Promise<boolean> | boolean;

const routeHandlers: RouteHandler[] = [
  handleHealthRoute,
  handleUploadRoute,
  handleChatRoute,
];

export function startHttpServer(port = env.port, host = env.host) {
  const server = createServer(async (req, res) => {
    const requestOrigin = Array.isArray(req.headers.origin)
      ? req.headers.origin[0]
      : req.headers.origin;
    const corsHeaders = createCorsHeaders(requestOrigin);

    if (!isAllowedCorsOrigin(requestOrigin)) {
      sendJson(res, 403, { error: 'Origin is not allowed.' }, corsHeaders);
      return;
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders);
      res.end();
      return;
    }

    for (const handler of routeHandlers) {
      if (await handler(req, res, corsHeaders)) {
        return;
      }
    }

    sendJson(res, 404, { error: 'Not found.' }, corsHeaders);
  });

  server.listen(port, host, () => {
    console.log(`Chatbot backend listening on http://${host}:${port}`);
  });

  return server;
}
