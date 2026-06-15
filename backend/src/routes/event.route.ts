import type { IncomingMessage, ServerResponse } from 'node:http';
import { getAuthenticatedUserId } from '../features/auth/auth.service.js';
import {
  cancelEvent,
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  updateEvent,
} from '../features/events/event.service.js';
import { DocumentProcessingError } from '../features/documents/types.js';
import { readJsonBody, sendJson } from '../server/errors.js';

const eventsPathPattern = /^\/api\/ais\/([^/]+)\/events$/i;
const eventPathPattern = /^\/api\/ais\/([^/]+)\/events\/([^/]+)$/i;
const cancelPathPattern = /^\/api\/ais\/([^/]+)\/events\/([^/]+)\/cancel$/i;

function decodePathPart(value: string | undefined) {
  return value ? decodeURIComponent(value) : '';
}

export async function handleEventRoute(
  req: IncomingMessage,
  res: ServerResponse,
  headers: Record<string, string>,
) {
  const host = req.headers.host || 'localhost';
  const requestUrl = new URL(req.url || '/', `http://${host}`);
  const eventsMatch = eventsPathPattern.exec(requestUrl.pathname);
  const eventMatch = eventPathPattern.exec(requestUrl.pathname);
  const cancelMatch = cancelPathPattern.exec(requestUrl.pathname);

  if (!eventsMatch && !eventMatch && !cancelMatch) {
    return false;
  }

  try {
    const userId = await getAuthenticatedUserId(req);

    if (eventsMatch && req.method === 'GET') {
      const companyId = decodePathPart(eventsMatch[1]);
      const events = await listEvents(userId, companyId);
      sendJson(res, 200, { events }, headers);
      return true;
    }

    if (eventsMatch && req.method === 'POST') {
      const companyId = decodePathPart(eventsMatch[1]);
      const body = await readJsonBody<Record<string, unknown>>(req, {
        maxBytes: 96 * 1024,
      });
      const event = await createEvent(userId, companyId, body);
      sendJson(res, 201, { event }, headers);
      return true;
    }

    if (eventMatch && req.method === 'GET') {
      const companyId = decodePathPart(eventMatch[1]);
      const eventId = decodePathPart(eventMatch[2]);
      const event = await getEvent(userId, companyId, eventId);
      sendJson(res, 200, { event }, headers);
      return true;
    }

    if (eventMatch && req.method === 'PATCH') {
      const companyId = decodePathPart(eventMatch[1]);
      const eventId = decodePathPart(eventMatch[2]);
      const body = await readJsonBody<Record<string, unknown>>(req, {
        maxBytes: 96 * 1024,
      });
      const event = await updateEvent(userId, companyId, eventId, body);
      sendJson(res, 200, { event }, headers);
      return true;
    }

    if (eventMatch && req.method === 'DELETE') {
      const companyId = decodePathPart(eventMatch[1]);
      const eventId = decodePathPart(eventMatch[2]);
      const event = await deleteEvent(userId, companyId, eventId);
      sendJson(res, 200, { ok: true, event }, headers);
      return true;
    }

    if (cancelMatch && req.method === 'POST') {
      const companyId = decodePathPart(cancelMatch[1]);
      const eventId = decodePathPart(cancelMatch[2]);
      const event = await cancelEvent(userId, companyId, eventId);
      sendJson(res, 200, { event }, headers);
      return true;
    }

    sendJson(res, 405, { error: 'Method not allowed.' }, headers);
  } catch (error) {
    const statusCode =
      error instanceof DocumentProcessingError ? error.statusCode : 500;
    const clientMessage =
      error instanceof DocumentProcessingError
        ? error.message
        : 'Failed to process event request.';

    if (statusCode >= 500) {
      console.error('Event route failure:', error);
    }

    sendJson(res, statusCode, { error: clientMessage }, headers);
  }

  return true;
}
