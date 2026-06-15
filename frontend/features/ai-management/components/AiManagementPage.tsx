'use client';

import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  CalendarDays,
  Check,
  Clock,
  Copy,
  ExternalLink,
  FilePlus2,
  FileText,
  Link2,
  Loader2,
  MapPin,
  MessageSquareText,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import AuthGate from '@/features/auth/AuthGate';
import {
  archiveCompany,
  deleteAdminDocument,
  getCompanyAccess,
  listAdminDocuments,
  listCompanyMembers,
  removeCompanyMember,
  updateAiSetup,
  uploadAdminDocument,
} from '@/features/admin/api';
import type {
  AiDocument,
  CompanyAccess,
  CompanyMemberRecord,
} from '@/features/admin/types';
import { getDocumentPdfSignedUrl } from '@/features/documents/api';
import {
  createInvite,
  getActiveInvite,
  revokeInvite,
  type ActiveInviteResponse,
  type CreatedInviteResponse,
} from '@/features/invitations/api';
import {
  cancelAiEvent,
  createAiEvent,
  deleteAiEvent,
  listAiEvents,
  updateAiEvent,
  type AiEvent,
  type EventInput,
} from '@/features/events/api';
import { cn } from '@/shared/lib/utils';
import { Button, buttonVariants } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Alert,
  AppShell,
  EmptyState,
  FormField,
  LoadingState,
  PageHeader,
  SectionHeader,
  Select,
  StatCard,
  StatusPill,
  Surface,
  TabList,
  Textarea,
} from '@/shared/ui/product';
import {
  documentStatusLabel,
  documentStatusTone,
  formatDate,
  formatFileSize,
  isAdminRole,
  roleLabel,
  StatusBadge,
  getUseCaseLabel,
} from '@/features/dashboard/components/ui';

type ManagementTab =
  | 'overview'
  | 'documents'
  | 'events'
  | 'members'
  | 'invitations'
  | 'settings';

const tabs: { id: ManagementTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: ShieldCheck },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'invitations', label: 'Invitations', icon: UserPlus },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function shortMemberLabel(member: CompanyMemberRecord, index: number) {
  return member.name || `Member ${index + 1}`;
}

function DocumentStatus({ status }: { status: string | undefined }) {
  return (
    <StatusPill tone={documentStatusTone(status)}>
      {documentStatusLabel(status)}
    </StatusPill>
  );
}

const timezoneChoices = [
  'Asia/Ulaanbaatar',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Singapore',
];

type EventFormState = {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  timezone: string;
  location: string;
  meetingUrl: string;
  status: 'scheduled' | 'cancelled';
};

function getDefaultTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ulaanbaatar';
}

function datePartsInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '00';

  return {
    year: Number(value('year')),
    month: Number(value('month')),
    day: Number(value('day')),
    hour: Number(value('hour')),
    minute: Number(value('minute')),
    second: Number(value('second')),
  };
}

function timezoneOffsetMs(timezone: string, date: Date) {
  const parts = datePartsInTimezone(date, timezone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return asUtc - date.getTime();
}

function zonedDateTimeToUtc(date: string, time: string, timezone: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  if (![year, month, day, hour, minute].every(Number.isFinite)) {
    return null;
  }

  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const firstPass = new Date(
    localAsUtc - timezoneOffsetMs(timezone, new Date(localAsUtc)),
  );
  const secondPass = new Date(
    localAsUtc - timezoneOffsetMs(timezone, firstPass),
  );

  return secondPass;
}

function toDateInputParts(isoValue: string | null, timezone: string) {
  const date = isoValue ? new Date(isoValue) : new Date(Date.now() + 60 * 60 * 1000);
  const parts = datePartsInTimezone(date, timezone);

  return {
    date: `${parts.year.toString().padStart(4, '0')}-${parts.month
      .toString()
      .padStart(2, '0')}-${parts.day.toString().padStart(2, '0')}`,
    time: `${parts.hour.toString().padStart(2, '0')}:${parts.minute
      .toString()
      .padStart(2, '0')}`,
  };
}

function formatEventDateTime(event: AiEvent) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    timeZone: event.timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const start = formatter.format(new Date(event.startsAt));
  const end = event.endsAt ? formatter.format(new Date(event.endsAt)) : null;

  return end ? `${start} to ${end}` : start;
}

function createBlankEventForm(): EventFormState {
  const timezone = getDefaultTimezone();
  const start = toDateInputParts(null, timezone);

  return {
    title: '',
    description: '',
    startDate: start.date,
    startTime: start.time,
    endDate: '',
    endTime: '',
    timezone,
    location: '',
    meetingUrl: '',
    status: 'scheduled',
  };
}

