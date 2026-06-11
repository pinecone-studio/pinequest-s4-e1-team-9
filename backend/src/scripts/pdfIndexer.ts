import fs from 'fs';
import * as pdf from 'pdf-parse';

interface PDFChunk {
  text: string;
  metadata: {
    source: string;
    page: number;
  };
}

/**
 * @param filePath PDF файлын байршил
 * @param fileName Файлын нэр (Ишлэлд ашиглагдана)
 */
export async function parsePdfByPages(
  filePath: string,
  fileName: string,
): Promise<PDFChunk[]> {
  const dataBuffer = fs.readFileSync(filePath);
  const chunks: PDFChunk[] = [];

  const options = {
    pagerender: async (pageData: any) => {
      const textContent = await pageData.getTextContent();
      let lastY: number | undefined;
      let text = '';

      for (const item of textContent.items as any[]) {
        if (lastY === item.transform[5] || !lastY) {
          text += item.str;
        } else {
          text += '\n' + item.str;
        }
        lastY = item.transform[5];
      }

      chunks.push({
        text: text,
        metadata: {
          source: fileName,
          page: pageData.pageIndex + 1,
        },
      });

      return text;
    },
  };

  await (pdf as any)(dataBuffer, options);

  return chunks;
}
