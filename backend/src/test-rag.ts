import { ingestPDF } from './ingest.ts';
import { generateChatResponse } from './chatbot.ts';
import type { ChatMessage } from './chatbot.ts';
import * as path from 'path';

async function testRAG() {
  try {
    const pdfPath = path.resolve('sample.pdf');
    console.log(`Testing ingestion of: ${pdfPath}`);
    await ingestPDF(pdfPath);

    console.log('\n--- Testing Chat Response ---\n');
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: 'Summarize the document and provide at least one citation.',
      },
    ];

    const response = await generateChatResponse(messages);
    console.log('Chatbot Response:');
    console.log(response);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRAG();
