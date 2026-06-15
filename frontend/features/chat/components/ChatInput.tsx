import { ArrowUp } from 'lucide-react';
import type { RefObject } from 'react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  onKeyDown,
  disabled = false,
  inputRef,
}: ChatInputProps) {
  const canSend = value.trim().length > 0 && !disabled;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  return (
    <div
      className="rounded-lg border border-border bg-card p-2 shadow-[var(--shadow-sm)] transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30"
      onClick={() => inputRef.current?.focus()}
    >
      <label htmlFor="chat-message" className="sr-only">
        Message
      </label>
      <div className="flex items-end gap-2">
        <textarea
          id="chat-message"
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          placeholder="Ask from this AI's documents..."
          disabled={disabled}
          rows={1}
          className="min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-foreground placeholder:text-muted-foreground disabled:opacity-60"
          style={{ maxHeight: 180 }}
        />

        <Button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSend();
          }}
          disabled={!canSend}
          aria-label="Send message"
          size="icon"
          className={cn(!canSend && 'opacity-50')}
        >
          <ArrowUp className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
