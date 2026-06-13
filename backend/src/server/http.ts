import { createServer } from 'node:http';
import { handleChatHistoryRoute } from '../routes/chat-history.route.js';
import { handleChatRoute } from '../routes/chat.route.js';
import { handleUploadRoute } from '../routes/upload.route.js';
import { handleDocumentPdfUrlRoute } from '../routes/document.route.js';
import { handleHealthRoute } from '../routes/health.route.js';
import { handleAdminRoute } from '../routes/admin.route.js';

export function startHttpServer(port = 4000, host = '0.0.0.0') {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, GET, POST, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  const server = createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders);
      res.end();
      return;
    }

    try {
      if (await handleHealthRoute(req, res, corsHeaders)) return;
      if (await handleAdminRoute(req, res, corsHeaders)) return;
      if (await handleChatHistoryRoute(req, res, corsHeaders)) return;
      if (await handleChatRoute(req, res, corsHeaders)) return;
      if (await handleUploadRoute(req, res, corsHeaders)) return;
      if (await handleDocumentPdfUrlRoute(req, res, corsHeaders)) return;

      res.writeHead(404, corsHeaders);
      res.end(JSON.stringify({ error: 'Not Found' }));
    } catch (error) {
      console.error('Unhandled server error:', error);
      res.writeHead(500, corsHeaders);
      res.end(JSON.stringify({ error: 'Internal server error.' }));
    }
  });

  server.listen(port, host, () => {
    console.log(`🚀 Backend listening on http://${host}:${port}`);
  });
}
