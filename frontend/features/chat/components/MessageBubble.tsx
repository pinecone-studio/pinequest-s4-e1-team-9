import MessageActions from '@/features/chat/components/MessageActions';
import FileAttachmentChip from '@/features/documents/components/FileAttachmentChip';
import type { Citation, Message } from '@/shared/types/chat';
import { memo, useState } from 'react';

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

function renderCitations(
  citations: Citation[] | undefined,
  onOpenModal: (c: Citation) => void,
) {
  if (!citations?.length) return null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {citations.map((citation, index) => (
        <div
          key={`${citation.sourceId}-${citation.chunkId ?? citation.chunkIndex ?? index}`}
          className="
            border-l border-[#00e5cc]/60 pl-3
            text-[12px] leading-5 text-muted-foreground
            font-['JetBrains_Mono'] cursor-pointer hover:bg-secondary/20 py-1 pr-2 transition-colors
          "
          onClick={() => onOpenModal(citation)}
          title="Эх сурвалжийн бүтэн текстийг харах"
        >
          <div className="text-[#00e5cc] break-words font-bold">
            {citationTitle(citation)} 🔍
          </div>
          {citation.preview && (
            <p className="m-0 mt-1 break-words line-clamp-2 text-muted-foreground/80">
              {citation.preview}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function MessageBubble({ message, onCopy }: MessageBubbleProps) {
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  function handleSourceClick(e: React.MouseEvent, index: number) {
    e.preventDefault();
    const citation = message.citations?.[index];
    if (citation) {
      setActiveCitation(citation);
    }
  }

  function renderWithInteractiveSources(
    text: string,
    citations: Citation[] | undefined,
  ) {
    if (!text) return null;

    const parts = text.split(/(\[Source \d+\])/g);

    return parts.map((part, index) => {
      const match = part.match(/^\[Source (\d+)\]$/);

      if (match) {
        const sourceIndex = parseInt(match[1], 10) - 1;
        const citation = citations?.[sourceIndex];

        if (citation) {
          return (
            <span
              key={index}
              onClick={(e) => handleSourceClick(e, sourceIndex)}
              className="text-[#00e5cc] hover:underline font-bold mx-0.5 cursor-pointer underline-offset-4 bg-[#00e5cc]/10 px-1 rounded"
              title={`${citation.filename} - Хуудас ${citation.pageNumber || 'Нэг хэсэг'}`}
            >
              {part}
            </span>
          );
        }

        return (
          <span key={index} className="text-[#00e5cc]">
            {part}
          </span>
        );
      }

      return <span key={index}>{part}</span>;
    });
  }

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[72%] flex flex-col items-end gap-2">
          {message.attachment && (
            <FileAttachmentChip name={message.attachment.name} />
          )}
          {message.content && (
            <div className="bg-secondary rounded-none border border-border px-[18px] py-2 text-[15px] leading-6 text-secondary-foreground whitespace-pre-wrap break-words font-['JetBrains_Mono']">
              {renderWithInteractiveSources(message.content, message.citations)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col relative">
      <div
        className={`
          m-0 text-[15px] leading-[26px] whitespace-pre-wrap break-words font-['JetBrains_Mono']
          ${message.tone === 'error' ? 'text-destructive' : 'text-foreground'}
          ${message.tone === 'success' ? 'text-[#00e5cc]' : ''}
        `}
      >
        {renderWithInteractiveSources(message.content, message.citations)}
      </div>

      {renderCitations(message.citations, (c) => setActiveCitation(c))}

      <MessageActions onCopy={() => onCopy?.(message.content)} />

      {activeCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl font-['JetBrains_Mono'] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
              <div className="flex flex-col">
                <span className="text-[12px] text-[#00e5cc] font-bold uppercase tracking-wider">
                  Ишлэл авсан хуудасны хэсэг
                </span>
                <span className="text-[14px] font-medium text-foreground truncate max-w-md mt-0.5">
                  {activeCitation.filename}{' '}
                  {activeCitation.pageNumber
                    ? `(Хуудас ${activeCitation.pageNumber})`
                    : ''}
                </span>
              </div>
              <button
                onClick={() => setActiveCitation(null)}
                className="text-muted-foreground hover:text-foreground text-xl p-1 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto text-[14px] leading-6 text-foreground/90 whitespace-pre-wrap select-text bg-card/50 selection:bg-[#00e5cc]/30">
              {activeCitation.preview || 'Энэ хэсэгт текст олдсонгүй.'}
            </div>

            <div className="flex justify-end p-3 border-t border-border bg-secondary/10">
              <button
                onClick={() => setActiveCitation(null)}
                className="px-4 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 text-[13px] font-medium transition-all"
              >
                Хаах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(
  MessageBubble,
  (prev, next) => prev.message === next.message && prev.onCopy === next.onCopy,
);
