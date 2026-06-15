import { Suspense } from 'react';
import AiCreateCompletion from '@/features/ai-setup/AiCreateCompletion';

export default function CreateAiCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
          Loading completion...
        </div>
      }
    >
      <AiCreateCompletion />
    </Suspense>
  );
}
