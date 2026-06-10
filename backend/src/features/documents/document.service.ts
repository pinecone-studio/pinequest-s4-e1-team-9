import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import type { IncomingMessage } from 'node:http';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { env } from '../../config/env.js';
import { DocumentProcessingError, type UploadedPdfFile } from './types.js';

const pdfHeader = Buffer.from('%PDF-');
const allowedPdfMimeTypes = new Set(['application/pdf', 'application/x-pdf']);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createFetchHeaders(req: IncomingMessage) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }

  return headers;
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === 'object' &&
    value !== null &&
    'arrayBuffer' in value &&
    typeof value.arrayBuffer === 'function'
  );
}

function getSingleHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function getRequestUserId(req: IncomingMessage) {
  const headerUserId = getSingleHeaderValue(req.headers['x-user-id'])?.trim();
  const userId = headerUserId || env.defaultUserId;

  if (!uuidPattern.test(userId)) {
    throw new DocumentProcessingError(
      'Invalid user id. Upload requests must include a valid UUID user id.',
      400,
    );
  }

  return userId;
}

function validateUploadedPdfMetadata(file: File) {
  const originalName = file.name?.trim() || 'uploaded.pdf';
  const extension = path.extname(originalName).toLowerCase();
  const mimeType = file.type?.trim().toLowerCase() || '';

  if (extension !== '.pdf') {
    throw new DocumentProcessingError('Only PDF files are supported.', 415);
  }

  if (!allowedPdfMimeTypes.has(mimeType)) {
    throw new DocumentProcessingError(
      'The uploaded file must have a PDF content type.',
      415,
    );
  }

  if (file.size <= 0) {
    throw new DocumentProcessingError('The uploaded PDF is empty.', 400);
  }

  if (file.size > env.maxPdfFileSizeBytes) {
    throw new DocumentProcessingError(
      `The uploaded PDF is too large. Maximum size is ${Math.floor(
        env.maxPdfFileSizeBytes / 1024 / 1024,
      )} MB.`,
      413,
    );
  }

  return { originalName, mimeType };
}

async function writePdfStreamToTempFile(file: File, filepath: string) {
  const reader = file.stream().getReader();
  const handle = await fs.promises.open(filepath, 'wx');
  let header = Buffer.alloc(0);
  let sizeBytes = 0;

  try {
    let readResult = await reader.read();
    while (!readResult.done) {
      const { value } = readResult;
      const chunk = Buffer.from(value);

      if (!chunk.length) {
        readResult = await reader.read();
        continue;
      }

      sizeBytes += chunk.length;

      if (sizeBytes > env.maxPdfFileSizeBytes) {
        throw new DocumentProcessingError(
          `The uploaded PDF is too large. Maximum size is ${Math.floor(
            env.maxPdfFileSizeBytes / 1024 / 1024,
          )} MB.`,
          413,
        );
      }

      if (header.length < pdfHeader.length) {
        header = Buffer.concat([header, chunk]).subarray(0, pdfHeader.length);
      }

      await handle.write(chunk);
      readResult = await reader.read();
    }
  } finally {
    await handle.close();
  }

  if (sizeBytes === 0) {
    throw new DocumentProcessingError('The uploaded PDF is empty.', 400);
  }

  if (!header.equals(pdfHeader)) {
    throw new DocumentProcessingError(
      'The uploaded file is not a valid PDF.',
      415,
    );
  }

  return sizeBytes;
}

export async function removeTempFile(filepath: string | null | undefined) {
  if (!filepath) {
    return;
  }

  await fs.promises.unlink(filepath).catch(() => undefined);
}

export async function saveUploadedPdfFile(
  req: IncomingMessage,
  uploadDir: string,
): Promise<UploadedPdfFile | null> {
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const request = new Request(
    `http://${req.headers.host || 'localhost'}/upload`,
    {
      method: req.method,
      headers: createFetchHeaders(req),
      body: Readable.toWeb(req) as ReadableStream<Uint8Array>,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' },
  );

  const formData = await request.formData();
  const file = formData.get('file');

  if (!isUploadedFile(file)) {
    return null;
  }

  const { originalName, mimeType } = validateUploadedPdfMetadata(file);
  const filepath = path.join(uploadDir, `${randomUUID()}.pdf`);

  try {
    const sizeBytes = await writePdfStreamToTempFile(file, filepath);

    return {
      filepath,
      originalName,
      mimeType,
      sizeBytes,
    };
  } catch (error) {
    await removeTempFile(filepath);
    throw error;
  }
}
