'use client';

import type { Conversation } from '@/shared/types/chat';
import { Button } from '@/shared/ui/button';
import {
  EmptyState,
  ProductLogo,
  SearchInput,
} from '@/shared/ui/product';
import {
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import { cn } from '@/shared/lib/utils';

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onNewChat: () => void;
  conversations: Conversation[];
  activeId: string | null;
  loading?: boolean;
  error?: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

function formatConversationDate(value: number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recent';

  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();

  if (sameDay) return 'Today';

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function ConversationList({
  conversations,
  activeId,
  loading,
  error,
  query,
  onSelect,
  onDelete,
}: {
  conversations: Conversation[];
  activeId: string | null;
  loading: boolean;
  error: string | null;
  query: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return conversations;

    return conversations.filter((conversation) =>
      [
        conversation.title,
        conversation.latestMessagePreview,
        conversation.document?.filename,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized)),
    );
  }, [conversations, query]);

  if (loading) {
    return (
      <div className="grid gap-2 p-3">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-14 animate-pulse rounded-lg bg-[var(--surface-2)]" />
        ))}
      </div>
    );
  }

  if (error && conversations.length === 0) {
    return (
      <p className="m-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="p-3">
        <EmptyState
          icon={MessageSquare}
          title={query ? 'No matching chats' : 'No history yet'}
          description={
            query
              ? 'Try another search term.'
              : 'Start a conversation and it will appear here.'
          }
        />
      </div>
    );
  }

  return (
    <div className="grid gap-1 p-2">
      {filtered.map((conversation, index) => {
        const active = conversation.id === activeId;
        const showDate =
          index === 0 ||
          formatConversationDate(filtered[index - 1].updatedAt) !==
            formatConversationDate(conversation.updatedAt);

        return (
          <div key={conversation.id}>
            {showDate && (
              <p className="px-2 pb-1 pt-3 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {formatConversationDate(conversation.updatedAt)}
              </p>
            )}
            <div
              className={cn(
                'group grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg border px-3 py-2 transition-colors',
                active
                  ? 'border-[color-mix(in_srgb,var(--accent)_42%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]'
                  : 'border-transparent hover:border-border hover:bg-[var(--surface-2)]',
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(conversation.id)}
                className="min-w-0 text-left"
              >
                <span className="block truncate text-sm font-medium text-foreground">
                  {conversation.title || 'Untitled conversation'}
                </span>
                {conversation.latestMessagePreview && (
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {conversation.latestMessagePreview}
                  </span>
                )}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${conversation.title}`}
                className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100"
                onClick={() => onDelete(conversation.id)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SidebarInner({
  onCollapsedChange,
  onNewChat,
  conversations,
  activeId,
  loading = false,
  error = null,
  onSelectConversation,
  onDeleteConversation,
}: Omit<SidebarProps, 'open' | 'onOpenChange' | 'collapsed'>) {
  const [query, setQuery] = useState('');

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex min-h-16 items-center justify-between gap-2 border-b border-sidebar-border px-4">
        <ProductLogo />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onCollapsedChange(true)}
          className="hidden lg:inline-flex"
          aria-label="Collapse conversation sidebar"
        >
          <PanelLeftClose className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <div className="grid gap-3 border-b border-sidebar-border p-3">
        <Button type="button" onClick={onNewChat} className="justify-start">
          <Plus className="size-4" aria-hidden="true" />
          New conversation
        </Button>
        <SearchInput
          aria-label="Search conversations"
          placeholder="Search history"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          loading={loading}
          error={error}
          query={query}
          onSelect={onSelectConversation}
          onDelete={onDeleteConversation}
        />
      </div>
    </div>
  );
}

function CollapsedSidebar({
  conversations,
  activeId,
  loading = false,
  onNewChat,
  onSelectConversation,
  onCollapsedChange,
}: Omit<SidebarProps, 'open' | 'onOpenChange' | 'onDeleteConversation' | 'error'>) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-2 bg-sidebar px-2 py-3 text-sidebar-foreground">
      <ProductLogo compact />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onCollapsedChange(false)}
        aria-label="Expand conversation sidebar"
      >
        <PanelLeftOpen className="size-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        size="icon"
        onClick={onNewChat}
        aria-label="New conversation"
      >
        <Plus className="size-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onCollapsedChange(false)}
        aria-label="Search conversations"
      >
        <Search className="size-4" aria-hidden="true" />
      </Button>
      <div className="min-h-0 w-full flex-1 overflow-y-auto pt-2">
        <div className="grid gap-1">
          {loading
            ? [0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="mx-auto size-9 animate-pulse rounded-lg bg-[var(--surface-2)]"
                />
              ))
            : conversations.map((conversation) => {
                const active = conversation.id === activeId;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    title={conversation.title || 'Untitled conversation'}
                    aria-label={`Open ${conversation.title || 'conversation'}`}
                    onClick={() => onSelectConversation(conversation.id)}
                    className={cn(
                      'mx-auto flex size-9 items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                      active
                        ? 'border-[color-mix(in_srgb,var(--accent)_48%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent'
                        : 'border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    )}
                  >
                    <MessageSquare className="size-4" aria-hidden="true" />
                  </button>
                );
              })}
        </div>
      </div>
    </div>
  );
}

function Sidebar(props: SidebarProps) {
  return (
    <>
      <aside
        className={cn(
          'hidden shrink-0 border-r border-sidebar-border transition-[width] duration-200 lg:block',
          props.collapsed ? 'w-[4.5rem]' : 'w-80',
        )}
      >
        {props.collapsed ? (
          <CollapsedSidebar {...props} />
        ) : (
          <SidebarInner {...props} />
        )}
      </aside>
      <Sheet open={props.open} onOpenChange={props.onOpenChange}>
        <SheetContent side="left" className="w-80 bg-sidebar p-0" showCloseButton={false}>
          <SheetHeader className="sr-only">
            <SheetTitle>Conversation history</SheetTitle>
          </SheetHeader>
          <SidebarInner {...props} />
        </SheetContent>
      </Sheet>
    </>
  );
}

export default memo(Sidebar);
