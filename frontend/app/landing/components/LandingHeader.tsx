'use client';
import { useAuth } from '@/features/auth/AuthProvider';
import { ProductLogo } from '@/shared/ui/product';
import { Button } from '@/shared/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LandingHeader() {
  const router = useRouter();
  const { session, isLoading, signOut } = useAuth();
  const isAuthenticated = !isLoading && Boolean(session);
  const getStartedLabel = isAuthenticated ? 'Open chat' : 'Try the demo';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="min-w-0">
          <ProductLogo />
        </Link>

        <div className="flex items-center gap-2 pr-1">
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                void signOut();
              }}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Sign out
            </button>
          )}
          <Button
            type="button"
            onClick={() => router.push(isAuthenticated ? '/chat' : '/auth/sign-in')}
          >
            {getStartedLabel}
          </Button>
        </div>
      </div>
    </header>
  );
}
