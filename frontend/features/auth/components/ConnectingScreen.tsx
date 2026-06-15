'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  LockKeyhole,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { ProductLogo, Surface } from '@/shared/ui/product';

const MESSAGES = [
  'Opening your workspace...',
  'Checking AI access...',
  'Preparing your assistants...',
  'Finalizing secure connection...',
  'Redirecting to Dashboard...',
];

const STEP_DURATION = 800;

interface ConnectingScreenProps {
  showContinueButton?: boolean;
  onContinue?: () => void;
}

export default function ConnectingScreen({
  showContinueButton = true,
  onContinue,
}: ConnectingScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const isDone = messageIndex >= MESSAGES.length - 1;

  useEffect(() => {
    const kickoff = setTimeout(() => setProgress(100), 100);

    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        const next = prev + 1;
        if (next >= MESSAGES.length) {
          clearInterval(interval);
        }
        return Math.min(next, MESSAGES.length - 1);
      });
    }, STEP_DURATION);

    return () => {
      clearTimeout(kickoff);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isDone || showContinueButton) return;

    const timeout = setTimeout(() => onContinue?.(), 600);

    return () => clearTimeout(timeout);
  }, [isDone, onContinue, showContinueButton]);

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col">
        <header className="flex h-16 items-center">
          <ProductLogo />
        </header>

        <main className="grid flex-1 place-items-center">
          <Surface className="w-full max-w-md p-6 text-center">
            <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-lg border border-border bg-[var(--surface-2)] text-muted-foreground">
              {isDone ? (
                <CheckCircle2 className="size-7 text-[var(--success)]" aria-hidden="true" />
              ) : (
                <LockKeyhole className="size-7" aria-hidden="true" />
              )}
            </div>

            <h1 className="text-2xl font-semibold tracking-normal">
              Authentication successful
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Securely connecting to your document AI workspace.
            </p>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent"
                style={{
                  width: `${progress}%`,
                  transition: `width ${STEP_DURATION * MESSAGES.length}ms cubic-bezier(0.65, 0, 0.35, 1)`,
                }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-left text-xs text-muted-foreground">
              <span className="inline-flex min-w-0 items-center gap-2">
                {isDone ? (
                  <CheckCircle2 className="size-4 shrink-0 text-[var(--success)]" aria-hidden="true" />
                ) : (
                  <LoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                )}
                <span className="truncate">{MESSAGES[messageIndex]}</span>
              </span>
              <span className="shrink-0">Secure</span>
            </div>

            {isDone && showContinueButton && (
              <Button type="button" onClick={onContinue} className="mt-6 w-full">
                Continue
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            )}
          </Surface>
        </main>
      </div>
    </div>
  );
}
