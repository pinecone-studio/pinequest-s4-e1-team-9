'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAdminCompanies } from '@/features/admin/hooks/useAdminCompanies';
import { cn } from '@/shared/lib/utils';
import AdminCompaniesPanel from './AdminCompaniesPanel';
import AdminDocumentPanel from './AdminDocumentPanel';
import AdminGate from './AdminGate';

type AdminTab = 'pdf' | 'company';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('pdf');
  const companiesState = useAdminCompanies();
  const selectedCompany = companiesState.companies.find(
    (company) => company.id === companiesState.selectedCompanyId,
  );

  useEffect(() => {
    void companiesState.fetchCompanies();
  }, [companiesState.fetchCompanies]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Admin Dashboard
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Manage your companies and documents.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Company
          </label>
          {companiesState.companies.length > 0 ? (
            <select
              value={companiesState.selectedCompanyId ?? ''}
              onChange={(event) =>
                companiesState.setSelectedCompanyId(event.target.value || null)
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            >
              {companiesState.companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} ({company.role})
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              Create a company before managing documents.
            </div>
          )}
        </div>

        <div className="mb-8 flex justify-center space-x-4">
          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={cn(
              'rounded-full px-6 py-2 text-sm font-medium transition-all',
              activeTab === 'pdf'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-100',
            )}
          >
            PDF Extractor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('company')}
            className={cn(
              'rounded-full px-6 py-2 text-sm font-medium transition-all',
              activeTab === 'company'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-100',
            )}
          >
            Company Management
          </button>
        </div>

        {activeTab === 'pdf' ? (
          selectedCompany ? (
            <AdminGate companyId={selectedCompany.id}>
              <AdminDocumentPanel company={selectedCompany} />
            </AdminGate>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-600 shadow-xl">
              Create a company first.
            </div>
          )
        ) : (
          <AdminCompaniesPanel companiesState={companiesState} />
        )}
      </div>
    </main>
  );
}
