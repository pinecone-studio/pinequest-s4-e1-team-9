'use client';

import { useCallback, useState } from 'react';
import {
  createCompany as createCompanyRequest,
  listCompanies,
} from '@/features/admin/api';
import { joinCompanyByCode } from '@/features/companies/api';
import type { Company } from '@/features/admin/types';

export function useAdminCompanies() {
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  );
  const [isFetchingCompanies, setIsFetchingCompanies] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    setIsFetchingCompanies(true);

    try {
      const data = await listCompanies();
      setCompanies(data);
      setSelectedCompanyId((current) =>
        data.some((company) => company.id === current)
          ? current
          : (data[0]?.id ?? null),
      );
      setCompanyError(null);
      return data;
    } catch (error) {
      console.error('Failed to fetch companies', error);
      setCompanyError(
        error instanceof Error ? error.message : 'Failed to fetch companies.',
      );
      return [];
    } finally {
      setIsFetchingCompanies(false);
    }
  }, []);

  const createCompany = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCompanyLoading(true);
    setCompanyError(null);

    try {
      const company = await createCompanyRequest({
        name: companyName.trim(),
        domain: companyDomain.trim(),
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

  const joinCompany = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setJoinLoading(true);
    setJoinError(null);

    try {
      await joinCompanyByCode(joinCode);
      setJoinCode('');
      await fetchCompanies();
    } catch (error) {
      setJoinError(
        error instanceof Error ? error.message : 'Failed to join workspace.',
      );
    } finally {
      setJoinLoading(false);
    }
  };

  return {
    companyName,
    setCompanyName,
    companyDomain,
    setCompanyDomain,
    joinCode,
    setJoinCode,
    companies,
    selectedCompanyId,
    setSelectedCompanyId,
    isFetchingCompanies,
    companyLoading,
    joinLoading,
    companyError,
    joinError,
    fetchCompanies,
    createCompany,
    joinCompany,
  };
}
