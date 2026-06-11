import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import { handleChatRoute } from '../routes/chat.route.js';
import { handleHealthRoute } from '../routes/health.route.js';
import { handleUploadRoute } from '../routes/upload.route.js';
import { createCorsHeaders, isAllowedCorsOrigin } from './cors.js';
import { sendJson } from './errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    if (req.url && req.url.startsWith('/uploads/') && req.method === 'GET') {
      const cleanUrl = req.url.split('?')[0].split('#')[0];
      const relativePath = cleanUrl.replace('/uploads/', '');

      const filePath = path.join(__dirname, '../../uploads', relativePath);

      try {
        if (fs.existsSync(filePath)) {
          res.writeHead(200, {
            ...corsHeaders,
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline',
          });

          const fileStream = fs.createReadStream(filePath);
          fileStream.pipe(res);
          return;
        } else {
          sendJson(res, 404, { error: 'File not found.' }, corsHeaders);
          return;
        }
      } catch (error) {
        sendJson(
          res,
          500,
          { error: 'Internal server error while serving file.' },
          corsHeaders,
        );
        return;
      }
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
