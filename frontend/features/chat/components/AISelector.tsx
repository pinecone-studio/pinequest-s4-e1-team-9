'use client';

import type { Company } from '@/features/companies/types';
import { isAdminRole, roleLabel } from '@/features/dashboard/components/ui';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { StatusPill } from '@/shared/ui/product';
import {
  Bot,
  Check,
  ChevronDown,
  Plus,
  Settings,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type AISelectorProps = {
  current: Company;
  companies: Company[];
  onSelect: (company: Company) => void;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AI';
}

function companyTime(company: Company) {
  const value = company.lastActivityAt ?? company.updatedAt ?? company.createdAt;
  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : 0;
}

function groupCompanies(companies: Company[]) {
  const active = [...companies]
    .filter((company) => company.setupStatus !== 'ARCHIVED')
    .sort((left, right) => companyTime(right) - companyTime(left));

  return {
    owned: active.filter((company) => company.role === 'OWNER'),
    joined: active.filter((company) => company.role !== 'OWNER'),
  };
}

function SelectorItem({
  company,
  active,
  onSelect,
}: {
  company: Company;
  active: boolean;
  onSelect: (company: Company) => void;
}) {
  const description =
    company.description ||
    company.aiConfiguration?.description ||
    'Private document AI';

  return (
    <button
      type="button"
      onClick={() => onSelect(company)}
      className={cn(
        'grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-ring',
        active && 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]',
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-background text-xs font-semibold">
        {initials(company.name)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">
          {company.name}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {description}
        </span>
      </span>
      <span className="flex items-center gap-2">
        <StatusPill tone={company.role === 'OWNER' ? 'success' : 'neutral'}>
          {roleLabel(company)}
        </StatusPill>
        {active && <Check className="size-4 text-accent" aria-hidden="true" />}
      </span>
    </button>
  );
}

function Group({
  label,
  companies,
  currentId,
  onSelect,
}: {
  label: string;
  companies: Company[];
  currentId: string;
  onSelect: (company: Company) => void;
}) {
  if (!companies.length) return null;

  return (
    <div className="grid gap-1">
      <p className="px-2 pt-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      {companies.map((company) => (
        <SelectorItem
          key={company.id}
          company={company}
          active={company.id === currentId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export default function AISelector({
  current,
  companies,
  onSelect,
}: AISelectorProps) {
  const [open, setOpen] = useState(false);
  const groups = useMemo(() => groupCompanies(companies), [companies]);

  const select = (company: Company) => {
    setOpen(false);
    onSelect(company);
  };

  return (
    <div className="relative min-w-0">
      <Button
        type="button"
        variant="outline"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="max-w-[58vw] justify-start sm:max-w-80"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-background text-[10px] font-semibold">
          {initials(current.name)}
        </span>
        <span className="min-w-0 truncate">{current.name}</span>
        <ChevronDown className="ml-auto size-4 shrink-0" aria-hidden="true" />
      </Button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close AI selector"
            className="fixed inset-0 z-20 cursor-default bg-transparent"
            onClick={() => setOpen(false)}
          />
          <div
            role="listbox"
            className="absolute left-0 z-30 mt-2 w-[min(92vw,420px)] rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-[var(--shadow-md)]"
          >
            <Group
              label="YOUR AIS"
              companies={groups.owned}
              currentId={current.id}
              onSelect={select}
            />
            <Group
              label="JOINED AIS"
              companies={groups.joined}
              currentId={current.id}
              onSelect={select}
            />

            {!groups.owned.length && !groups.joined.length && (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                <Bot className="mx-auto mb-2 size-5" aria-hidden="true" />
                No other AIs yet.
              </div>
            )}

            <div className="mt-2 grid gap-1 border-t border-border pt-2">
              <Link
                href="/join"
                className="flex min-h-9 items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-[var(--surface-2)]"
              >
                <UserPlus className="size-4" aria-hidden="true" />
                Join another AI
              </Link>
              <Link
                href="/create-ai"
                className="flex min-h-9 items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-[var(--surface-2)]"
              >
                <Plus className="size-4" aria-hidden="true" />
                Create a new AI
              </Link>
              {isAdminRole(current) && (
                <Link
                  href={`/ai/${current.id}/manage`}
                  className="flex min-h-9 items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-[var(--surface-2)]"
                >
                  <Settings className="size-4" aria-hidden="true" />
                  Manage current AI
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
