'use client';

import AuthGate from '@/features/auth/AuthGate';
import { getCompanyAccess } from '@/features/admin/api';
import type { CompanyAccess } from '@/features/admin/types';
import AISelector from '@/features/chat/components/AISelector';
import ChatArea from '@/features/chat/components/ChatArea';
import EmptyState from '@/features/chat/components/EmptyState';
import Sidebar from '@/features/chat/components/Sidebar';
import { useChat } from '@/features/chat/hooks/useChat';
import {
  isValidCompanyId,
  resolveChatWorkspace,
} from '@/features/chat/workspace-resolution';
import { listUserCompanies } from '@/features/companies/api';
import type { Company } from '@/features/companies/types';
import { getDocumentPdfSignedUrl } from '@/features/documents/api';
import { listAiEvents, type AiEvent } from '@/features/events/api';
import {
  getUserPreferences,
  setLastSelectedCompanyId,
} from '@/features/preferences/api';
import { StatusBadge } from '@/features/dashboard/components/ui';
import type { Citation, EventSource } from '@/shared/types/chat';
import { Button, buttonVariants } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import {
  Alert,
  LoadingState,
  ProfileMenu,
  StatusPill,
} from '@/shared/ui/product';
import {
  ExternalLink,
  FileText,
  Menu,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

type SourceState = {
  citation: Citation;
  url: string | null;
  error: string | null;
  loading: boolean;
};

function withPdfPageFragment(
  signedUrl: string,
  pageNumber: number | null,
  zoom: number | 'page-width' = 'page-width',
) {
  const hashParts = [
    pageNumber ? `page=${pageNumber}` : null,
    zoom ? `zoom=${zoom}` : null,
  ].filter(Boolean);

  if (!hashParts.length) return signedUrl;

  try {
    const url = new URL(signedUrl);
    url.hash = hashParts.join('&');
    return url.toString();
  } catch {
    return `${signedUrl}#${hashParts.join('&')}`;
  }
}

function withoutHash(url: string) {
  const [baseUrl] = url.split('#');
  return baseUrl;
}

function formatEventSourceDate(eventSource: EventSource) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    timeZone: eventSource.timezone,
    dateStyle: 'full',
    timeStyle: 'short',
  });
  const start = formatter.format(new Date(eventSource.startsAt));
  const end = eventSource.endsAt
    ? formatter.format(new Date(eventSource.endsAt))
    : null;

  return end ? `${start} to ${end}` : start;
}

export default function ChatPage({
  companyId,
  conversationId,
  initialNotice,
}: {
  companyId: string;
  conversationId?: string;
  initialNotice?: string;
}) {
  return (
    <AuthGate>
      <ChatWorkspace
        companyId={companyId}
        conversationId={conversationId}
        initialNotice={initialNotice}
      />
    </AuthGate>
  );
}

