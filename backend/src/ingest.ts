import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Supabase Client
// Ensure these environment variables are set in your terminal or .env file
const supabaseUrl =
  process.env.SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.',
  );
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Define vectorStore globally so it can be exported and used in chatbot.ts
export const vectorStore = new SupabaseVectorStore(
  new OpenAIEmbeddings({ modelName: 'text-embedding-3-small' }),
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

  // This automatically calls OpenAI to vectorize text, then updates the Supabase table
  await SupabaseVectorStore.fromDocuments(
    splitDocs,
    new OpenAIEmbeddings({ modelName: 'text-embedding-3-small' }),
    {
      client: supabaseClient,
      tableName: 'documents',
      queryName: 'match_documents', // Targets the SQL function we created earlier
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
