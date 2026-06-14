import MessageActions from '@/features/chat/components/MessageActions';
import { getDocumentPdfSignedUrl } from '@/features/documents/api';
import FileAttachmentChip from '@/features/documents/components/FileAttachmentChip';
import type { Citation, Message } from '@/shared/types/chat';
import { Check, Copy, Pencil, X } from 'lucide-react';
import { memo, useEffect, useState } from 'react';

interface MessageBubbleProps {
  message: Message;
  onCopy?: (content: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
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

function withPdfPageFragment(signedUrl: string, pageNumber: number | null) {
  if (!pageNumber) return signedUrl;

  try {
    const url = new URL(signedUrl);
    url.hash = `page=${pageNumber}`;
    return url.toString();
  } catch {
    return `${signedUrl}#page=${pageNumber}`;
  }
}

async function openCitationPdf(citation: Citation) {
  if (!citation.documentId) {
    window.alert('This source is missing its document id.');
    return;
  }

  const pdfWindow = window.open('about:blank', '_blank');

  try {
    if (pdfWindow) {
      pdfWindow.opener = null;
      pdfWindow.document.title = citation.filename || 'PDF source';
      pdfWindow.document.body.textContent = 'Opening PDF...';
    }

    const { signedUrl } = await getDocumentPdfSignedUrl(citation.documentId);

    if (!signedUrl) {
      throw new Error('Failed to create PDF link.');
    }

    const pdfUrl = withPdfPageFragment(signedUrl, citation.pageNumber);

    if (pdfWindow) {
      pdfWindow.location.href = pdfUrl;
    } else {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    pdfWindow?.close();
    const message =
      error instanceof Error ? error.message : 'Failed to open PDF source.';
    window.alert(message);
  }
}

function renderCitations(citations: Citation[] | undefined) {
  if (!citations?.length) return null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {citations.map((citation, index) => {
        return (
          <button
            key={`${citation.sourceId}-${citation.chunkId ?? citation.chunkIndex ?? index}`}
            type="button"
            onClick={() => {
              void openCitationPdf(citation);
            }}
            className="
              border-l border-[#00e5cc]/60 pl-3 block w-full text-left no-underline
              text-[12px] leading-5 text-muted-foreground
              font-['Inter'] hover:bg-secondary/20 py-1 pr-2 transition-colors
            "
            title="Supabase Storage-оос бодит PDF хуудсыг шинэ таб дээр нээх"
          >
            <div className="text-[#00e5cc] break-words font-bold">
              {citationTitle(citation)} 📄
            </div>
            {citation.preview && (
              <p className="m-0 mt-1 break-words line-clamp-2 text-muted-foreground/80">
                {citation.preview}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

function MessageBubble({ message, onCopy, onEdit }: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(message.content);
    }
  }, [isEditing, message.content]);

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
            <button
              key={index}
              type="button"
              onClick={() => {
                void openCitationPdf(citation);
              }}
              className="text-[#00e5cc] hover:underline font-bold mx-0.5 underline-offset-4 bg-[#00e5cc]/10 px-1 rounded inline-block"
              title={`${citation.filename}`}
            >
              {part}
            </button>
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

  function handleSaveEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== message.content) {
      onEdit?.(message.id, trimmed);
    }
    setIsEditing(false);
  }

  function handleCancelEdit() {
    setEditValue(message.content);
    setIsEditing(false);
  }

  if (message.role === 'user') {
    return (
      <div
        className="flex justify-end"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="max-w-[72%] flex flex-col items-end gap-1.5">
          {message.attachment && (
            <FileAttachmentChip name={message.attachment.name} />
          )}

          {message.content && (
            <>
              {isEditing ? (
                <div className="w-full flex flex-col gap-2 items-end">
                  <textarea
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveEdit();
                      }
                      if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    rows={Math.min(
                      8,
                      Math.max(2, editValue.split('\n').length),
                    )}
                    className="
                      w-full bg-secondary rounded-2xl border border-[#00e5cc]/40
                      px-4 py-3 text-[15px] leading-6 text-secondary-foreground
                      whitespace-pre-wrap break-words font-['Inter']
                      outline-none focus:border-[#717976] resize-none
                      transition-colors duration-150
                    "
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="
                        flex items-center gap-1 px-3 py-1.5 rounded-full
                        bg-transparent border border-border text-muted-foreground
                        hover:bg-muted hover:text-foreground
                        text-[13px] font-medium cursor-pointer transition-colors duration-150
                      "
                    >
                      <X size={14} />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="
                        flex items-center gap-1 px-3 py-1.5 rounded-full
                        bg-[#d3d6d5] text-black border-none
                        hover:bg-[#929795]
                        text-[13px] font-medium cursor-pointer transition-colors duration-150
                      "
                    >
                      <Check size={14} />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="
                      bg-secondary rounded-full px-5 py-4 text-[16px] leading-6 text-secondary-foreground whitespace-pre-wrap break-words font-['Inter'] shadow-sm
                    "
                  >
                    {renderWithInteractiveSources(
                      message.content,
                      message.citations,
                    )}
                  </div>

                  <div
                    className={`
                      flex items-center gap-0.5 transition-opacity duration-150
                      ${hovered ? 'opacity-100' : 'opacity-0'}
                    `}
                  >
                    <button
                      type="button"
                      aria-label="Edit message"
                      title="Edit"
                      onClick={() => {
                        setEditValue(message.content);
                        setIsEditing(true);
                      }}
                      className="
                        w-7 h-7 rounded-full flex items-center justify-center
                        bg-transparent border-none text-muted-foreground
                        hover:bg-muted hover:text-foreground
                        cursor-pointer transition-colors duration-150
                      "
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      aria-label="Copy"
                      title="Copy"
                      onClick={() => onCopy?.(message.content)}
                      className="
                        w-7 h-7 rounded-full flex items-center justify-center
                        bg-transparent border-none text-muted-foreground
                        hover:bg-muted hover:text-foreground
                        cursor-pointer transition-colors duration-150
                      "
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col relative">
      <div
        className={`
          m-0 text-[15px] leading-[26px] whitespace-pre-wrap break-words font-['Inter']
          ${message.tone === 'error' ? 'text-destructive' : 'text-foreground'}
          ${message.tone === 'success' ? 'text-[#00e5cc]' : ''}
        `}
      >
        {renderWithInteractiveSources(message.content, message.citations)}
      </div>

      {renderCitations(message.citations)}

      <MessageActions onCopy={() => onCopy?.(message.content)} />
    </div>
  );
}

export default memo(
  MessageBubble,
  (prev, next) =>
    prev.message === next.message &&
    prev.onCopy === next.onCopy &&
    prev.onEdit === next.onEdit,
);
