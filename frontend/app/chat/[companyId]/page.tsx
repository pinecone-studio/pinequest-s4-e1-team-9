import ChatPage from '@/features/chat/components/ChatPage';

function normalizeNotice(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CompanyChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams?: Promise<{ notice?: string | string[] }>;
}) {
  const { companyId } = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <ChatPage
      companyId={companyId}
      initialNotice={normalizeNotice(resolvedSearchParams?.notice)}
    />
  );
}
