'use client';

import LoadingDots from '@/app/_components/actions/LoadingDots';
import ChatComposer, {
  ChatComposerHandle,
} from '@/app/_components/chat/ChatComposer';
import MessageBubble, { Message } from '@/app/_components/chat/MessageBubble';
import { RefObject, useCallback, useEffect, useRef } from 'react';

interface ChatAreaProps {
  messages: Message[];
  loading: boolean;
  onSend: (payload: {
    text: string;
    file: File | null;
  }) => void | Promise<void>;
  composerRef: RefObject<ChatComposerHandle>;
  disabled?: boolean;
}

export default function ChatArea({
  messages,
  loading,
  onSend,
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
            <MessageBubble key={msg.id} message={msg} onCopy={handleCopy} />
          ))}
          {loading && <LoadingDots />}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="w-full max-w-[768px] mx-auto px-6 py-3 box-border">
        <ChatComposer ref={composerRef} onSend={onSend} disabled={disabled} />
      </div>
    </div>
  );
}
