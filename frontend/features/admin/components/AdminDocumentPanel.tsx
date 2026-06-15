'use client';

import { AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-react';
import { useAdminDocumentUpload } from '@/features/admin/hooks/useAdminDocumentUpload';
import type { Company } from '@/features/admin/types';
import { formatCompanyRole } from '@/features/companies/types';
import { cn } from '@/shared/lib/utils';

export default function AdminDocumentPanel({ company }: { company: Company }) {
  const {
    file,
    isDragging,
    loading,
    result,
    error,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileChange,
    uploadFile,
  } = useAdminDocumentUpload(company.id);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
      <div className="p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">{company.name}</h2>
          <p className="text-sm text-gray-500">
            Uploading as {formatCompanyRole(company.role)} for this workspace.
          </p>
        </div>

        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            'relative rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200',
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400',
          )}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={onFileChange}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <div className="flex flex-col items-center">
            <Upload
              className={cn(
                'mb-4 h-12 w-12 transition-colors',
                isDragging ? 'text-blue-500' : 'text-gray-400',
              )}
            />
            <p className="text-lg font-medium text-gray-700">
              {file ? file.name : 'Drag and drop your PDF here'}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              or click to browse from your computer
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={uploadFile}
            disabled={!file || loading}
            className={cn(
              'flex items-center justify-center rounded-md border border-transparent px-8 py-3 text-base font-medium text-white shadow-md transition-all',
              !file || loading
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95',
            )}
          >
            {loading ? (
              <>
                <Loader2 className="-ml-1 mr-3 h-5 w-5 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload PDF'
            )}
          </button>
        </div>

        {error && (
          <div className="mt-6 flex items-start space-x-3 rounded-lg bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-8">
            <div className="mb-4 flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Processed Document
              </h2>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-gray-700">
                {JSON.stringify(
                  {
                    documentId: result.document?.id,
                    filename: result.document?.filename,
                    status: result.document?.status,
                    chunks: result.chunks,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