function formFromEvent(event: AiEvent): EventFormState {
  const start = toDateInputParts(event.startsAt, event.timezone);
  const end = event.endsAt
    ? toDateInputParts(event.endsAt, event.timezone)
    : { date: '', time: '' };

  return {
    title: event.title,
    description: event.description ?? '',
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    timezone: event.timezone,
    location: event.location ?? '',
    meetingUrl: event.meetingUrl ?? '',
    status: event.status,
  };
}

function inputFromForm(form: EventFormState): EventInput {
  const title = form.title.replace(/\s+/g, ' ').trim();

  if (!title) {
    throw new Error('Title is required.');
  }

  if (!form.startDate || !form.startTime) {
    throw new Error('Start date and time are required.');
  }

  const startsAt = zonedDateTimeToUtc(
    form.startDate,
    form.startTime,
    form.timezone,
  );

  if (!startsAt) {
    throw new Error('Start date and time are invalid.');
  }

  const hasEnd = Boolean(form.endDate || form.endTime);
  const endsAt = hasEnd
    ? zonedDateTimeToUtc(
        form.endDate || form.startDate,
        form.endTime || form.startTime,
        form.timezone,
      )
    : null;

  if (hasEnd && !endsAt) {
    throw new Error('End date and time are invalid.');
  }

  if (endsAt && endsAt.getTime() < startsAt.getTime()) {
    throw new Error('End time must be after the start time.');
  }

  return {
    title,
    description: form.description.trim() || null,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt?.toISOString() ?? null,
    timezone: form.timezone,
    location: form.location.trim() || null,
    meetingUrl: form.meetingUrl.trim() || null,
    status: form.status,
  };
}

function EventRow({
  event,
  onEdit,
  onCancel,
  onRestore,
  onDelete,
  working,
}: {
  event: AiEvent;
  onEdit: (event: AiEvent) => void;
  onCancel: (event: AiEvent) => void;
  onRestore: (event: AiEvent) => void;
  onDelete: (event: AiEvent) => void;
  working: boolean;
}) {
  const cancelled = event.status === 'cancelled';

  return (
    <div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium">{event.title}</p>
          <StatusPill tone={cancelled ? 'warning' : 'success'}>
            {cancelled ? 'Cancelled' : 'Scheduled'}
          </StatusPill>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {formatEventDateTime(event)}
          </span>
          <span>{event.timezone}</span>
          {event.location && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{event.location}</span>
            </span>
          )}
          {event.meetingUrl && (
            <a
              href={event.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 items-center gap-1 hover:text-foreground"
            >
              <Link2 className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">Meeting link</span>
            </a>
          )}
        </div>
        {event.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {event.description}
          </p>
        )}
        {event.creatorName && (
          <p className="mt-2 text-xs text-muted-foreground">
            Created by {event.creatorName}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={() => onEdit(event)}>
          Edit
        </Button>
        {cancelled ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => onRestore(event)}
            disabled={working}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Restore
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => onCancel(event)}
            disabled={working}
          >
            Cancel
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => onDelete(event)}
          disabled={working}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Delete
        </Button>
      </div>
    </div>
  );
}

function OverviewTab({
  access,
  documents,
  members,
}: {
  access: CompanyAccess;
  documents: AiDocument[];
  members: CompanyMemberRecord[];
}) {
  const readyCount = documents.filter((document) => document.status === 'ready').length;
  const failedCount = documents.filter((document) => document.status === 'error').length;
  const checklist = [
    {
      label: 'Behavior configured',
      done: Boolean(access.company.aiConfiguration?.purpose),
    },
    { label: 'At least one ready PDF', done: readyCount > 0 },
    { label: 'No failed documents', done: failedCount === 0 },
    { label: 'Private access configured', done: access.company.role === 'OWNER' },
  ];

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Use case" value={getUseCaseLabel(access.company.useCaseType)} />
        <StatCard label="Documents" value={`${readyCount}/${documents.length}`} description="Ready PDFs" />
        <StatCard label="Members" value={members.length || access.company.memberCount || 1} />
        <StatCard label="Updated" value={formatDate(access.company.updatedAt)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Surface className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">{access.company.name}</h2>
            <StatusBadge status={access.company.setupStatus} />
            <StatusPill>{roleLabel(access.company)}</StatusPill>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            {access.company.description ||
              access.company.aiConfiguration?.description ||
              'This AI is configured with saved behavior and uploaded knowledge.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`/chat/${access.company.id}`} className={buttonVariants()}>
              <MessageSquareText className="size-4" aria-hidden="true" />
              Open Chat
            </Link>
            <Link
              href={`/ai/${access.company.id}/documents?tab=documents`}
              className={buttonVariants({ variant: 'outline' })}
            >
              <FilePlus2 className="size-4" aria-hidden="true" />
              Add PDFs
            </Link>
          </div>
        </Surface>

        <Surface className="overflow-hidden">
          <SectionHeader title="Setup checklist" description="Readiness uses real configuration and document state." />
          <div className="grid gap-2 p-4">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full border',
                    item.done
                      ? 'border-[color-mix(in_srgb,var(--success)_38%,var(--border))] bg-[var(--success-soft)] text-[var(--success)]'
                      : 'border-[color-mix(in_srgb,var(--warning)_42%,var(--border))] bg-[var(--warning-soft)] text-[var(--warning)]',
                  )}
                >
                  {item.done ? <Check className="size-3" aria-hidden="true" /> : '!'}
                </span>
                {item.label}
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}

