'use client';

import AuthGate from '@/features/auth/AuthGate';
import { listUserCompanies } from '@/features/companies/api';
import type { Company } from '@/features/companies/types';
import {
  getUserPreferences,
  setLastSelectedCompanyId,
} from '@/features/preferences/api';
import { resolveChatWorkspace } from '@/features/chat/workspace-resolution';
import { buttonVariants } from '@/shared/ui/button';
import {
  Alert,
  LoadingState,
  ProductLogo,
  ProfileMenu,
} from '@/shared/ui/product';
import {
  Bot,
  MessageSquareText,
  Plus,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

function NoAiState({ notice }: { notice?: string | null }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <aside className="hidden w-80 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <div className="flex h-full flex-col">
          <div className="flex min-h-16 items-center border-b border-sidebar-border px-4">
            <ProductLogo />
          </div>
          <div className="grid gap-3 p-3">
            <Link href="/create-ai" className={buttonVariants({ className: 'justify-start' })}>
              <Plus className="size-4" aria-hidden="true" />
              Create your AI
            </Link>
            <Link href="/join" className={buttonVariants({ variant: 'outline', className: 'justify-start' })}>
              <UserPlus className="size-4" aria-hidden="true" />
              Join AI
            </Link>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-border bg-background px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <ProductLogo compact />
            <span className="truncate text-sm font-semibold">Document AI</span>
          </div>
          <ProfileMenu />
        </header>

        {notice && (
          <div className="px-4 pt-3">
            <Alert variant="info">{notice}</Alert>
          </div>
        )}

        <div className="grid min-h-0 flex-1 place-items-center overflow-y-auto px-4 py-8">
          <div className="w-full max-w-xl text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
              <Bot className="size-6" aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-2xl font-semibold tracking-normal text-foreground">
              You are not connected to an AI yet
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Join a private assistant with an invitation code or create a new
              document AI for your team.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Link href="/join" className={buttonVariants()}>
                <UserPlus className="size-4" aria-hidden="true" />
                Join an AI
              </Link>
              <Link href="/create-ai" className={buttonVariants({ variant: 'outline' })}>
                <Plus className="size-4" aria-hidden="true" />
                Create your AI
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ChatEntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const notice = searchParams.get('notice');

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const [nextCompanies, preferences] = await Promise.all([
          listUserCompanies(),
          getUserPreferences().catch(() => ({ lastSelectedCompanyId: null })),
        ]);
        const resolution = resolveChatWorkspace(
          nextCompanies,
          preferences.lastSelectedCompanyId,
        );

        if (!active) return;

        setCompanies(nextCompanies);

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
          if (notice) nextUrl.searchParams.set('notice', notice);
          router.replace(`${nextUrl.pathname}${nextUrl.search}`);
          return;
        }

        if (resolution.shouldClearStaleSelection) {
          void setLastSelectedCompanyId(null).catch(() => undefined);
        }
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load your AIs.',
        );
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [notice, router]);

  const hasCompanies = useMemo(() => companies.length > 0, [companies]);

  if (isLoading || hasCompanies) {
    return (
      <div className="min-h-screen bg-background p-4">
        <LoadingState
          label="Opening your AI chat..."
          className="min-h-[calc(100vh-2rem)]"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="w-full max-w-md">
          <Alert variant="error" title="Could not open chat">
            {error}
          </Alert>
          <Link href="/join" className={buttonVariants({ className: 'mt-4 w-full' })}>
            <MessageSquareText className="size-4" aria-hidden="true" />
            Join an AI
          </Link>
        </div>
      </div>
    );
  }

  return <NoAiState notice={notice} />;
}

export default function ChatEntryPage() {
  return (
    <AuthGate>
      <Suspense
        fallback={
          <div className="min-h-screen bg-background p-4">
            <LoadingState
              label="Opening your AI chat..."
              className="min-h-[calc(100vh-2rem)]"
            />
          </div>
        }
      >
        <ChatEntryContent />
      </Suspense>
    </AuthGate>
  );
}
