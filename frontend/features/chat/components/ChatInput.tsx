import FileAttachmentChip from '@/features/documents/components/FileAttachmentChip';
import { PDF_ACCEPT } from '@/shared/types/documents';
import { ArrowUp, Plus } from 'lucide-react';
import { RefObject, useRef } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFileSelect?: (file: File) => void;
  onRemoveAttachment?: () => void;
  attachedFile?: File | null;
  disabled?: boolean;
  inputRef: RefObject<HTMLTextAreaElement>;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  onKeyDown,
  onFileSelect,
  onRemoveAttachment,
  attachedFile = null,
  disabled = false,
  inputRef,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const suppressEnterRef = useRef(false);
  const canSend = value.trim().length > 0 || !!attachedFile;

  const clearEnterSuppression = () => {
    window.setTimeout(() => {
      suppressEnterRef.current = false;
    }, 100);
  };

  const openFilePicker = () => {
    suppressEnterRef.current = true;
    inputRef.current?.blur();
    window.addEventListener('focus', clearEnterSuppression, { once: true });
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suppressEnterRef.current && e.key === 'Enter') {
      e.preventDefault();
      suppressEnterRef.current = false;
      return;
    }
    onKeyDown(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect?.(file);
      e.target.value = '';
      inputRef.current?.focus();
    }
    clearEnterSuppression();
  };

  return (
    <div
      className="
        bg-input rounded-full px-3.5 py-2.5
        border border-transparent focus-within:border-[white] focus-within:shadow-[0_0_8px_rgba(0,229,204,0.12)]
        transition-all duration-200 ease-in-out cursor-text font-['Inter']
      "
      onClick={() => inputRef.current?.focus()}
    >
      {attachedFile && (
        <div className="flex items-center gap-2 pb-2 mb-0.5">
          <FileAttachmentChip
            name={attachedFile.name}
            onRemove={() => onRemoveAttachment?.()}
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={PDF_ACCEPT}
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          aria-label="Attach document"
          title="Attach PDF"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            openFilePicker();
          }}
          className="
          w-9 h-9 rounded-full flex items-center justify-center shrink-0
          bg-transparent border-none text-muted-foreground
          hover:bg-muted hover:text-foreground
          disabled:opacity-40 disabled:cursor-not-allowed
          cursor-pointer transition-colors duration-150
        "
        >
          <Plus size={20} />
        </button>
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter query sequence or attach a document..."
          disabled={disabled}
          rows={1}
          className="
          flex-1 bg-transparent border-none outline-none resize-none
          transition-all duration-200 ease-in-out
          text-foreground text-[15px] leading-6
          placeholder:text-muted-foreground font-['Inter']
          py-1.5 disabled:opacity-60
          [&::-webkit-scrollbar]:hidden
        "
          style={{ maxHeight: 200 }}
        />

        {canSend && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSend();
            }}
            disabled={disabled}
            aria-label="Send message"
            className="
            w-9 h-9 rounded-full flex items-center justify-center shrink-0
            bg-[#161616] border-none text-[#00e5cc]
            hover:opacity-90 active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed
            cursor-pointer transition-colors duration-150
          "
          >
            <div className="w-8 h-8 bg-[#323232] flex border border-[#717976] items-center justify-center rounded-full">
              <ArrowUp size={20} className="text-foreground" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
