'use client';

import type { Conversation, Message } from '@/shared/types/chat';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY_PREFIX = 'research_docs_chat_history';
const MAX_CONVERSATIONS = 100;

function getStorageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

function readStorage(storageKey: string): Conversation[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

function writeStorage(storageKey: string, conversations: Conversation[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(conversations));
  } catch {}
}

function deriveTitle(messages: Message[]): string {
  const first = messages.find((m) => m.role === 'user');
  if (!first) return 'New chat';
  const text = first.content.trim();
  return text.length > 60 ? text.slice(0, 57) + '…' : text;
}

export function useLocalChatHistory(userId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const storageKey = getStorageKey(userId);

  useEffect(() => {
    setConversations(readStorage(storageKey));
    setActiveId(null);
  }, [storageKey]);

  useEffect(() => {
    if (conversations.length > 0) {
      writeStorage(storageKey, conversations);
    }
  }, [conversations, storageKey]);

  const createConversation = useCallback((): string => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const newConvo: Conversation = {
      id,
      title: 'New chat',
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    setConversations((prev) => {
      const next = [newConvo, ...prev].slice(0, MAX_CONVERSATIONS);
      writeStorage(storageKey, next);
      return next;
    });
    setActiveId(id);
    return id;
  }, [storageKey]);
  const saveMessages = useCallback(
    (conversationId: string, messages: Message[]) => {
      setConversations((prev) => {
        const next = prev.map((c) => {
          if (c.id !== conversationId) return c;
          return {
            ...c,
            title: deriveTitle(messages),
            updatedAt: Date.now(),
            messages,
          };
        });
        writeStorage(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );
  const loadConversation = useCallback(
    (conversationId: string): Message[] => {
      setActiveId(conversationId);
      const convo = conversations.find((c) => c.id === conversationId);
      return convo?.messages ?? [];
    },
    [conversations],
  );
  const deleteConversation = useCallback(
    (conversationId: string) => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== conversationId);
        writeStorage(storageKey, next);
        return next;
      });
      if (activeId === conversationId) {
        setActiveId(null);
      }
    },
    [activeId, storageKey],
  );

  const clearAll = useCallback(() => {
    localStorage.removeItem(storageKey);
    setConversations([]);
    setActiveId(null);
  }, [storageKey]);

  return {
    conversations,
    activeId,
    setActiveId,
    createConversation,
    saveMessages,
    loadConversation,
    deleteConversation,
    clearAll,
  };
}
