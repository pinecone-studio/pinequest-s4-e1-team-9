'use client';

import { useCallback, useState } from 'react';
import { uploadAdminDocument } from '@/features/admin/api';
import type { AdminUploadResponse } from '@/features/admin/types';

export function useAdminDocumentUpload(companyId: string | null) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdminUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectFile = useCallback((selectedFile: File | null) => {
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    setFile(selectedFile);
    setError(null);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      selectFile(event.dataTransfer.files[0] ?? null);
    },
    [selectFile],
  );

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0] ?? null);
  };

  const uploadFile = async () => {
    if (!file || !companyId) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const data = await uploadAdminDocument(file, companyId);
      setResult(data);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'An error occurred during upload.',
      );
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
}
