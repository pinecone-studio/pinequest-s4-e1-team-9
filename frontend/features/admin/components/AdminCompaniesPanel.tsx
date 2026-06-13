'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Building2,
  Check,
  Copy,
  Loader2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import type { useAdminCompanies } from '@/features/admin/hooks/useAdminCompanies';
import type { Company, CompanyRole } from '@/features/admin/types';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

type AdminCompaniesState = ReturnType<typeof useAdminCompanies>;

const roleClassName: Record<CompanyRole, string> = {
  OWNER: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
  ADMIN: 'border-sky-500/30 bg-sky-500/10 text-sky-700',
  MEMBER: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-700',
};

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

export default function AdminCompaniesPanel({
  companiesState,
}: {
  companiesState: AdminCompaniesState;
}) {
  const [copiedCompanyId, setCopiedCompanyId] = useState<string | null>(null);
  const {
    companyName,
    setCompanyName,
    companyDomain,
    setCompanyDomain,
    companies,
    isFetchingCompanies,
    companyLoading,
    companyError,
    fetchCompanies,
    createCompany,
  } = companiesState;

  const copyInvitationCode = async (company: Company) => {
    await navigator.clipboard.writeText(company.invitationCode);
    setCopiedCompanyId(company.id);
    window.setTimeout(() => {
      setCopiedCompanyId((current) =>
        current === company.id ? null : current,
      );
    }, 1200);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <section className="rounded-lg border border-border bg-sidebar p-4">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Building2 className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold">Create Company</h2>
            <p className="text-sm text-muted-foreground">
              New companies are owned by your signed-in account.
            </p>
          </div>
        </div>

        <form onSubmit={createCompany} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Company name
            <Input
              type="text"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Acme Corp"
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
            {companyLoading ? 'Creating' : 'Create company'}
          </Button>
        </form>

        {companyError && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4" aria-hidden="true" />
            <span>{companyError}</span>
          </div>
        )}
      </section>

      <section className="min-w-0 rounded-lg border border-border bg-sidebar">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Companies</h2>
            <p className="text-sm text-muted-foreground">
              {companies.length} total
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

        <div className="divide-y divide-border">
          {isFetchingCompanies && companies.length === 0 ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Loading companies...
            </div>
          ) : companies.length > 0 ? (
            companies.map((company) => (
              <article
                key={company.id}
                className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">
                      {company.name}
                    </h3>
                    <span
                      className={cn(
                        'rounded-md border px-1.5 py-0.5 text-xs font-medium',
                        roleClassName[company.role],
                      )}
                    >
                      {company.role}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {company.domain || 'No domain'} · Added{' '}
                    {formatDate(company.createdAt)}
                  </p>
                </div>

                <div className="flex min-w-0 items-center gap-2">
                  <code className="min-w-0 truncate rounded-md border border-border bg-background px-2 py-1 font-mono text-xs text-foreground">
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
              </article>
            ))
          ) : (
            <p className="p-4 text-sm text-muted-foreground">
              No companies created yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
