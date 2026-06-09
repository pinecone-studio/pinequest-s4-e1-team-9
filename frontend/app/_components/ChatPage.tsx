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
    composerRef.current?.reset();
    composerRef.current?.focus();
  }, []);

  const uploadFile = async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(UPLOAD_API_URL, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Upload failed');
  };

  const sendMessage = useCallback(
    async ({ text, file: fileToUpload }: SendPayload) => {
      if (loading) return;

      setLoading(true);

      try {
        const userMsg: Message = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: text,
          attachment: fileToUpload ? { name: fileToUpload.name } : undefined,
        };

        const updatedMessages = [...messagesRef.current, userMsg];
        setMessages(updatedMessages);

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

        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.reply?.trim() || 'No response.',
          },
        ]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error.';
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: text
              ? `Sorry, I couldn't reach the backend: ${msg}`
              : `Failed to upload file: ${msg}`,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  return (
    <div className="flex h-screen overflow-hidden relative bg-background text-foreground">
      <ChatBackground />

      <Sidebar onNewChat={handleNewChat} />

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
