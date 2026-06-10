import MessageActions from '@/features/chat/components/MessageActions';
import FileAttachmentChip from '@/features/documents/components/FileAttachmentChip';
import type { Citation, Message } from '@/shared/types/chat';
import { memo } from 'react';

function renderWithSources(text: string) {
  if (!text) return null;

  const parts = text.split(/(\[Source \d+\])/g);
  return parts.map((part, index) => {
    if (/^\[Source \d+\]$/.test(part)) {
      return (
        <span key={index} className="text-[#00e5cc] hover:underline">
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

interface MessageBubbleProps {
  message: Message;
  onCopy?: (content: string) => void;
}

function citationTitle(citation: Citation) {
  return [
    citation.label || `[${citation.sourceId}]`,
    citation.filename,
    citation.pageNumber ? `p. ${citation.pageNumber}` : null,
  ]
    .filter(Boolean)
    .join(' - ');
}

function renderCitations(citations: Citation[] | undefined) {
  if (!citations?.length) return null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {citations.map((citation, index) => (
        <div
          key={`${citation.sourceId}-${citation.chunkId ?? citation.chunkIndex ?? index}`}
          className="
            border-l border-[#00e5cc]/60 pl-3
            text-[12px] leading-5 text-muted-foreground
            font-['JetBrains_Mono']
          "
        >
          <div className="text-[#00e5cc] break-words">
            {citationTitle(citation)}
          </div>
          {citation.preview && (
            <p className="m-0 mt-1 break-words">{citation.preview}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function MessageBubble({ message, onCopy }: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[72%] flex flex-col items-end gap-2">
          {message.attachment && (
            <FileAttachmentChip name={message.attachment.name} />
          )}
          {message.content && (
            <div
              className="
                bg-secondary rounded-none border border-border
                px-[18px] py-2 text-[15px] leading-6
                text-secondary-foreground whitespace-pre-wrap break-words font-['JetBrains_Mono']
              "
            >
              {renderWithSources(message.content)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <p
        className={`
          m-0 text-[15px] leading-[26px] whitespace-pre-wrap break-words font-['JetBrains_Mono']
          ${message.tone === 'error' ? 'text-destructive' : 'text-foreground'}
          ${message.tone === 'success' ? 'text-[#00e5cc]' : ''}
        `}
      >
        {renderWithSources(message.content)}
      </p>
      {renderCitations(message.citations)}
      <MessageActions onCopy={() => onCopy?.(message.content)} />
    </div>
  );
}

export default memo(
  MessageBubble,
  (prev, next) => prev.message === next.message && prev.onCopy === next.onCopy,
);
