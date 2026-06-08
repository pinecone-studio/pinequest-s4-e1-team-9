'use client';

import GeminiLogo from '@/app/_components/chat/GeminiLogo';
import { Plus, Search } from 'lucide-react';
import { memo, useState } from 'react';

interface SidebarProps {
  onNewChat: () => void;
}

function Sidebar({ onNewChat }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);

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
        className={`
          mb-3 h-9 w-full rounded-lg border-none bg-transparent cursor-pointer
          flex items-center justify-start gap-3
          transition-colors duration-150 hover:bg-muted
        `}
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
          transition-colors duration-150 mb-3
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

      <div
        className={`${expanded ? 'w-full' : 'w-9'} transition-all duration-200`}
      >
        {expanded ? (
          <input
            type="text"
            placeholder="Search Chats"
            className="
              w-full h-9 px-3 rounded-none text-base
              bg-input text-foreground placeholder:text-muted-foreground
              border border-transparent focus:border-[#00e5cc] focus:outline-none
              transition-colors duration-150
            "
          />
        ) : (
          <button
            type="button"
            aria-label="Search chats"
            className="
              h-9 w-9 rounded-none flex items-center justify-center border-none cursor-pointer
              transition-colors duration-150
              bg-input text-muted-foreground hover:bg-input/80 hover:text-foreground
            "
          >
            <Search size={20} />
          </button>
        )}
      </div>

      <div className="flex-1" />

      <div className="flex-1" />

      {/* <div className={`relative ${expanded ? 'w-full' : ''}`}>
        <SidebarIcon
          label="Settings"
          onClick={() => undefined}
          expanded={expanded}
        >
          <Settings size={20} />
        </SidebarIcon>
        {!expanded && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 border-[1.5px] border-[#131314]" />
        )}
      </div> */}

      {/* {expanded ? (
        <button
          type="button"
          aria-label="User profile"
          className="
            flex items-center gap-2.5 w-full h-9 px-2.5 rounded-lg
            border-none bg-transparent cursor-pointer
            hover:bg-white/[0.08] transition-colors duration-150
          "
        >
          <UserAvatar letter="L" className="w-7 h-7 text-xs" />
          <span className="text-[14px] text-[#e8eaed] truncate">Louis</span>
        </button>
      ) : (
        <UserAvatar letter="L" />
      )} */}
    </aside>
  );
}

export default memo(Sidebar);
