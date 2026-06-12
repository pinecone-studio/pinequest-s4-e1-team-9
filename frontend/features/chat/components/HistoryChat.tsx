'use client';

import type { Conversation } from '@/shared/types/chat';
import { ChevronDown, MessageSquare, Search, Trash2 } from 'lucide-react';
import { memo, useMemo, useRef, useState } from 'react';

interface HistoryChatProps {
  conversations: Conversation[];
  activeId: string | null;
  expanded: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function groupLabel(ts: number): string {
  const now = startOfDay(Date.now());
  const day = startOfDay(ts);
  const diff = now - day;
  if (diff === 0) return 'Today';
  if (diff === 86_400_000) return 'Yesterday';
  if (diff < 7 * 86_400_000) return 'This week';
  if (diff < 30 * 86_400_000) return 'This month';
  return 'Earlier';
}

const GROUP_ORDER = [
  'Today',
  'Yesterday',
  'This week',
  'This month',
  'Earlier',
];

type GroupedConversations = {
  label: string;
  items: Conversation[];
}[];

function groupConversations(convos: Conversation[]): GroupedConversations {
  const map = new Map<string, Conversation[]>();
  for (const c of convos) {
    const label = groupLabel(c.updatedAt);
    const items = map.get(label) ?? [];
    items.push(c);
    map.set(label, items);
  }
  return GROUP_ORDER.flatMap((label) => {
    const items = map.get(label);
    return items ? [{ label, items }] : [];
  });
}

interface HistoryRowProps {
  conversation: Conversation;
  isActive: boolean;
  expanded: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const HistoryRow = memo(function HistoryRow({
  conversation,
  isActive,
  expanded,
  onSelect,
  onDelete,
}: HistoryRowProps) {
  const [hovered, setHovered] = useState(false);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={onSelect}
        title={conversation.title}
        aria-label={conversation.title}
        className={`
          w-9 h-9 flex items-center justify-center rounded-full border-none cursor-pointer
          transition-colors duration-150 shrink-0
          ${
            isActive
              ? 'bg-[#717976]/25 text-foreground hover:bg-[#717976]/40'
              : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
          }
        `}
      >
        <MessageSquare size={16} />
      </button>
    );
  }

  return (
    <div
      className={`
        group relative flex items-center w-full h-9 rounded-[10px] cursor-pointer
        transition-colors duration-150 select-none px-3
        ${isActive ? 'bg-[#717976]/25' : 'hover:bg-muted/60'}
      `}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      <span
        className={`
          flex-1 truncate text-[13px] leading-none font-['Inter'] px-3
          transition-colors duration-150
          ${
            isActive
              ? 'text-foreground font-medium'
              : 'text-muted-foreground group-hover:text-foreground'
          }
        `}
      >
        {conversation.title}
      </span>

      {hovered && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete chat"
          className="
            shrink-0 w-6 h-6 flex items-center justify-center
            bg-transparent border-none rounded-full cursor-pointer
            text-muted-foreground hover:text-destructive hover:bg-muted
            transition-colors duration-100 -mr-1
          "
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
});

interface GroupHeaderProps {
  label: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
}

const GroupHeader = memo(function GroupHeader({
  label,
  count,
  isOpen,
  onToggle,
}: GroupHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="
        w-full flex items-center justify-between gap-2
        px-3 py-1.5 mb-0.5 rounded-[8px]
        bg-transparent border-none cursor-pointer
        text-[10px] uppercase tracking-[0.08em] font-semibold font-['Inter']
        text-muted-foreground/60
        transition-colors duration-150
        hover:text-foreground hover:bg-muted/40
      "
      aria-expanded={isOpen}
    >
      <span className="flex items-center gap-1.5">
        {label}
        <span className="text-muted-foreground/40 font-normal tracking-normal">
          {count}
        </span>
      </span>
      <ChevronDown
        size={12}
        className={`transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
      />
    </button>
  );
});

function HistoryChat({
  conversations,
  activeId,
  expanded,
  searchQuery,
  onSearchChange,
  onSelect,
  onDelete,
}: HistoryChatProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const grouped = useMemo(() => groupConversations(filtered), [filtered]);

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  if (!expanded) {
    if (conversations.length === 0) return null;
    return (
      <div className="flex flex-col items-center gap-0.5 mt-1 overflow-y-auto max-h-[calc(100vh-200px)] [scrollbar-width:none]">
        {conversations.slice(0, 20).map((c) => (
          <HistoryRow
            key={c.id}
            conversation={c}
            isActive={c.id === activeId}
            expanded={false}
            onSelect={() => onSelect(c.id)}
            onDelete={(e) => {
              e.stopPropagation();
              onDelete(c.id);
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 mt-1 ">
      <div className="px-2 mb-2">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search chats…"
            className="
              w-full h-8 pl-7 pr-3 p-5 rounded-[10px] text-[13px]
              bg-input text-foreground placeholder:text-muted-foreground
              border border-transparent focus:border-[#717976] focus:outline-none
              font-['Inter'] transition-colors duration-150
            "
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1 [scrollbar-width:thin] [scrollbar-color:var(--muted)_transparent]">
        {grouped.length === 0 && (
          <p className="text-[12px] text-muted-foreground text-center mt-6 font-['Inter']">
            {searchQuery ? 'No matching chats' : 'No history yet'}
          </p>
        )}

        {grouped.map(({ label, items }) => {
          const isOpen = !collapsedGroups.has(label);
          return (
            <div key={label} className="mb-1">
              <GroupHeader
                label={label}
                count={items.length}
                isOpen={isOpen}
                onToggle={() => toggleGroup(label)}
              />

              {isOpen && (
                <div className="flex flex-col gap-0.5 mb-2">
                  {items.map((c) => (
                    <HistoryRow
                      key={c.id}
                      conversation={c}
                      isActive={c.id === activeId}
                      expanded={true}
                      onSelect={() => onSelect(c.id)}
                      onDelete={(e) => {
                        e.stopPropagation();
                        onDelete(c.id);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(HistoryChat);
