'use client';

import ChatInput from '@/app/_components/chat/ChatInput';
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

export interface SendPayload {
  text: string;
  file: File | null;
}

interface ChatComposerProps {
  onSend: (payload: SendPayload) => void | Promise<void>;
  disabled?: boolean;
}

const ChatComposer = forwardRef<ChatComposerHandle, ChatComposerProps>(
  function ChatComposer({ onSend, disabled = false }, ref) {
    const [input, setInput] = useState('');
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      reset: () => {
        setInput('');
        setAttachedFile(null);
        if (inputRef.current) inputRef.current.style.height = 'auto';
      },
    }));

    const handleSend = useCallback(async () => {
      const text = input.trim();
      if ((!text && !attachedFile) || disabled) return;

      const file = attachedFile;
      setInput('');
      setAttachedFile(null);
      if (inputRef.current) inputRef.current.style.height = 'auto';

      await onSend({ text, file });
    }, [input, attachedFile, disabled, onSend]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          void handleSend();
        }
      },
      [handleSend]
    );

    return (
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        onKeyDown={handleKeyDown}
        onFileSelect={setAttachedFile}
        onRemoveAttachment={() => setAttachedFile(null)}
        attachedFile={attachedFile}
        disabled={disabled}
        inputRef={inputRef}
      />
    );
  }
);

export default ChatComposer;
