'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import type { useAdminCompanies } from '@/features/admin/hooks/useAdminCompanies';

type AdminCompaniesState = ReturnType<typeof useAdminCompanies>;

export default function AdminCompaniesPanel({
  companiesState,
}: {
  companiesState: AdminCompaniesState;
}) {
  const {
    companyName,
    setCompanyName,
    companyDomain,
    setCompanyDomain,
    companies,
    companyLoading,
    companyError,
    fetchCompanies,
    createCompany,
  } = companiesState;

  useEffect(() => {
    void fetchCompanies();
  }, [fetchCompanies]);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-2xl font-bold text-black">
          Create New Company
        </h2>
        <form onSubmit={createCompany} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-black">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-black focus:border-blue-500 focus:ring-blue-500"
              placeholder="Acme Corp"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-black">
              Domain (optional)
            </label>
            <input
              type="text"
              value={companyDomain}
              onChange={(event) => setCompanyDomain(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
              placeholder="acme.com"
            />
          </div>
          <button
            type="submit"
            disabled={companyLoading}
            className="w-full rounded-md bg-blue-600 py-2 font-medium text-white shadow-md transition-colors hover:bg-blue-700 disabled:bg-gray-400"
          >
            {companyLoading ? 'Creating...' : 'Create Company'}
          </button>
        </form>
        {companyError && (
          <div className="mt-4 flex items-center rounded bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mr-2 h-4 w-4" />
            {companyError}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          Existing Companies
        </h2>
        <div className="divide-y divide-gray-100">
          {companies.length > 0 ? (
            companies.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between py-4"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {company.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {company.domain || 'No domain'} · {company.role} · Code: <span className="font-mono font-bold text-blue-600">{company.invitationCode}</span>
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  Added {new Date(company.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-gray-500">
              No companies created yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
