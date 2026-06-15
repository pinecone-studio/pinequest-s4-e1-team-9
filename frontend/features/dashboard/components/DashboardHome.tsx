'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Check,
  FilePlus2,
  FileText,
  FolderClock,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Search,
  UserPlus,
  Users,
} from 'lucide-react';
import AuthGate from '@/features/auth/AuthGate';
import { listCompanies } from '@/features/admin/api';
import { joinCompanyByCode } from '@/features/companies/api';
import type { AiSetupStatus, Company } from '@/features/companies/types';
import { cn } from '@/shared/lib/utils';
import { Button, buttonVariants } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Alert,
  AppShell,
  EmptyState,
  PageHeader,
  SearchInput,
  Select,
  StatCard,
  Surface,
} from '@/shared/ui/product';
import {
  formatDate,
  isAdminRole,
  roleLabel,
  StatusBadge,
  statusLabel,
  getUseCaseLabel,
} from './ui';
import { getAiRecordActions } from './actions';

type StatusFilter = 'all' | AiSetupStatus;

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'READY', label: 'Ready' },
  { value: 'NEEDS_ATTENTION', label: 'Needs attention' },
  { value: 'FAILED', label: 'Failed' },
];

function getSetupStatus(company: Company): AiSetupStatus {
  return company.setupStatus ?? 'READY';
}

function documentSummary(company: Company) {
  const total = company.documentCount ?? 0;
  const ready = company.readyDocumentCount ?? 0;
  const failed = company.failedDocumentCount ?? 0;
  const processing = company.processingDocumentCount ?? 0;

  if (total === 0) return 'No documents yet';
  if (failed > 0) return `${failed} failed`;
  if (processing > 0) return `${processing} preparing`;
  return `${ready}/${total} ready`;
}

function JoinAiPanel({
  onJoined,
  onCancel,
}: {
  onJoined: () => Promise<void>;
  onCancel: () => void;
}) {
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const joinAi = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsJoining(true);
    setJoinError(null);

    try {
      await joinCompanyByCode(joinCode);
      setJoinCode('');
      await onJoined();
    } catch (joinFailure) {
      setJoinError(
        joinFailure instanceof Error ? joinFailure.message : 'Join failed.',
      );
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Surface className="p-4">
      <form onSubmit={joinAi} className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
        <label className="grid gap-1.5 text-sm font-medium">
          Invitation code
          <Input
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value)}
            placeholder="Paste the code an Owner shared"
            disabled={isJoining}
            required
          />
        </label>
        <Button type="submit" disabled={isJoining}>
          <UserPlus className="size-4" aria-hidden="true" />
          {isJoining ? 'Joining...' : 'Join AI'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isJoining}>
          Cancel
        </Button>
      </form>
      {joinError && (
        <Alert variant="error" className="mt-4">
          {joinError}
        </Alert>
      )}
    </Surface>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-lg border border-border bg-card" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-lg border border-border bg-card" />
    </div>
  );
}

