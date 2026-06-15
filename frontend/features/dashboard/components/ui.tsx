import type React from 'react';
import type { AiSetupStatus } from '@/features/companies/types';
import {
  PageHeader,
  ProfileMenu,
  StatusPill,
} from '@/shared/ui/product';
import {
  statusLabel,
  statusTone,
} from './presentation';

export {
  documentStatusLabel,
  documentStatusTone,
  formatDate,
  formatFileSize,
  isAdminRole,
  roleLabel,
  statusLabel,
  statusTone,
  getUseCaseLabel,
} from './presentation';

export function StatusBadge({
  status,
  className,
}: {
  status: AiSetupStatus | string | undefined;
  className?: string;
}) {
  return (
    <StatusPill tone={statusTone(status)} className={className}>
      {statusLabel(status)}
    </StatusPill>
  );
}

export function ProductHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <PageHeader
      eyebrow="Dashboard"
      title={title}
      description={description}
      actions={
        <>
          {actions}
          <ProfileMenu />
        </>
      }
    />
  );
}

export { ProfileMenu };
