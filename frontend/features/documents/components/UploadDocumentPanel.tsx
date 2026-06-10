'use client';

import { uploadDocument } from '@/features/documents/api';
import { PDF_ACCEPT } from '@/shared/types/documents';
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Loader2,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';

type UploadState = 'idle' | 'ready' | 'uploading' | 'success' | 'error';

function isBackendAcceptedPdf(file: File) {
  const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf');
  const hasPdfMime =
    file.type === 'application/pdf' || file.type === 'application/x-pdf';

  return hasPdfExtension && hasPdfMime;
}

function statusClass(state: UploadState) {
  if (state === 'success') return 'text-[#00e5cc]';
  if (state === 'error') return 'text-destructive';
  return 'text-zinc-400';
}

export default function UploadDocumentPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [status, setStatus] = useState('Select a PDF to prepare ingestion.');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;

    if (!selectedFile) return;

    if (!isBackendAcceptedPdf(selectedFile)) {
      setFile(null);
      setState('error');
      setStatus('Only real PDF files are accepted right now.');
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
    setState('ready');
    setStatus(`${selectedFile.name} is ready to upload.`);
  };

  const uploadFile = async () => {
    if (!file || state === 'uploading') return;

    setState('uploading');
    setStatus('Uploading and processing PDF...');

    try {
      await uploadDocument(file);
      setState('success');
      setStatus('PDF uploaded, parsed, chunked, embedded, and indexed.');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (error) {
      setState('error');
      setStatus(
        error instanceof Error
          ? error.message
          : 'Failed to upload PDF. Please try again.',
      );
    }
  };

  const statusIcon =
    state === 'success' ? (
      <CheckCircle2 size={15} />
    ) : state === 'error' ? (
      <AlertCircle size={15} />
    ) : null;

  return (
    <div className="w-full max-w-lg flex flex-col bg-zinc-900 rounded-lg border border-zinc-700/50 overflow-hidden shadow-2xl">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-700/50 bg-zinc-900/80">
        <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
          <Sparkles size={15} className="text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-100 tracking-wide">
            Research Docs
          </p>
          <p className="text-[11px] text-zinc-500">PDF Ingestion</p>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-4">
        <label className="flex flex-col items-center justify-center w-full min-h-40 border-2 border-zinc-700 border-dashed rounded-lg cursor-pointer bg-zinc-800 hover:bg-zinc-700 transition-colors">
          <div className="flex flex-col items-center justify-center px-4 py-6 text-center">
            <Upload size={30} className="text-zinc-500 mb-2" />
            <p className="m-0 text-sm text-zinc-300 break-all">
              {file ? file.name : 'PDF upload'}
            </p>
            <p className="m-0 mt-1 text-[11px] text-zinc-500">
              application/pdf
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept={PDF_ACCEPT}
          />
        </label>

        <button
          type="button"
          onClick={uploadFile}
          disabled={!file || state === 'uploading'}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400 hover:bg-amber-400/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {state === 'uploading' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <FileUp size={16} />
          )}
          {state === 'uploading' ? 'Processing' : 'Upload PDF'}
        </button>

        <p
          className={`m-0 flex items-center justify-center gap-2 text-center text-sm ${statusClass(state)}`}
        >
          {statusIcon}
          <span>{status}</span>
        </p>
      </div>
    </div>
  );
}
