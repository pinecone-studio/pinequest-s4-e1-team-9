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

function resolveStringList(value: string | undefined, fallback: string[]) {
  const values = value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const resolvedValues = values?.length ? values : fallback;

  if (resolvedValues.includes('*')) {
    throw new Error('FRONTEND_ORIGIN must not contain wildcard origins.');
  }

  return resolvedValues;
}

const mib = 1024 * 1024;

export const env = {
  port: resolvePort(),
  host: process.env.HOST || '0.0.0.0',
  frontendOrigins: resolveStringList(process.env.FRONTEND_ORIGIN, [
    'http://localhost:3000',
  ]),
  publicAppUrl:
    process.env.PUBLIC_APP_URL ||
    process.env.FRONTEND_ORIGIN?.split(',')[0]?.trim() ||
    'http://localhost:3000',
  inviteCodePepper: process.env.INVITE_CODE_PEPPER || '',
  supabaseStorageBucket:
    process.env.SUPABASE_STORAGE_BUCKET || 'user-documents',
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
  chatRateLimitPerMinute: resolvePositiveInteger(
    process.env.CHAT_RATE_LIMIT_PER_MINUTE,
    20,
  ),
  uploadRateLimitPerMinute: resolvePositiveInteger(
    process.env.UPLOAD_RATE_LIMIT_PER_MINUTE,
    5,
  ),
  inviteRedeemRateLimitPerMinute: resolvePositiveInteger(
    process.env.INVITE_REDEEM_RATE_LIMIT_PER_MINUTE,
    10,
  ),
  defaultEventTimezone:
    process.env.DEFAULT_EVENT_TIMEZONE || 'Asia/Ulaanbaatar',
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

export function getSupabaseAuthConfig() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing Supabase anon key. Ensure SUPABASE_ANON_KEY is set on the backend.',
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
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
