import type { AiSetupStatus, Company } from '@/features/companies/types';

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'No activity yet';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatFileSize(value: string | number | null | undefined) {
  const bytes = Number(value ?? 0);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return 'Size unknown';
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function getUseCaseLabel(value: string | undefined) {
  const labels: Record<string, string> = {
    company_team: 'Company or Team',
    education: 'Education',
    customer_support: 'Customer Support',
    personal_knowledge: 'Personal Knowledge',
    custom: 'Custom',
  };

  return labels[value ?? 'custom'] ?? 'Custom';
}

export function statusLabel(status: AiSetupStatus | string | undefined) {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    PROCESSING: 'Processing',
    READY: 'Ready',
    NEEDS_ATTENTION: 'Needs attention',
    FAILED: 'Failed',
    ARCHIVED: 'Archived',
  };

  return labels[status ?? 'READY'] ?? 'Ready';
}

export function statusTone(status: AiSetupStatus | string | undefined) {
  const normalized = status ?? 'READY';

  if (normalized === 'READY') return 'success';
  if (normalized === 'PROCESSING') return 'info';
  if (normalized === 'NEEDS_ATTENTION' || normalized === 'DRAFT') {
    return 'warning';
  }
  if (normalized === 'FAILED' || normalized === 'ARCHIVED') return 'error';

  return 'neutral';
}

export function documentStatusLabel(status: string | undefined) {
  const labels: Record<string, string> = {
    queued: 'Queued',
    uploading: 'Uploading',
    processing: 'Processing',
    ready: 'Ready',
    error: 'Failed',
    failed: 'Failed',
  };

  return labels[status ?? 'processing'] ?? statusLabel(status);
}

export function documentStatusTone(status: string | undefined) {
  if (status === 'ready') return 'success';
  if (status === 'error' || status === 'failed') return 'error';
  if (status === 'queued') return 'warning';
  return 'info';
}

export function roleLabel(company: Pick<Company, 'role'>) {
  return company.role === 'OWNER' ? 'Owner' : 'Member';
}

export function isAdminRole(company: Pick<Company, 'role'>) {
  return company.role === 'OWNER';
}