function ChatWorkspace({
  companyId,
  conversationId,
  initialNotice,
}: {
  companyId: string;
  conversationId?: string;
  initialNotice?: string;
}) {
  const router = useRouter();
  const [access, setAccess] = useState<CompanyAccess | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isAccessLoading, setIsAccessLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [source, setSource] = useState<SourceState | null>(null);
  const [eventDetails, setEventDetails] = useState<EventSource | null>(null);
  const [events, setEvents] = useState<AiEvent[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingSwitch, setPendingSwitch] = useState<Company | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem('pinequest.chat.sidebarCollapsed');

    if (stored === 'true' || stored === 'false') {
      setSidebarCollapsed(stored === 'true');
      return;
    }

    if (window.innerWidth < 1280) {
      setSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      'pinequest.chat.sidebarCollapsed',
      String(sidebarCollapsed),
    );
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (source && window.innerWidth < 1500) {
      setSidebarCollapsed(true);
    }
  }, [source]);

  useEffect(() => {
    let active = true;

    async function redirectToResolvedWorkspace(reason: string) {
      const [nextCompanies, preferences] = await Promise.all([
        listUserCompanies(),
        getUserPreferences().catch(() => ({ lastSelectedCompanyId: null })),
      ]);
      const fallbackCompanies = nextCompanies.filter(
        (company) => company.id !== companyId,
      );
      const resolution = resolveChatWorkspace(
        fallbackCompanies,
        preferences.lastSelectedCompanyId,
      );

      if (!active) return;

      const noticeText =
        reason ||
        'That AI is no longer available, so we opened an accessible workspace.';

      if (resolution.status === 'selected') {
        if (resolution.shouldPersist) {
          void setLastSelectedCompanyId(resolution.company.id).catch(
            () => undefined,
          );
        }
        const nextUrl = new URL(
          `/chat/${resolution.company.id}`,
          window.location.origin,
        );
        nextUrl.searchParams.set('notice', noticeText);
        router.replace(`${nextUrl.pathname}${nextUrl.search}`);
        return;
      }

      if (resolution.shouldClearStaleSelection || !isValidCompanyId(companyId)) {
        void setLastSelectedCompanyId(null).catch(() => undefined);
      }

      const nextUrl = new URL('/chat', window.location.origin);
      nextUrl.searchParams.set('notice', noticeText);
      router.replace(`${nextUrl.pathname}${nextUrl.search}`);
    }

    async function loadAccess() {
      setIsAccessLoading(true);
      setAccess(null);
      setAccessError(null);

      if (!isValidCompanyId(companyId)) {
        await redirectToResolvedWorkspace('That AI link is invalid.');
        return;
      }

      try {
        const nextAccess = await getCompanyAccess(companyId);
        if (!active) return;

        setAccess(nextAccess);
        setCompanies((current) =>
          current.some((company) => company.id === nextAccess.company.id)
            ? current
            : [nextAccess.company, ...current],
        );
        void setLastSelectedCompanyId(nextAccess.company.id).catch(
          () => undefined,
        );
        void listUserCompanies()
          .then((nextCompanies) => {
            if (active) setCompanies(nextCompanies);
          })
          .catch(() => undefined);
        void listAiEvents(nextAccess.company.id)
          .then((nextEvents) => {
            if (active) setEvents(nextEvents);
          })
          .catch(() => {
            if (active) setEvents([]);
          });
        setIsAccessLoading(false);
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof Error
            ? error.message
            : 'Workspace access could not be verified.';

        try {
          await redirectToResolvedWorkspace(message);
        } catch (redirectError) {
          if (!active) return;
          setAccessError(
            redirectError instanceof Error
              ? redirectError.message
              : 'Workspace access could not be verified.',
          );
          setIsAccessLoading(false);
        }
      }
    }

    void loadAccess();

    return () => {
      active = false;
    };
  }, [companyId, router]);

  const {
    messages,
    hasMessages,
    isBusy,
    busyLabel,
    isHistoryLoading,
    isConversationLoading,
    errorMessage,
    composerRef,
    conversations,
    activeId,
    handleNewChat,
    handleSelectConversation,
    handleDeleteConversation,
    handleEditMessage,
    sendMessage,
  } = useChat(companyId, Boolean(access));

  useEffect(() => {
    if (!access || !conversationId) return;
    void handleSelectConversation(conversationId);
  }, [access, conversationId, handleSelectConversation]);

  useEffect(() => {
    if (!activeId || conversationId === activeId) return;
    router.replace(`/chat/${companyId}/${activeId}`);
  }, [activeId, companyId, conversationId, router]);

  useEffect(() => {
    if (initialNotice) {
      setNotice(initialNotice);
      const timer = window.setTimeout(() => setNotice(null), 4200);
      return () => window.clearTimeout(timer);
    }

    const confirmation = window.sessionStorage.getItem('ai-switch-confirmation');
    if (!confirmation) return;
    window.sessionStorage.removeItem('ai-switch-confirmation');
    setNotice(confirmation);
    const timer = window.setTimeout(() => setNotice(null), 2400);
    return () => window.clearTimeout(timer);
  }, [companyId, initialNotice]);

  const selectorCompanies = useMemo(() => {
    if (!access) return companies;
    return companies.some((company) => company.id === access.company.id)
      ? companies
      : [access.company, ...companies];
  }, [access, companies]);

  const switchToCompany = useCallback(
    async (company: Company) => {
      await setLastSelectedCompanyId(company.id).catch(() => undefined);
      window.sessionStorage.setItem(
        'ai-switch-confirmation',
        `You are now chatting with ${company.name}.`,
      );
      router.push(`/chat/${company.id}`);
    },
    [router],
  );

  const handleSelectCompany = useCallback(
    (company: Company) => {
      if (company.id === companyId) return;

      if (isBusy) {
        setPendingSwitch(company);
        setNotice(`Switching to ${company.name} after this response.`);
        return;
      }

      void switchToCompany(company);
    },
    [companyId, isBusy, switchToCompany],
  );

  useEffect(() => {
    if (isBusy || !pendingSwitch) return;
    const target = pendingSwitch;
    setPendingSwitch(null);
    void switchToCompany(target);
  }, [isBusy, pendingSwitch, switchToCompany]);

  const suggestedQuestions = useMemo(
    () => {
      const base = access?.company.aiConfiguration?.suggestedQuestions ?? [];
      const hasUpcomingEvent = events.some(
        (event) =>
          event.status === 'scheduled' &&
          new Date(event.startsAt).getTime() >= Date.now(),
      );

      if (!hasUpcomingEvent) return base;

      return [
        ...base,
        'What is the next scheduled event?',
        'Are there any events this week?',
      ].filter((question, index, values) => values.indexOf(question) === index);
    },
    [access?.company.aiConfiguration?.suggestedQuestions, events],
  );
  const readyDocumentCount = access?.company.readyDocumentCount ?? 0;

  const openCitation = async (citation: Citation) => {
    setSource({ citation, url: null, error: null, loading: true });

    if (!citation.documentId) {
      setSource({
        citation,
        url: null,
        error: 'This source is missing its document link.',
        loading: false,
      });
      return;
    }

    try {
      const result = await getDocumentPdfSignedUrl(citation.documentId);
      if (!result.signedUrl) {
        throw new Error('Failed to create PDF link.');
      }
      setSource({
        citation,
        url: withPdfPageFragment(result.signedUrl, citation.pageNumber),
        error: null,
        loading: false,
      });
    } catch (error) {
      setSource({
        citation,
        url: null,
        error:
          error instanceof Error ? error.message : 'Failed to open PDF source.',
        loading: false,
      });
    }
  };

  if (isAccessLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <LoadingState label="Checking workspace access..." className="min-h-[calc(100vh-2rem)]" />
      </div>
    );
  }

  if (!access) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
        <div className="max-w-md">
          <Alert variant="error" title="Workspace unavailable">
          {accessError ?? 'You do not have access to this AI workspace.'}
          </Alert>
          <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
            <Link href="/create-ai" className={buttonVariants()}>
              Create AI
            </Link>
            <Link href="/join" className={buttonVariants({ variant: 'outline' })}>
              Join AI
            </Link>
            <Link href="/chat" className={buttonVariants({ variant: 'ghost' })}>
              Back to Chat
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <Sidebar
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        onNewChat={() => {
          handleNewChat();
          router.push(`/chat/${companyId}`);
          setHistoryOpen(false);
        }}
        conversations={conversations}
        activeId={activeId}
        loading={isHistoryLoading}
        error={errorMessage}
        onSelectConversation={(id) => {
          router.push(`/chat/${companyId}/${id}`);
          void handleSelectConversation(id);
          setHistoryOpen(false);
        }}
        onDeleteConversation={(id) => {
          void handleDeleteConversation(id);
        }}
      />

      <div className="flex min-w-0 flex-1 overflow-hidden">
      <main
        className={cn(
          'flex min-w-0 flex-1 flex-col overflow-hidden',
          source && 'lg:basis-1/2',
        )}
      >
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-border bg-background/94 px-3 backdrop-blur sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setHistoryOpen(true)}
              aria-label="Open conversation history"
            >
              <Menu className="size-4" aria-hidden="true" />
            </Button>
            <AISelector
              current={access.company}
              companies={selectorCompanies}
              onSelect={handleSelectCompany}
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/chat"
              className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'hidden sm:inline-flex' })}
            >
              Chat
            </Link>
            <Link
              href="/create-ai"
              className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'hidden md:inline-flex' })}
            >
              Create AI
            </Link>
            <Link
              href="/join"
              className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'hidden md:inline-flex' })}
            >
              Join AI
            </Link>
            <StatusBadge status={access.company.setupStatus} />
            <ProfileMenu />
          </div>
        </header>

        {notice && (
          <div className="px-4 pt-3">
            <Alert variant="info">{notice}</Alert>
          </div>
        )}

        {errorMessage && (
          <div className="px-4 pt-3">
            <Alert variant="warning">{errorMessage}</Alert>
          </div>
        )}

        {hasMessages || isConversationLoading ? (
          <ChatArea
            messages={messages}
            loading={isBusy}
            loadingLabel={isConversationLoading ? 'Loading chat...' : busyLabel}
            onSend={sendMessage}
            onEdit={handleEditMessage}
            onCitationOpen={(citation) => void openCitation(citation)}
            onEventOpen={setEventDetails}
            composerRef={composerRef}
            disabled={isBusy}
          />
        ) : (
          <EmptyState
            company={access.company}
            suggestedQuestions={suggestedQuestions}
            events={events}
            readyDocumentCount={readyDocumentCount}
            onSend={sendMessage}
            composerRef={composerRef}
            disabled={isBusy}
          />
        )}
      </main>

      <SourcePanel
        source={source}
        onClose={() => setSource(null)}
        onRetry={(citation) => void openCitation(citation)}
      />
      </div>
      <EventDetailsDialog
        eventSource={eventDetails}
        onClose={() => setEventDetails(null)}
      />
    </div>
  );
}

