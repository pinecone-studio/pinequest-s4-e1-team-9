'use client';

import { useEffect, useState } from 'react';
import AuthGate from '@/features/auth/AuthGate';
import ChatArea from '@/features/chat/components/ChatArea';
import EmptyState from '@/features/chat/components/EmptyState';
import HeaderActions from '@/features/chat/components/HeaderActions';
import Sidebar from '@/features/chat/components/Sidebar';
import { useChat } from '@/features/chat/hooks/useChat';
import JoinCompany from '@/features/companies/components/JoinCompany';
import { getAuthHeaders } from '@/features/auth/supabase';

export default function ChatPage() {
  return (
    <AuthGate>
      <MembershipGate>
        <ChatWorkspace />
      </MembershipGate>
    </AuthGate>
  );
}

function MembershipGate({ children }: { children: React.ReactNode }) {
  const [hasMembership, setHasMembership] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkMembership() {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/companies', { headers });
      const companies = await response.json();
      setHasMembership(Array.isArray(companies) && companies.length > 0);
    }
    checkMembership();
  }, []);

  if (hasMembership === null) {
    return <div className="grid h-screen place-items-center">Loading...</div>;
  }

  if (!hasMembership) {
    return (
      <div className="grid h-screen place-items-center bg-gray-50">
        <JoinCompany />
      </div>
    );
  }

  return <>{children}</>;
}

function ChatWorkspace() {
  const {
    messages,
    hasMessages,
    isBusy,
    busyLabel,
    isHistoryLoading,
    isConversationLoading,
    errorMessage,
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
        loading={isHistoryLoading}
        error={errorMessage}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <HeaderActions />
        {errorMessage && (
          <div className="mx-auto mt-3 w-full max-w-[720px] px-6">
            <p className="m-0 border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          </div>
        )}

        {hasMessages || isConversationLoading ? (
          <ChatArea
            messages={messages}
            loading={isBusy}
            loadingLabel={isConversationLoading ? 'Loading chat...' : busyLabel}
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
