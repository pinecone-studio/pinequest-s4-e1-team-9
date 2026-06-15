'use client';

import ChatComposer, {
  ChatComposerHandle,
} from '@/features/chat/components/ChatComposer';
import type { Company } from '@/features/companies/types';
import type { AiEvent } from '@/features/events/api';
import type { SendPayload } from '@/shared/types/chat';
import { Alert, StatusPill } from '@/shared/ui/product';
import { BookOpen, CalendarDays, MessageSquareText } from 'lucide-react';
import { RefObject, useEffect, useState } from 'react';

interface EmptyStateProps {
  company: Company;
  suggestedQuestions: string[];
  events?: AiEvent[];
  readyDocumentCount: number;
  onSend: (payload: SendPayload) => void | Promise<void>;
  composerRef: RefObject<ChatComposerHandle | null>;
  disabled?: boolean;
}

export default function EmptyState({
  company,
  suggestedQuestions,
  events = [],
  readyDocumentCount,
  onSend,
  composerRef,
  disabled = false,
}: EmptyStateProps) {
  const config = company.aiConfiguration;
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
  }, [events]);

  const upcomingEvents = events
    .filter(
      (event) =>
        event.status === 'scheduled' &&
        new Date(event.startsAt).getTime() >= now,
    )
    .slice(0, 3);

  const formatEvent = (event: AiEvent) =>
    new Intl.DateTimeFormat(undefined, {
      timeZone: event.timezone,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(event.startsAt));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-8 sm:px-6">
        <div className="mb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-[var(--surface-2)] text-muted-foreground">
              <MessageSquareText className="size-5" aria-hidden="true" />
            </span>
            <StatusPill tone={readyDocumentCount > 0 ? 'success' : 'warning'}>
              {readyDocumentCount > 0
                ? `${readyDocumentCount} source PDF${readyDocumentCount === 1 ? '' : 's'} ready`
                : 'No ready sources'}
            </StatusPill>
          </div>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
            {config?.welcomeMessage || `Ask ${company.name} a question`}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {config?.description ||
              company.description ||
              'This AI answers from the documents and behavior configured for this workspace.'}
          </p>
        </div>

        {readyDocumentCount === 0 && (
          <Alert variant="warning" className="mb-6">
            This AI does not have a ready PDF yet. It may not be able to answer
            source-backed questions until the owner adds knowledge.
          </Alert>
        )}

        {upcomingEvents.length > 0 && (
          <div className="mb-6 rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
              Upcoming events
            </div>
            <div className="grid gap-2">
              {upcomingEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() =>
                    onSend({ text: `When is ${event.title}?`, file: null })
                  }
                  disabled={disabled}
                  className="grid gap-1 rounded-lg border border-border bg-[var(--surface-2)] p-3 text-left transition-colors hover:bg-[var(--surface-3)] focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="truncate text-sm font-medium">
                    {event.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatEvent(event)} · {event.timezone}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {suggestedQuestions.length > 0 && (
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <BookOpen className="size-4 text-muted-foreground" aria-hidden="true" />
              Starter questions
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {suggestedQuestions.slice(0, 4).map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => onSend({ text: question, file: null })}
                  disabled={disabled}
                  className="rounded-lg border border-border bg-card p-3 text-left text-sm leading-5 text-foreground transition-colors hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <ChatComposer ref={composerRef} onSend={onSend} disabled={disabled} />
      </div>
    </div>
  );
}