function SourcePanel({
  source,
  onClose,
  onRetry,
}: {
  source: SourceState | null;
  onClose: () => void;
  onRetry: (citation: Citation) => void;
}) {
  const [page, setPage] = useState(source?.citation.pageNumber ?? 1);
  const [zoom, setZoom] = useState<number | 'page-width'>('page-width');

  useEffect(() => {
    if (source) {
      setPage(source.citation.pageNumber ?? 1);
      setZoom('page-width');
    }
  }, [source]);

  if (!source) return null;

  const title = source.citation.filename ?? source.citation.label ?? 'Source PDF';
  const pageLabel = page ? `Page ${page}` : 'Source';
  const displayUrl = source.url
    ? withPdfPageFragment(withoutHash(source.url), page, zoom)
    : null;
  const zoomLabel = zoom === 'page-width' ? 'Fit width' : `${zoom}%`;

  return (
    <aside className="fixed inset-0 z-40 flex w-full flex-col border-l border-border bg-card shadow-[var(--shadow-md)] lg:static lg:z-auto lg:min-w-[420px] lg:basis-1/2 xl:min-w-[520px]">
      <div className="flex min-h-16 items-center justify-between gap-3 border-b border-border px-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="truncate text-sm font-semibold">{title}</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{pageLabel}</p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close source">
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>

      {source.citation.preview && (
        <div className="border-b border-border bg-[var(--surface-2)] p-4 text-sm leading-6 text-muted-foreground">
          {source.citation.preview}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden">
        {source.loading ? (
          <LoadingState label="Creating secure PDF link..." className="h-full rounded-none border-0" />
        ) : source.error ? (
          <div className="grid gap-3 p-4">
            <Alert variant="error">{source.error}</Alert>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onRetry(source.citation)}
              >
                Retry
              </Button>
              {source.url && (
                <a
                  href={withoutHash(source.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'outline' })}
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Open PDF
                </a>
              )}
            </div>
          </div>
        ) : displayUrl ? (
          <iframe
            title={title}
            src={displayUrl}
            className="h-full w-full border-0 bg-background"
          />
        ) : null}
      </div>

      {displayUrl && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border p-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="rounded-md border border-border bg-[var(--surface-2)] px-2 py-1 text-xs text-muted-foreground">
            Page {page}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setZoom((value) =>
                value === 'page-width' ? 90 : Math.max(50, value - 10),
              )
            }
          >
            Zoom out
          </Button>
          <span className="rounded-md border border-border bg-[var(--surface-2)] px-2 py-1 text-xs text-muted-foreground">
            {zoomLabel}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setZoom((value) =>
                value === 'page-width' ? 120 : Math.min(200, value + 10),
              )
            }
          >
            Zoom in
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setZoom('page-width')}
          >
            Fit width
          </Button>
          <a
            href={withoutHash(displayUrl)}
            target="_blank"
            rel="noopener noreferrer"
            download
            className={buttonVariants({ variant: 'outline', className: 'ml-auto' })}
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Download
          </a>
        </div>
      )}
    </aside>
  );
}

