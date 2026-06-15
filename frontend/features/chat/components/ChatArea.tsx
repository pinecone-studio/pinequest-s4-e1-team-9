'use client';

import ChatComposer, {
  ChatComposerHandle,
} from '@/features/chat/components/ChatComposer';
import LoadingDots from '@/features/chat/components/LoadingDots';
import MessageBubble from '@/features/chat/components/MessageBubble';
import type {
  Citation,
  EventSource,
  Message,
  SendPayload,
} from '@/shared/types/chat';
import { RefObject, useCallback, useEffect, useRef } from 'react';

interface ChatAreaProps {
  messages: Message[];
  loading: boolean;
  loadingLabel?: string;
  onSend: (payload: SendPayload) => void | Promise<void>;
  onEdit: (messageId: string, newContent: string) => void;
  onCitationOpen?: (citation: Citation) => void;
  onEventOpen?: (eventSource: EventSource) => void;
  composerRef: RefObject<ChatComposerHandle | null>;
  disabled?: boolean;
}

export default function ChatArea({
  messages,
  loading,
  loadingLabel,
  onSend,
  onEdit,
  onCitationOpen,
  onEventOpen,
  composerRef,
  disabled = false,
}: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [lastMessageId, loading]);

  const handleCopy = useCallback((content: string) => {
    navigator.clipboard.writeText(content).catch(() => undefined);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pb-4 pt-6 [scrollbar-width:thin] [scrollbar-color:var(--muted)_transparent] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--muted)] [&::-webkit-scrollbar]:w-1.5"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 sm:px-6">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onCopy={handleCopy}
              onEdit={onEdit}
              onCitationOpen={onCitationOpen}
              onEventOpen={onEventOpen}
            />
          ))}
          {loading && <LoadingDots label={loadingLabel} />}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
        <ChatComposer ref={composerRef} onSend={onSend} disabled={disabled} />
        </div>
      </div>
    </div>
  );
}
