import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { DocumentProcessingError, type LoadedPdfDocument } from './types.js';

export async function splitPdfDocuments(docs: LoadedPdfDocument[]) {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 150,
  });

  const splitDocs = (await textSplitter.splitDocuments(docs)).filter((doc) =>
    doc.pageContent.trim(),
  );

  if (splitDocs.length === 0) {
    throw new DocumentProcessingError(
      'No usable text chunks were found in this PDF.',
      422,
    );
  }

  return splitDocs;
}
