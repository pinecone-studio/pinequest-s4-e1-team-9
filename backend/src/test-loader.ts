import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';

async function testLoader() {
  try {
    const loader = new PDFLoader('sample.pdf');
    const docs = await loader.load();
    console.log('Docs loaded:', docs.length);
    if (docs.length > 0) {
      console.log('First doc content preview:', docs[0].pageContent.substring(0, 100));
    } else {
      console.log('No documents extracted. The PDF might be empty or scanned.');
    }
  } catch (e) {
    console.error('Loader failed:', e);
  }
}
testLoader();