function EventDetailsDialog({
  eventSource,
  onClose,
}: {
  eventSource: EventSource | null;
  onClose: () => void;
}) {
  if (!eventSource) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/80 px-4 py-6 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-source-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-md)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <StatusPill tone={eventSource.status === 'cancelled' ? 'warning' : 'success'}>
              {eventSource.status === 'cancelled' ? 'Cancelled' : 'Scheduled'}
            </StatusPill>
            <h2
              id="event-source-title"
              className="mt-3 truncate text-lg font-semibold"
            >
              {eventSource.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {formatEventSourceDate(eventSource)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close event details"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-4 grid gap-2 text-sm">
          <div className="rounded-lg border border-border bg-[var(--surface-2)] p-3">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Timezone
            </span>
            <p className="mt-1">{eventSource.timezone}</p>
          </div>
          {eventSource.location && (
            <div className="rounded-lg border border-border bg-[var(--surface-2)] p-3">
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Location
              </span>
              <p className="mt-1">{eventSource.location}</p>
            </div>
          )}
          {eventSource.meetingUrl && (
            <a
              href={eventSource.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-border bg-[var(--surface-2)] p-3 transition-colors hover:bg-[var(--surface-3)]"
            >
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Meeting link
              </span>
              <span className="mt-1 flex min-w-0 items-center gap-2">
                <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{eventSource.meetingUrl}</span>
              </span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
