'use client';

import AuthGate from '@/features/auth/AuthGate';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

type AuthRoutePageProps = {
  mode: 'sign-in' | 'sign-up';
};

function safeRedirect(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/chat';
  }

  return value;
}

function AuthRouteContent({ mode }: AuthRoutePageProps) {
  const searchParams = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get('redirectTo'));

  return (
    <AuthGate initialMode={mode} authenticatedRedirectTo={redirectTo}>
      <div className="min-h-screen bg-background" />
    </AuthGate>
  );
}

export default function AuthRoutePage(props: AuthRoutePageProps) {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
          Loading...
        </div>
      }
    >
      <AuthRouteContent {...props} />
    </Suspense>
  );
}
