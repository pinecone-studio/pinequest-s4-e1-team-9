import { Suspense } from 'react';
import AiCreateWizard from '@/features/ai-setup/AiCreateWizard';

export default function CreateAiPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
          Preparing setup...
        </div>
      }
    >
      <AiCreateWizard />
    </Suspense>
  );
}
