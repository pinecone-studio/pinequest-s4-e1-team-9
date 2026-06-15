'use client';

import { useAuth } from '@/features/auth/AuthProvider';
import {
  deleteChatConversation,
  fetchChatConversations,
  fetchConversationMessages,
  isValidConversationId,
  sendChatMessages,
} from '@/features/chat/api';
import type { Conversation, Message, SendPayload } from '@/shared/types/chat';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatComposerHandle } from '../components/ChatComposer';

type BusyState = 'idle' | 'thinking';

function createMessage(input: Omit<Message, 'id'>): Message {
  return {
    ...input,
    id: `${input.role}-${Date.now()}-${crypto.randomUUID()}`,
  };
}

function sortConversations(conversations: Conversation[]) {
  return [...conversations].sort(
    (left, right) => right.updatedAt - left.updatedAt,
  );
}

export function useChat(companyId: string, enabled = true) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busyState, setBusyState] = useState<BusyState>('idle');
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const composerRef = useRef<ChatComposerHandle>(null);
  const messagesRef = useRef<Message[]>([]);
  const activeConversationId = useRef<string | null>(null);
  const conversationLoadRequest = useRef(0);

  const isBusy = busyState !== 'idle' || isConversationLoading;
  const busyLabel =
    busyState === 'thinking' ? 'Reading documents...' : undefined;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    composerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isBusy) composerRef.current?.focus();
  }, [isBusy]);

  const commitMessages = useCallback((nextMessages: Message[]) => {
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
  }, []);

  const loadConversations = useCallback(async () => {
    if (!enabled || !companyId) {
      return [];
    }

    setIsHistoryLoading(true);
    setErrorMessage(null);

    try {
      const nextConversations = await fetchChatConversations(companyId);
      setConversations(nextConversations);
      return nextConversations;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load chat history.';
      setErrorMessage(message);
      throw error;
    } finally {
      setIsHistoryLoading(false);
    }
  }, [companyId, enabled]);

  const patchConversation = useCallback((conversation: Conversation) => {
    if (!isValidConversationId(conversation.id)) {
      return;
    }

    setConversations((current) =>
      sortConversations([
        conversation,
        ...current.filter((item) => item.id !== conversation.id),
      ]),
    );
  }, []);

  const lastUserId = useRef<string | null>(null);
  const lastCompanyId = useRef<string | null>(null);

  useEffect(() => {
    const userId = user?.id ?? null;
    const nextCompanyId = enabled ? companyId : null;

    if (
      userId === lastUserId.current &&
      nextCompanyId === lastCompanyId.current
    ) {
      return;
    }

    lastUserId.current = userId;
    lastCompanyId.current = nextCompanyId;
    conversationLoadRequest.current += 1;
    activeConversationId.current = null;
    messagesRef.current = [];
    setMessages([]);
    setActiveId(null);
    setConversations([]);
    setErrorMessage(null);

    if (!userId || !nextCompanyId) {
      return;
    }

    void loadConversations().catch(() => undefined);
  }, [companyId, enabled, loadConversations, user?.id]);

  const handleNewChat = useCallback(() => {
    conversationLoadRequest.current += 1;
    setMessages([]);
    messagesRef.current = [];
    activeConversationId.current = null;
    setActiveId(null);
    setErrorMessage(null);
    setIsConversationLoading(false);
    composerRef.current?.reset();
    composerRef.current?.focus();
  }, []);

  const handleSelectConversation = useCallback(
    async (id: string) => {
      if (!isValidConversationId(id)) {
        setConversations((current) =>
          current.filter((conversation) => conversation.id !== id),
        );
        setErrorMessage('Conversation is no longer available.');
        return;
      }

      const requestId = conversationLoadRequest.current + 1;
      conversationLoadRequest.current = requestId;
      setErrorMessage(null);
      setActiveId(id);
      activeConversationId.current = id;
      setIsConversationLoading(true);

      try {
        const restoredMessages = await fetchConversationMessages(companyId, id);

        if (conversationLoadRequest.current !== requestId) {
          return;
        }

        commitMessages(restoredMessages);
        composerRef.current?.reset();
      } catch (error) {
        if (conversationLoadRequest.current !== requestId) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Failed to load conversation.';
        setErrorMessage(message);
        setActiveId(null);
        activeConversationId.current = null;
        commitMessages([]);
        void loadConversations().catch(() => undefined);
      } finally {
        if (conversationLoadRequest.current === requestId) {
          setIsConversationLoading(false);
          composerRef.current?.focus();
        }
      }
    },
    [commitMessages, companyId, loadConversations],
  );

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      if (!isValidConversationId(id)) {
        setConversations((current) =>
          current.filter((conversation) => conversation.id !== id),
        );

        if (activeConversationId.current === id) {
          activeConversationId.current = null;
          setActiveId(null);
          commitMessages([]);
        }

        return;
      }

      setErrorMessage(null);

      try {
        await deleteChatConversation(companyId, id);
        setConversations((current) =>
          current.filter((conversation) => conversation.id !== id),
        );

        if (activeConversationId.current === id) {
          conversationLoadRequest.current += 1;
          activeConversationId.current = null;
          setActiveId(null);
          commitMessages([]);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to delete conversation.';
        setErrorMessage(message);
      }
    },
    [commitMessages, companyId],
  );

  const appendAssistantMessage = useCallback(
    (baseMessages: Message[], message: Omit<Message, 'id' | 'role'>) => {
      const assistantMessage = createMessage({
        role: 'assistant',
        ...message,
      });
      const nextMessages = [...baseMessages, assistantMessage];
      commitMessages(nextMessages);

      return nextMessages;
    },
    [commitMessages],
  );

  const sendMessage = useCallback(
    async ({ text, file }: SendPayload) => {
      if (isBusy) return;

      setErrorMessage(null);

      if (!companyId) {
        setErrorMessage('Select an AI workspace before chatting.');
        return;
      }

      if (file) {
        setErrorMessage('Upload workspace PDFs from the dashboard management panel.');
        return;
      }

      const conversationId = activeConversationId.current;
      const userMessage = createMessage({
        role: 'user',
        content: text,
      });
      const nextMessages = [...messagesRef.current, userMessage];

      commitMessages(nextMessages);

      try {
        if (!text) return;

        setBusyState('thinking');
        const response = await sendChatMessages(
          companyId,
          nextMessages,
          conversationId,
        );
        const serverConversationId = response.conversationId ?? conversationId;

        if (serverConversationId) {
          activeConversationId.current = serverConversationId;
          setActiveId(serverConversationId);
        }

        appendAssistantMessage(nextMessages, {
          content: response.reply?.trim() || 'No response.',
          citations: response.citations ?? [],
          eventSources: response.eventSources ?? [],
        });

        if (response.conversation) {
          patchConversation(response.conversation);
        } else {
          void loadConversations().catch(() => undefined);
        }

        if (response.warnings?.length) {
          setErrorMessage(response.warnings.join(' '));
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error.';
        setErrorMessage(message);
        appendAssistantMessage(messagesRef.current, {
          content: `Request failed: ${message}`,
          tone: 'error',
        });
      } finally {
        setBusyState('idle');
      }
    },
    [
      appendAssistantMessage,
      companyId,
      commitMessages,
      isBusy,
      loadConversations,
      patchConversation,
    ],
  );

  const handleEditMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (isBusy) return;
      if (!companyId) {
        setErrorMessage('Select an AI workspace before chatting.');
        return;
      }

      const conversationId = activeConversationId.current;
      const index = messagesRef.current.findIndex((m) => m.id === messageId);
      if (index === -1) return;

      const editedMessage: Message = {
        ...messagesRef.current[index],
        content: newContent,
      };

      const nextMessages = [
        ...messagesRef.current.slice(0, index),
        editedMessage,
      ];

      commitMessages(nextMessages);

      try {
        setBusyState('thinking');
        const response = await sendChatMessages(
          companyId,
          nextMessages,
          conversationId,
        );
        const serverConversationId = response.conversationId ?? conversationId;

        if (serverConversationId) {
          activeConversationId.current = serverConversationId;
          setActiveId(serverConversationId);
        }

        appendAssistantMessage(nextMessages, {
          content: response.reply?.trim() || 'No response.',
          citations: response.citations ?? [],
        });

        if (response.conversation) {
          patchConversation(response.conversation);
        } else {
          void loadConversations().catch(() => undefined);
        }

        if (response.warnings?.length) {
          setErrorMessage(response.warnings.join(' '));
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error.';
        setErrorMessage(message);
        appendAssistantMessage(messagesRef.current, {
          content: `Request failed: ${message}`,
          tone: 'error',
        });
      } finally {
        setBusyState('idle');
      }
    },
    [
      appendAssistantMessage,
      companyId,
      commitMessages,
      isBusy,
      loadConversations,
      patchConversation,
    ],
  );

  return {
    messages,
    hasMessages: messages.length > 0,
    isBusy,
    busyLabel,
    isHistoryLoading,
    isConversationLoading,
    errorMessage,
    composerRef,
    conversations,
    activeId,
    handleNewChat,
    handleSelectConversation,
    handleDeleteConversation,
    handleEditMessage,
    sendMessage,
  };
}
