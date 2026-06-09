'use client';

import type { Message } from '@/app/_components/chat/MessageBubble';
import { useCallback, useEffect, useState } from 'react';

export type Conversation = {
  id: string;
  title: string;
  createdAt: number; // unix ms
  updatedAt: number;
  messages: Message[];
};

const STORAGE_KEY = 'research_docs_chat_history';
const MAX_CONVERSATIONS = 100;

function readStorage(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

function writeStorage(conversations: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {}
}

function deriveTitle(messages: Message[]): string {
  const first = messages.find((m) => m.role === 'user');
  if (!first) return 'New chat';
  const text = first.content.trim();
  return text.length > 60 ? text.slice(0, 57) + '…' : text;
}

export function useLocalChatHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setConversations(readStorage());
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      writeStorage(conversations);
    }
  }, [conversations]);

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
      writeStorage(next);
      return next;
    });
    setActiveId(id);
    return id;
  }, []);
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
        writeStorage(next);
        return next;
      });
    },
    [],
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
        writeStorage(next);
        return next;
      });
      if (activeId === conversationId) {
        setActiveId(null);
      }
    },
    [activeId],
  );

  const clearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setConversations([]);
    setActiveId(null);
  }, []);

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
