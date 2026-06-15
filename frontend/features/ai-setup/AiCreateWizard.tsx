'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  GraduationCap,
  Headphones,
  HelpCircle,
  Library,
  Loader2,
  Lock,
  MessageSquareText,
  RotateCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  X,
} from 'lucide-react';
import AuthGate from '@/features/auth/AuthGate';
import {
  createAiDraft,
  finalizeAiSetup,
  getAiSetup,
  listAdminDocuments,
  updateAiSetup,
  uploadAdminDocument,
} from '@/features/admin/api';
import type { AiDocument } from '@/features/admin/types';
import type { AiConfiguration, Company } from '@/features/companies/types';
import { cn } from '@/shared/lib/utils';
import { Button, buttonVariants } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  createDefaultConfiguration,
  getAiUseCaseTemplate,
  type AiSetupQuestion,
  type AiUseCaseTemplate,
  aiUseCaseTemplates,
  validateQuestions,
} from './templates';
import {
  Alert,
  AppShell,
  PageHeader,
  Surface,
} from '@/shared/ui/product';
import {
  formatFileSize,
  StatusBadge,
  getUseCaseLabel,
} from '@/features/dashboard/components/ui';

const steps = [
  {
    id: 'use-case',
    title: 'Use case',
    description: 'Choose the kind of document AI you are creating.',
  },
  {
    id: 'identity',
    title: 'AI identity',
    description: 'Name the AI and define the first impression.',
  },
  {
    id: 'goals',
    title: 'Audience and goals',
    description: 'Answer the questions that make this use case specific.',
  },
  {
    id: 'behavior',
    title: 'Behavior',
    description: 'Set tone, sources, language, and boundaries.',
  },
  {
    id: 'access',
    title: 'Access',
    description: 'Confirm who can manage and who can join later.',
  },
  {
    id: 'knowledge',
    title: 'Knowledge upload',
    description: 'Upload the PDFs this AI should trust.',
  },
  {
    id: 'review',
    title: 'Review and create',
    description: 'Confirm the configuration before creating the AI.',
  },
] as const;

const behaviorQuestionIds = new Set<keyof AiConfiguration>([
  'tone',
  'language',
  'responseLength',
  'requireCitations',
  'missingAnswerBehavior',
  'shouldExplainStepByStep',
  'canGenerateExamples',
  'canCreateQuizzes',
  'avoidGradedAssignments',
  'answerMode',
]);

const iconMap = {
  Building2,
  GraduationCap,
  Headphones,
  Library,
  SlidersHorizontal,
};

type UploadItem = {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'queued' | 'uploading' | 'processing' | 'ready' | 'failed';
  progress: number;
  error?: string;
  document?: AiDocument | null;
};

type FieldErrors = Record<string, string>;

