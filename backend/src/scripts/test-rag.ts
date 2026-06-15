import * as path from 'path';
import { env } from '../config/env.js';
import {
  createUserDocument,
  updateUserDocumentStatus,
} from '../db/repositories/documents.repo.js';
import { generateChatResponse } from '../features/chat/chat.service.js';
import type { ChatMessage } from '../features/chat/types.js';
import { ingestPDF } from '../features/documents/ingest.service.js';

async function testRAG() {
  try {
    const pdfPath = path.resolve('sample.pdf');
    const filename = path.basename(pdfPath);
    console.log(`Testing ingestion of: ${pdfPath}`);
    const userDocument = await createUserDocument({
      userId: env.defaultUserId,
      filename,
      mimeType: 'application/pdf',
    });

    await ingestPDF({
      filePath: pdfPath,
      userId: env.defaultUserId,
      documentId: userDocument.id,
      filename,
    });
    await updateUserDocumentStatus(env.defaultUserId, userDocument.id, 'ready');

    console.log('\n--- Testing Chat Response ---\n');
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: 'Summarize the document and provide at least one citation.',
      },
    ];

    const response = await generateChatResponse(messages, {
      userId: env.defaultUserId,
      companyId: env.defaultUserId,
      userName: 'Test User',
    });
    console.log('Chatbot Response:');
    console.log(response);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

if (import.meta.main) {
  void testRAG();
}
