import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import fs from 'fs/promises';

const router = Router();

/**
 * Clean template for PDF text extraction.
 * TODO: Paste your existing PDF extraction logic here.
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    // TODO: Paste your existing PDF extraction logic here
    // Example: const data = await somePdfLibrary.parse(filePath);
    // return data.text;
    
    console.log(`Processing file at: ${filePath}`);
    return "Placeholder: Extracted text will appear here once logic is pasted.";
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

router.post('/extract', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const filePath = req.file.path;
    const extractedText = await extractTextFromPDF(filePath);

    // Optional: Clean up the file after extraction
    // await fs.unlink(filePath);

    res.json({
      message: 'Text extracted successfully',
      text: extractedText,
      metadata: {
        filename: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
