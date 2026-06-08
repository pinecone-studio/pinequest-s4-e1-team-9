import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
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

export const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// 2. Initialize Google Generative AI Embeddings
// Using the official LangChain implementation for better reliability
export const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: googleApiKey,
  modelName: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
});

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
  const splitDocs = await textSplitter.splitDocuments(docs);

  console.log(
    `📤 Sending ${splitDocs.length} chunks to Supabase Vector Store...`,
  );

  // This automatically calls Gemini to vectorize text, then updates the Supabase table
  await SupabaseVectorStore.fromDocuments(splitDocs, embeddings, {
    client: supabaseClient,
    tableName: 'document_chunks',
    queryName: 'match_documents', // Targets the SQL function we created earlier
  });

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
