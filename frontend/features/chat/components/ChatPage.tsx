'use client';

import AuthGate from '@/features/auth/AuthGate';
import ChatArea from '@/features/chat/components/ChatArea';
import EmptyState from '@/features/chat/components/EmptyState';
import HeaderActions from '@/features/chat/components/HeaderActions';
import Sidebar from '@/features/chat/components/Sidebar';
import { useChat } from '@/features/chat/hooks/useChat';

export default function ChatPage() {
  return (
    <AuthGate>
      <ChatWorkspace />
    </AuthGate>
  );
}

function ChatWorkspace() {
  const {
    messages,
    hasMessages,
    isBusy,
    busyLabel,
    composerRef,
    conversations,
    activeId,
    handleNewChat,
    handleSelectConversation,
    handleDeleteConversation,
    handleEditMessage,
    sendMessage,
  } = useChat();

  return (
    <div className="flex h-screen overflow-hidden relative bg-background text-foreground">
      <Sidebar
        onNewChat={handleNewChat}
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <HeaderActions />

        {hasMessages ? (
          <ChatArea
            messages={messages}
            loading={isBusy}
            loadingLabel={busyLabel}
            onSend={sendMessage}
            onEdit={handleEditMessage}
            composerRef={composerRef}
            disabled={isBusy}
          />
        ) : (
          <EmptyState
            onSend={sendMessage}
            composerRef={composerRef}
            disabled={isBusy}
          />
        )}
      </main>
    </div>
  );
}
