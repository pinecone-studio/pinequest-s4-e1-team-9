'use client';

import { useAuth } from '@/features/auth/AuthProvider';
import { sendChatMessages } from '@/features/chat/api';
import { useLocalChatHistory } from '@/features/chat/hooks/useLocalChatHistory';
import { uploadDocument } from '@/features/documents/api';
import type { Message, SendPayload } from '@/shared/types/chat';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatComposerHandle } from '../components/ChatComposer';

type BusyState = 'idle' | 'uploading' | 'thinking';

function createMessage(input: Omit<Message, 'id'>): Message {
  return {
    ...input,
    id: `${input.role}-${Date.now()}-${crypto.randomUUID()}`,
  };
}

export function useChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [busyState, setBusyState] = useState<BusyState>('idle');
  const composerRef = useRef<ChatComposerHandle>(null);
  const messagesRef = useRef<Message[]>([]);
  const activeConversationId = useRef<string | null>(null);

  const {
    conversations,
    activeId,
    setActiveId,
    createConversation,
    saveMessages,
    loadConversation,
    deleteConversation,
  } = useLocalChatHistory(user?.id ?? 'anonymous');
  const isBusy = busyState !== 'idle';
  const busyLabel =
    busyState === 'uploading'
      ? 'Uploading PDF...'
      : busyState === 'thinking'
        ? 'Reading documents...'
        : undefined;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    composerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isBusy) composerRef.current?.focus();
  }, [isBusy]);

  const commitMessages = useCallback(
    (conversationId: string, nextMessages: Message[]) => {
      messagesRef.current = nextMessages;
      setMessages(nextMessages);
      saveMessages(conversationId, nextMessages);
    },
    [saveMessages],
  );

  const ensureConversation = useCallback(() => {
    const conversationId = activeConversationId.current ?? createConversation();
    activeConversationId.current = conversationId;
    return conversationId;
  }, [createConversation]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    messagesRef.current = [];
    activeConversationId.current = null;
    setActiveId(null);
    composerRef.current?.reset();
    composerRef.current?.focus();
  }, [setActiveId]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      const restored = loadConversation(id);
      messagesRef.current = restored;
      setMessages(restored);
      activeConversationId.current = id;
      composerRef.current?.reset();
      composerRef.current?.focus();
    },
    [loadConversation],
  );

  const handleDeleteConversation = useCallback(
    (id: string) => {
      deleteConversation(id);
      if (activeConversationId.current === id) {
        setMessages([]);
        messagesRef.current = [];
        activeConversationId.current = null;
      }
    },
    [deleteConversation],
  );

  const appendAssistantMessage = useCallback(
    (
      conversationId: string,
      baseMessages: Message[],
      message: Omit<Message, 'id' | 'role'>,
    ) => {
      const assistantMessage = createMessage({
        role: 'assistant',
        ...message,
      });
      const nextMessages = [...baseMessages, assistantMessage];
      commitMessages(conversationId, nextMessages);
    },
    [commitMessages],
  );

  const sendMessage = useCallback(
    async ({ text, file }: SendPayload) => {
      if (isBusy) return;

      const conversationId = ensureConversation();
      const userMessage = createMessage({
        role: 'user',
        content: text,
        attachment: file ? { name: file.name } : undefined,
      });
      const nextMessages = [...messagesRef.current, userMessage];

      commitMessages(conversationId, nextMessages);

      try {
        if (file) {
          setBusyState('uploading');
          await uploadDocument(file);

          if (!text) {
            appendAssistantMessage(conversationId, nextMessages, {
              content: 'PDF uploaded and indexed. Ready when you are.',
              tone: 'success',
            });
            return;
          }
        }

        if (!text) return;

        setBusyState('thinking');
        const response = await sendChatMessages(nextMessages, conversationId);
        appendAssistantMessage(conversationId, nextMessages, {
          content: response.reply?.trim() || 'No response.',
          citations: response.citations ?? [],
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error.';
        appendAssistantMessage(conversationId, messagesRef.current, {
          content:
            file && !text
              ? `Upload failed: ${message}`
              : `Request failed: ${message}`,
          tone: 'error',
        });
      } finally {
        setBusyState('idle');
      }
    },
    [appendAssistantMessage, commitMessages, ensureConversation, isBusy],
  );

  const handleEditMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (isBusy) return;

      const conversationId =
        activeConversationId.current ?? ensureConversation();
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

      commitMessages(conversationId, nextMessages);

      try {
        setBusyState('thinking');
        const response = await sendChatMessages(nextMessages, conversationId);
        appendAssistantMessage(conversationId, nextMessages, {
          content: response.reply?.trim() || 'No response.',
          citations: response.citations ?? [],
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error.';
        appendAssistantMessage(conversationId, messagesRef.current, {
          content: `Request failed: ${message}`,
          tone: 'error',
        });
      } finally {
        setBusyState('idle');
      }
    },
    [appendAssistantMessage, commitMessages, ensureConversation, isBusy],
  );

  return {
    messages,
    hasMessages: messages.length > 0,
    isBusy,
    busyLabel,
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
