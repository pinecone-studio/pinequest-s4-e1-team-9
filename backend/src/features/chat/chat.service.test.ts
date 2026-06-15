import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

const invoke = jest.fn<(messages: unknown[]) => Promise<{ content: string }>>();
const buildRagContext = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const buildChatEventContext =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getCompanyBehavior = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const createChatMessages = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getConversationSummary =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const conversationExistsForUser =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
let capturedMessages: unknown[] = [];

let generateChatResponse: typeof import('./chat.service.js').generateChatResponse;

describe('chat service AI behavior', () => {
  beforeAll(async () => {
    jest.doMock('../../ai/groq.js', () => ({
      createChatModel: () => ({
        invoke,
      }),
    }));
    jest.doMock('../retrieval/retriever.service.js', () => ({
      buildRagContext,
    }));
    jest.doMock('../events/event.service.js', () => ({
      buildChatEventContext,
    }));
    jest.doMock('../companies/company.service.js', () => ({
      getCompanyBehavior,
    }));
    jest.doMock('../../db/repositories/chat-messages.repo.js', () => ({
      createChatMessages,
      getConversationSummary,
      conversationExistsForUser,
    }));
    ({ generateChatResponse } = await import('./chat.service.js'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    capturedMessages = [];
    buildRagContext.mockResolvedValue({
      context: '[Source 1] HR Handbook\nEmployees may take PTO.',
      citations: [],
      sourceCount: 1,
      truncated: false,
    });
    getCompanyBehavior.mockResolvedValue({
      systemInstructions:
        'You are Acme HR Assistant.\nUse a professional tone.\nDo not invent policies.',
    });
    buildChatEventContext.mockResolvedValue({
      context: 'No event context was requested for this message.',
      eventSources: [],
      eventRelated: false,
    });
    invoke.mockImplementation((messages: unknown[]) => {
      capturedMessages = messages;
      return Promise.resolve({ content: 'Use the PTO policy.' });
    });
    createChatMessages.mockResolvedValue({ count: 2 });
    getConversationSummary.mockResolvedValue(null);
    conversationExistsForUser.mockResolvedValue(true);
  });

  it('loads saved company behavior into the server system message', async () => {
    const result = await generateChatResponse(
      [{ role: 'user', content: 'Can I take PTO?' }],
      {
        userId: 'user-1',
        companyId: 'company-1',
        userName: 'Orgil',
      },
    );

    expect(result.reply).toBe('Use the PTO policy.');
    expect(getCompanyBehavior).toHaveBeenCalledWith('company-1');
    expect(capturedMessages).toHaveLength(2);
    expect(
      (capturedMessages[0] as { content?: string }).content,
    ).toContain('You are Acme HR Assistant.');
    expect(
      (capturedMessages[0] as { content?: string }).content,
    ).toContain('Retrieved PDF context');
  });

  it('includes structured event context and event source metadata', async () => {
    buildChatEventContext.mockResolvedValue({
      context:
        '[Event 1] Pinequest Hackathon Opening\nStarts: Jun 18, 2026, 10:00 AM\nTimezone: Asia/Ulaanbaatar',
      eventRelated: true,
      eventSources: [
        {
          type: 'event',
          sourceId: 'Event 1',
          label: '[Event 1]',
          eventId: 'event-1',
          title: 'Pinequest Hackathon Opening',
          startsAt: '2026-06-18T02:00:00.000Z',
          endsAt: null,
          timezone: 'Asia/Ulaanbaatar',
          location: 'Pinecone Academy',
          meetingUrl: null,
          status: 'scheduled',
          preview: 'Jun 18, 2026, 10:00 AM · Asia/Ulaanbaatar',
        },
      ],
    });
    invoke.mockImplementation((messages: unknown[]) => {
      capturedMessages = messages;
      return Promise.resolve({
        content: 'The opening is on June 18, 2026. [Event 1]',
      });
    });

    const result = await generateChatResponse(
      [{ role: 'user', content: 'When does the hackathon start?' }],
      {
        userId: 'user-1',
        companyId: 'company-1',
        userName: 'Orgil',
      },
    );

    expect(result.eventSources).toHaveLength(1);
    expect(result.retrieval.eventSourceCount).toBe(1);
    expect((capturedMessages[0] as { content?: string }).content).toContain(
      'Structured event context',
    );
    expect((capturedMessages[0] as { content?: string }).content).toContain(
      '[Event 1] Pinequest Hackathon Opening',
    );
  });
});
