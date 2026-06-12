'use client';

import { useCallback, useState } from 'react';
import {
  createCompany as createCompanyRequest,
  listCompanies,
} from '@/features/admin/api';
import type { Company } from '@/features/admin/types';

export function useAdminCompanies() {
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  );
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    try {
      const data = await listCompanies();
      setCompanies(data);
      setSelectedCompanyId((current) => current ?? data[0]?.id ?? null);
      setCompanyError(null);
      return data;
    } catch (error) {
      console.error('Failed to fetch companies', error);
      setCompanyError(
        error instanceof Error ? error.message : 'Failed to fetch companies.',
      );
      return [];
    }
  }, []);

  const createCompany = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCompanyLoading(true);
    setCompanyError(null);

    try {
      const company = await createCompanyRequest({
        name: companyName,
        domain: companyDomain,
      });
      setCompanyName('');
      setCompanyDomain('');
      setSelectedCompanyId(company.id);
      await fetchCompanies();
    } catch (error) {
      setCompanyError(
        error instanceof Error ? error.message : 'An error occurred.',
      );
    } finally {
      setCompanyLoading(false);
    }
  };

  return {
    companyName,
    setCompanyName,
    companyDomain,
    setCompanyDomain,
    companies,
    selectedCompanyId,
    setSelectedCompanyId,
    companyLoading,
    companyError,
    fetchCompanies,
    createCompany,
  };
}
