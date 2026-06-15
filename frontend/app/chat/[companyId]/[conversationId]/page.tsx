import ChatPage from '@/features/chat/components/ChatPage';

function normalizeNotice(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CompanyConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string; conversationId: string }>;
  searchParams?: Promise<{ notice?: string | string[] }>;
}) {
  const { companyId, conversationId } = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <ChatPage
      companyId={companyId}
      conversationId={conversationId}
      initialNotice={normalizeNotice(resolvedSearchParams?.notice)}
    />
  );
}
