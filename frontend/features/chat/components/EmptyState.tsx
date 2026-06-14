'use client';

import ChatComposer, {
  ChatComposerHandle,
} from '@/features/chat/components/ChatComposer';
import type { SendPayload } from '@/shared/types/chat';
import { RefObject } from 'react';

interface EmptyStateProps {
  onSend: (payload: SendPayload) => void | Promise<void>;
  composerRef: RefObject<ChatComposerHandle>;
  disabled?: boolean;
}

export default function EmptyState({
  onSend,
  composerRef,
  disabled = false,
}: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8 font-['Inter']">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-[34px] font-semibold tracking-tight text-foreground m-0">
          Research Docs
        </h1>
        <p className="m-0 text-sm text-muted-foreground">PDF-ready workspace</p>
      </div>

      <div className="w-full max-w-[680px]">
        <ChatComposer ref={composerRef} onSend={onSend} disabled={disabled} />
      </div>
    </div>
  );
}
