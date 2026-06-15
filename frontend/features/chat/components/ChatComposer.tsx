'use client';

import ChatInput from '@/features/chat/components/ChatInput';
import type { SendPayload } from '@/shared/types/chat';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

export interface ChatComposerHandle {
  focus: () => void;
  reset: () => void;
}

interface ChatComposerProps {
  onSend: (payload: SendPayload) => void | Promise<void>;
  disabled?: boolean;
}

const ChatComposer = forwardRef<ChatComposerHandle, ChatComposerProps>(
  function ChatComposer({ onSend, disabled = false }, ref) {
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      reset: () => {
        setInput('');
        if (inputRef.current) inputRef.current.style.height = 'auto';
      },
    }));

    const handleSend = useCallback(async () => {
      const text = input.trim();
      if (!text || disabled) return;

      setInput('');
      if (inputRef.current) inputRef.current.style.height = 'auto';

      await onSend({ text, file: null });
    }, [input, disabled, onSend]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          void handleSend();
        }
      },
      [handleSend],
    );

    return (
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        inputRef={inputRef}
      />
    );
  },
);

export default ChatComposer;
