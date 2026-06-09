'use client';

import GeminiLogo from '@/app/_components/chat/GeminiLogo';
import HistoryChat from '@/app/_components/chat/HistoryChat';
import { Conversation } from '@/app/_components/chat/UseLocalChatHistory';
import { Plus } from 'lucide-react';
import { memo, useState } from 'react';

interface SidebarProps {
  onNewChat: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

function Sidebar({
  onNewChat,
  conversations,
  activeId,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpanded = () => setExpanded((prev) => !prev);

  return (
    <aside
      className={`
        flex flex-col pt-3 pb-4 gap-1 shrink-0 relative z-10 px-2.5 font-['DM_Sans']
        transition-[width] duration-200 ease-in-out overflow-hidden
        bg-sidebar ${expanded ? 'w-60 border-r border-border' : 'w-14'}
      `}
    >
      <button
        type="button"
        onClick={toggleExpanded}
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        className="
          mb-3 h-9 w-full rounded-lg border-none bg-transparent cursor-pointer
          flex items-center justify-start gap-3
          transition-colors duration-150 hover:bg-muted
        "
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center">
          <GeminiLogo size={26} />
        </span>
        {expanded && (
          <span className="truncate text-[15px] font-medium text-foreground">
            Research Docs
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={onNewChat}
        aria-label="New chat"
        className={`
          h-9 w-full rounded-none flex items-center justify-center gap-2 border-none cursor-pointer
          transition-colors duration-150 mb-2
          bg-[#00e5cc] text-black hover:bg-[#00d4b8]
          ${expanded ? 'py-6' : ''}
        `}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center">
          <Plus size={20} />
        </span>
        {expanded && (
          <span className="text-[14px] truncate font-medium">New Chat</span>
        )}
      </button>

      <div className="w-full h-px bg-border/50 mb-1" />

      <HistoryChat
        conversations={conversations}
        activeId={activeId}
        expanded={expanded}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelect={onSelectConversation}
        onDelete={onDeleteConversation}
      />
    </aside>
  );
}

export default memo(Sidebar);
