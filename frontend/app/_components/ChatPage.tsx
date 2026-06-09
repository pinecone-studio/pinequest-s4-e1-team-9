'use client';

import EmptyState from '@/app/_components/actions/EmptyState';
import HeaderActions from '@/app/_components/actions/HeaderActions';
import ChatArea from '@/app/_components/chat/ChatArea';
import ChatBackground from '@/app/_components/chat/ChatBackground';
import {
  ChatComposerHandle,
  SendPayload,
} from '@/app/_components/chat/ChatComposer';
import { Message } from '@/app/_components/chat/MessageBubble';
import Sidebar from '@/app/_components/chat/Sidebar';
import { useLocalChatHistory } from '@/app/_components/chat/UseLocalChatHistory';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ChatResponse {
  reply?: string;
  error?: string;
}

const CHAT_API_URL =
  process.env.NEXT_PUBLIC_CHAT_API_URL || 'http://localhost:4000/chat';

const UPLOAD_API_URL =
  process.env.NEXT_PUBLIC_UPLOAD_API_URL || 'http://localhost:4000/upload';

export default function GeminiPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
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
  } = useLocalChatHistory();

  const hasMessages = messages.length > 0;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    composerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!loading) composerRef.current?.focus();
  }, [loading]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    activeConversationId.current = null;
    setActiveId(null);
    composerRef.current?.reset();
    composerRef.current?.focus();
  }, [setActiveId]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      const restored = loadConversation(id);
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
        activeConversationId.current = null;
      }
    },
    [deleteConversation],
  );

  const uploadFile = async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(UPLOAD_API_URL, { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Upload failed');
  };

  const sendMessage = useCallback(
    async ({ text, file: fileToUpload }: SendPayload) => {
      if (loading) return;
      setLoading(true);

      try {
        if (!activeConversationId.current) {
          activeConversationId.current = createConversation();
        }

        const conversationId = activeConversationId.current!;

        const userMsg: Message = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: text,
          attachment: fileToUpload ? { name: fileToUpload.name } : undefined,
        };

        const updatedMessages = [...messagesRef.current, userMsg];
        setMessages(updatedMessages);
        saveMessages(conversationId, updatedMessages);

        if (fileToUpload) {
          await uploadFile(fileToUpload);
        }

        if (!text) return;

        const res = await fetch(CHAT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages
              .filter((m) => !m.id.startsWith('system-'))
              .map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        const data = (await res.json()) as ChatResponse;
        if (!res.ok) throw new Error(data.error ?? 'Request failed');

        const assistantMsg: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.reply?.trim() || 'No response.',
        };

        const finalMessages = [...updatedMessages, assistantMsg];
        setMessages(finalMessages);
        saveMessages(conversationId, finalMessages);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error.';
        const errorMsg: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: text
            ? `Sorry, I couldn't reach the backend: ${msg}`
            : `Failed to upload file: ${msg}`,
        };
        const withError = [...messagesRef.current, errorMsg];
        setMessages(withError);
        if (activeConversationId.current) {
          saveMessages(activeConversationId.current, withError);
        }
      } finally {
        setLoading(false);
      }
    },
    [loading, createConversation, saveMessages],
  );

  return (
    <div className="flex h-screen overflow-hidden relative bg-background text-foreground">
      <ChatBackground />

      <Sidebar
        onNewChat={handleNewChat}
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <HeaderActions hasMessages={hasMessages} />

        {hasMessages ? (
          <ChatArea
            messages={messages}
            loading={loading}
            onSend={sendMessage}
            composerRef={composerRef}
            disabled={loading}
          />
        ) : (
          <EmptyState
            userName="Louis"
            onSend={sendMessage}
            composerRef={composerRef}
            disabled={loading}
          />
        )}
      </main>
    </div>
  );
}
