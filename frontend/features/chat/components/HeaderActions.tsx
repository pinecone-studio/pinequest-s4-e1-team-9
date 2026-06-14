'use client';

import { CircleUserRound, LogOut, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button } from '@/shared/ui/button';

function IconBtn({
  label,
  onClick,
  isDarkMode,
}: {
  label: string;
  onClick: () => void;
  isDarkMode: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="rounded-[10px] text-muted-foreground transition-colors duration-150"
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
      <span style={{ filter: 'drop-shadow(0 0 4px #00e5cc)' }}>
        {isDarkMode ? (
          <Moon className="size-5" aria-hidden="true" />
        ) : (
          <Sun className="size-5" aria-hidden="true" />
        )}
      </span>
    </Button>
  );
}

export default function HeaderActions() {
  const { signOut, user } = useAuth();
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
    <div className="absolute top-4 right-5 z-10 flex max-w-[calc(100vw-2.5rem)] items-center gap-1">
      <div
        className="flex h-9 min-w-0 max-w-[42vw] items-center gap-2 rounded-[10px] border border-border/70 bg-background/80 px-3 text-sm text-foreground shadow-sm backdrop-blur sm:max-w-[260px]"
        aria-label={`Signed in as ${userEmail}`}
        title={userEmail}
      >
        <CircleUserRound
          className="size-5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <span className="min-w-0 truncate">{userEmail}</span>
      </div>
      <IconBtn label="Theme" onClick={toggleTheme} isDarkMode={isDarkMode} />
      <div className="relative" ref={signOutMenuRef}>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label="Sign out"
          title="Sign out"
          aria-expanded={isConfirmingSignOut}
          onClick={confirmSignOut}
          className="rounded-[10px] text-muted-foreground transition-colors duration-150"
        >
          <LogOut className="size-5" aria-hidden="true" />
        </Button>

        {isConfirmingSignOut && (
          <div className="absolute top-full right-0 mt-2 w-40 rounded-[10px] border border-border/70 bg-background/95 p-1 shadow-lg backdrop-blur">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => {
                void signOut();
              }}
              className="h-9 w-full justify-start rounded-lg px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
