import { createServer } from 'node:http';
import { handleChatHistoryRoute } from '../routes/chat-history.route.js';
import { handleChatRoute } from '../routes/chat.route.js';
import { handleUploadRoute } from '../routes/upload.route.js';
import { handleDocumentPdfUrlRoute } from '../routes/document.route.js';
import { handleHealthRoute } from '../routes/health.route.js';
import { handleAdminRoute } from '../routes/admin.route.js';
import { handleCompanyRoute } from '../routes/company.route.js';
import { handleInvitationRoute } from '../routes/invitation.route.js';
import { handlePreferencesRoute } from '../routes/preferences.route.js';
import { handleProfileRoute } from '../routes/profile.route.js';
import { handleEventRoute } from '../routes/event.route.js';
import { createCorsHeaders, isAllowedCorsOrigin } from './cors.js';

export function startHttpServer(port = 4000, host = '0.0.0.0') {
  const server = createServer(async (req, res) => {
    const requestOrigin = Array.isArray(req.headers.origin)
      ? req.headers.origin[0]
      : req.headers.origin;
    const corsHeaders = createCorsHeaders(requestOrigin);

    if (!isAllowedCorsOrigin(requestOrigin)) {
      res.writeHead(403, corsHeaders);
      res.end(JSON.stringify({ error: 'CORS origin is not allowed.' }));
      return;
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders);
      res.end();
      return;
    }

    try {
      if (await handleHealthRoute(req, res, corsHeaders)) return;
      if (await handleProfileRoute(req, res, corsHeaders)) return;
      if (await handlePreferencesRoute(req, res, corsHeaders)) return;
      if (await handleInvitationRoute(req, res, corsHeaders)) return;
      if (await handleEventRoute(req, res, corsHeaders)) return;
      if (await handleCompanyRoute(req, res, corsHeaders)) return;
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
