'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Bot, FileText, RefreshCw } from 'lucide-react';
import { useAdminCompanies } from '@/features/admin/hooks/useAdminCompanies';
import { formatCompanyRole } from '@/features/companies/types';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import AdminCompaniesPanel from './AdminCompaniesPanel';
import AdminDocumentPanel from './AdminDocumentPanel';
import AdminGate from './AdminGate';

type AdminTab = 'workspaces' | 'documents';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('workspaces');
  const companiesState = useAdminCompanies();
  const { fetchCompanies, isFetchingCompanies } = companiesState;
  const selectedCompany = companiesState.companies.find(
    (company) => company.id === companiesState.selectedCompanyId,
  );
  const hasCompanies = companiesState.companies.length > 0;

  useEffect(() => {
    void fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    if (!isFetchingCompanies && !hasCompanies) {
      setActiveTab('workspaces');
    }
  }, [isFetchingCompanies, hasCompanies]);

  const handleManageCompany = (companyId: string) => {
    companiesState.setSelectedCompanyId(companyId);
    setActiveTab('documents');
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create or join document AI workspaces, then chat with their PDFs.
            </p>
          </div>

          <div
            className="flex w-full rounded-lg border border-border bg-sidebar p-1 md:w-auto"
            role="tablist"
            aria-label="Admin sections"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'workspaces'}
              onClick={() => setActiveTab('workspaces')}
              className={cn(
                'flex h-8 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors md:flex-none',
                activeTab === 'workspaces'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Bot className="size-4" aria-hidden="true" />
              AI Workspaces
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'documents'}
              onClick={() => setActiveTab('documents')}
              disabled={!hasCompanies}
              className={cn(
                'flex h-8 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:flex-none',
                activeTab === 'documents'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <FileText className="size-4" aria-hidden="true" />
              Management
            </button>
          </div>
        </header>

        <section className="flex flex-col gap-3 rounded-lg border border-border bg-sidebar p-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Active workspace
            </label>
            {hasCompanies ? (
              <select
                value={companiesState.selectedCompanyId ?? ''}
                onChange={(event) =>
                  companiesState.setSelectedCompanyId(
                    event.target.value || null,
                  )
                }
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"
              >
                {companiesState.companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({formatCompanyRole(company.role)})
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex min-h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground">
                <AlertCircle className="size-4" aria-hidden="true" />
                No AI workspaces yet.
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void companiesState.fetchCompanies();
            }}
            disabled={companiesState.isFetchingCompanies}
            className="w-full md:w-auto"
          >
            <RefreshCw
              className={cn(
                'size-4',
                companiesState.isFetchingCompanies && 'animate-spin',
              )}
              aria-hidden="true"
            />
            Refresh
          </Button>
        </section>

        {companiesState.companyError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {companiesState.companyError}
          </p>
        )}

        {activeTab === 'documents' ? (
          selectedCompany ? (
            <AdminGate companyId={selectedCompany.id}>
              <AdminDocumentPanel company={selectedCompany} />
            </AdminGate>
          ) : (
            <div className="rounded-lg border border-border bg-sidebar p-6 text-sm text-muted-foreground">
              Create or join an AI workspace before managing documents.
            </div>
          )
        ) : (
          <AdminCompaniesPanel
            companiesState={companiesState}
            onManageCompany={handleManageCompany}
          />
        )}
      </div>
    </main>
  );
}
