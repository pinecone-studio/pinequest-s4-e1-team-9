// 🛠️ REMOVED THE TRAILING `.js` FROM ALL LAYERED SUBPATHS:
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// 1. Initialize Supabase Client
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Ensure SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) are set.',
  );
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// 🛠️ FIX 1: Changed 'model' to 'modelName'
export const vectorStore = new SupabaseVectorStore(
  new GoogleGenerativeAIEmbeddings({ modelName: 'text-embedding-004' }),
  {
    client: supabaseClient,
    tableName: 'documents',
    queryName: 'match_documents',
  },
);

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

  // 🛠️ FIX 2: Changed 'model' to 'modelName'
  await SupabaseVectorStore.fromDocuments(
    splitDocs,
    new GoogleGenerativeAIEmbeddings({ modelName: 'text-embedding-004' }),
    {
      client: supabaseClient,
      tableName: 'documents',
      queryName: 'match_documents',
    },
  );

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
