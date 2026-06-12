import type { DocumentInterface } from '@langchain/core/documents';

export type LoadedPdfDocument = DocumentInterface;

export type UploadedPdfFile = {
  filepath: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

export type IngestPdfInput = {
  filePath: string;
  userId: string;
  companyId?: string | null;
  documentId: string;
  filename: string;
};

export class DocumentProcessingError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 422,
  ) {
    super(message);
    this.name = 'DocumentProcessingError';
  }
}
