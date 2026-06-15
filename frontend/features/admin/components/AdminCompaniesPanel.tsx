'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Building2,
  Check,
  Copy,
  Loader2,
  Plus,
  RefreshCw,
  Users,
} from 'lucide-react';
import type { useAdminCompanies } from '@/features/admin/hooks/useAdminCompanies';
import type { Company } from '@/features/admin/types';
import {
  formatCompanyRole,
  isCompanyManagerRole,
} from '@/features/companies/types';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

type AdminCompaniesState = ReturnType<typeof useAdminCompanies>;

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function roleClassName(company: Company) {
  return isCompanyManagerRole(company.role)
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
    : 'border-zinc-500/30 bg-zinc-500/10 text-zinc-700';
}

export default function AdminCompaniesPanel({
  companiesState,
  onManageCompany,
}: {
  companiesState: AdminCompaniesState;
  onManageCompany: (companyId: string) => void;
}) {
  const [copiedCompanyId, setCopiedCompanyId] = useState<string | null>(null);
  const {
    companyName,
    setCompanyName,
    companyDomain,
    setCompanyDomain,
    joinCode,
    setJoinCode,
    companies,
    isFetchingCompanies,
    companyLoading,
    joinLoading,
    companyError,
    joinError,
    fetchCompanies,
    createCompany,
    joinCompany,
  } = companiesState;

  const copyInvitationCode = async (company: Company) => {
    if (!company.invitationCode) return;

    await navigator.clipboard.writeText(company.invitationCode);
    setCopiedCompanyId(company.id);
    window.setTimeout(() => {
      setCopiedCompanyId((current) =>
        current === company.id ? null : current,
      );
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-sidebar p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Building2 className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Create AI Workspace</h2>
              <p className="text-sm text-muted-foreground">
                You will be the Owner for every AI you create.
              </p>
            </div>
          </div>

          <form onSubmit={createCompany} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Workspace name
              <Input
                type="text"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Acme Knowledge AI"
                disabled={companyLoading}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Domain
              <Input
                type="text"
                value={companyDomain}
                onChange={(event) => setCompanyDomain(event.target.value)}
                placeholder="acme.com"
                disabled={companyLoading}
              />
            </label>

            <Button type="submit" disabled={companyLoading}>
              {companyLoading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="size-4" aria-hidden="true" />
              )}
              {companyLoading ? 'Creating' : 'Create AI'}
            </Button>
          </form>

          {companyError && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4" aria-hidden="true" />
              <span>{companyError}</span>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-border bg-sidebar p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Users className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Join AI Workspace</h2>
              <p className="text-sm text-muted-foreground">
                Enter an invitation code shared by an AI Owner.
              </p>
            </div>
          </div>

          <form onSubmit={joinCompany} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Invitation code
              <Input
                type="text"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value)}
                placeholder="A1B2C3D4"
                disabled={joinLoading}
                required
              />
            </label>

            <Button type="submit" variant="outline" disabled={joinLoading}>
              {joinLoading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="size-4" aria-hidden="true" />
              )}
              {joinLoading ? 'Joining' : 'Join AI'}
            </Button>
          </form>

          {joinError && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4" aria-hidden="true" />
              <span>{joinError}</span>
            </div>
          )}
        </section>
      </div>

      <section className="min-w-0 rounded-lg border border-border bg-sidebar">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">My AIs</h2>
            <p className="text-sm text-muted-foreground">
              {companies.length} accessible workspace
              {companies.length === 1 ? '' : 's'}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void fetchCompanies();
            }}
            disabled={isFetchingCompanies}
            className="w-full sm:w-auto"
          >
            <RefreshCw
              className={cn('size-4', isFetchingCompanies && 'animate-spin')}
              aria-hidden="true"
            />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-2">
          {isFetchingCompanies && companies.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Loading AI workspaces...
            </div>
          ) : companies.length > 0 ? (
            companies.map((company) => {
              const isManager = isCompanyManagerRole(company.role);

              return (
                <article
                  key={company.id}
                  className="flex min-h-44 flex-col justify-between rounded-lg border border-border bg-background p-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold">
                        {company.name}
                      </h3>
                      <span
                        className={cn(
                          'rounded-md border px-1.5 py-0.5 text-xs font-medium',
                          roleClassName(company),
                        )}
                      >
                        {formatCompanyRole(company.role)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {company.domain || 'No domain'} · Added{' '}
                      {formatDate(company.createdAt)}
                    </p>
                  </div>

                  {isManager && company.invitationCode && (
                    <div className="mt-4 flex min-w-0 items-center gap-2">
                      <code className="min-w-0 truncate rounded-md border border-border bg-sidebar px-2 py-1 font-mono text-xs text-foreground">
                        {company.invitationCode}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Copy invite code for ${company.name}`}
                        title="Copy invite code"
                        onClick={() => {
                          void copyInvitationCode(company);
                        }}
                      >
                        {copiedCompanyId === company.id ? (
                          <Check className="size-4" aria-hidden="true" />
                        ) : (
                          <Copy className="size-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/chat/${company.id}`}
                      className="inline-flex h-8 flex-1 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
                    >
                      Open Chat
                    </Link>
                    {isManager && (
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => onManageCompany(company.id)}
                      >
                        Manage
                      </Button>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              Create or join an AI workspace to start chatting with documents.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
