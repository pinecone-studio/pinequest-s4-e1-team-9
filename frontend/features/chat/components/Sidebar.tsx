'use client';

import GeminiLogo from '@/features/chat/components/GeminiLogo';
import HistoryChat from '@/features/chat/components/HistoryChat';
import { useIsMobile } from '@/shared/lib/use-mobile';
import type { Conversation } from '@/shared/types/chat';
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
  const isMobile = useIsMobile();

  const toggleExpanded = () => setExpanded((prev) => !prev);
  const closeMobileSidebar = () => {
    if (isMobile) setExpanded(false);
  };

  const handleNewChat = () => {
    onNewChat();
    closeMobileSidebar();
  };

  const handleSelectConversation = (id: string) => {
    onSelectConversation(id);
    closeMobileSidebar();
  };

  const handleDeleteConversation = (id: string) => {
    onDeleteConversation(id);
    closeMobileSidebar();
  };

  return (
    <>
      {isMobile && expanded && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-20 bg-background/70 border-none"
        />
      )}

      <aside
        className={`
          flex flex-col pt-3 pb-4 gap-1 shrink-0 px-2.5 font-['DM_Sans']
          transition-[width,transform] duration-200 ease-in-out overflow-hidden
          bg-sidebar
          ${expanded ? 'w-60 border-r border-border' : 'w-14'}
          ${isMobile && expanded ? 'fixed inset-y-0 left-0 z-30 shadow-2xl' : 'relative z-10'}
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
            <span className="truncate text-[20px] font-medium text-foreground">
              Research Docs
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={handleNewChat}
          aria-label="New chat"
          className={`
            h-9 w-full rounded-[10px] flex items-center justify-start gap-2 border-none cursor-pointer
            transition-colors duration-150 bg-[#717976]/20 text-black hover:bg-[#717976]/60
            ${expanded ? 'py-6 px-2' : ''}
          `}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center text-foreground">
            <Plus size={20} />
          </span>
          {expanded && (
            <span className="text-[14px] truncate font-medium text-foreground">
              New Chat
            </span>
          )}
        </button>

        <div className="w-full h-px bg-border/50 mb-1" />

        <HistoryChat
          conversations={conversations}
          activeId={activeId}
          expanded={expanded}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelect={handleSelectConversation}
          onDelete={handleDeleteConversation}
        />
      </aside>
    </>
  );
}

export default memo(Sidebar);
