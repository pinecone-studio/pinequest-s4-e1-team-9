import * as dotenv from 'dotenv';

dotenv.config();

function resolvePort(portValue = process.env.PORT) {
  if (!portValue) {
    return 3001;
  }

  const port = Number(portValue);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return 3001;
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

function resolveStringList(value: string | undefined, fallback: string[]) {
  const values = value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return values?.length ? values : fallback;
}

const mib = 1024 * 1024;

export const env = {
  port: resolvePort(),
  host: process.env.HOST || '0.0.0.0',
  frontendOrigins: resolveStringList(process.env.FRONTEND_ORIGIN, [
    'http://localhost:3000',
    'http://localhost:3002',
  ]),
  supabaseStorageBucket:
    process.env.SUPABASE_STORAGE_BUCKET || 'user-documents',
  defaultUserId:
    process.env.DEFAULT_USER_ID || '00000000-0000-4000-8000-000000000000',
  maxPdfFileSizeBytes: resolvePositiveInteger(
    process.env.PDF_MAX_FILE_SIZE_BYTES,
    25 * mib,
  ),
  retrievalMatchCount: resolvePositiveInteger(
    process.env.RAG_RETRIEVAL_MATCH_COUNT,
    5,
  ),
  geminiEmbeddingModel:
    process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
  geminiEmbeddingConcurrency: resolvePositiveInteger(
    process.env.GEMINI_EMBEDDING_CONCURRENCY,
    4,
  ),
};

function getSupabaseUrl() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error(
      'Missing Supabase URL. Ensure SUPABASE_URL is set on the backend.',
    );
  }

  return supabaseUrl;
}

export function getSupabaseServiceRoleConfig() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseWriteKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseWriteKey) {
    throw new Error(
      'Missing backend Supabase service-role key. Ensure SUPABASE_SERVICE_ROLE_KEY is set server-side.',
    );
  }

  return {
    supabaseUrl,
    supabaseServiceRoleKey: supabaseWriteKey,
  };
}

export function getSupabaseVectorConfig() {
  const { supabaseUrl, supabaseServiceRoleKey } =
    getSupabaseServiceRoleConfig();

  return {
    supabaseUrl,
    supabaseWriteKey: supabaseServiceRoleKey,
    supabaseKey: supabaseServiceRoleKey,
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
