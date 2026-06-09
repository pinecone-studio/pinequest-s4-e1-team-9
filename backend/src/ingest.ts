import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import {
  GoogleGenerativeAIEmbeddings,
  type GoogleGenerativeAIEmbeddingsParams,
} from '@langchain/google-genai';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// 1. Initialize Supabase Client
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseWriteKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_KEY;
const supabaseKey =
  supabaseWriteKey ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const googleApiKey = process.env.GOOGLE_API_KEY || '';
const embeddingModelName =
  process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
const embeddingConcurrency = Number(
  process.env.GEMINI_EMBEDDING_CONCURRENCY || 4,
);

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase configuration. Ensure SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY are set.',
  );
}

if (!googleApiKey) {
  throw new Error('Missing GOOGLE_API_KEY configuration.');
}

let warnedAboutPublicSupabaseKey = false;

function warnIfUsingPublicSupabaseKey() {
  if (supabaseWriteKey || warnedAboutPublicSupabaseKey) {
    return;
  }

  warnedAboutPublicSupabaseKey = true;
  console.warn(
    'SUPABASE_SERVICE_ROLE_KEY is not set. Falling back to SUPABASE_ANON_KEY for PDF ingestion; make sure database grants/RLS allow document_chunks writes.',
  );
}

type GeminiTaskType = NonNullable<
  GoogleGenerativeAIEmbeddingsParams['taskType']
>;

const retrievalDocumentTaskType = 'RETRIEVAL_DOCUMENT' as GeminiTaskType;
const retrievalQueryTaskType = 'RETRIEVAL_QUERY' as GeminiTaskType;

function supportsEmbeddingTaskType(modelName: string) {
  const normalizedModelName = modelName.replace(/^models\//, '');

  return (
    normalizedModelName === 'embedding-001' ||
    normalizedModelName === 'gemini-embedding-001'
  );
}

function createEmbeddings(taskType?: GeminiTaskType) {
  const params: GoogleGenerativeAIEmbeddingsParams = {
    apiKey: googleApiKey,
    modelName: embeddingModelName,
  };

  if (taskType && supportsEmbeddingTaskType(embeddingModelName)) {
    params.taskType = taskType;
  }

  return new GoogleGenerativeAIEmbeddings(params);
}

async function embedDocumentChunks(texts: string[]) {
  const concurrency =
    Number.isFinite(embeddingConcurrency) && embeddingConcurrency > 0
      ? Math.floor(embeddingConcurrency)
      : 1;
  const vectors: number[][] = [];
  let expectedDimensions: number | null = null;

  for (let start = 0; start < texts.length; start += concurrency) {
    const batch = texts.slice(start, start + concurrency);
    const batchVectors = await Promise.all(
      batch.map(async (text, batchIndex) => {
        const chunkIndex = start + batchIndex;
        const vector = await documentEmbeddings.embedQuery(text);

        if (vector.length === 0) {
          throw new Error(
            `Gemini returned an empty embedding for chunk ${chunkIndex + 1}. Check GOOGLE_API_KEY, Gemini API access/quota, and GEMINI_EMBEDDING_MODEL.`,
          );
        }

        if (expectedDimensions === null) {
          expectedDimensions = vector.length;
        } else if (vector.length !== expectedDimensions) {
          throw new Error(
            `Gemini returned inconsistent embedding dimensions. Expected ${expectedDimensions}, got ${vector.length} for chunk ${chunkIndex + 1}.`,
          );
        }

        return vector;
      }),
    );

    vectors.push(...batchVectors);
    console.log(`🧠 Generated ${vectors.length}/${texts.length} embeddings...`);
  }

  return vectors;
}

export const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// 2. Initialize Google Generative AI Embeddings
// Using the official LangChain implementation for better reliability
export const documentEmbeddings = createEmbeddings(retrievalDocumentTaskType);
export const embeddings = createEmbeddings(retrievalQueryTaskType);

// Define vectorStore globally so it can be exported and used in chatbot.ts
export const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabaseClient,
  tableName: 'document_chunks',
  queryName: 'match_documents',
});

/**
 * Parses a local PDF, vectorizes it, and saves it permanently to Supabase.
 * Returns a configured retriever for the LangGraph chatbot to query.
 */
export async function ingestPDF(filePath: string) {
  warnIfUsingPublicSupabaseKey();

  console.log('⏳ Loading local PDF document...');
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();

  if (docs.length === 0 || docs.every((d) => !d.pageContent.trim())) {
    throw new Error(
      'No text content found in the PDF. It might be empty or scanned (image-based).',
    );
  }

  console.log('✂️ Chunking text down to optimal sizes...');
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 150,
  });
  const splitDocs = (await textSplitter.splitDocuments(docs)).filter((doc) =>
    doc.pageContent.trim(),
  );

  if (splitDocs.length === 0) {
    throw new Error(
      'No usable text chunks found in the PDF after splitting. It might be empty or scanned (image-based).',
    );
  }

  console.log(`📤 Generating embeddings for ${splitDocs.length} chunks...`);

  const vectors = await embedDocumentChunks(
    splitDocs.map((doc) => doc.pageContent),
  );

  console.log('📦 Sending vectors to Supabase Vector Store...');

  await vectorStore.addVectors(vectors, splitDocs);

  console.log('✅ Vector embeddings safely stored in Supabase!');

  // Return a retriever configured to grab the top 5 most relevant segments
  return vectorStore.asRetriever({ k: 5 });
}

/**
 * Helper function for your chatbot.ts file to query Supabase without re-uploading the file.
 */
export function getSupabaseRetriever() {
  return vectorStore.asRetriever({ k: 5 });
}
