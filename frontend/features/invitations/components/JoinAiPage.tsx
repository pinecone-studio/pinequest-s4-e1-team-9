'use client';

import { useAuth } from '@/features/auth/AuthProvider';
import {
  previewInvite,
  redeemInvite,
  type InvitePreview,
} from '@/features/invitations/api';
import { setLastSelectedCompanyId } from '@/features/preferences/api';
import { buttonVariants } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Alert,
  LoadingState,
  ProductLogo,
  StatusPill,
  Surface,
} from '@/shared/ui/product';
import {
  ArrowRight,
  Bot,
  Check,
  LogIn,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';

function authHref(path: '/auth/sign-in' | '/auth/sign-up', code: string) {
  return `${path}?redirectTo=${encodeURIComponent(`/join/${code}`)}`;
}

function expiryLabel(expiresAt: string | undefined) {
  if (!expiresAt) return '15-minute invitation';
  const remainingMs = new Date(expiresAt).getTime() - Date.now();

  if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
    return 'Expired';
  }

  const minutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  return `Expires in ${minutes} min`;
}

function JoinByCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    router.push(`/join/${encodeURIComponent(trimmed)}`);
  };

  return (
    <Surface className="w-full max-w-lg p-5">
      <h1 className="text-xl font-semibold">Join an AI</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Paste the invitation code shared by the AI owner.
      </p>
      <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={submit}>
        <Input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="PINE-7KQ4-9M2X"
          aria-label="Invitation code"
          required
        />
        <button type="submit" className={buttonVariants()}>
          <ArrowRight className="size-4" aria-hidden="true" />
          Continue
        </button>
      </form>
    </Surface>
  );
}

function InvitePreviewPanel({
  code,
  preview,
  onJoined,
}: {
  code: string;
  preview: InvitePreview;
  onJoined: () => Promise<void>;
}) {
  const { session, isLoading } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const company = preview.company;

  const description =
    company.description ||
    company.aiConfiguration?.description ||
    'Private document assistant';

  const join = async () => {
    setIsJoining(true);
    setJoinError(null);

    try {
      await onJoined();
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : 'Failed to join.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Surface className="w-full max-w-2xl overflow-hidden">
      <div className="border-b border-border p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-[var(--surface-2)] text-muted-foreground">
            <Bot className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold">{company.name}</h1>
              <StatusPill tone="info">{expiryLabel(preview.invite.expiresAt)}</StatusPill>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
            {preview.ownerName && (
              <p className="mt-1 text-xs text-muted-foreground">
                Owner: {preview.ownerName}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Documents</p>
            <p className="mt-1 text-sm font-medium">
              {company.documentCount ?? 0} connected
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Members</p>
            <p className="mt-1 text-sm font-medium">
              {company.memberCount ?? 1} active
            </p>
          </div>
        </div>

        {joinError && <Alert variant="error">{joinError}</Alert>}

        {isLoading ? (
          <LoadingState label="Checking your session..." />
        ) : session ? (
          <button
            type="button"
            className={buttonVariants({ className: 'w-full' })}
            onClick={() => void join()}
            disabled={isJoining}
          >
            {isJoining ? (
              <ArrowRight className="size-4" aria-hidden="true" />
            ) : (
              <Check className="size-4" aria-hidden="true" />
            )}
            {isJoining ? 'Joining...' : 'Join and open chat'}
          </button>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href={authHref('/auth/sign-in', code)} className={buttonVariants({ className: 'flex-1' })}>
              <LogIn className="size-4" aria-hidden="true" />
              Sign in
            </Link>
            <Link href={authHref('/auth/sign-up', code)} className={buttonVariants({ variant: 'outline', className: 'flex-1' })}>
              <UserPlus className="size-4" aria-hidden="true" />
              Sign up
            </Link>
          </div>
        )}
      </div>
    </Surface>
  );
}

export default function JoinAiPage({ code }: { code?: string }) {
  const router = useRouter();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(code));
  const decodedCode = useMemo(() => (code ? decodeURIComponent(code) : ''), [code]);

  useEffect(() => {
    if (!decodedCode) return;

    let active = true;
    setIsLoading(true);
    setError(null);

    previewInvite(decodedCode)
      .then((nextPreview) => {
        if (active) setPreview(nextPreview);
      })
      .catch((previewError) => {
        if (!active) return;
        setError(
          previewError instanceof Error
            ? previewError.message
            : 'Invitation is unavailable.',
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [decodedCode]);

  const joined = async () => {
    const result = await redeemInvite(decodedCode);
    await setLastSelectedCompanyId(result.company.id).catch(() => undefined);
    router.replace(`/chat/${result.company.id}`);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-8 text-foreground">
      <div className="w-full">
        <div className="mx-auto mb-6 flex w-full max-w-2xl items-center justify-between">
          <Link href="/" className="min-w-0">
            <ProductLogo />
          </Link>
          <Link href="/chat" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Chat
          </Link>
        </div>

        <div className="mx-auto grid place-items-center">
          {!decodedCode ? (
            <JoinByCodeForm />
          ) : isLoading ? (
            <LoadingState label="Checking invitation..." className="w-full max-w-2xl" />
          ) : error || !preview ? (
            <Surface className="w-full max-w-lg p-5">
              <Alert variant="error" title="Invitation unavailable">
                {error ?? 'This invitation could not be loaded.'}
              </Alert>
              <Link href="/join" className={buttonVariants({ className: 'mt-4 w-full' })}>
                Enter another code
              </Link>
            </Surface>
          ) : (
            <InvitePreviewPanel
              code={decodedCode}
              preview={preview}
              onJoined={joined}
            />
          )}
        </div>
      </div>
    </main>
  );
}
