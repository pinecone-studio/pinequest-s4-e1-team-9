import { env } from '../../config/env.js';
import * as eventsRepo from '../../db/repositories/events.repo.js';
import {
  requireCompanyMember,
  requireCompanyOwner,
} from '../companies/authorization.service.js';
import { DocumentProcessingError } from '../documents/types.js';

export type AiEventStatus = 'scheduled' | 'cancelled';

export type EventSource = {
  type: 'event';
  sourceId: string;
  label: string;
  eventId: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  location: string | null;
  meetingUrl: string | null;
  status: AiEventStatus;
  preview: string;
};

export type EventContextResult = {
  context: string;
  eventSources: EventSource[];
  eventRelated: boolean;
};

type EventInput = {
  title?: unknown;
  description?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
  timezone?: unknown;
  location?: unknown;
  meetingUrl?: unknown;
  status?: unknown;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const eventQueryPattern =
  /\b(event|events|schedule|scheduled|calendar|deadline|due|when|where|next|upcoming|past|week|today|tomorrow|yesterday|start|starts|begin|begins|finish|finished|ends?|opening|orientation|judging|session|meeting|exam|holiday|training)\b/i;

const stopWords = new Set([
  'what',
  'when',
  'where',
  'which',
  'there',
  'event',
  'events',
  'schedule',
  'scheduled',
  'next',
  'this',
  'week',
  'today',
  'tomorrow',
  'does',
  'the',
  'and',
  'are',
  'any',
  'has',
  'have',
  'with',
  'from',
  'that',
  'about',
]);

function assertUuid(value: string, label: string) {
  if (!uuidPattern.test(value)) {
    throw new DocumentProcessingError(`Invalid ${label}.`, 400);
  }
}

function compactText(value: string) {
  return value.replace(/\s+/gu, ' ').trim();
}

function optionalText(value: unknown, maxChars: number, label: string) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new DocumentProcessingError(`${label} must be text.`, 400);
  }

  const text = compactText(value);

  if (!text) {
    return null;
  }

  if (text.length > maxChars) {
    throw new DocumentProcessingError(
      `${label} must be ${maxChars} characters or fewer.`,
      400,
    );
  }

  return text;
}

function requiredTitle(value: unknown) {
  if (typeof value !== 'string') {
    throw new DocumentProcessingError('Event title is required.', 400);
  }

  const title = compactText(value);

  if (!title) {
    throw new DocumentProcessingError('Event title is required.', 400);
  }

  if (title.length > 140) {
    throw new DocumentProcessingError(
      'Event title must be 140 characters or fewer.',
      400,
    );
  }

  return title;
}

function parseDate(value: unknown, label: string) {
  if (typeof value !== 'string') {
    throw new DocumentProcessingError(`${label} is required.`, 400);
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    throw new DocumentProcessingError(`${label} must be a valid date.`, 400);
  }

  return date;
}

function optionalDate(value: unknown, label: string) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  return parseDate(value, label);
}

function isValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function normalizeTimezone(value: unknown) {
  const timezone =
    typeof value === 'string' && value.trim()
      ? value.trim()
      : env.defaultEventTimezone;

  if (timezone.length > 80 || !isValidTimezone(timezone)) {
    throw new DocumentProcessingError('Event timezone is invalid.', 400);
  }

  return timezone;
}

function normalizeMeetingUrl(value: unknown) {
  const text = optionalText(value, 500, 'Meeting link');

  if (text === undefined || text === null) {
    return text;
  }

  try {
    const url = new URL(text);

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }

    return url.toString();
  } catch {
    throw new DocumentProcessingError(
      'Meeting link must be a valid http or https URL.',
      400,
    );
  }
}

function normalizeStatus(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === 'cancelled' || value === 'CANCELLED') {
    return 'CANCELLED' as const;
  }

  if (value === 'scheduled' || value === 'SCHEDULED') {
    return 'SCHEDULED' as const;
  }

  throw new DocumentProcessingError('Event status is invalid.', 400);
}

function normalizeCreateInput(input: EventInput) {
  const startsAt = parseDate(input.startsAt, 'Start date');
  const endsAt = optionalDate(input.endsAt, 'End date') ?? null;

  if (endsAt && endsAt.getTime() < startsAt.getTime()) {
    throw new DocumentProcessingError(
      'Event end time must be after the start time.',
      400,
    );
  }

  return {
    title: requiredTitle(input.title),
    description: optionalText(input.description, 2_000, 'Description') ?? null,
    startsAt,
    endsAt,
    timezone: normalizeTimezone(input.timezone),
    location: optionalText(input.location, 240, 'Location') ?? null,
    meetingUrl: normalizeMeetingUrl(input.meetingUrl) ?? null,
    status: normalizeStatus(input.status) ?? 'SCHEDULED',
  };
}

