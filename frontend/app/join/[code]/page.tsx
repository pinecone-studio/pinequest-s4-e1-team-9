import JoinAiPage from '@/features/invitations/components/JoinAiPage';

export default async function JoinCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <JoinAiPage code={code} />;
}