function KnowledgeTab({
  companyId,
  documents,
  onRefresh,
}: {
  companyId: string;
  documents: AiDocument[];
  onRefresh: () => Promise<void>;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const addFiles = (fileList: FileList | File[] | null) => {
    if (!fileList) return;
    setUploadError(null);
    const accepted: File[] = [];
    const errors: string[] = [];
    const signatures = new Set([
      ...files.map((file) => `${file.name}:${file.size}`),
      ...documents.map((document) => `${document.filename}:${document.fileSize ?? ''}`),
    ]);

    for (const file of Array.from(fileList)) {
      const isPdf =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const signature = `${file.name}:${file.size}`;

      if (!isPdf) {
        errors.push(`${file.name} is not a PDF.`);
        continue;
      }

      if (signatures.has(signature)) {
        errors.push(`${file.name} is already selected or uploaded.`);
        continue;
      }

      signatures.add(signature);
      accepted.push(file);
    }

    if (errors.length) setUploadError(errors.join(' '));
    setFiles((current) => [...current, ...accepted]);
  };

  const uploadFiles = async () => {
    if (!files.length) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      for (const file of files) {
        await uploadAdminDocument(file, companyId);
      }
      setFiles([]);
      await onRefresh();
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'Failed to upload documents.',
      );
      await onRefresh();
    } finally {
      setIsUploading(false);
    }
  };

  const openPdf = async (documentId: string) => {
    setActionError(null);
    try {
      const result = await getDocumentPdfSignedUrl(documentId);
      if (result.signedUrl) {
        window.open(result.signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Failed to open PDF.',
      );
    }
  };

  const removeDocument = async (documentId: string) => {
    setActionError(null);
    try {
      await deleteAdminDocument(companyId, documentId);
      await onRefresh();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Failed to remove document.',
      );
    }
  };

  return (
    <div className="grid gap-4">
      <Surface className="overflow-hidden">
        <SectionHeader
          title="Add knowledge"
          description="Upload PDFs the AI should use as its source of truth."
          actions={
            <Button type="button" onClick={uploadFiles} disabled={isUploading || files.length === 0}>
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="size-4" aria-hidden="true" />
              )}
              {isUploading ? 'Uploading...' : 'Upload selected'}
            </Button>
          }
        />
        <div className="grid gap-4 p-4">
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              addFiles(Array.from(event.dataTransfer.files));
            }}
            className={cn(
              'flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors',
              isDragging
                ? 'border-[color-mix(in_srgb,var(--accent)_58%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)]'
                : 'border-border bg-[var(--surface-2)] hover:bg-[var(--surface-3)]',
            )}
          >
            <Upload className="size-7 text-muted-foreground" aria-hidden="true" />
            <span className="mt-3 text-sm font-medium">Drag PDFs here or choose files</span>
            <span className="mt-1 text-xs text-muted-foreground">
              PDF only. Selected files stay queued until you upload.
            </span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="sr-only"
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = '';
              }}
            />
          </label>

          {files.length > 0 && (
            <div className="rounded-lg border border-border">
              <div className="border-b border-border px-3 py-2 text-sm font-medium">
                Upload queue
              </div>
              <div className="divide-y divide-border">
                {files.map((file) => (
                  <div key={`${file.name}-${file.size}`} className="grid gap-2 p-3 sm:grid-cols-[1fr_auto]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <StatusPill tone="warning">Queued</StatusPill>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`Remove ${file.name}`}
                      onClick={() =>
                        setFiles((current) =>
                          current.filter((candidate) => candidate !== file),
                        )
                      }
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadError && <Alert variant="error">{uploadError}</Alert>}
        </div>
      </Surface>

      {actionError && <Alert variant="error">{actionError}</Alert>}

      <Surface className="overflow-hidden">
        <SectionHeader
          title="Document library"
          description="Review processing state and remove documents that should not be used."
        />
        <div className="divide-y divide-border">
          {documents.length > 0 ? (
            documents.map((document) => (
              <div key={document.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{document.filename}</p>
                    <DocumentStatus status={document.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatFileSize(document.fileSize)} · Uploaded {formatDate(document.createdAt)}
                  </p>
                  {document.errorMessage && (
                    <p className="mt-1 text-xs text-destructive">
                      {document.errorMessage}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void openPdf(document.id)}
                    disabled={!document.id}
                  >
                    <ExternalLink className="size-4" aria-hidden="true" />
                    Open PDF
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void removeDocument(document.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Remove
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4">
              <EmptyState
                icon={FileText}
                title="No documents uploaded"
                description="Upload at least one PDF so the AI can answer from trusted sources."
              />
            </div>
          )}
        </div>
      </Surface>
    </div>
  );
}

function EventsTab({
  companyId,
  events,
  onRefresh,
}: {
  companyId: string;
  events: AiEvent[];
  onRefresh: () => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AiEvent | null>(null);
  const [form, setForm] = useState<EventFormState>(() => createBlankEventForm());
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [workingEventId, setWorkingEventId] = useState<string | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
  }, [events]);

  const scheduled = events.filter((event) => event.status === 'scheduled');
  const cancelled = events.filter((event) => event.status === 'cancelled');
  const upcoming = scheduled.filter(
    (event) => new Date(event.startsAt).getTime() >= now,
  );
  const past = scheduled.filter(
    (event) => new Date(event.startsAt).getTime() < now,
  );

  const openCreate = () => {
    setEditingEvent(null);
    setForm(createBlankEventForm());
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (event: AiEvent) => {
    setEditingEvent(event);
    setForm(formFromEvent(event));
    setError(null);
    setDialogOpen(true);
  };

  const patchForm = (patch: Partial<EventFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
    setError(null);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const input = inputFromForm(form);
      if (editingEvent) {
        await updateAiEvent(companyId, editingEvent.id, input);
      } else {
        await createAiEvent(companyId, input);
      }
      setDialogOpen(false);
      await onRefresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Failed to save event.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const cancel = async (event: AiEvent) => {
    if (!window.confirm(`Cancel ${event.title}? Members will see it as cancelled.`)) {
      return;
    }

    setWorkingEventId(event.id);
    setError(null);

    try {
      await cancelAiEvent(companyId, event.id);
      await onRefresh();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : 'Failed to cancel event.',
      );
    } finally {
      setWorkingEventId(null);
    }
  };

  const restore = async (event: AiEvent) => {
    setWorkingEventId(event.id);
    setError(null);

    try {
      await updateAiEvent(companyId, event.id, { status: 'scheduled' });
      await onRefresh();
    } catch (restoreError) {
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : 'Failed to restore event.',
      );
    } finally {
      setWorkingEventId(null);
    }
  };

  const remove = async (event: AiEvent) => {
    if (!window.confirm(`Delete ${event.title}? This cannot be undone.`)) {
      return;
    }

    setWorkingEventId(event.id);
    setError(null);

    try {
      await deleteAiEvent(companyId, event.id);
      await onRefresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete event.',
      );
    } finally {
      setWorkingEventId(null);
    }
  };

  const renderGroup = (
    title: string,
    description: string,
    groupEvents: AiEvent[],
  ) => (
    <Surface className="overflow-hidden">
      <SectionHeader title={title} description={description} />
      <div className="divide-y divide-border">
        {groupEvents.length ? (
          groupEvents.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              onEdit={openEdit}
              onCancel={cancel}
              onRestore={restore}
              onDelete={remove}
              working={workingEventId === event.id}
            />
          ))
        ) : (
          <div className="p-4">
            <EmptyState
              icon={CalendarDays}
              title={`No ${title.toLowerCase()}`}
              description="Events created here become available to members and chat answers."
            />
          </div>
        )}
      </div>
    </Surface>
  );

  return (
    <div className="grid gap-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex justify-end">
        <Button type="button" onClick={openCreate}>
          <CalendarDays className="size-4" aria-hidden="true" />
          Create event
        </Button>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events yet"
          description="Create deadlines, sessions, meetings, or important dates for this AI."
          actions={
            <Button type="button" onClick={openCreate}>
              Create event
            </Button>
          }
        />
      ) : (
        <>
          {renderGroup(
            'Upcoming events',
            'Scheduled events that have not started yet.',
            upcoming,
          )}
          {renderGroup(
            'Past events',
            'Scheduled events whose start time has passed.',
            past,
          )}
          {renderGroup(
            'Cancelled events',
            'Events retained for clarity but marked cancelled.',
            cancelled,
          )}
        </>
      )}

      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-background/80 px-4 py-6 backdrop-blur"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-dialog-title"
          onKeyDown={(dialogEvent) => {
            if (dialogEvent.key === 'Escape') {
              setDialogOpen(false);
            }
          }}
        >
          <Surface className="max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 id="event-dialog-title" className="text-lg font-semibold">
                  {editingEvent ? 'Edit event' : 'Create event'}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Dates are saved as UTC with the selected timezone preserved.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close event form"
                onClick={() => setDialogOpen(false)}
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>

            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            <form className="grid gap-4" onSubmit={save}>
              <FormField id="event-title" label="Title">
                <Input
                  id="event-title"
                  value={form.title}
                  maxLength={140}
                  onChange={(event) => patchForm({ title: event.target.value })}
                  required
                />
              </FormField>

              <FormField id="event-description" label="Description">
                <Textarea
                  id="event-description"
                  value={form.description}
                  onChange={(event) =>
                    patchForm({ description: event.target.value })
                  }
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="event-start-date" label="Start date">
                  <Input
                    id="event-start-date"
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      patchForm({ startDate: event.target.value })
                    }
                    required
                  />
                </FormField>
                <FormField id="event-start-time" label="Start time">
                  <Input
                    id="event-start-time"
                    type="time"
                    value={form.startTime}
                    onChange={(event) =>
                      patchForm({ startTime: event.target.value })
                    }
                    required
                  />
                </FormField>
                <FormField id="event-end-date" label="End date">
                  <Input
                    id="event-end-date"
                    type="date"
                    value={form.endDate}
                    onChange={(event) =>
                      patchForm({ endDate: event.target.value })
                    }
                  />
                </FormField>
                <FormField id="event-end-time" label="End time">
                  <Input
                    id="event-end-time"
                    type="time"
                    value={form.endTime}
                    onChange={(event) =>
                      patchForm({ endTime: event.target.value })
                    }
                  />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="event-timezone" label="Timezone">
                  <Select
                    id="event-timezone"
                    value={form.timezone}
                    onChange={(event) =>
                      patchForm({ timezone: event.target.value })
                    }
                    required
                  >
                    {[form.timezone, ...timezoneChoices]
                      .filter((value, index, values) => values.indexOf(value) === index)
                      .map((timezone) => (
                        <option key={timezone} value={timezone}>
                          {timezone}
                        </option>
                      ))}
                  </Select>
                </FormField>
                <FormField id="event-status" label="Status">
                  <Select
                    id="event-status"
                    value={form.status}
                    onChange={(event) =>
                      patchForm({
                        status: event.target.value as EventFormState['status'],
                      })
                    }
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="event-location" label="Location">
                  <Input
                    id="event-location"
                    value={form.location}
                    onChange={(event) =>
                      patchForm({ location: event.target.value })
                    }
                  />
                </FormField>
                <FormField id="event-meeting-url" label="Meeting link">
                  <Input
                    id="event-meeting-url"
                    type="url"
                    value={form.meetingUrl}
                    onChange={(event) =>
                      patchForm({ meetingUrl: event.target.value })
                    }
                  />
                </FormField>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="size-4" aria-hidden="true" />
                  )}
                  {isSaving ? 'Saving...' : 'Save event'}
                </Button>
              </div>
            </form>
          </Surface>
        </div>
      )}
    </div>
  );
}