function AiRecord({
  company,
}: {
  company: Company;
}) {
  const admin = isAdminRole(company);
  const status = getSetupStatus(company);
  const draft = status === 'DRAFT';
  const needsAttention = status === 'FAILED' || status === 'NEEDS_ATTENTION';
  const actions = getAiRecordActions(company);
  const primaryHref = draft && admin
    ? `/dashboard/create?draftId=${company.id}`
    : `/chat/${company.id}`;

  return (
    <article
      className={cn(
        'grid gap-4 p-4 transition-colors lg:grid-cols-[minmax(0,1.45fr)_minmax(270px,0.85fr)_auto]',
        draft ? 'bg-[var(--warning-soft)]/45' : 'hover:bg-[var(--surface-2)]/55',
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-semibold text-foreground">
            {company.name}
          </h3>
          <StatusBadge status={status} />
          <span className="rounded-md border border-border bg-[var(--surface-2)] px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {roleLabel(company)}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {company.description ||
            company.aiConfiguration?.description ||
            'This AI uses saved behavior and uploaded documents.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{getUseCaseLabel(company.useCaseType)}</span>
          <span>Updated {formatDate(company.lastActivityAt ?? company.updatedAt)}</span>
          {draft && company.setupStep !== undefined && (
            <span>Step {company.setupStep + 1} in setup</span>
          )}
        </div>
        {needsAttention && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-md border border-[color-mix(in_srgb,var(--warning)_38%,var(--border))] bg-[var(--warning-soft)] px-2 py-1 text-xs text-[var(--warning)]">
            <AlertCircle className="size-3.5" aria-hidden="true" />
            Review setup or document processing.
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="size-3.5" aria-hidden="true" />
            Docs
          </div>
          <p className="mt-1 truncate font-medium text-foreground">
            {documentSummary(company)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" aria-hidden="true" />
            Members
          </div>
          <p className="mt-1 font-medium text-foreground">
            {company.memberCount ?? 1}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-xs text-muted-foreground">State</div>
          <p className="mt-1 truncate font-medium text-foreground">
            {statusLabel(status)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-stretch">
        <Link href={primaryHref} className={buttonVariants()}>
          {draft && admin ? (
            <FilePlus2 className="size-4" aria-hidden="true" />
          ) : (
            <MessageSquareText className="size-4" aria-hidden="true" />
          )}
          {draft && admin ? 'Continue setup' : 'Open Chat'}
        </Link>
        {actions.includes('manage') && (
          <Link
            href={`/dashboard/ai/${company.id}`}
            className={buttonVariants({ variant: 'outline' })}
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
            Manage
          </Link>
        )}
      </div>
    </article>
  );
}

function DashboardHomeContent() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showJoin, setShowJoin] = useState(false);

  const fetchCompanies = async () => {
    setIsLoading(true);
    setError(null);

    try {
      setCompanies(await listCompanies());
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Failed to load your AIs.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCompanies();
  }, []);

  const summary = useMemo(() => {
    return companies.reduce(
      (counts, company) => {
        const status = getSetupStatus(company);
        counts.total += 1;
        if (isAdminRole(company)) counts.admin += 1;
        if (status === 'READY') counts.ready += 1;
        if (status === 'PROCESSING') counts.processing += 1;
        if (status === 'DRAFT') counts.drafts += 1;
        if (status === 'NEEDS_ATTENTION' || status === 'FAILED') {
          counts.attention += 1;
        }
        return counts;
      },
      { total: 0, admin: 0, ready: 0, processing: 0, drafts: 0, attention: 0 },
    );
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return companies.filter((company) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          company.name,
          company.description,
          company.domain,
          company.aiConfiguration?.purpose,
          getUseCaseLabel(company.useCaseType),
          roleLabel(company),
          statusLabel(company.setupStatus),
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedQuery),
          );
      const matchesStatus =
        statusFilter === 'all' || getSetupStatus(company) === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [companies, query, statusFilter]);

  return (
    <AppShell title="My AIs" contentClassName="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Product home"
        title="My AIs"
        description="Create, test, and manage document AIs that answer from the PDFs your team trusts."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowJoin((value) => !value)}
            >
              <UserPlus className="size-4" aria-hidden="true" />
              Join AI
            </Button>
            <Link href="/dashboard/create" className={buttonVariants()}>
              <Plus className="size-4" aria-hidden="true" />
              Create AI
            </Link>
          </>
        }
      />

      <div className="grid gap-6">
        {showJoin && (
          <JoinAiPanel
            onCancel={() => setShowJoin(false)}
            onJoined={async () => {
              setShowJoin(false);
              await fetchCompanies();
            }}
          />
        )}

        {error && (
          <Alert variant="error" title="Dashboard could not load">
            {error}
          </Alert>
        )}

        {isLoading ? (
          <DashboardSkeleton />
        ) : companies.length === 0 ? (
          <EmptyState
            icon={FolderClock}
            title="Create your first document AI"
            description="Choose a use case, define the AI behavior, upload source PDFs, then test the assistant before inviting members."
            actions={
              <>
                <Link href="/dashboard/create" className={buttonVariants()}>
                  <Plus className="size-4" aria-hidden="true" />
                  Create AI
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowJoin(true)}
                >
                  <UserPlus className="size-4" aria-hidden="true" />
                  Join with code
                </Button>
              </>
            }
          />
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Accessible AIs" value={summary.total} icon={MessageSquareText} />
              <StatCard label="Owner access" value={summary.admin} icon={Users} />
              <StatCard label="Ready" value={summary.ready} icon={Check} />
              <StatCard
                label="Needs attention"
                value={summary.attention + summary.drafts}
                description={
                  summary.processing > 0
                    ? `${summary.processing} still preparing`
                    : undefined
                }
                icon={AlertCircle}
              />
            </section>

            <Surface className="overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Accessible AIs</h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredCompanies.length} shown from {companies.length} total
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-[minmax(220px,320px)_180px_auto]">
                  <SearchInput
                    aria-label="Search AIs"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search name, role, status"
                  />
                  <Select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as StatusFilter)
                    }
                    aria-label="Filter by status"
                  >
                    {statusFilters.map((filter) => (
                      <option key={filter.value} value={filter.value}>
                        {filter.label}
                      </option>
                    ))}
                  </Select>
                  <Button type="button" variant="outline" onClick={() => void fetchCompanies()}>
                    <RefreshCcw className="size-4" aria-hidden="true" />
                    Refresh
                  </Button>
                </div>
              </div>

              {filteredCompanies.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    icon={Search}
                    title="No AIs match those filters"
                    description="Try a different search term or show all setup statuses."
                    actions={
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setQuery('');
                          setStatusFilter('all');
                        }}
                      >
                        Clear filters
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredCompanies.map((company) => (
                    <AiRecord
                      key={company.id}
                      company={company}
                    />
                  ))}
                </div>
              )}
            </Surface>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function DashboardHome() {
  return (
    <AuthGate>
      <DashboardHomeContent />
    </AuthGate>
  );
}
