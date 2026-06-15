'use client';

import { useAuth } from '@/features/auth/AuthProvider';
import { Button } from '@/shared/ui/button';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HeroActions() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const isAuthenticated = !isLoading && Boolean(session);

  const chatLabel = isAuthenticated ? 'Open chat' : 'Try the demo';

  return (
    <div className="mt-8 mb-10 flex flex-col gap-3 sm:flex-row">
      <Button
        type="button"
        onClick={() => router.push(isAuthenticated ? '/chat' : '/auth/sign-in')}
        size="lg"
        className="w-full sm:w-auto"
      >
        {chatLabel}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
