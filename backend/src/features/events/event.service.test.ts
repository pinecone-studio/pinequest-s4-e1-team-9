import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

const requireCompanyMember = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const requireCompanyOwner = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const listCompanyEvents = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const listChatCandidateEvents =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getCompanyEvent = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const createCompanyEvent = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const updateCompanyEvent = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const deleteCompanyEvent = jest.fn<(...args: unknown[]) => Promise<unknown>>();

let service: typeof import('./event.service.js');

const companyId = '123e4567-e89b-42d3-a456-426614174000';
const eventId = '123e4567-e89b-42d3-a456-426614174001';

const baseEvent = {
  id: eventId,
  companyId,
  title: 'Pinequest Hackathon Opening',
  description: 'Official opening session.',
  startsAt: '2026-06-18T02:00:00.000Z',
  endsAt: null,
  timezone: 'Asia/Ulaanbaatar',
  location: 'Pinecone Academy',
  meetingUrl: null,
  status: 'scheduled' as const,
  createdBy: '123e4567-e89b-42d3-a456-426614174002',
  creatorName: 'Orgil',
  createdAt: '2026-06-15T00:00:00.000Z',
  updatedAt: '2026-06-15T00:00:00.000Z',
};

describe('event service', () => {
  beforeAll(async () => {
    jest.doMock('../companies/authorization.service.js', () => ({
      requireCompanyMember,
      requireCompanyOwner,
    }));
    jest.doMock('../../db/repositories/events.repo.js', () => ({
      listCompanyEvents,
      listChatCandidateEvents,
      getCompanyEvent,
      createCompanyEvent,
      updateCompanyEvent,
      deleteCompanyEvent,
    }));
    service = await import('./event.service.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    requireCompanyMember.mockResolvedValue({});
    requireCompanyOwner.mockResolvedValue({});
    getCompanyEvent.mockResolvedValue(baseEvent);
    createCompanyEvent.mockImplementation((input) =>
      Promise.resolve({
        ...baseEvent,
        ...(input as { data?: Record<string, unknown> }).data,
      }),
    );
    updateCompanyEvent.mockImplementation((input) =>
      Promise.resolve({
        ...baseEvent,
        ...(input as { data?: Record<string, unknown> }).data,
      }),
    );
    deleteCompanyEvent.mockResolvedValue(baseEvent);
    listChatCandidateEvents.mockResolvedValue([baseEvent]);
  });

  it('allows members to read AI-scoped events', async () => {
    listCompanyEvents.mockResolvedValue([baseEvent]);

    await expect(service.listEvents('user-1', companyId)).resolves.toEqual([
      baseEvent,
    ]);
    expect(requireCompanyMember).toHaveBeenCalledWith('user-1', companyId);
  });

  it('requires owner access to create events', async () => {
    await service.createEvent('owner-1', companyId, {
      title: 'Opening',
      startsAt: '2026-06-18T02:00:00.000Z',
      timezone: 'Asia/Ulaanbaatar',
    });

    expect(requireCompanyOwner).toHaveBeenCalledWith('owner-1', companyId);
  });

  it('rejects end times before start times', async () => {
    await expect(
      service.createEvent('owner-1', companyId, {
        title: 'Opening',
        startsAt: '2026-06-18T02:00:00.000Z',
        endsAt: '2026-06-18T01:00:00.000Z',
        timezone: 'Asia/Ulaanbaatar',
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects invalid meeting URLs', async () => {
    await expect(
      service.createEvent('owner-1', companyId, {
        title: 'Opening',
        startsAt: '2026-06-18T02:00:00.000Z',
        timezone: 'Asia/Ulaanbaatar',
        meetingUrl: 'javascript:alert(1)',
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('returns event sources for next-event chat queries', async () => {
    const result = await service.buildChatEventContext(
      companyId,
      'What is the next event?',
      new Date('2026-06-15T00:00:00.000Z'),
    );

    expect(result.eventRelated).toBe(true);
    expect(result.eventSources).toEqual([
      expect.objectContaining({
        label: '[Event 1]',
        title: 'Pinequest Hackathon Opening',
        timezone: 'Asia/Ulaanbaatar',
      }),
    ]);
    expect(result.context).toContain('[Event 1] Pinequest Hackathon Opening');
  });
});
