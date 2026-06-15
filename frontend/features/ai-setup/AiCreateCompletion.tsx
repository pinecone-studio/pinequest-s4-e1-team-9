'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  FileText,
  MessageSquareText,
  Settings,
  Users,
} from 'lucide-react';
import AuthGate from '@/features/auth/AuthGate';
import { getCompanyAccess, listAdminDocuments } from '@/features/admin/api';
import type { AiDocument, CompanyAccess } from '@/features/admin/types';
import { buttonVariants } from '@/shared/ui/button';
import {
  Alert,
  AppShell,
  EmptyState,
  LoadingState,
  PageHeader,
  SectionHeader,
  StatCard,
  Surface,
} from '@/shared/ui/product';
import {
  StatusBadge,
  formatFileSize,
  documentStatusTone,
} from '@/features/dashboard/components/ui';

function CompletionContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId');
  const [access, setAccess] = useState<CompanyAccess | null>(null);
  const [documents, setDocuments] = useState<AiDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadCompletion() {
      if (!companyId) {
        setError('Missing AI id.');
        setIsLoading(false);
        return;
      }

      try {
        const [nextAccess, nextDocuments] = await Promise.all([
          getCompanyAccess(companyId),
          listAdminDocuments(companyId),
        ]);

        if (!active) return;
        setAccess(nextAccess);
        setDocuments(nextDocuments);
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load completion state.',
        );
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadCompletion();

    return () => {
      active = false;
    };
  }, [companyId]);

  const readyDocuments = documents.filter(
    (document) => document.status === 'ready',
  );
  const failedDocuments = documents.filter(
    (document) => document.status === 'error',
  );

  return (
    <AppShell
      title="AI prepared"
      breadcrumbs={[{ label: 'Create AI', href: '/create-ai' }, { label: 'Complete' }]}
      contentClassName="mx-auto max-w-5xl"
    >
      <PageHeader
        eyebrow="Setup complete"
        title="Your AI is being prepared"
        description="Configuration has been saved. Review document processing before inviting members."
      />

      <div className="grid gap-6">
        {isLoading ? (
          <LoadingState label="Loading preparation status..." />
        ) : error || !access || !companyId ? (
          <Alert variant="error" title="Completion state could not load">
            {error ?? 'The AI could not be loaded.'}
          </Alert>
        ) : (
          <>
            <Surface className="p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold">
                      {access.company.name}
                    </h2>
                    <StatusBadge status={access.company.setupStatus} />
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {access.company.description ||
                      access.company.aiConfiguration?.description}
                  </p>
                </div>
                <CheckCircle2 className="size-8 text-emerald-200" />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <StatCard label="Configuration" value="Saved" />
                <StatCard
                  label="Documents"
                  value={`${readyDocuments.length}/${documents.length}`}
                  description="Ready PDFs"
                />
                <StatCard
                  label="Attention"
                  value={failedDocuments.length ? failedDocuments.length : 'None'}
                />
              </div>
            </Surface>

            <Surface className="overflow-hidden">
              <SectionHeader
                title="Knowledge processing"
                description="Processing can be retried by uploading the failed PDF again from Knowledge."
              />
              <div className="divide-y divide-border">
                {documents.length > 0 ? (
                  documents.map((document) => (
                    <div
                      key={document.id}
                      className="grid gap-2 p-4 sm:grid-cols-[1fr_auto]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {document.filename}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatFileSize(document.fileSize)}
                        </p>
                        {document.errorMessage && (
                          <p className="mt-1 text-xs text-destructive">
                            {document.errorMessage}
                          </p>
                        )}
                      </div>
                      <StatusBadge
                        status={
                          documentStatusTone(document.status) === 'success'
                            ? 'READY'
                            : documentStatusTone(document.status) === 'error'
                              ? 'FAILED'
                              : 'PROCESSING'
                        }
                      />
                    </div>
                  ))
                ) : (
                  <div className="p-4">
                    <EmptyState
                      icon={FileText}
                      title="No PDFs were uploaded"
                      description="Add knowledge from the management page before inviting members."
                    />
                  </div>
                )}
              </div>
            </Surface>

            <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Link href={`/chat/${companyId}`} className={buttonVariants()}>
                <MessageSquareText className="size-4" />
                Test your AI
              </Link>
              <Link
                href={`/ai/${companyId}/documents?tab=documents`}
                className={buttonVariants({ variant: 'outline' })}
              >
                <FileText className="size-4" />
                Manage knowledge
              </Link>
              <Link
                href={`/ai/${companyId}/invites?tab=invitations`}
                className={buttonVariants({ variant: 'outline' })}
              >
                <Users className="size-4" />
                Invite members
              </Link>
              <Link
                href="/chat"
                className={buttonVariants({ variant: 'outline' })}
              >
                <Settings className="size-4" />
                Go to Dashboard
              </Link>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function AiCreateCompletion() {
  return (
    <AuthGate>
      <CompletionContent />
    </AuthGate>
  );
}
