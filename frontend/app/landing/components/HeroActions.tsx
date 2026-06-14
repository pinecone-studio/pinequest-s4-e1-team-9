'use client';

import { useAuth } from '@/features/auth/AuthProvider';
import { useRouter } from 'next/navigation';

export default function HeroActions() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const isAuthenticated = !isLoading && Boolean(session);

  const chatLabel = isAuthenticated ? 'Open Chat' : 'Chat with My Company Bot';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 sm:mb-24">
      <button
        type="button"
        onClick={() => router.push('/chat')}
        className="w-full sm:w-auto bg-background text-foreground border-2 border-border text-[18px] font-medium px-10 py-5 rounded-full hover:bg-secondary transition-colors shadow-sm"
      >
        {chatLabel}
      </button>
    </div>
  );
}
