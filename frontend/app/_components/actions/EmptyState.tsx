'use client';

import ChatComposer, {
  ChatComposerHandle,
} from '@/app/_components/chat/ChatComposer';
import { RefObject } from 'react';

interface EmptyStateProps {
  userName?: string;
  onSend: (payload: {
    text: string;
    file: File | null;
  }) => void | Promise<void>;
  composerRef: RefObject<ChatComposerHandle>;
  disabled?: boolean;
}

export default function EmptyState({
  userName = 'Louis',
  onSend,
  composerRef,
  disabled = false,
}: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
      <h1 className="text-[34px] font-normal text-foreground m-0 tracking-[-0.3px]"></h1>

      <div className="w-full max-w-[680px]">
        <ChatComposer ref={composerRef} onSend={onSend} disabled={disabled} />
      </div>
    </div>
  );
}
