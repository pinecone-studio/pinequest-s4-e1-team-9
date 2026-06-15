import { Suspense } from 'react';
import AiManagementPage from '@/features/ai-management/components/AiManagementPage';

export default async function DashboardAiPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
          Loading AI management...
        </div>
      }
    >
      <AiManagementPage companyId={companyId} />
    </Suspense>
  );
}
