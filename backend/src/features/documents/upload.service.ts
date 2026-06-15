import type { IncomingMessage } from 'node:http';
import * as documentsRepo from '../../db/repositories/documents.repo.js';
import { ingestPDF } from './ingest.service.js';
import { removeTempFile, saveUploadedPdfFile } from './document.service.js';
import { uploadDocumentFileToStorage } from './storage.service.js';
import { DocumentProcessingError } from './types.js';

type IngestUploadedPdfInput = {
  req: IncomingMessage;
  uploadDir: string;
  userId: string;
  companyId?: string | null;
};

export async function ingestUploadedPdf({
  req,
  uploadDir,
  userId,
  companyId = null,
}: IngestUploadedPdfInput) {
  let filepath: string | null = null;
  let userDocument: Awaited<
    ReturnType<typeof documentsRepo.createUserDocument>
  > | null = null;

  try {
    const uploadedFile = await saveUploadedPdfFile(req, uploadDir);

    if (!uploadedFile) {
      throw new DocumentProcessingError('No file uploaded.', 400);
    }

    filepath = uploadedFile.filepath;
    userDocument = await documentsRepo.createUserDocument({
      userId,
      companyId,
      filename: uploadedFile.originalName,
      fileSize: uploadedFile.sizeBytes,
      mimeType: uploadedFile.mimeType,
    });

    const storagePath = await uploadDocumentFileToStorage({
      userId,
      companyId,
      documentId: userDocument.id,
      filePath: uploadedFile.filepath,
      mimeType: uploadedFile.mimeType,
    });

    userDocument =
      (await documentsRepo.updateUserDocument(userId, userDocument.id, {
        storagePath,
      })) ?? userDocument;

    const result = await ingestPDF({
      filePath: uploadedFile.filepath,
      userId,
      companyId,
      documentId: userDocument.id,
      filename: uploadedFile.originalName,
    });

    const readyDocument =
      (await documentsRepo.updateUserDocumentStatus(
        userId,
        userDocument.id,
        'ready',
      )) ?? userDocument;

    return {
      document: documentsRepo.serializeUserDocument(readyDocument),
      chunks: result.chunkCount,
    };
  } catch (error) {
    if (userDocument) {
      const clientMessage =
        error instanceof Error ? error.message : 'Failed to process PDF.';

      await documentsRepo
        .updateUserDocumentStatus(
          userId,
          userDocument.id,
          'error',
          clientMessage,
        )
        .catch((statusError) => {
          console.error('Failed to mark document as error:', statusError);
        });
    }

    throw error;
  } finally {
    await removeTempFile(filepath);
  }
}
