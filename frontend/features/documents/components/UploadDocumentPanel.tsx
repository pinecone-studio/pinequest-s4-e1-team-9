'use client';

import { uploadDocument } from '@/features/documents/api';
import { PDF_ACCEPT } from '@/shared/types/documents';
import { Button } from '@/shared/ui/button';
import {
  Alert,
  SectionHeader,
  StatusPill,
  Surface,
} from '@/shared/ui/product';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';

type UploadState = 'idle' | 'queued' | 'uploading' | 'processing' | 'ready' | 'failed';

function isBackendAcceptedPdf(file: File) {
  const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf');
  const hasPdfMime =
    file.type === 'application/pdf' || file.type === 'application/x-pdf';

  return hasPdfExtension && hasPdfMime;
}

function stateLabel(state: UploadState) {
  const labels: Record<UploadState, string> = {
    idle: 'No file selected',
    queued: 'Queued',
    uploading: 'Uploading',
    processing: 'Processing',
    ready: 'Ready',
    failed: 'Failed',
  };

  return labels[state];
}

function stateTone(state: UploadState) {
  if (state === 'ready') return 'success';
  if (state === 'failed') return 'error';
  if (state === 'queued') return 'warning';
  if (state === 'uploading' || state === 'processing') return 'info';
  return 'neutral';
}

export default function UploadDocumentPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [status, setStatus] = useState('Choose a PDF to upload.');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;

    if (!selectedFile) return;

    if (!isBackendAcceptedPdf(selectedFile)) {
      setFile(null);
      setState('failed');
      setStatus('Only PDF files are accepted.');
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
    setState('queued');
    setStatus(`${selectedFile.name} is queued for upload.`);
  };

  const uploadFile = async () => {
    if (!file || state === 'uploading' || state === 'processing') return;

    setState('uploading');
    setStatus('Uploading the PDF...');

    try {
      setState('processing');
      setStatus('Processing the PDF so it can be used as a source.');
      await uploadDocument(file);
      setState('ready');
      setStatus('PDF uploaded and queued for source-backed answers.');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (error) {
      setState('failed');
      setStatus(
        error instanceof Error
          ? error.message
          : 'Failed to upload PDF. Please try again.',
      );
    }
  };

  return (
    <Surface className="w-full max-w-xl overflow-hidden">
      <SectionHeader
        title="Upload PDF"
        description="Add a source document for the current authenticated workspace."
      />
      <div className="grid gap-4 p-4">
        <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-[var(--surface-2)] p-6 text-center transition-colors hover:bg-[var(--surface-3)]">
          <Upload className="size-7 text-muted-foreground" aria-hidden="true" />
          <span className="mt-3 max-w-full truncate text-sm font-medium">
            {file ? file.name : 'Choose a PDF'}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            Supported format: PDF
          </span>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            onChange={handleFileChange}
            accept={PDF_ACCEPT}
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-[var(--surface-2)] p-3">
          <div className="flex min-w-0 items-center gap-3">
            <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {file?.name ?? 'No PDF selected'}
              </p>
              <p className="text-xs text-muted-foreground">{status}</p>
            </div>
          </div>
          <StatusPill tone={stateTone(state)}>{stateLabel(state)}</StatusPill>
        </div>

        <Button
          type="button"
          onClick={uploadFile}
          disabled={!file || state === 'uploading' || state === 'processing'}
        >
          {state === 'uploading' || state === 'processing' ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : state === 'ready' ? (
            <CheckCircle2 className="size-4" aria-hidden="true" />
          ) : state === 'failed' ? (
            <AlertCircle className="size-4" aria-hidden="true" />
          ) : (
            <Upload className="size-4" aria-hidden="true" />
          )}
          {state === 'uploading' || state === 'processing'
            ? 'Preparing PDF...'
            : 'Upload PDF'}
        </Button>

        {state === 'failed' && <Alert variant="error">{status}</Alert>}
      </div>
    </Surface>
  );
}
