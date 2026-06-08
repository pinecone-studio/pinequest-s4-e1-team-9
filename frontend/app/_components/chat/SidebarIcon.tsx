import { ReactNode } from 'react';

interface SidebarIconProps {
  children: ReactNode;
  active?: boolean;
  label?: string;
  onClick?: () => void;
  expanded?: boolean;
}

export default function SidebarIcon({
  children,
  active = false,
  label,
  onClick,
  expanded = false,
}: SidebarIconProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={expanded ? undefined : label}
      className={`
        h-9 w-full rounded-lg flex items-center justify-start gap-3 border-none cursor-pointer transition-colors duration-150
        ${
          active
            ? 'bg-muted text-foreground'
            : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
        }
      `}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center">
        {children}
      </span>
      {expanded && label && (
        <span className="text-[14px] truncate text-foreground">{label}</span>
      )}
    </button>
  );
}
