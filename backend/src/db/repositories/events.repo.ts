import type {
  AiEvent,
  EventStatus as PrismaEventStatus,
  Prisma,
} from '../../generated/prisma/client.js';
import * as profilesRepo from './profiles.repo.js';
import prisma from '../prisma.js';

export type SerializedAiEvent = {
  id: string;
  companyId: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  location: string | null;
  meetingUrl: string | null;
  status: 'scheduled' | 'cancelled';
  createdBy: string;
  creatorName: string | null;
  createdAt: string;
  updatedAt: string;
};

type EventMutationInput = {
  title?: string;
  description?: string | null;
  startsAt?: Date;
  endsAt?: Date | null;
  timezone?: string;
  location?: string | null;
  meetingUrl?: string | null;
  status?: PrismaEventStatus;
};

function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function serializeStatus(status: PrismaEventStatus) {
  return status === 'CANCELLED' ? 'cancelled' : 'scheduled';
}

export function serializeEvent(
  event: AiEvent,
  creatorName?: string | null,
): SerializedAiEvent {
  return {
    id: event.id,
    companyId: event.companyId,
    title: event.title,
    description: event.description,
    startsAt: event.startsAt.toISOString(),
    endsAt: toIsoString(event.endsAt),
    timezone: event.timezone,
    location: event.location,
    meetingUrl: event.meetingUrl,
    status: serializeStatus(event.status),
    createdBy: event.createdBy,
    creatorName: creatorName ?? null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

async function serializeEventsWithCreators(events: AiEvent[]) {
  const profiles = await profilesRepo.listProfilesByUserIds(
    events.map((event) => event.createdBy),
  );

  return events.map((event) =>
    serializeEvent(event, profiles.get(event.createdBy)?.name ?? null),
  );
}

export async function listCompanyEvents(companyId: string) {
  const events = await prisma.aiEvent.findMany({
    where: { companyId },
    orderBy: [{ startsAt: 'asc' }, { createdAt: 'asc' }],
  });

  return serializeEventsWithCreators(events);
}

export async function listChatCandidateEvents(input: {
  companyId: string;
  since: Date;
  limit?: number;
}) {
  const events = await prisma.aiEvent.findMany({
    where: {
      companyId: input.companyId,
      startsAt: {
        gte: input.since,
      },
    },
    orderBy: [{ startsAt: 'asc' }, { createdAt: 'asc' }],
    take: input.limit ?? 30,
  });

  return serializeEventsWithCreators(events);
}

export async function getCompanyEvent(companyId: string, eventId: string) {
  const event = await prisma.aiEvent.findFirst({
    where: {
      id: eventId,
      companyId,
    },
  });

  if (!event) {
    return null;
  }

  const profiles = await profilesRepo.listProfilesByUserIds([event.createdBy]);

  return serializeEvent(event, profiles.get(event.createdBy)?.name ?? null);
}

export async function createCompanyEvent(input: {
  companyId: string;
  createdBy: string;
  data: Required<
    Pick<EventMutationInput, 'title' | 'startsAt' | 'timezone'>
  > &
    Omit<EventMutationInput, 'title' | 'startsAt' | 'timezone'>;
}) {
  const event = await prisma.aiEvent.create({
    data: {
      companyId: input.companyId,
      createdBy: input.createdBy,
      title: input.data.title,
      description: input.data.description ?? null,
      startsAt: input.data.startsAt,
      endsAt: input.data.endsAt ?? null,
      timezone: input.data.timezone,
      location: input.data.location ?? null,
      meetingUrl: input.data.meetingUrl ?? null,
      status: input.data.status ?? 'SCHEDULED',
    },
  });

  return serializeEvent(event);
}

export async function updateCompanyEvent(input: {
  companyId: string;
  eventId: string;
  data: EventMutationInput;
}) {
  const data: Prisma.AiEventUpdateInput = {};

  if (input.data.title !== undefined) data.title = input.data.title;
  if (input.data.description !== undefined) {
    data.description = input.data.description;
  }
  if (input.data.startsAt !== undefined) data.startsAt = input.data.startsAt;
  if (input.data.endsAt !== undefined) data.endsAt = input.data.endsAt;
  if (input.data.timezone !== undefined) data.timezone = input.data.timezone;
  if (input.data.location !== undefined) data.location = input.data.location;
  if (input.data.meetingUrl !== undefined) {
    data.meetingUrl = input.data.meetingUrl;
  }
  if (input.data.status !== undefined) data.status = input.data.status;

  const event = await prisma.aiEvent.update({
    where: { id: input.eventId },
    data,
  });

  return serializeEvent(event);
}

export async function deleteCompanyEvent(companyId: string, eventId: string) {
  const event = await prisma.aiEvent.delete({
    where: { id: eventId },
  });

  return serializeEvent(event);
}
