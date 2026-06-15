import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

const chatMessageCreateMany = jest.fn<() => Promise<{ count: number }>>();
const chatMessageCount = jest.fn<() => Promise<number>>();
const chatMessageDeleteMany = jest.fn<() => Promise<{ count: number }>>();
const chatMessageFindMany = jest.fn<() => Promise<unknown[]>>();
const chatMessageGroupBy = jest.fn<() => Promise<unknown[]>>();
const prismaMock = {
  chatMessage: {
    createMany: chatMessageCreateMany,
    count: chatMessageCount,
    deleteMany: chatMessageDeleteMany,
    findMany: chatMessageFindMany,
    groupBy: chatMessageGroupBy,
  },
};

let conversationExistsForUser: typeof import(
  './chat-messages.repo.js'
).conversationExistsForUser;
let createChatMessages: typeof import(
  './chat-messages.repo.js'
).createChatMessages;
let deleteConversationMessages: typeof import(
  './chat-messages.repo.js'
).deleteConversationMessages;
let listUserConversations: typeof import(
  './chat-messages.repo.js'
).listUserConversations;

describe('chat messages repository company scoping', () => {
  beforeAll(async () => {
    jest.doMock('../prisma.js', () => ({
      __esModule: true,
      default: prismaMock,
      prisma: prismaMock,
    }));
    ({
      conversationExistsForUser,
      createChatMessages,
      deleteConversationMessages,
      listUserConversations,
    } = await import('./chat-messages.repo.js'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists company id with every chat message', async () => {
    chatMessageCreateMany.mockResolvedValue({ count: 2 });

    await createChatMessages([
      {
        userId: 'user-1',
        companyId: 'company-1',
        conversationId: 'conversation-1',
        role: 'user',
        content: ' Question ',
      },
      {
        userId: 'user-1',
        companyId: 'company-1',
        conversationId: 'conversation-1',
        role: 'assistant',
        content: ' Answer ',
      },
    ]);

    expect(chatMessageCreateMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: 'user-1',
          companyId: 'company-1',
          conversationId: 'conversation-1',
          role: 'user',
          content: 'Question',
        }),
        expect.objectContaining({
          userId: 'user-1',
          companyId: 'company-1',
          conversationId: 'conversation-1',
          role: 'assistant',
          content: 'Answer',
        }),
      ],
    });
  });

  it('checks conversation ownership inside the selected company', async () => {
    chatMessageCount.mockResolvedValue(1);

    await expect(
      conversationExistsForUser('user-1', 'company-1', 'conversation-1'),
    ).resolves.toBe(true);

    expect(chatMessageCount).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        companyId: 'company-1',
        conversationId: 'conversation-1',
      },
    });
  });

  it('lists only conversations for the selected company', async () => {
    const createdAt = new Date('2026-06-14T00:00:00.000Z');
    const updatedAt = new Date('2026-06-14T00:05:00.000Z');

    chatMessageGroupBy.mockResolvedValue([
      {
        conversationId: 'conversation-1',
        _max: { createdAt: updatedAt },
      },
    ]);
    chatMessageFindMany.mockResolvedValue([
      {
        id: 'message-1',
        userId: 'user-1',
        companyId: 'company-1',
        conversationId: 'conversation-1',
        role: 'user',
        content: 'What is the policy?',
        metadata: null,
        createdAt,
      },
      {
        id: 'message-2',
        userId: 'user-1',
        companyId: 'company-1',
        conversationId: 'conversation-1',
        role: 'assistant',
        content: 'The policy is in the workspace handbook.',
        metadata: null,
        createdAt: updatedAt,
      },
    ]);

    const conversations = await listUserConversations('user-1', 'company-1');

    expect(chatMessageGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-1',
          companyId: 'company-1',
          conversationId: { not: null },
        },
      }),
    );
    expect(chatMessageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-1',
          companyId: 'company-1',
          conversationId: { in: ['conversation-1'] },
        },
      }),
    );
    expect(conversations).toEqual([
      expect.objectContaining({
        id: 'conversation-1',
        title: 'What is the policy?',
      }),
    ]);
  });

  it('deletes messages only from the selected company conversation', async () => {
    chatMessageDeleteMany.mockResolvedValue({ count: 2 });

    await deleteConversationMessages('user-1', 'company-1', 'conversation-1');

    expect(chatMessageDeleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        companyId: 'company-1',
        conversationId: 'conversation-1',
      },
    });
  });
});