function BehaviorTab({
  access,
  onSaved,
}: {
  access: CompanyAccess;
  onSaved: (access: CompanyAccess) => void;
}) {
  const router = useRouter();
  const [configuration, setConfiguration] = useState(
    access.company.aiConfiguration,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setConfiguration(access.company.aiConfiguration);
  }, [access.company.aiConfiguration]);

  if (!configuration) {
    return (
      <EmptyState
        icon={Settings}
        title="Behavior has not been configured yet"
        description="Continue setup from the dashboard to create the initial behavior configuration."
      />
    );
  }

  const saveBehavior = async () => {
    setIsSaving(true);
    setStatus(null);

    try {
      const company = await updateAiSetup(access.company.id, {
        name: configuration.aiName,
        description: configuration.description,
        useCaseType: configuration.useCaseType,
        aiConfiguration: configuration,
      });
      onSaved({ ...access, company: { ...access.company, ...company } });
      setStatus('Behavior saved for future chat responses.');
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Failed to save behavior.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const patchConfig = (patch: Partial<typeof configuration>) => {
    setConfiguration((current) => (current ? { ...current, ...patch } : current));
  };

  const archive = async () => {
    const confirmed = window.confirm(
      `Archive ${access.company.name}? Members will lose access immediately.`,
    );

    if (!confirmed) return;

    setIsArchiving(true);
    setStatus(null);

    try {
      await archiveCompany(access.company.id);
      router.replace('/chat');
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Failed to archive AI.',
      );
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid gap-4">
        <Surface className="grid gap-4 p-4">
          <SectionHeader
            title="Identity"
            description="How the AI introduces itself and frames its job."
          />
          <div className="grid gap-4 p-0 sm:grid-cols-2">
            <FormField id="aiName" label="AI name">
              <Input
                id="aiName"
                value={configuration.aiName}
                onChange={(event) => patchConfig({ aiName: event.target.value })}
              />
            </FormField>
            <FormField id="language" label="Default language">
              <Select
                id="language"
                value={configuration.language}
                onChange={(event) => patchConfig({ language: event.target.value })}
              >
                {['Auto', 'English', 'Mongolian', 'Spanish', 'French'].map((language) => (
                  <option key={language}>{language}</option>
                ))}
              </Select>
            </FormField>
          </div>
          <FormField id="description" label="Short description">
            <Textarea
              id="description"
              value={configuration.description}
              onChange={(event) => patchConfig({ description: event.target.value })}
            />
          </FormField>
          <FormField id="welcomeMessage" label="Welcome message">
            <Textarea
              id="welcomeMessage"
              value={configuration.welcomeMessage}
              onChange={(event) =>
                patchConfig({ welcomeMessage: event.target.value })
              }
            />
          </FormField>
        </Surface>

        <Surface className="grid gap-4 p-4">
          <SectionHeader
            title="Purpose and answer style"
            description="Guide who the AI serves, how much detail it gives, and what it does when sources are missing."
          />
          <FormField id="purpose" label="Purpose">
            <Textarea
              id="purpose"
              value={configuration.purpose}
              onChange={(event) => patchConfig({ purpose: event.target.value })}
            />
          </FormField>
          <FormField id="audience" label="Audience">
            <Input
              id="audience"
              value={configuration.audience}
              onChange={(event) => patchConfig({ audience: event.target.value })}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="tone" label="Tone">
              <Select
                id="tone"
                value={configuration.tone}
                onChange={(event) => patchConfig({ tone: event.target.value })}
              >
                {['Professional', 'Approachable', 'Conversational', 'Formal', 'Encouraging'].map((tone) => (
                  <option key={tone}>{tone}</option>
                ))}
              </Select>
            </FormField>
            <FormField id="responseLength" label="Answer length">
              <Select
                id="responseLength"
                value={configuration.responseLength}
                onChange={(event) =>
                  patchConfig({ responseLength: event.target.value })
                }
              >
                {['Brief', 'Balanced', 'Detailed'].map((length) => (
                  <option key={length}>{length}</option>
                ))}
              </Select>
            </FormField>
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-border bg-[var(--surface-2)] p-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={configuration.requireCitations}
              onChange={(event) =>
                patchConfig({ requireCitations: event.target.checked })
              }
              className="mt-1 size-4 accent-[var(--accent)]"
            />
            <span>
              Include sources for factual answers
              <span className="mt-1 block text-sm font-normal text-muted-foreground">
                Recommended for document-backed assistants.
              </span>
            </span>
          </label>
          <FormField id="missingAnswerBehavior" label="When the documents do not contain the answer">
            <Textarea
              id="missingAnswerBehavior"
              value={configuration.missingAnswerBehavior}
              onChange={(event) =>
                patchConfig({ missingAnswerBehavior: event.target.value })
              }
            />
          </FormField>
          <FormField id="suggestedQuestions" label="Suggested questions" description="Enter one starter question per line.">
            <Textarea
              id="suggestedQuestions"
              value={configuration.suggestedQuestions.join('\n')}
              onChange={(event) =>
                patchConfig({
                  suggestedQuestions: event.target.value
                    .split('\n')
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
              }
            />
          </FormField>
        </Surface>
      </div>

      <div className="grid content-start gap-4">
        <Surface className="p-4">
          <h3 className="text-sm font-semibold">Behavior preview</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {configuration.aiName} answers {configuration.audience} in a{' '}
            {configuration.tone.toLowerCase()} tone, uses {configuration.language}
            {' '}by default, and{' '}
            {configuration.requireCitations
              ? 'cites document-backed claims.'
              : 'cites sources when useful.'}
          </p>
        </Surface>
        <div className="flex flex-col gap-2">
          <Button type="button" onClick={saveBehavior} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            {isSaving ? 'Saving...' : 'Save behavior'}
          </Button>
          {status && (
            <Alert variant={status.includes('failed') || status.includes('Failed') ? 'error' : 'success'}>
              {status}
            </Alert>
          )}
        </div>
        <Surface className="p-4">
          <h3 className="text-sm font-semibold text-destructive">
            Danger zone
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Archiving removes this AI from chat access without deleting database
            history.
          </p>
          <Button
            type="button"
            variant="destructive"
            className="mt-3"
            onClick={() => void archive()}
            disabled={isArchiving}
          >
            {isArchiving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="size-4" aria-hidden="true" />
            )}
            Archive AI
          </Button>
        </Surface>
      </div>
    </div>
  );
}

function MembersTab({
  access,
  members,
  onRefresh,
}: {
  access: CompanyAccess;
  members: CompanyMemberRecord[];
  onRefresh: () => Promise<void>;
}) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const removeMember = async (member: CompanyMemberRecord) => {
    if (member.role === 'OWNER') return;
    setRemovingUserId(member.userId);
    setActionError(null);

    try {
      await removeCompanyMember(access.company.id, member.userId);
      await onRefresh();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Failed to remove member.',
      );
    } finally {
      setRemovingUserId(null);
    }
  };

  return (
    <div className="grid gap-4">
      {actionError && <Alert variant="error">{actionError}</Alert>}

      <Surface className="overflow-hidden">
        <SectionHeader
          title="Members"
          description="Owners can remove members. Owners cannot leave their own AI in this MVP."
        />
        <div className="divide-y divide-border">
          {members.length > 0 ? (
            members.map((member, index) => (
              <div key={member.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="text-sm font-medium">
                    {shortMemberLabel(member, index)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatDate(member.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill>
                    {member.role === 'OWNER' ? 'Owner' : 'Member'}
                  </StatusPill>
                  {member.role !== 'OWNER' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void removeMember(member)}
                      disabled={removingUserId === member.userId}
                    >
                      {removingUserId === member.userId ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 className="size-4" aria-hidden="true" />
                      )}
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4">
              <EmptyState
                icon={Users}
                title="No members loaded"
                description="Invite people with the code above after the AI is ready."
              />
            </div>
          )}
        </div>
      </Surface>
    </div>
  );
}

function formatInviteCountdown(expiresAt: string | null | undefined) {
  if (!expiresAt) return 'No active invitation';
  const remaining = new Date(expiresAt).getTime() - Date.now();

  if (!Number.isFinite(remaining) || remaining <= 0) {
    return 'Expired';
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function InvitationsTab({ access }: { access: CompanyAccess }) {
  const [state, setState] = useState<ActiveInviteResponse | null>(null);
  const [createdInvite, setCreatedInvite] =
    useState<CreatedInviteResponse | null>(null);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setState(await getActiveInvite(access.company.id));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load invitation.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [access.company.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const generate = async () => {
    setIsWorking(true);
    setError(null);
    setCopied(null);

    try {
      const created = await createInvite(access.company.id);
      setCreatedInvite(created);
      setState((current) => ({
        activeInvite: created.invite,
        recentRedemptions: current?.recentRedemptions ?? [],
      }));
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : 'Failed to generate invitation.',
      );
    } finally {
      setIsWorking(false);
    }
  };

  const revoke = async () => {
    setIsWorking(true);
    setError(null);

    try {
      await revokeInvite(access.company.id);
      setCreatedInvite(null);
      await load();
    } catch (revokeError) {
      setError(
        revokeError instanceof Error
          ? revokeError.message
          : 'Failed to revoke invitation.',
      );
    } finally {
      setIsWorking(false);
    }
  };

  const copy = async (value: string, kind: 'code' | 'link') => {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1200);
  };

  const activeInvite = createdInvite?.invite ?? state?.activeInvite ?? null;

  return (
    <div className="grid gap-4">
      {error && <Alert variant="error">{error}</Alert>}

      <Surface className="overflow-hidden">
        <SectionHeader
          title="Invitation"
          description="One active invitation is available at a time and expires after 15 minutes."
          actions={
            <Button type="button" onClick={generate} disabled={isWorking}>
              {isWorking ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <UserPlus className="size-4" aria-hidden="true" />
              )}
              Generate invitation
            </Button>
          }
        />
        <div className="grid gap-4 p-4">
          {isLoading ? (
            <LoadingState label="Loading invitation..." />
          ) : activeInvite ? (
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={activeInvite.isActive ? 'success' : 'warning'}>
                  {activeInvite.isActive ? 'Active' : 'Expired'}
                </StatusPill>
                <span className="text-sm text-muted-foreground">
                  Expires in: {formatInviteCountdown(activeInvite.expiresAt)}
                </span>
              </div>

              {createdInvite ? (
                <div className="grid gap-3">
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <code className="min-w-0 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm">
                      {createdInvite.code}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void copy(createdInvite.code, 'code')}
                    >
                      {copied === 'code' ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copied === 'code' ? 'Copied' : 'Copy code'}
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <code className="min-w-0 truncate rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm">
                      {createdInvite.link}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void copy(createdInvite.link, 'link')}
                    >
                      {copied === 'link' ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copied === 'link' ? 'Copied' : 'Copy link'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Alert variant="info">
                  An active invitation exists. The raw code is only shown when it is generated.
                </Alert>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => void revoke()}
                disabled={isWorking}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Revoke active invitation
              </Button>
            </div>
          ) : (
            <Alert variant="warning">
              No active invitation. Generate one when you are ready to share this AI.
            </Alert>
          )}
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        <SectionHeader
          title="Recent joins"
          description="Successful invitation redemptions for this AI."
        />
        <div className="divide-y divide-border">
          {state?.recentRedemptions?.length ? (
            state.recentRedemptions.map((redemption) => (
              <div key={redemption.id} className="p-4">
                <p className="text-sm font-medium">
                  {redemption.name || 'New member'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Joined {formatDate(redemption.redeemedAt)}
                </p>
              </div>
            ))
          ) : (
            <div className="p-4">
              <EmptyState
                icon={UserPlus}
                title="No joins yet"
                description="New members will appear here after they redeem an invitation."
              />
            </div>
          )}
        </div>
      </Surface>
    </div>
  );
}

function AiManagementContent({ companyId }: { companyId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab') as ManagementTab | null;
  const pathTab: ManagementTab =
    pathname.endsWith('/documents')
      ? 'documents'
      : pathname.endsWith('/events')
        ? 'events'
      : pathname.endsWith('/members')
        ? 'members'
        : pathname.endsWith('/invites')
          ? 'invitations'
          : pathname.endsWith('/settings')
            ? 'settings'
            : 'overview';
  const [activeTab, setActiveTab] = useState<ManagementTab>(
    tabs.some((tab) => tab.id === requestedTab) ? requestedTab! : pathTab,
  );
  const [access, setAccess] = useState<CompanyAccess | null>(null);
  const [documents, setDocuments] = useState<AiDocument[]>([]);
  const [members, setMembers] = useState<CompanyMemberRecord[]>([]);
  const [events, setEvents] = useState<AiEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextAccess = await getCompanyAccess(companyId);

      if (!isAdminRole(nextAccess.company)) {
        setAccess(nextAccess);
        return;
      }

      const [nextDocuments, nextMembers, nextEvents] = await Promise.all([
        listAdminDocuments(companyId),
        listCompanyMembers(companyId),
        listAiEvents(companyId),
      ]);
      setAccess(nextAccess);
      setDocuments(nextDocuments);
      setMembers(nextMembers);
      setEvents(nextEvents);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load AI management.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setActiveTab(
      tabs.some((tab) => tab.id === requestedTab) ? requestedTab! : pathTab,
    );
  }, [pathTab, requestedTab]);

  const setTab = (tab: ManagementTab) => {
    setActiveTab(tab);
    router.replace(`/ai/${companyId}/manage?tab=${tab}`);
  };

  const content = useMemo(() => {
    if (!access) return null;

    if (activeTab === 'overview') {
      return <OverviewTab access={access} documents={documents} members={members} />;
    }

    if (activeTab === 'documents') {
      return (
        <KnowledgeTab
          companyId={companyId}
          documents={documents}
          onRefresh={load}
        />
      );
    }

    if (activeTab === 'events') {
      return (
        <EventsTab companyId={companyId} events={events} onRefresh={load} />
      );
    }

    if (activeTab === 'members') {
      return (
        <MembersTab access={access} members={members} onRefresh={load} />
      );
    }

    if (activeTab === 'invitations') {
      return <InvitationsTab access={access} />;
    }

    return <BehaviorTab access={access} onSaved={setAccess} />;
  }, [access, activeTab, companyId, documents, events, load, members]);

  return (
    <AppShell
      title={access?.company.name ?? 'Manage AI'}
      breadcrumbs={[{ label: access?.company.name ?? 'Manage AI' }]}
      contentClassName="mx-auto max-w-7xl"
      actions={
        access ? (
          <Link href={`/chat/${access.company.id}`} className={buttonVariants()}>
            <MessageSquareText className="size-4" aria-hidden="true" />
            Open Chat
          </Link>
        ) : null
      }
    >
      <PageHeader
        eyebrow="AI management"
        title={access?.company.name ?? 'Manage AI'}
        description="Manage knowledge, behavior, members, and testing for this document AI."
        meta={
          access && (
            <>
              <StatusBadge status={access.company.setupStatus} />
              <StatusPill>{getUseCaseLabel(access.company.useCaseType)}</StatusPill>
              <StatusPill>{roleLabel(access.company)}</StatusPill>
            </>
          )
        }
      />

      {isLoading ? (
        <LoadingState label="Loading management..." />
      ) : error ? (
        <Alert variant="error" title="Management could not load">
          {error}
        </Alert>
      ) : !access || !isAdminRole(access.company) ? (
        <EmptyState
          icon={AlertCircle}
          title="Owner access required"
          description="Members can chat with this AI, but management is available only to the owner."
          actions={
            <>
              <Link href={`/chat/${companyId}`} className={buttonVariants()}>
                Open Chat
              </Link>
              <Link
                href="/chat"
                className={buttonVariants({ variant: 'outline' })}
              >
                Go to Chat
              </Link>
            </>
          }
        />
      ) : (
        <Surface className="overflow-hidden">
          <TabList tabs={tabs} active={activeTab} onChange={setTab} />
          <div className="border-t border-border p-4 md:p-6">{content}</div>
        </Surface>
      )}
    </AppShell>
  );
}

export default function AiManagementPage({ companyId }: { companyId: string }) {
  return (
    <AuthGate>
      <AiManagementContent companyId={companyId} />
    </AuthGate>
  );
}