function newUploadId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function splitTagValue(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function questionValueToText(value: unknown) {
  if (Array.isArray(value)) {
    return value.join('\n');
  }

  return typeof value === 'string' ? value : '';
}

function getGoalQuestions(template: AiUseCaseTemplate) {
  return template.questions.filter(
    (question) => !behaviorQuestionIds.has(question.id),
  );
}

function getBehaviorQuestions(template: AiUseCaseTemplate) {
  return template.questions.filter((question) =>
    behaviorQuestionIds.has(question.id),
  );
}

function mergeConfig(
  base: AiConfiguration,
  patch: Partial<AiConfiguration>,
) {
  return {
    ...base,
    ...patch,
    suggestedQuestions:
      patch.suggestedQuestions ?? base.suggestedQuestions ?? [],
    restrictedTopics: patch.restrictedTopics ?? base.restrictedTopics ?? [],
  };
}

function FileStatusBadge({ status }: { status: UploadItem['status'] | string }) {
  const labels: Record<string, string> = {
    queued: 'Ready to upload',
    uploading: 'Uploading',
    processing: 'Processing',
    ready: 'Ready',
    failed: 'Failed',
    error: 'Failed',
  };
  const classNames: Record<string, string> = {
    queued: 'border-zinc-600 bg-zinc-800 text-zinc-200',
    uploading: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
    processing: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
    ready: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    failed: 'border-red-500/30 bg-red-500/10 text-red-200',
    error: 'border-red-500/30 bg-red-500/10 text-red-200',
  };

  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-md border px-2 text-xs font-medium',
        classNames[status] ?? classNames.queued,
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}

function WizardStepNav({
  currentStep,
  onStepClick,
}: {
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <nav aria-label="Create AI progress" className="overflow-x-auto lg:sticky lg:top-20">
      <ol className="flex gap-2 lg:grid">
        {steps.map((step, index) => {
          const active = currentStep === index;
          const complete = currentStep > index;

          return (
            <li key={step.id} className="min-w-64 lg:min-w-0">
              <button
                type="button"
                onClick={() => onStepClick(index)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  active
                    ? 'border-[color-mix(in_srgb,var(--accent)_52%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)]'
                    : 'border-border bg-card hover:bg-[var(--surface-2)]',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex size-6 items-center justify-center rounded-md text-xs font-semibold',
                    complete
                      ? 'bg-emerald-500/15 text-emerald-200'
                      : active
                        ? 'bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-accent'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {complete ? <Check className="size-3.5" /> : index + 1}
                </span>
                <span>
                  <span className="block text-sm font-medium">
                    {step.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                    {step.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function QuestionField({
  question,
  configuration,
  error,
  onChange,
}: {
  question: AiSetupQuestion;
  configuration: AiConfiguration;
  error?: string;
  onChange: (id: keyof AiConfiguration, value: unknown) => void;
}) {
  const fieldId = `question-${String(question.id)}`;
  const rawValue = configuration[question.id];

  if (question.inputType === 'checkbox') {
    return (
      <label className="flex gap-3 rounded-lg border border-border bg-background p-3">
        <input
          id={fieldId}
          type="checkbox"
          checked={Boolean(rawValue)}
          onChange={(event) => onChange(question.id, event.target.checked)}
          className="mt-1 size-4 rounded border-border accent-cyan-300"
        />
        <span>
          <span className="block text-sm font-medium">{question.label}</span>
          {question.description && (
            <span className="mt-1 block text-sm text-muted-foreground">
              {question.description}
            </span>
          )}
        </span>
      </label>
    );
  }

  return (
    <div className="grid gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium">
        {question.label}
      </label>
      {question.description && (
        <p className="text-sm text-muted-foreground">{question.description}</p>
      )}
      {question.inputType === 'textarea' && (
        <textarea
          id={fieldId}
          value={questionValueToText(rawValue)}
          onChange={(event) => onChange(question.id, event.target.value)}
          placeholder={question.placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className="min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      )}
      {question.inputType === 'select' && (
        <select
          id={fieldId}
          value={String(rawValue ?? '')}
          onChange={(event) => onChange(question.id, event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Select an option</option>
          {question.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
      {question.inputType === 'tags' && (
        <textarea
          id={fieldId}
          value={questionValueToText(rawValue)}
          onChange={(event) =>
            onChange(question.id, splitTagValue(event.target.value))
          }
          placeholder={question.placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className="min-h-20 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      )}
      {question.inputType === 'text' && (
        <Input
          id={fieldId}
          value={questionValueToText(rawValue)}
          onChange={(event) => onChange(question.id, event.target.value)}
          placeholder={question.placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : undefined}
        />
      )}
      {error && (
        <p id={`${fieldId}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function UseCaseStep({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (template: AiUseCaseTemplate) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {aiUseCaseTemplates.map((template) => {
        const Icon =
          iconMap[template.icon as keyof typeof iconMap] ?? HelpCircle;
        const selected = selectedId === template.id;

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className={cn(
                  'flex min-h-40 flex-col rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
              selected
                ? 'border-[color-mix(in_srgb,var(--accent)_58%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)]'
                : 'border-border bg-card hover:bg-[var(--surface-2)]',
            )}
          >
            <span className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-[var(--surface-2)]">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="text-base font-semibold">{template.label}</span>
            </span>
            <span className="mt-3 text-sm leading-6 text-muted-foreground">
              {template.description}
            </span>
            <span className="mt-auto pt-4 text-xs font-medium text-accent">
              Example: {template.exampleUse}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function IdentityStep({
  configuration,
  errors,
  onChange,
}: {
  configuration: AiConfiguration;
  errors: FieldErrors;
  onChange: (patch: Partial<AiConfiguration>) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <label htmlFor="aiName" className="text-sm font-medium">
          AI name
        </label>
        <Input
          id="aiName"
          value={configuration.aiName}
          onChange={(event) => onChange({ aiName: event.target.value })}
          placeholder="Acme HR Assistant"
          aria-invalid={Boolean(errors.aiName)}
          aria-describedby={errors.aiName ? 'aiName-error' : undefined}
        />
        {errors.aiName && (
          <p id="aiName-error" className="text-sm text-destructive">
            {errors.aiName}
          </p>
        )}
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Short description
        </label>
        <textarea
          id="description"
          value={configuration.description}
          onChange={(event) => onChange({ description: event.target.value })}
          className="min-h-20 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="Helps employees find answers in HR policies and handbooks."
          aria-invalid={Boolean(errors.description)}
          aria-describedby={
            errors.description ? 'description-error' : undefined
          }
        />
        {errors.description && (
          <p id="description-error" className="text-sm text-destructive">
            {errors.description}
          </p>
        )}
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="welcomeMessage" className="text-sm font-medium">
          Welcome message
        </label>
        <textarea
          id="welcomeMessage"
          value={configuration.welcomeMessage}
          onChange={(event) => onChange({ welcomeMessage: event.target.value })}
          className="min-h-20 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      <QuestionField
        question={{
          id: 'suggestedQuestions',
          label: 'Suggested starter questions',
          description: 'Enter one question per line.',
          inputType: 'tags',
        }}
        configuration={configuration}
        onChange={(id, value) =>
          onChange({ [id]: value } as Partial<AiConfiguration>)
        }
      />
    </div>
  );
}

function AccessStep({
  company,
  configuration,
  onChange,
}: {
  company: Company | null;
  configuration: AiConfiguration;
  onChange: (patch: Partial<AiConfiguration>) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 size-5 text-emerald-200" />
          <div>
            <h3 className="text-sm font-semibold">Owner access is ready</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              You are the owner for this AI. Members can chat after they join,
              but they cannot edit behavior, upload knowledge, or see invite
              controls.
            </p>
          </div>
        </div>
      </div>
      <label className="grid gap-1.5 text-sm font-medium">
        Sharing model
        <select
          value={configuration.visibility ?? 'Shared with invited members'}
          onChange={(event) => onChange({ visibility: event.target.value })}
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option>Shared with invited members</option>
          <option>Private</option>
        </select>
      </label>
      {company?.invitationCode && (
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-start gap-3">
            <Lock className="mt-1 size-5 text-cyan-200" />
            <div>
              <h3 className="text-sm font-semibold">Invitation code reserved</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                The code is available after creation from the Members tab.
              </p>
              <code className="mt-3 inline-flex rounded-md border border-border px-2 py-1 font-mono text-xs text-muted-foreground">
                {company.invitationCode}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KnowledgeStep({
  documents,
  uploadItems,
  error,
  isUploading,
  onFiles,
  onUploadAll,
  onRemoveQueued,
  onRetry,
}: {
  documents: AiDocument[];
  uploadItems: UploadItem[];
  error: string | null;
  isUploading: boolean;
  onFiles: (files: FileList | File[]) => void;
  onUploadAll: () => void;
  onRemoveQueued: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-border bg-background p-4">
        <h3 className="text-sm font-semibold">PDF source of truth</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Your AI will use these documents as its source of truth. Upload
          policies, handbooks, lesson materials, guides, manuals, or other
          relevant PDFs.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          PDF only. Avoid unrelated or sensitive material unless the AI is
          intended to answer from it.
        </p>
      </div>

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
          onFiles(Array.from(event.dataTransfer.files));
        }}
        className={cn(
          'flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-background p-6 text-center transition-colors',
          isDragging
            ? 'border-cyan-300 bg-cyan-500/10'
            : 'border-border hover:bg-muted/40',
        )}
      >
        <Upload className="size-7 text-muted-foreground" aria-hidden="true" />
        <span className="mt-3 text-sm font-medium">
          Drag PDFs here or choose files
        </span>
        <span className="mt-1 text-xs text-muted-foreground">
          Multiple PDFs supported
        </span>
        <input
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) onFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </label>

      {error && (
        <p className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          {error}
        </p>
      )}

      {uploadItems.length > 0 && (
        <section className="rounded-lg border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border p-3">
            <div>
              <h3 className="text-sm font-semibold">Upload queue</h3>
              <p className="text-xs text-muted-foreground">
                Files show upload and processing state separately.
              </p>
            </div>
            <Button
              type="button"
              onClick={onUploadAll}
              disabled={isUploading || !uploadItems.some((item) => item.status === 'queued' || item.status === 'failed')}
            >
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Upload
            </Button>
          </div>
          <div className="divide-y divide-border">
            {uploadItems.map((item) => (
              <div key={item.id} className="grid gap-3 p-3 sm:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <FileStatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatFileSize(item.size)}
                    {item.error ? ` · ${item.error}` : ''}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        item.status === 'failed'
                          ? 'bg-destructive'
                          : 'bg-cyan-300',
                      )}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {item.status === 'failed' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`Retry ${item.name}`}
                      onClick={() => onRetry(item.id)}
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                  )}
                  {(item.status === 'queued' || item.status === 'failed') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => onRemoveQueued(item.id)}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-border bg-background">
        <div className="border-b border-border p-3">
          <h3 className="text-sm font-semibold">Uploaded documents</h3>
          <p className="text-xs text-muted-foreground">
            At least one ready PDF is required before the AI can be created.
          </p>
        </div>
        <div className="divide-y divide-border">
          {documents.length > 0 ? (
            documents.map((document) => (
              <div
                key={document.id}
                className="grid gap-2 p-3 sm:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {document.filename}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatFileSize(document.fileSize)} · Uploaded{' '}
                    {new Date(document.createdAt).toLocaleDateString()}
                  </p>
                  {document.errorMessage && (
                    <p className="mt-1 text-xs text-destructive">
                      {document.errorMessage}
                    </p>
                  )}
                </div>
                <FileStatusBadge
                  status={document.status === 'error' ? 'failed' : document.status}
                />
              </div>
            ))
          ) : (
            <p className="p-3 text-sm text-muted-foreground">
              No PDFs have been uploaded yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 border-b border-border py-3 last:border-b-0 sm:grid-cols-[180px_1fr]">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

function ReviewStep({
  configuration,
  documents,
  onEditStep,
}: {
  configuration: AiConfiguration;
  documents: AiDocument[];
  onEditStep: (step: number) => void;
}) {
  const readyDocuments = documents.filter((document) => document.status === 'ready');

  return (
    <div className="grid gap-4">
      <dl className="rounded-lg border border-border bg-background px-4">
        <ReviewRow label="AI name" value={configuration.aiName} />
        <ReviewRow label="Use case" value={getUseCaseLabel(configuration.useCaseType)} />
        <ReviewRow label="Purpose" value={configuration.purpose} />
        <ReviewRow label="Audience" value={configuration.audience} />
        <ReviewRow label="Tone" value={configuration.tone} />
        <ReviewRow label="Language" value={configuration.language} />
        <ReviewRow
          label="Citation behavior"
          value={configuration.requireCitations ? 'Sources required' : 'Sources when useful'}
        />
        <ReviewRow
          label="Missing answers"
          value={configuration.missingAnswerBehavior}
        />
        <ReviewRow
          label="Knowledge"
          value={`${readyDocuments.length} ready of ${documents.length} uploaded PDF${documents.length === 1 ? '' : 's'}`}
        />
        <ReviewRow
          label="Access"
          value="You are the owner. Members can join by invitation after creation."
        />
      </dl>

      <div className="grid gap-2 sm:grid-cols-3">
        <Button type="button" variant="outline" onClick={() => onEditStep(1)}>
          Edit identity
        </Button>
        <Button type="button" variant="outline" onClick={() => onEditStep(3)}>
          Edit behavior
        </Button>
        <Button type="button" variant="outline" onClick={() => onEditStep(5)}>
          Edit knowledge
        </Button>
      </div>
    </div>
  );
}

function AiCreateWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedDraftId = searchParams.get('draftId');
  const initRef = useRef(false);
  const [draftId, setDraftId] = useState<string | null>(requestedDraftId);
  const [company, setCompany] = useState<Company | null>(null);
  const [configuration, setConfiguration] = useState<AiConfiguration>(
    createDefaultConfiguration(aiUseCaseTemplates[0]),
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [documents, setDocuments] = useState<AiDocument[]>([]);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const template = getAiUseCaseTemplate(configuration.useCaseType);
  const goalQuestions = useMemo(() => getGoalQuestions(template), [template]);
  const behaviorQuestions = useMemo(
    () => getBehaviorQuestions(template),
    [template],
  );
  const readyDocumentCount = documents.filter(
    (document) => document.status === 'ready',
  ).length;

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function initDraft() {
      setIsLoading(true);
      setError(null);

      try {
        let activeDraftId = requestedDraftId;

        if (!activeDraftId) {
          const draft = await createAiDraft();
          activeDraftId = draft.id;
          router.replace(`/create-ai?draftId=${draft.id}`);
        }

        setDraftId(activeDraftId);
        const setup = await getAiSetup(activeDraftId);
        const loadedCompany = setup.company;
        const loadedTemplate = getAiUseCaseTemplate(
          loadedCompany.aiConfiguration?.useCaseType ??
            loadedCompany.useCaseType,
        );
        const nextConfig = mergeConfig(
          createDefaultConfiguration(loadedTemplate),
          loadedCompany.aiConfiguration ?? {},
        );
        setCompany(loadedCompany);
        setConfiguration(nextConfig);
        setCurrentStep(Math.min(loadedCompany.setupStep ?? 0, steps.length - 1));
        setDocuments(await listAdminDocuments(activeDraftId));
      } catch (initError) {
        setError(
          initError instanceof Error
            ? initError.message
            : 'Failed to start setup.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void initDraft();
  }, [requestedDraftId, router]);

  const updateConfiguration = (patch: Partial<AiConfiguration>) => {
    setConfiguration((current) => mergeConfig(current, patch));
  };

  const selectTemplate = (nextTemplate: AiUseCaseTemplate) => {
    const defaults = createDefaultConfiguration(nextTemplate);
    setConfiguration((current) => ({
      ...defaults,
      organizationName: current.organizationName || defaults.organizationName,
      aiName:
        current.aiName && current.aiName !== 'Document Assistant'
          ? current.aiName
          : defaults.aiName,
      suggestedQuestions: [...defaults.suggestedQuestions],
      restrictedTopics: [...defaults.restrictedTopics],
    }));
    setFieldErrors({});
  };

  const saveDraft = async (step = currentStep) => {
    if (!draftId) return null;
    setIsSaving(true);
    setError(null);

    try {
      const saved = await updateAiSetup(draftId, {
        name: configuration.aiName,
        description: configuration.description,
        useCaseType: configuration.useCaseType,
        setupStep: step,
        aiConfiguration: {
          ...configuration,
        },
      });
      setCompany((current) => ({ ...(current ?? saved), ...saved }));
      setLastSavedAt(new Date().toLocaleTimeString());
      return saved;
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save setup.',
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const validateCurrentStep = () => {
    let errors: FieldErrors = {};

    if (currentStep === 0 && !configuration.useCaseType) {
      errors.useCaseType = 'Choose a use case.';
    }

    if (currentStep === 1) {
      if (!configuration.aiName.trim()) {
        errors.aiName = 'AI name is required.';
      }
      if (!configuration.description.trim()) {
        errors.description = 'Short description is required.';
      }
      if (!configuration.welcomeMessage.trim()) {
        errors.welcomeMessage = 'Welcome message is required.';
      }
    }

    if (currentStep === 2) {
      errors = validateQuestions(configuration, goalQuestions);
    }

    if (currentStep === 3) {
      errors = validateQuestions(configuration, behaviorQuestions);
    }

    if (currentStep === 5 && readyDocumentCount === 0) {
      errors.documents =
        'Upload at least one PDF that finishes processing before creating this AI.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const goToStep = async (step: number) => {
    const boundedStep = Math.max(0, Math.min(step, steps.length - 1));
    setCurrentStep(boundedStep);
    await saveDraft(boundedStep);
  };

  const continueStep = async () => {
    if (!validateCurrentStep()) return;
    const nextStep = Math.min(currentStep + 1, steps.length - 1);
    await saveDraft(nextStep);
    setCurrentStep(nextStep);
  };

  const backStep = async () => {
    const nextStep = Math.max(0, currentStep - 1);
    await saveDraft(nextStep);
    setCurrentStep(nextStep);
  };

  const addFiles = (filesInput: FileList | File[]) => {
    const files = Array.from(filesInput);
    setUploadError(null);

    setUploadItems((current) => {
      const signatures = new Set([
        ...current.map((item) => `${item.name}:${item.size}`),
        ...documents.map((document) => `${document.filename}:${document.fileSize ?? ''}`),
      ]);
      const nextItems = [...current];
      const errors: string[] = [];

      for (const file of files) {
        const isPdf =
          file.type === 'application/pdf' ||
          file.name.toLowerCase().endsWith('.pdf');
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
        nextItems.push({
          id: newUploadId(),
          file,
          name: file.name,
          size: file.size,
          status: 'queued',
          progress: 0,
        });
      }

      if (errors.length) {
        setUploadError(errors.join(' '));
      }

      return nextItems;
    });
  };

  const uploadOne = async (item: UploadItem) => {
    if (!draftId) return;

    setUploadItems((current) =>
      current.map((candidate) =>
        candidate.id === item.id
          ? { ...candidate, status: 'uploading', progress: 35, error: undefined }
          : candidate,
      ),
    );

    try {
      setUploadItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? { ...candidate, status: 'processing', progress: 70 }
            : candidate,
        ),
      );
      const result = await uploadAdminDocument(item.file, draftId);
      const document = result.document
        ? ({
            id: result.document.id,
            filename: result.document.filename,
            companyId: result.document.companyId ?? draftId,
            fileSize: result.document.fileSize ?? String(item.size),
            mimeType: result.document.mimeType ?? item.file.type,
            status: result.document.status,
            errorMessage: result.document.errorMessage ?? null,
            createdAt: result.document.createdAt ?? new Date().toISOString(),
            updatedAt: result.document.updatedAt ?? new Date().toISOString(),
          } satisfies AiDocument)
        : null;

      setUploadItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? { ...candidate, status: 'ready', progress: 100, document }
            : candidate,
        ),
      );
    } catch (uploadFailure) {
      setUploadItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? {
                ...candidate,
                status: 'failed',
                progress: 100,
                error:
                  uploadFailure instanceof Error
                    ? uploadFailure.message
                    : 'Upload failed.',
              }
            : candidate,
        ),
      );
    }
  };

  const uploadAll = async () => {
    const queue = uploadItems.filter(
      (item) => item.status === 'queued' || item.status === 'failed',
    );

    if (!queue.length) return;

    setIsUploading(true);

    try {
      for (const item of queue) {
        await uploadOne(item);
      }
      if (draftId) {
        setDocuments(await listAdminDocuments(draftId));
      }
    } finally {
      setIsUploading(false);
    }
  };

  const retryUpload = (id: string) => {
    const item = uploadItems.find((candidate) => candidate.id === id);
    if (!item) return;
    void uploadOne(item).then(async () => {
      if (draftId) setDocuments(await listAdminDocuments(draftId));
    });
  };

  const finalize = async () => {
    if (!draftId) return;

    if (!validateCurrentStep()) {
      return;
    }

    setIsFinalizing(true);
    setError(null);

    try {
      await saveDraft(6);
      await finalizeAiSetup(draftId);
      router.push(`/create-ai/complete?companyId=${draftId}`);
    } catch (finalizeError) {
      setError(
        finalizeError instanceof Error
          ? finalizeError.message
          : 'Failed to create AI.',
      );
    } finally {
      setIsFinalizing(false);
    }
  };

  const renderStep = () => {
    if (currentStep === 0) {
      return (
        <UseCaseStep
          selectedId={configuration.useCaseType}
          onSelect={selectTemplate}
        />
      );
    }

    if (currentStep === 1) {
      return (
        <IdentityStep
          configuration={configuration}
          errors={fieldErrors}
          onChange={updateConfiguration}
        />
      );
    }

    if (currentStep === 2) {
      return (
        <div className="grid gap-4">
          {goalQuestions.map((question) => (
            <QuestionField
              key={String(question.id)}
              question={question}
              configuration={configuration}
              error={fieldErrors[String(question.id)]}
              onChange={(id, value) =>
                updateConfiguration({
                  [id]: value,
                } as Partial<AiConfiguration>)
              }
            />
          ))}
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="grid gap-4">
          {behaviorQuestions.map((question) => (
            <QuestionField
              key={String(question.id)}
              question={question}
              configuration={configuration}
              error={fieldErrors[String(question.id)]}
              onChange={(id, value) =>
                updateConfiguration({
                  [id]: value,
                } as Partial<AiConfiguration>)
              }
            />
          ))}
        </div>
      );
    }

    if (currentStep === 4) {
      return (
        <AccessStep
          company={company}
          configuration={configuration}
          onChange={updateConfiguration}
        />
      );
    }

    if (currentStep === 5) {
      return (
        <KnowledgeStep
          documents={documents}
          uploadItems={uploadItems}
          error={fieldErrors.documents ?? uploadError}
          isUploading={isUploading}
          onFiles={addFiles}
          onUploadAll={uploadAll}
          onRemoveQueued={(id) =>
            setUploadItems((current) =>
              current.filter((item) => item.id !== id),
            )
          }
          onRetry={retryUpload}
        />
      );
    }

    return (
      <ReviewStep
        configuration={configuration}
        documents={documents}
        onEditStep={setCurrentStep}
      />
    );
  };

  return (
    <AppShell
      title="Create AI"
      breadcrumbs={[{ label: 'Create AI' }]}
      contentClassName="mx-auto max-w-7xl"
      actions={
        <Link
          href="/chat"
          className={buttonVariants({ variant: 'outline' })}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Save and exit
        </Link>
      }
    >
      <PageHeader
        eyebrow="Guided setup"
        title="Create AI"
        description="Build a document AI through guided setup, knowledge upload, review, and testing."
      />

      <div className="grid w-full gap-6 lg:grid-cols-[300px_1fr]">
        <WizardStepNav currentStep={currentStep} onStepClick={goToStep} />

        <Surface className="min-w-0 overflow-hidden">
          <div className="border-b border-border p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  {steps[currentStep].title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {steps[currentStep].description}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {company?.setupStatus && (
                  <StatusBadge status={company.setupStatus} />
                )}
                <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                  {getUseCaseLabel(configuration.useCaseType)}
                </span>
              </div>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-cyan-300 transition-all"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid min-h-96 place-items-center p-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Preparing setup...
              </span>
            </div>
          ) : (
            <>
              <div className="p-4 md:p-6">{renderStep()}</div>

              {error && (
                <Alert variant="error" className="mx-4 mb-4 md:mx-6">
                  {error}
                </Alert>
              )}

              <div className="flex flex-col gap-3 border-t border-border p-4 md:flex-row md:items-center md:justify-between">
                <div className="text-xs text-muted-foreground">
                  {isSaving ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" />
                      Saving...
                    </span>
                  ) : lastSavedAt ? (
                    <span className="flex items-center gap-1.5">
                      <Save className="size-3.5" />
                      Saved at {lastSavedAt}
                    </span>
                  ) : (
                    <span>Progress saves when you move between steps.</span>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={backStep}
                    disabled={currentStep === 0 || isSaving || isFinalizing}
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Back
                  </Button>
                  {currentStep < steps.length - 1 ? (
                    <Button
                      type="button"
                      onClick={continueStep}
                      disabled={isSaving || isFinalizing}
                    >
                      Continue
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={finalize}
                      disabled={
                        isSaving ||
                        isFinalizing ||
                        readyDocumentCount === 0
                      }
                    >
                      {isFinalizing ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <MessageSquareText className="size-4" />
                      )}
                      {isFinalizing ? 'Creating AI' : 'Create AI'}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </Surface>
      </div>
    </AppShell>
  );
}

export default function AiCreateWizard() {
  return (
    <AuthGate>
      <AiCreateWizardContent />
    </AuthGate>
  );
}
