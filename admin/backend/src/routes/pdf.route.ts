import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import fs from 'fs/promises';
import { env } from '../config/env.js';
import { ingestPDF } from '../features/documents/ingest.service.js';
import { uploadDocumentFileToStorage } from '../features/documents/storage.service.js';
import * as documentsRepo from '../db/repositories/documents.repo.js';

const router = Router();

router.post('/extract', upload.single('pdf'), async (req, res) => {
  let filePath: string | null = null;
  const userId = env.defaultUserId;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    filePath = req.file.path;
    const filename = req.file.originalname;
    const mimeType = req.file.mimetype;
    const fileSize = req.file.size;

    console.log(`Processing PDF: ${filename} for user: ${userId}`);

    // 1. Create document entry in DB
    let userDocument = await documentsRepo.createUserDocument({
      userId,
      filename,
      fileSize,
      mimeType,
    });

    try {
      // 2. Upload to Supabase Storage
      const storagePath = await uploadDocumentFileToStorage({
        userId,
        documentId: userDocument.id,
        filePath,
        filename,
        mimeType,
      });

      // 3. Update storage path
      userDocument = await documentsRepo.updateUserDocument(userId, userDocument.id, {
        storagePath,
      }) ?? userDocument;

      // 4. Ingest PDF (chunking and embedding)
      const result = await ingestPDF({
        filePath,
        userId,
        documentId: userDocument.id,
        filename,
      });

      // 5. Mark as ready
      await documentsRepo.updateUserDocumentStatus(
        userId,
        userDocument.id,
        'ready'
      );

      res.json({
        message: 'PDF processed and embedded successfully',
        documentId: userDocument.id,
        chunkCount: result.chunkCount,
        metadata: {
          filename,
          size: fileSize
        }
      });
    } catch (error: any) {
      console.error('Error during PDF processing:', error);
      
      // Mark document as error in DB
      await documentsRepo.updateUserDocumentStatus(
        userId,
        userDocument.id,
        'error',
        error.message || 'Failed to process PDF'
      );

      throw error;
    }
  } catch (error: any) {
    console.error('PDF extraction route error:', error);
    res.status(500).json({ error: error.message || 'Failed to process PDF' });
  } finally {
    // Optional: Clean up the temp file after extraction
    if (filePath) {
      await fs.unlink(filePath).catch(() => undefined);
    }
  }
});

export default router;
