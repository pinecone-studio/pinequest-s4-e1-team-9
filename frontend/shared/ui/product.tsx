'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronRight,
  MessageSquareText,
  Loader2,
  LogOut,
  Menu,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  UserCircle,
  UserPlus,
  X,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { cn } from '@/shared/lib/utils';
import { Button, buttonVariants } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  contentClassName?: string;
};

const navItems = [
  { href: '/chat', label: 'Chat', icon: MessageSquareText },
  { href: '/create-ai', label: 'Create AI', icon: Plus },
  { href: '/join', label: 'Join AI', icon: UserPlus },
];

export function ProductLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent">
        <Sparkles className="size-4" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="truncate text-sm font-semibold tracking-normal text-foreground">
          Pinequest AI
        </span>
      )}
    </span>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ShellNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="grid gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex min-h-9 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/72 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function ProfileMenu() {
  const { user, profile, signOut, updateProfileName } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(profile?.name ?? '');
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const displayName = profile?.name || 'Account';

  useEffect(() => {
    if (!editing) {
      setNameValue(profile?.name ?? '');
    }
  }, [editing, profile?.name]);

  const saveName = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = nameValue.replace(/\s+/g, ' ').trim();

    if (name.length < 2) {
      setStatus('Name must be at least 2 characters.');
      return;
    }

    if (name.length > 80) {
      setStatus('Name must be 80 characters or fewer.');
      return;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      await updateProfileName(name);
      setEditing(false);
      setStatus('Name saved.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to save name.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="max-w-52 justify-start"
      >
        <UserCircle className="size-4" aria-hidden="true" />
        <span className="truncate">{displayName}</span>
      </Button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close account menu"
            className="fixed inset-0 z-20 cursor-default bg-transparent"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-30 mt-2 w-72 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-[var(--shadow-md)]"
          >
            <div className="border-b border-border px-2 py-2">
              <p className="truncate text-sm font-medium">
                {displayName}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {user?.email ?? 'Private document AI access'}
              </p>
            </div>
            <div className="border-b border-border px-2 py-3">
              {editing ? (
                <form className="grid gap-2" onSubmit={saveName}>
                  <label
                    htmlFor="profile-menu-name"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Name
                  </label>
                  <Input
                    id="profile-menu-name"
                    value={nameValue}
                    minLength={2}
                    maxLength={80}
                    onChange={(event) => {
                      setNameValue(event.target.value);
                      setStatus(null);
                    }}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Save className="size-4" aria-hidden="true" />
                      )}
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(false);
                        setNameValue(profile?.name ?? '');
                        setStatus(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setNameValue(profile?.name ?? '');
                    setStatus(null);
                    setEditing(true);
                  }}
                >
                  <UserCircle className="size-4" aria-hidden="true" />
                  Edit profile name
                </Button>
              )}
              {status && (
                <p className="mt-2 text-xs text-muted-foreground">{status}</p>
              )}
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
              className="mt-2 flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function AppShell({
  children,
  title,
  description,
  actions,
  breadcrumbs,
  contentClassName,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Link href="/chat" className="min-w-0">
          <ProductLogo />
        </Link>
      </div>
      <div className="flex-1 px-3 py-4">
        <ShellNav onNavigate={() => setMobileOpen(false)} />
      </div>
      <div className="border-t border-sidebar-border px-4 py-4 text-xs leading-5 text-sidebar-foreground/58">
        Answers stay scoped to the AIs and documents you can access.
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:block">
        {sidebar}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0" showCloseButton={false}>
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          {sidebar}
        </SheetContent>
      </Sheet>

      <div className="min-h-screen md:pl-60">
        <header className="sticky top-0 z-10 border-b border-border bg-background/92 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="size-4" aria-hidden="true" />
              </Button>
              <div className="min-w-0">
                {breadcrumbs?.length ? (
                  <Breadcrumbs items={breadcrumbs} />
                ) : (
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Workspace
                  </p>
                )}
                {title && (
                  <h1 className="truncate text-base font-semibold text-foreground">
                    {title}
                  </h1>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {actions}
              <ProfileMenu />
            </div>
          </div>
        </header>

        <main className={cn('px-4 py-6 sm:px-6 lg:px-8', contentClassName)}>
          {description && !breadcrumbs?.length && (
            <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
              {description}
            </p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-1 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
      <Link href="/chat" className="inline-flex items-center gap-1 hover:text-foreground">
        <MessageSquareText className="size-3.5" aria-hidden="true" />
        Chat
      </Link>
      {items.map((item) => (
        <span key={`${item.href ?? item.label}`} className="inline-flex min-w-0 items-center gap-1">
          <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
          {item.href ? (
            <Link href={item.href} className="truncate hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="truncate text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-2xl font-semibold tracking-normal text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
        {meta && <div className="mt-3 flex flex-wrap gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </section>
  );
}

export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Surface({
  children,
  className,
  as: Component = 'section',
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <Component
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground shadow-[var(--shadow-sm)]',
        className,
      )}
    >
      {children}
    </Component>
  );
}

export function EmptyState({
  icon: Icon = Bot,
  title,
  description,
  actions,
  className,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-dashed border-border bg-card p-6 text-left', className)}>
      <div className="flex max-w-2xl gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-[var(--surface-2)] text-muted-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          )}
          {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

export function Alert({
  title,
  children,
  variant = 'info',
  className,
}: {
  title?: string;
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  className?: string;
}) {
  const variants = {
    info: 'border-[color-mix(in_srgb,var(--info)_34%,var(--border))] bg-[var(--info-soft)] text-foreground',
    success:
      'border-[color-mix(in_srgb,var(--success)_34%,var(--border))] bg-[var(--success-soft)] text-foreground',
    warning:
      'border-[color-mix(in_srgb,var(--warning)_38%,var(--border))] bg-[var(--warning-soft)] text-foreground',
    error:
      'border-[color-mix(in_srgb,var(--destructive)_38%,var(--border))] bg-destructive/10 text-foreground',
  };
  const icons = {
    info: AlertCircle,
    success: CheckCircle2,
    warning: AlertCircle,
    error: AlertCircle,
  };
  const Icon = icons[variant];

  return (
    <div className={cn('flex items-start gap-3 rounded-lg border p-3 text-sm', variants[variant], className)}>
      <Icon
        className={cn(
          'mt-0.5 size-4 shrink-0',
          variant === 'error' && 'text-destructive',
          variant === 'success' && 'text-[var(--success)]',
          variant === 'warning' && 'text-[var(--warning)]',
          variant === 'info' && 'text-[var(--info)]',
        )}
        aria-hidden="true"
      />
      <div className="min-w-0">
        {title && <p className="font-medium">{title}</p>}
        <div className={cn(title && 'mt-1', 'leading-6 text-muted-foreground')}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function StatusPill({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'error';
  className?: string;
}) {
  const tones = {
    neutral: 'border-border bg-[var(--surface-2)] text-muted-foreground',
    info: 'border-[color-mix(in_srgb,var(--info)_38%,var(--border))] bg-[var(--info-soft)] text-[var(--info)]',
    success:
      'border-[color-mix(in_srgb,var(--success)_38%,var(--border))] bg-[var(--success-soft)] text-[var(--success)]',
    warning:
      'border-[color-mix(in_srgb,var(--warning)_42%,var(--border))] bg-[var(--warning-soft)] text-[var(--warning)]',
    error:
      'border-[color-mix(in_srgb,var(--destructive)_42%,var(--border))] bg-destructive/10 text-destructive',
  };

  return (
    <span
      className={cn(
        'inline-flex min-h-6 items-center rounded-md border px-2 py-0.5 text-xs font-medium leading-4',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function FormField({
  id,
  label,
  description,
  error,
  children,
}: {
  id?: string;
  label: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {description && (
        <p className="text-sm leading-5 text-muted-foreground">{description}</p>
      )}
      {children}
      {error && (
        <p id={id ? `${id}-error` : undefined} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function Textarea({
  className,
  ...props
}: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-9 w-full rounded-lg border border-input bg-input px-3 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function SearchInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <label className={cn('relative block', className)}>
      <span className="sr-only">{props['aria-label'] ?? 'Search'}</span>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input className="h-9 pl-9" {...props} />
    </label>
  );
}

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  description?: string;
  icon?: React.ElementType;
}) {
  return (
    <Surface className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-normal text-foreground">
            {value}
          </p>
          {description && (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {Icon && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-[var(--surface-2)] text-muted-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>
    </Surface>
  );
}

export function LoadingState({
  label = 'Loading...',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('grid min-h-72 place-items-center rounded-lg border border-border bg-card text-sm text-muted-foreground', className)}>
      <span className="inline-flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {label}
      </span>
    </div>
  );
}

export function TabList<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; icon?: React.ElementType }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 p-2" role="tablist">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = active === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'bg-[var(--surface-3)] text-foreground'
                : 'text-muted-foreground hover:bg-[var(--surface-2)] hover:text-foreground',
            )}
          >
            {Icon && <Icon className="size-4" aria-hidden="true" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function IconLink({
  href,
  children,
  variant = 'outline',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
}) {
  return (
    <Link href={href} className={buttonVariants({ variant })}>
      {children}
    </Link>
  );
}

export function ManagerOnlyNote() {
  return (
    <StatusPill tone="success">
      <ShieldCheck className="mr-1 size-3.5" aria-hidden="true" />
      Admin controls
    </StatusPill>
  );
}

export function CloseButton({
  onClick,
  label = 'Close',
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button type="button" variant="ghost" size="icon" onClick={onClick} aria-label={label}>
      <X className="size-4" aria-hidden="true" />
    </Button>
  );
}
