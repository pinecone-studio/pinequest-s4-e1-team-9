'use client';

import { useAuth } from '@/features/auth/AuthProvider';
import { Button } from '@/shared/ui/button';
import { ArrowLeft, LogOut, Moon, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function IconBtn({
  label,
  onClick,
  isDarkMode,
  children,
}: {
  label: string;
  onClick: () => void;
  isDarkMode: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="rounded-full text-muted-foreground transition-colors duration-150"
      style={
        {
          '--hover-color': isDarkMode ? '#00e5cc' : '#1e3a8a',
        } as React.CSSProperties & { '--hover-color': string }
      }
      onMouseEnter={(e) => {
        (e.currentTarget.querySelector('span') as HTMLElement).style.color =
          isDarkMode ? '#00e5cc' : '#1e3a8a';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget.querySelector('span') as HTMLElement).style.color =
          'inherit';
      }}
    >
      <span style={{ filter: 'drop-shadow(0 0 4px #00e5cc)' }}>{children}</span>
    </Button>
  );
}

export default function HeaderActions() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isConfirmingSignOut, setIsConfirmingSignOut] = useState(false);
  const signOutMenuRef = useRef<HTMLDivElement>(null);
  const userEmail = user?.email ?? 'Signed in';

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    if (!isConfirmingSignOut) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        signOutMenuRef.current &&
        !signOutMenuRef.current.contains(event.target as Node)
      ) {
        setIsConfirmingSignOut(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsConfirmingSignOut(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isConfirmingSignOut]);

  const toggleTheme = () => {
    const nextIsDarkMode = !isDarkMode;

    document.documentElement.classList.toggle('dark', nextIsDarkMode);
    setIsDarkMode(nextIsDarkMode);
    setIsConfirmingSignOut(false);
  };

  const confirmSignOut = () => {
    setIsConfirmingSignOut((current) => !current);
  };

  return (
    <div className="absolute top-4 left-5 right-5 flex items-center justify-between z-10 font-['Inter']">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => router.push('/landing')}
        className="rounded-full text-muted-foreground hover:text-foreground transition-colors duration-150 gap-1.5"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Button>

      <div className="flex items-center gap-1">
        <IconBtn label="Theme" onClick={toggleTheme} isDarkMode={isDarkMode}>
          {isDarkMode ? (
            <Moon className="size-5" aria-hidden="true" />
          ) : (
            <Sun className="size-5" aria-hidden="true" />
          )}
        </IconBtn>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label="Sign out"
          title="Sign out"
          onClick={() => {
            void signOut();
          }}
          className="rounded-full text-muted-foreground transition-colors duration-150"
        >
          <LogOut className="size-5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
