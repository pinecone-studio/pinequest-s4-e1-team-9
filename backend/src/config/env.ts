import * as dotenv from 'dotenv';

dotenv.config();

function resolvePort(portValue = process.env.PORT) {
  if (!portValue) {
    return 4000;
  }

  const port = Number(portValue);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: ${portValue}`);
  }

  return port;
}

function resolvePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value ?? fallback);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

const mib = 1024 * 1024;

export const env = {
  port: resolvePort(),
  host: process.env.HOST || '0.0.0.0',
  frontendOrigin: process.env.FRONTEND_ORIGIN || '*',
  defaultUserId:
    process.env.DEFAULT_USER_ID || '00000000-0000-4000-8000-000000000000',
  maxPdfFileSizeBytes: resolvePositiveInteger(
    process.env.PDF_MAX_FILE_SIZE_BYTES,
    25 * mib,
  ),
  maxChatHistoryMessages: resolvePositiveInteger(
    process.env.CHAT_MAX_HISTORY_MESSAGES,
    10,
  ),
  maxChatMessageChars: resolvePositiveInteger(
    process.env.CHAT_MAX_MESSAGE_CHARS,
    4_000,
  ),
  retrievalMatchCount: resolvePositiveInteger(
    process.env.RAG_RETRIEVAL_MATCH_COUNT,
    5,
  ),
  maxRetrievedContextChars: resolvePositiveInteger(
    process.env.RAG_MAX_CONTEXT_CHARS,
    12_000,
  ),
  maxRetrievedSourceChars: resolvePositiveInteger(
    process.env.RAG_MAX_SOURCE_CHARS,
    2_500,
  ),
  groqChatModel: process.env.GROQ_CHAT_MODEL || 'llama-3.3-70b-versatile',
  geminiEmbeddingModel:
    process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
  geminiEmbeddingConcurrency: resolvePositiveInteger(
    process.env.GEMINI_EMBEDDING_CONCURRENCY,
    4,
  ),
};

export function getSupabaseVectorConfig() {
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

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase configuration. Ensure SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY are set.',
    );
  }

  return {
    supabaseUrl,
    supabaseWriteKey,
    supabaseKey,
  };
}

export function getGoogleApiKey() {
  const googleApiKey = process.env.GOOGLE_API_KEY || '';

  if (!googleApiKey) {
    throw new Error('Missing GOOGLE_API_KEY configuration.');
  }

  return googleApiKey;
}

export function getDatabaseUrl() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  return connectionString;
}
