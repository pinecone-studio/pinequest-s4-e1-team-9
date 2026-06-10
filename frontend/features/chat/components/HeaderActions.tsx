'use client';

import { LogOut, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

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
      className="rounded-none text-muted-foreground transition-colors duration-150"
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
  const { signOut } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const nextIsDarkMode = !isDarkMode;

    document.documentElement.classList.toggle('dark', nextIsDarkMode);
    setIsDarkMode(nextIsDarkMode);
  };

  return (
    <div className="absolute top-4 right-5 flex items-center gap-1 z-10">
      <IconBtn label="Theme" onClick={toggleTheme} isDarkMode={isDarkMode} />
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-label="Sign out"
        title="Sign out"
        onClick={() => {
          void signOut();
        }}
        className="rounded-none text-muted-foreground transition-colors duration-150"
      >
        <LogOut className="size-5" aria-hidden="true" />
      </Button>
    </div>
  );
}
