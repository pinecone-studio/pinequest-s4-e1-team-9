import type { Citation, EventSource, Message } from '@/shared/types/chat';
import { Button } from '@/shared/ui/button';
import { StatusPill } from '@/shared/ui/product';
import { cn } from '@/shared/lib/utils';
import {
  Check,
  Copy,
  CalendarDays,
  FileText,
  Pencil,
  X,
} from 'lucide-react';
import type React from 'react';
import { memo, useEffect, useState } from 'react';

interface MessageBubbleProps {
  message: Message;
  onCopy?: (content: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onCitationOpen?: (citation: Citation) => void;
  onEventOpen?: (eventSource: EventSource) => void;
}

function citationTitle(citation: Citation) {
  return [
    citation.label || `[${citation.sourceId}]`,
    citation.filename,
    citation.pageNumber ? `p. ${citation.pageNumber}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

function SourceToken({
  label,
  citation,
  eventSource,
  onCitationOpen,
  onEventOpen,
}: {
  label: string;
  citation?: Citation;
  eventSource?: EventSource;
  onCitationOpen?: (citation: Citation) => void;
  onEventOpen?: (eventSource: EventSource) => void;
}) {
  if (eventSource) {
    return (
      <button
        type="button"
        onClick={() => onEventOpen?.(eventSource)}
        className="mx-0.5 inline-flex rounded-md border border-[color-mix(in_srgb,var(--success)_42%,var(--border))] bg-[var(--success-soft)] px-1.5 py-0.5 text-xs font-medium text-[var(--success)] transition-colors hover:bg-[color-mix(in_srgb,var(--success)_18%,transparent)] focus-visible:ring-2 focus-visible:ring-ring"
        title={eventSource.title}
      >
        {label}
      </button>
    );
  }

  if (!citation) {
    return (
      <span className="inline-flex rounded-md bg-[var(--surface-2)] px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onCitationOpen?.(citation)}
      className="mx-0.5 inline-flex rounded-md border border-[color-mix(in_srgb,var(--accent)_42%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-1.5 py-0.5 text-xs font-medium text-accent transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] focus-visible:ring-2 focus-visible:ring-ring"
      title={citationTitle(citation)}
    >
      {label}
    </button>
  );
}

function renderInlineSources(
  text: string,
  citations: Citation[] | undefined,
  eventSources: EventSource[] | undefined,
  onCitationOpen?: (citation: Citation) => void,
  onEventOpen?: (eventSource: EventSource) => void,
) {
  const parts = text.split(/(\[(?:Source|Event) \d+\])/g);

  return parts.map((part, index) => {
    const sourceMatch = part.match(/^\[Source (\d+)\]$/);
    const eventMatch = part.match(/^\[Event (\d+)\]$/);

    if (!sourceMatch && !eventMatch) return <span key={index}>{part}</span>;

    if (eventMatch) {
      const eventSource = eventSources?.[Number(eventMatch[1]) - 1];
      return (
        <SourceToken
          key={index}
          label={part}
          eventSource={eventSource}
          onEventOpen={onEventOpen}
        />
      );
    }

    const citation = citations?.[Number(sourceMatch![1]) - 1];
    return (
      <SourceToken
        key={index}
        label={part}
        citation={citation}
        onCitationOpen={onCitationOpen}
      />
    );
  });
}

function MarkdownLite({
  content,
  citations,
  eventSources,
  onCitationOpen,
  onEventOpen,
}: {
  content: string;
  citations?: Citation[];
  eventSources?: EventSource[];
  onCitationOpen?: (citation: Citation) => void;
  onEventOpen?: (eventSource: EventSource) => void;
}) {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];
  let codeLines: string[] = [];
  let inCode = false;

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="ml-5 list-disc space-y-1">
        {listItems.map((item, index) => (
          <li key={`${item}-${index}`}>
            {renderInlineSources(
              item,
              citations,
              eventSources,
              onCitationOpen,
              onEventOpen,
            )}
          </li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  const flushCode = () => {
    if (!codeLines.length) return;
    blocks.push(
      <pre
        key={`code-${blocks.length}`}
        className="overflow-x-auto rounded-lg border border-border bg-background p-3 text-xs"
      >
        <code>{codeLines.join('\n')}</code>
      </pre>,
    );
    codeLines = [];
  };

  lines.forEach((line) => {
    if (line.trim().startsWith('```')) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        flushList();
        inCode = true;
      }
      return;
    }

    if (inCode) {
      codeLines.push(line);
      return;
    }

    const bullet = line.match(/^\s*[-*]\s+(.+)/);
    if (bullet) {
      listItems.push(bullet[1]);
      return;
    }

    flushList();

    if (!line.trim()) {
      return;
    }

    if (line.startsWith('### ')) {
      blocks.push(
        <h4 key={`h4-${blocks.length}`} className="text-sm font-semibold">
          {renderInlineSources(
            line.slice(4),
            citations,
            eventSources,
            onCitationOpen,
            onEventOpen,
          )}
        </h4>,
      );
      return;
    }

    if (line.startsWith('## ')) {
      blocks.push(
        <h3 key={`h3-${blocks.length}`} className="text-base font-semibold">
          {renderInlineSources(
            line.slice(3),
            citations,
            eventSources,
            onCitationOpen,
            onEventOpen,
          )}
        </h3>,
      );
      return;
    }

