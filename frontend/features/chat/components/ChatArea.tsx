'use client';

import ChatComposer, {
  ChatComposerHandle,
} from '@/features/chat/components/ChatComposer';
import LoadingDots from '@/features/chat/components/LoadingDots';
import MessageBubble from '@/features/chat/components/MessageBubble';
import type { Message, SendPayload } from '@/shared/types/chat';
import { RefObject, useCallback, useEffect, useRef } from 'react';

interface ChatAreaProps {
  messages: Message[];
  loading: boolean;
  loadingLabel?: string;
  onSend: (payload: SendPayload) => void | Promise<void>;
  onEdit: (messageId: string, newContent: string) => void;
  composerRef: RefObject<ChatComposerHandle | null>;
  disabled?: boolean;
}

export default function ChatArea({
  messages,
  loading,
  loadingLabel,
  onSend,
  onEdit,
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
    <div className="flex flex-col flex-1 overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="
          flex-1 overflow-y-auto pt-6 pb-2
          [scrollbar-width:thin] [scrollbar-color:var(--muted)_transparent]
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-[var(--muted)]
          [&::-webkit-scrollbar-thumb]:rounded-full
        "
      >
        <div className="max-w-[720px] mx-auto px-6 flex flex-col gap-6">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onCopy={handleCopy}
              onEdit={onEdit}
            />
          ))}
          {loading && <LoadingDots label={loadingLabel} />}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="w-full max-w-[768px] mx-auto px-6 py-3 box-border">
        <ChatComposer ref={composerRef} onSend={onSend} disabled={disabled} />
      </div>
    </div>
  );
}
