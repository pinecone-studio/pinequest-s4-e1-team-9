'use client';

import { useEffect, useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { getCompanyAccess } from '@/features/admin/api';
import type { CompanyAccess } from '@/features/admin/types';

export default function AdminGate({
  companyId,
  children,
}: {
  companyId: string;
  children: React.ReactNode;
}) {
  const [access, setAccess] = useState<CompanyAccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);
    setAccess(null);

    getCompanyAccess(companyId)
      .then((nextAccess) => {
        if (!active) return;
        setAccess(nextAccess);
      })
      .catch((accessError) => {
        if (!active) return;
        setError(
          accessError instanceof Error
            ? accessError.message
            : 'Failed to check workspace access.',
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 text-gray-600 shadow-xl">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Checking workspace access...
      </div>
    );
  }

  if (!access?.permissions.canManageCompany) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-900 shadow-xl">
        <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-red-500" />
        <h1 className="text-xl font-bold">AI Owner access required</h1>
        <p className="mt-2 text-sm text-gray-600">
          {error ||
            'Your signed-in account is a Member for this workspace.'}
        </p>
      </section>
    );
  }

  return children;
}
