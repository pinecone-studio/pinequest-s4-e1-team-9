import UploadDocumentPanel from '@/features/documents/components/UploadDocumentPanel';
import { ProductLogo } from '@/shared/ui/product';

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl flex-col">
        <header className="flex h-16 items-center">
          <ProductLogo />
        </header>
        <main className="grid flex-1 place-items-center">
          <UploadDocumentPanel />
        </main>
      </div>
    </div>
  );
}
