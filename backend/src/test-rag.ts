import { ingestPDF } from './ingest';
import { generateChatResponse } from './chatbot';
import * as path from 'path';

async function testRAG() {
  try {
    const pdfPath = path.resolve('sample.pdf');
    console.log(`Testing ingestion of: \${pdfPath}`);
    await ingestPDF(pdfPath);

    console.log('\n--- Testing Chat Response ---\n');
    const messages = [
      { role: 'user', content: 'Summarize the document and provide at least one citation.' }
    ];

    const response = await generateChatResponse(messages as any);
    console.log('Chatbot Response:');
    console.log(response);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRAG();
