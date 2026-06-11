import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocumentProcessingError } from './types.js';

export async function loadPdfDocuments(filePath: string) {
  let docs;

  try {
    const loader = new PDFLoader(filePath);
    docs = await loader.load();
  } catch (error) {
    throw new DocumentProcessingError(
      'We could not read this PDF. Please try another PDF file.',
      422,
    );
  }

  if (docs.length === 0 || docs.every((doc) => !doc.pageContent.trim())) {
    throw new DocumentProcessingError(
      'No readable text was found in this PDF.',
      422,
    );
  }

  return docs;
}
