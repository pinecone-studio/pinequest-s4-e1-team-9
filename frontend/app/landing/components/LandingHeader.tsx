'use client';
import { useAuth } from '@/features/auth/AuthProvider';
import GeminiLogo from '@/features/chat/components/GeminiLogo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LandingHeader() {
  const router = useRouter();
  const { session, isLoading, signOut } = useAuth();
  const isAuthenticated = !isLoading && Boolean(session);
  const getStartedLabel = isAuthenticated ? 'Open Dashboard' : 'Sign up';

  return (
    <header className="w-full top-0 sticky z-50 flex justify-center px-6 pt-4">
      <div
        className="
          flex justify-between items-center h-[60px] px-3 w-[1000px] max-w-full
          rounded-full border border-white/10
          bg-[#1a1a1a]/20 backdrop-blur-md
        "
      >
        <Link href="/" className="flex items-center gap-2 pl-2">
          <GeminiLogo size={26} aria-label="CompanyDoc AI" />
          <span className="font-semibold text-[18px] tracking-tight text-white">
            CompanyDoc AI
          </span>
        </Link>

        <div className="flex items-center gap-2 pr-1">
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                void signOut();
              }}
              className="text-white/50 text-[16px] hover:text-white transition-colors duration-200 px-3 py-1.5 border-none bg-transparent cursor-pointer"
            >
              Log out
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="
              bg-white text-black text-[16px] font-semibold
              px-4 py-1.5 rounded-full
              hover:bg-white/90 transition-opacity
              border-none cursor-pointer
            "
          >
            {getStartedLabel}
          </button>
        </div>
      </div>
    </header>
  );
}
