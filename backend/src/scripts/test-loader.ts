import { loadPdfDocuments } from '../features/documents/pdf.service.js';

async function testLoader() {
  try {
    const docs = await loadPdfDocuments('sample.pdf');
    console.log('Docs loaded:', docs.length);
    if (docs.length > 0) {
      console.log(
        'First doc content preview:',
        docs[0].pageContent.substring(0, 100),
      );
    } else {
      console.log('No documents extracted. The PDF might be empty or scanned.');
    }
  } catch (error) {
    console.error('Loader failed:', error);
  }
}

if (import.meta.main) {
  void testLoader();
}
