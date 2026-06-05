import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { Embeddings } from '@langchain/core/embeddings';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// 1. Initialize Supabase Client
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const googleApiKey = process.env.GOOGLE_API_KEY || '';

const GEMINI_EMBEDDING_MODEL = (
  process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001'
).replace(/^models\//, '');
const GEMINI_EMBEDDING_DIMENSIONS = Number(
  process.env.GEMINI_EMBEDDING_DIMENSIONS || 1536,
);
const GEMINI_EMBEDDING_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent`;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase configuration. Ensure SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY are set.',
  );
}

if (!googleApiKey) {
  throw new Error('Missing GOOGLE_API_KEY configuration.');
}

if (
  !Number.isInteger(GEMINI_EMBEDDING_DIMENSIONS) ||
  GEMINI_EMBEDDING_DIMENSIONS <= 0
) {
  throw new Error('GEMINI_EMBEDDING_DIMENSIONS must be a positive integer.');
}

export const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

type GeminiEmbeddingTaskType = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY';

type GeminiEmbeddingResponse = {
  embedding?: {
    values?: number[];
  };
};

function normalizeEmbedding(values: number[]) {
  const magnitude = Math.sqrt(
    values.reduce((sum, value) => sum + value * value, 0),
  );

  if (!magnitude) {
    return values;
  }

  return values.map((value) => value / magnitude);
}

function assertEmbeddingDimensions(values: number[]) {
  if (values.length !== GEMINI_EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Gemini returned ${values.length} embedding dimensions, but Supabase is configured for vector(${GEMINI_EMBEDDING_DIMENSIONS}).`,
    );
  }
}

class GeminiEmbeddings extends Embeddings {
  constructor() {
    super({});
  }

  async embedDocuments(documents: string[]) {
    return Promise.all(
      documents.map((document) =>
        this.embedText(document, 'RETRIEVAL_DOCUMENT'),
      ),
    );
  }

  async embedQuery(document: string) {
    return this.embedText(document, 'RETRIEVAL_QUERY');
  }

  private async embedText(text: string, taskType: GeminiEmbeddingTaskType) {
    const response = await fetch(GEMINI_EMBEDDING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': googleApiKey,
      },
      body: JSON.stringify({
        content: {
          parts: [{ text: text.replace(/\n/g, ' ') }],
        },
        output_dimensionality: GEMINI_EMBEDDING_DIMENSIONS,
        taskType,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();

      throw new Error(
        `Gemini embedding request failed: ${response.status} ${response.statusText} ${errorBody}`,
      );
    }

    const data = (await response.json()) as GeminiEmbeddingResponse;
    const values = data.embedding?.values;

    if (!values) {
      throw new Error('Gemini embedding response did not include values.');
    }

    assertEmbeddingDimensions(values);

    return normalizeEmbedding(values);
  }
}

export const embeddings = new GeminiEmbeddings();

// Define vectorStore globally so it can be exported and used in chatbot.ts
export const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabaseClient,
  tableName: 'documents',
  queryName: 'match_documents',
});

/**
 * Parses a local PDF, vectorizes it, and saves it permanently to Supabase.
 * Returns a configured retriever for the LangGraph chatbot to query.
 */
export async function ingestPDF(filePath: string) {
  console.log('⏳ Loading local PDF document...');
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();

  console.log('✂️ Chunking text down to optimal sizes...');
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const splitDocs = await textSplitter.splitDocuments(docs);

  console.log(
    `📤 Sending ${splitDocs.length} chunks to Supabase Vector Store...`,
  );

  // This automatically calls Gemini to vectorize text, then updates the Supabase table
  await SupabaseVectorStore.fromDocuments(splitDocs, embeddings, {
    client: supabaseClient,
    tableName: 'documents',
    queryName: 'match_documents', // Targets the SQL function we created earlier
  });

  console.log('✅ Vector embeddings safely stored in Supabase!');

  // Return a retriever configured to grab the top 3 most relevant segments
  return vectorStore.asRetriever({ k: 3 });
}

/**
 * Helper function for your chatbot.ts file to query Supabase without re-uploading the file.
 */
export function getSupabaseRetriever() {
  return vectorStore.asRetriever({ k: 3 });
}