function normalizeUpdateInput(
  input: EventInput,
  existing: eventsRepo.SerializedAiEvent,
) {
  const startsAt =
    input.startsAt === undefined
      ? new Date(existing.startsAt)
      : parseDate(input.startsAt, 'Start date');
  const endsAt =
    input.endsAt === undefined
      ? existing.endsAt
        ? new Date(existing.endsAt)
        : null
      : optionalDate(input.endsAt, 'End date');

  if (endsAt && endsAt.getTime() < startsAt.getTime()) {
    throw new DocumentProcessingError(
      'Event end time must be after the start time.',
      400,
    );
  }

  return {
    ...(input.title !== undefined ? { title: requiredTitle(input.title) } : {}),
    ...(input.description !== undefined
      ? {
          description:
            optionalText(input.description, 2_000, 'Description') ?? null,
        }
      : {}),
    ...(input.startsAt !== undefined ? { startsAt } : {}),
    ...(input.endsAt !== undefined ? { endsAt } : {}),
    ...(input.timezone !== undefined
      ? { timezone: normalizeTimezone(input.timezone) }
      : {}),
    ...(input.location !== undefined
      ? { location: optionalText(input.location, 240, 'Location') ?? null }
      : {}),
    ...(input.meetingUrl !== undefined
      ? { meetingUrl: normalizeMeetingUrl(input.meetingUrl) ?? null }
      : {}),
    ...(input.status !== undefined ? { status: normalizeStatus(input.status) } : {}),
  };
}

function eventTokens(query: string) {
  return query
    .toLocaleLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length >= 3 && !stopWords.has(token));
}

function scoreEvent(queryTokens: string[], event: eventsRepo.SerializedAiEvent) {
  const haystack = [
    event.title,
    event.description,
    event.location,
    event.meetingUrl,
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase();

  return queryTokens.reduce(
    (score, token) => score + (haystack.includes(token) ? 1 : 0),
    0,
  );
}

function formatEventDate(event: eventsRepo.SerializedAiEvent) {
  const startsAt = new Date(event.startsAt);
  const endsAt = event.endsAt ? new Date(event.endsAt) : null;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: event.timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const startLabel = formatter.format(startsAt);
  const endLabel = endsAt ? formatter.format(endsAt) : null;

  return endLabel ? `${startLabel} to ${endLabel}` : startLabel;
}

function toEventSource(
  event: eventsRepo.SerializedAiEvent,
  index: number,
): EventSource {
  const label = `[Event ${index + 1}]`;
  const detailParts = [
    formatEventDate(event),
    event.timezone,
    event.location,
    event.meetingUrl,
    event.status === 'cancelled' ? 'Cancelled' : null,
  ].filter(Boolean);

  return {
    type: 'event',
    sourceId: `Event ${index + 1}`,
    label,
    eventId: event.id,
    title: event.title,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    timezone: event.timezone,
    location: event.location,
    meetingUrl: event.meetingUrl,
    status: event.status,
    preview: detailParts.join(' · '),
  };
}

function buildEventContext(sources: EventSource[]) {
  if (!sources.length) {
    return 'No matching scheduled or cancelled events were found for this AI.';
  }

  return sources
    .map((source) => {
      const details = [
        `${source.label} ${source.title}`,
        `Status: ${source.status}`,
        `Starts: ${formatEventDate({
          id: source.eventId,
          companyId: '',
          title: source.title,
          description: null,
          startsAt: source.startsAt,
          endsAt: source.endsAt,
          timezone: source.timezone,
          location: source.location,
          meetingUrl: source.meetingUrl,
          status: source.status,
          createdBy: '',
          creatorName: null,
          createdAt: '',
          updatedAt: '',
        })}`,
        `Timezone: ${source.timezone}`,
        source.location ? `Location: ${source.location}` : null,
        source.meetingUrl ? `Meeting link: ${source.meetingUrl}` : null,
      ].filter(Boolean);

      return details.join('\n');
    })
    .join('\n\n');
}

function datePartsInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '00';

  return {
    year: Number(value('year')),
    month: Number(value('month')),
    day: Number(value('day')),
    hour: Number(value('hour')),
    minute: Number(value('minute')),
    second: Number(value('second')),
  };
}

function timezoneOffsetMs(timezone: string, date: Date) {
  const parts = datePartsInTimezone(date, timezone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return asUtc - date.getTime();
}

function zonedDateTimeToUtc(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  timezone: string;
}) {
  const localAsUtc = Date.UTC(
    input.year,
    input.month - 1,
    input.day,
    input.hour,
    input.minute,
    0,
    0,
  );
  const firstPass = new Date(
    localAsUtc - timezoneOffsetMs(input.timezone, new Date(localAsUtc)),
  );

  return new Date(localAsUtc - timezoneOffsetMs(input.timezone, firstPass));
}

