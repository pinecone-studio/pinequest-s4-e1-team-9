'use client';

import type { Conversation } from '@/shared/types/chat';
import { MessageSquare, Search, Trash2, X } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';

interface SearchModalProps {
  conversations: Conversation[];
  onSelect: (id: string) => void;
  onClose: () => void;
  onNewChat: () => void;
}

export function SearchModal({
  conversations,
  onSelect,
  onClose,
  onNewChat,
}: SearchModalProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const filtered = useMemo(
    () =>
      query.trim()
        ? conversations.filter((c) =>
            c.title.toLowerCase().includes(query.toLowerCase()),
          )
        : conversations,
    [conversations, query],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#2c2c2c] rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-white/10">
          <Search size={16} className="text-muted-foreground shrink-0 mr-3" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-[15px] outline-none border-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="ml-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-foreground hover:bg-white/5 transition-colors text-[14px]"
          >
            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center shrink-0">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            New chat
          </button>

          {filtered.length > 0 && (
            <>
              <p className="px-4 py-1 text-[11px] text-muted-foreground/60 tracking-widest uppercase mt-2">
                Recents
              </p>
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelect(c.id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-foreground hover:bg-white/5 transition-colors text-[14px] text-left"
                >
                  <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center shrink-0">
                    <MessageSquare size={14} />
                  </div>
                  <span className="truncate">{c.title}</span>
                </button>
              ))}
            </>
          )}

          {filtered.length === 0 && query && (
            <p className="text-center text-[13px] text-muted-foreground py-8">
              No matching chats
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface HistoryChatProps {
  conversations: Conversation[];
  activeId: string | null;
  expanded: boolean;
  searchQuery: string;
  loading?: boolean;
  error?: string | null;
  onSearchChange: (q: string) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
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
        group relative flex items-center w-full h-9 rounded-full cursor-pointer
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
          flex-1 truncate text-[13px] font-['Inter'] px-3
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

function HistoryChat({
  conversations,
  activeId,
  expanded,
  loading = false,
  error = null,
  onSelect,
  onDelete,
  onNewChat,
}: HistoryChatProps) {
  const [modalOpen, setModalOpen] = useState(false);

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
    <>
      {modalOpen && (
        <SearchModal
          conversations={conversations}
          onSelect={onSelect}
          onClose={() => setModalOpen(false)}
          onNewChat={onNewChat}
        />
      )}

      <div className="flex flex-col flex-1 min-h-0">
        <div className="mb-2">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="
              w-full h-[60px] rounded-full flex items-center gap-2 px-4
              bg-[#717976]/20 hover:bg-[#717976]/60
              border-none cursor-pointer transition-colors duration-150
            "
          >
            <Search size={13} className="text-muted-foreground shrink-0" />
            <span className="text-[14px] text-muted-foreground font-['Inter']">
              Search chats…
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-1 [scrollbar-width:thin] [scrollbar-color:var(--muted)_transparent]">
          {conversations.length === 0 && !loading && (
            <p className="text-[12px] text-muted-foreground text-center mt-6 font-['Inter']">
              No history yet
            </p>
          )}

          {loading && (
            <p className="text-[12px] text-muted-foreground text-center mt-6 font-['Inter']">
              Loading chats...
            </p>
          )}

          {error && !loading && (
            <p className="text-[12px] text-destructive text-center mt-3 px-2 font-['Inter']">
              {error}
            </p>
          )}

          {!loading && conversations.length > 0 && (
            <>
              <p className="px-2 py-1 text-[11px] text-muted-foreground/60 tracking-[0.08em] font-['Inter'] uppercase mt-2">
                Recents
              </p>
              <div className="flex flex-col gap-0.5 mb-2">
                {conversations.map((c) => (
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
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default memo(HistoryChat);
