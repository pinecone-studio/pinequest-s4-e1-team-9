'use client';

import {
  Building2,
  Mail,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  EmptyState,
  ProductLogo,
  StatusPill,
} from '@/shared/ui/product';

interface NoCompanyProps {
  onCreateCompany?: () => void;
  onContactAdmin?: () => void;
}

export default function NoCompany({
  onCreateCompany,
  onContactAdmin,
}: NoCompanyProps) {
  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col">
        <header className="flex h-16 items-center justify-between">
          <ProductLogo />
          <StatusPill tone="success">
            <ShieldCheck className="mr-1 size-3.5" aria-hidden="true" />
            Private access
          </StatusPill>
        </header>
        <main className="grid flex-1 place-items-center">
          <EmptyState
            icon={Building2}
            title="You are not connected to an AI yet"
            description="Create a new document AI if you are setting this up, or ask an Owner for an invitation code."
            actions={
              <>
                <Button type="button" onClick={onCreateCompany}>
                  <Plus className="size-4" aria-hidden="true" />
                  Create AI
                </Button>
                <Button type="button" variant="outline" onClick={onContactAdmin}>
                  <Mail className="size-4" aria-hidden="true" />
                  Contact Owner
                </Button>
              </>
            }
            className="w-full max-w-2xl"
          />
        </main>
      </div>
    </div>
  );
}