function startOfWeekInTimezone(date: Date, timezone: string) {
  const parts = datePartsInTimezone(date, timezone);
  const localNoon = zonedDateTimeToUtc({
    ...parts,
    hour: 12,
    minute: 0,
    timezone,
  });
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
    new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
    }).format(localNoon),
  );
  const diff = weekday === 0 ? 6 : weekday - 1;
  const localWeekStart = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day - diff, 0, 0, 0, 0),
  );

  return zonedDateTimeToUtc({
    year: localWeekStart.getUTCFullYear(),
    month: localWeekStart.getUTCMonth() + 1,
    day: localWeekStart.getUTCDate(),
    hour: 0,
    minute: 0,
    timezone,
  });
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function selectRelevantEvents(
  query: string,
  events: eventsRepo.SerializedAiEvent[],
  now: Date,
) {
  const lower = query.toLocaleLowerCase();
  const wantsNext = /\b(next|upcoming|soonest)\b/i.test(query);
  const wantsWeek = /\b(this week|week)\b/i.test(query);
  const wantsCancelled = /\b(cancelled|canceled)\b/i.test(query);

  if (wantsWeek) {
    const weekStart = startOfWeekInTimezone(now, env.defaultEventTimezone);
    const weekEnd = addDays(weekStart, 7);
    return events
      .filter((event) => {
        const time = new Date(event.startsAt).getTime();
        return time >= weekStart.getTime() && time < weekEnd.getTime();
      })
      .slice(0, 10);
  }

  if (wantsNext) {
    return events
      .filter(
        (event) =>
          event.status === 'scheduled' &&
          new Date(event.startsAt).getTime() >= now.getTime(),
      )
      .slice(0, 5);
  }

  const tokens = eventTokens(lower);
  const scored = events
    .map((event) => ({ event, score: scoreEvent(tokens, event) }))
    .filter(({ event, score }) =>
      wantsCancelled ? event.status === 'cancelled' || score > 0 : score > 0,
    )
    .sort(
      (left, right) =>
        right.score - left.score ||
        new Date(left.event.startsAt).getTime() -
          new Date(right.event.startsAt).getTime(),
    );

  if (scored.length) {
    return scored.map(({ event }) => event).slice(0, 6);
  }

  return events
    .filter(
      (event) =>
        event.status === 'scheduled' &&
        new Date(event.startsAt).getTime() >= now.getTime(),
    )
    .slice(0, 5);
}

export function queryMayInvolveEvents(query: string) {
  return eventQueryPattern.test(query);
}

export async function listEvents(userId: string, companyId: string) {
  assertUuid(companyId, 'AI id');
  await requireCompanyMember(userId, companyId);
  return eventsRepo.listCompanyEvents(companyId);
}

export async function getEvent(
  userId: string,
  companyId: string,
  eventId: string,
) {
  assertUuid(companyId, 'AI id');
  assertUuid(eventId, 'event id');
  await requireCompanyMember(userId, companyId);
  const event = await eventsRepo.getCompanyEvent(companyId, eventId);

  if (!event) {
    throw new DocumentProcessingError('Event not found.', 404);
  }

  return event;
}

export async function createEvent(
  userId: string,
  companyId: string,
  input: EventInput,
) {
  assertUuid(companyId, 'AI id');
  await requireCompanyOwner(userId, companyId);
  return eventsRepo.createCompanyEvent({
    companyId,
    createdBy: userId,
    data: normalizeCreateInput(input),
  });
}

export async function updateEvent(
  userId: string,
  companyId: string,
  eventId: string,
  input: EventInput,
) {
  assertUuid(companyId, 'AI id');
  assertUuid(eventId, 'event id');
  await requireCompanyOwner(userId, companyId);
  const existing = await eventsRepo.getCompanyEvent(companyId, eventId);

  if (!existing) {
    throw new DocumentProcessingError('Event not found.', 404);
  }

  return eventsRepo.updateCompanyEvent({
    companyId,
    eventId,
    data: normalizeUpdateInput(input, existing),
  });
}

export async function cancelEvent(
  userId: string,
  companyId: string,
  eventId: string,
) {
  return updateEvent(userId, companyId, eventId, { status: 'cancelled' });
}

export async function deleteEvent(
  userId: string,
  companyId: string,
  eventId: string,
) {
  assertUuid(companyId, 'AI id');
  assertUuid(eventId, 'event id');
  await requireCompanyOwner(userId, companyId);
  const existing = await eventsRepo.getCompanyEvent(companyId, eventId);

  if (!existing) {
    throw new DocumentProcessingError('Event not found.', 404);
  }

  return eventsRepo.deleteCompanyEvent(companyId, eventId);
}

export async function buildChatEventContext(
  companyId: string,
  query: string,
  now = new Date(),
): Promise<EventContextResult> {
  const eventRelated = queryMayInvolveEvents(query);

  if (!eventRelated) {
    return {
      context: 'No event context was requested for this message.',
      eventSources: [],
      eventRelated,
    };
  }

  const since = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
  const events = await eventsRepo.listChatCandidateEvents({
    companyId,
    since,
    limit: 30,
  });
  const selected = selectRelevantEvents(query, events, now);
  const eventSources = selected.map(toEventSource);

  return {
    context: buildEventContext(eventSources),
    eventSources,
    eventRelated,
  };
}
