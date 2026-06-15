const fallbackApiOrigin =
  process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:4000'
    : 'https://pinequest-s4-e1-team-9.onrender.com';

function resolvePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value ?? fallback);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

export const clientEnv = {
  chatApiUrl:
    process.env.NEXT_PUBLIC_CHAT_API_URL || `${fallbackApiOrigin}/chat`,
  uploadApiUrl:
    process.env.NEXT_PUBLIC_UPLOAD_API_URL || `${fallbackApiOrigin}/upload`,
  documentsApiUrl:
    process.env.NEXT_PUBLIC_DOCUMENTS_API_URL ||
    `${fallbackApiOrigin}/documents`,
  companiesApiUrl:
    process.env.NEXT_PUBLIC_COMPANIES_API_URL ||
    `${fallbackApiOrigin}/api/companies`,
  invitesApiUrl:
    process.env.NEXT_PUBLIC_INVITES_API_URL || `${fallbackApiOrigin}/api/invites`,
  preferencesApiUrl:
    process.env.NEXT_PUBLIC_PREFERENCES_API_URL ||
    `${fallbackApiOrigin}/api/me/preferences`,
  profileApiUrl:
    process.env.NEXT_PUBLIC_PROFILE_API_URL ||
    `${fallbackApiOrigin}/api/me/profile`,
  eventsApiBaseUrl:
    process.env.NEXT_PUBLIC_EVENTS_API_BASE_URL ||
    `${fallbackApiOrigin}/api/ais`,
  adminCompaniesApiUrl:
    process.env.NEXT_PUBLIC_ADMIN_COMPANIES_API_URL ||
    `${fallbackApiOrigin}/admin/companies`,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  maxChatHistoryMessages: resolvePositiveInteger(
    process.env.NEXT_PUBLIC_CHAT_MAX_HISTORY_MESSAGES,
    10,
  ),
};
