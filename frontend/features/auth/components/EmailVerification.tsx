'use client';

import { ExternalLink, Mail } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { ProductLogo, Surface } from '@/shared/ui/product';

interface EmailVerificationProps {
  onOpenEmailApp?: () => void;
  onResend?: () => void;
  onUseDifferentEmail?: () => void;
}

export default function EmailVerification({
  onOpenEmailApp,
  onResend,
  onUseDifferentEmail,
}: EmailVerificationProps) {
  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col">
        <header className="flex h-16 items-center">
          <ProductLogo />
        </header>

        <main className="grid flex-1 place-items-center">
          <Surface className="w-full max-w-md p-6 text-center">
            <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-lg border border-border bg-[var(--surface-2)] text-muted-foreground">
              <Mail className="size-6" aria-hidden="true" />
            </div>

            <h1 className="text-2xl font-semibold tracking-normal">
              Check your email
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              We sent a verification link to your email. Verify your account to
              continue.
            </p>

            <div className="mt-6 grid gap-2">
              <Button type="button" onClick={onOpenEmailApp}>
                Open email app
                <ExternalLink className="size-4" aria-hidden="true" />
              </Button>
              <Button type="button" variant="outline" onClick={onResend}>
                Resend verification email
              </Button>
              <button
                type="button"
                onClick={onUseDifferentEmail}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Use a different email
              </button>
            </div>
          </Surface>
        </main>
      </div>
    </div>
  );
}