    blocks.push(
      <p key={`p-${blocks.length}`}>
        {renderInlineSources(
          line,
          citations,
          eventSources,
          onCitationOpen,
          onEventOpen,
        )}
      </p>,
    );
  });

  flushList();
  flushCode();

  return <div className="space-y-3">{blocks}</div>;
}

function formatEventSourceTime(eventSource: EventSource) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    timeZone: eventSource.timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const start = formatter.format(new Date(eventSource.startsAt));
  const end = eventSource.endsAt
    ? formatter.format(new Date(eventSource.endsAt))
    : null;

  return end ? `${start} to ${end}` : start;
}

function EventSourceCards({
  eventSources,
  onEventOpen,
}: {
  eventSources: EventSource[] | undefined;
  onEventOpen?: (eventSource: EventSource) => void;
}) {
  if (!eventSources?.length) return null;

  return (
    <div className="mt-4 grid gap-2">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        <CalendarDays className="mr-1 inline size-3.5" aria-hidden="true" />
        Events
      </p>
      <div className="grid gap-2">
        {eventSources.map((eventSource, index) => (
          <button
            key={`${eventSource.eventId}-${index}`}
            type="button"
            onClick={() => onEventOpen?.(eventSource)}
            className="rounded-lg border border-[color-mix(in_srgb,var(--success)_30%,var(--border))] bg-[var(--success-soft)] p-3 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--success)_16%,transparent)] focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={eventSource.status === 'cancelled' ? 'warning' : 'success'}>
                Event {index + 1}
              </StatusPill>
              <span className="min-w-0 truncate text-sm font-medium text-foreground">
                {eventSource.title}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {formatEventSourceTime(eventSource)} · {eventSource.timezone}
              {eventSource.location ? ` · ${eventSource.location}` : ''}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function CitationCards({
  citations,
  onCitationOpen,
}: {
  citations: Citation[] | undefined;
  onCitationOpen?: (citation: Citation) => void;
}) {
  if (!citations?.length) return null;

  return (
    <div className="mt-4 grid gap-2">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Sources
      </p>
      <div className="grid gap-2">
        {citations.map((citation, index) => (
          <button
            key={`${citation.sourceId}-${citation.chunkId ?? citation.chunkIndex ?? index}`}
            type="button"
            onClick={() => onCitationOpen?.(citation)}
            className="rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="info">Source {index + 1}</StatusPill>
              <span className="min-w-0 truncate text-sm font-medium text-foreground">
                {citation.filename || citation.label || 'Document source'}
              </span>
              {citation.pageNumber && (
                <span className="text-xs text-muted-foreground">
                  Page {citation.pageNumber}
                </span>
              )}
            </div>
            {citation.preview && (
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {citation.preview}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onCopy,
  onEdit,
  onCitationOpen,
  onEventOpen,
}: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(message.content);
    }
  }, [isEditing, message.content]);

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
        <div className="flex w-full max-w-[min(640px,86%)] flex-col items-end gap-2">
          {isEditing ? (
            <div className="w-full rounded-lg border border-border bg-card p-2">
              <textarea
                autoFocus
                value={editValue}
                onChange={(event) => setEditValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSaveEdit();
                  }
                  if (event.key === 'Escape') {
                    handleCancelEdit();
                  }
                }}
                rows={Math.min(8, Math.max(2, editValue.split('\n').length))}
                className="min-h-24 w-full resize-none bg-transparent px-2 py-2 text-sm leading-6 text-foreground"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>
                  <X className="size-4" aria-hidden="true" />
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={handleSaveEdit}>
                  <Check className="size-4" aria-hidden="true" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground shadow-[var(--shadow-sm)]">
                <MarkdownLite
                  content={message.content}
                  citations={message.citations}
                  eventSources={message.eventSources}
                  onCitationOpen={onCitationOpen}
                  onEventOpen={onEventOpen}
                />
              </div>
              <div
                className={cn(
                  'flex items-center gap-1 transition-opacity',
                  hovered ? 'opacity-100' : 'opacity-0 focus-within:opacity-100',
                )}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Edit message"
                  onClick={() => {
                    setEditValue(message.content);
                    setIsEditing(true);
                  }}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Copy message"
                  onClick={() => onCopy?.(message.content)}
                >
                  <Copy className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        <FileText className="size-3.5" aria-hidden="true" />
        Assistant
      </div>
      <div
        className={cn(
          'max-w-3xl text-sm leading-7',
          message.tone === 'error' ? 'text-destructive' : 'text-foreground',
          message.tone === 'success' && 'text-[var(--success)]',
        )}
      >
        <MarkdownLite
          content={message.content}
          citations={message.citations}
          eventSources={message.eventSources}
          onCitationOpen={onCitationOpen}
          onEventOpen={onEventOpen}
        />
      </div>
      <CitationCards
        citations={message.citations}
        onCitationOpen={onCitationOpen}
      />
      <EventSourceCards
        eventSources={message.eventSources}
        onEventOpen={onEventOpen}
      />
      <div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Copy message"
          onClick={() => onCopy?.(message.content)}
        >
          <Copy className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export default memo(
  MessageBubble,
  (prev, next) =>
    prev.message === next.message &&
    prev.onCopy === next.onCopy &&
    prev.onEdit === next.onEdit &&
    prev.onCitationOpen === next.onCitationOpen &&
    prev.onEventOpen === next.onEventOpen,
);
