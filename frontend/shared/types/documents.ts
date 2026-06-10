export const PDF_ACCEPT = 'application/pdf,.pdf';

export type UploadDocumentResponse = {
  message?: string;
  document?: {
    id: string;
    filename: string;
    status: string;
  };
  error?: string;
};
