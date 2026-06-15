const localApiOrigin = 'http://127.0.0.1:4000';

const apiPathByKey = {
  chatApiUrl: '/chat',
  uploadApiUrl: '/upload',
  documentsApiUrl: '/documents',
  companiesApiUrl: '/api/companies',
  invitesApiUrl: '/api/invites',
  preferencesApiUrl: '/api/me/preferences',
  profileApiUrl: '/api/me/profile',
  eventsApiBaseUrl: '/api/ais',
  adminCompaniesApiUrl: '/admin/companies',
} as const;

type ApiPath = (typeof apiPathByKey)[keyof typeof apiPathByKey];

export function normalizeApiOrigin(value: string | undefined) {
  const trimmed = value?.trim().replace(/\/+$/, '') ?? '';

  if (!trimmed) {
    return '';
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    return trimmed;
  }
}

function isLocalApiUrl(value: string) {
  try {
    const parsed = new URL(value);

    return ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function isProductionLocalhostApiUrl(value: string) {
  return process.env.NODE_ENV === 'production' && isLocalApiUrl(value);
}

export function buildApiResourceUrl(
  apiOrigin: string,
  path: ApiPath,
  resourceOverride?: string,
  envName = 'NEXT_PUBLIC_API_URL',
) {
  const override = resourceOverride?.trim().replace(/\/+$/, '') ?? '';
  const configuredValue = override || apiOrigin;

  if (!configuredValue) {
    return '';
  }

  if (isProductionLocalhostApiUrl(configuredValue)) {
    console.warn(
      `${envName} points to localhost in production and will be ignored. Configure NEXT_PUBLIC_API_URL with the deployed HTTPS backend origin.`,
    );
    return '';
  }

  if (override.endsWith(path)) {
    return override;
  }

  return `${configuredValue}${path}`;
}

const configuredApiOrigin = normalizeApiOrigin(
  process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'development' ? localApiOrigin : ''),
);

function resolvePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value ?? fallback);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

export const clientEnv = {
  apiOrigin: configuredApiOrigin,
  chatApiUrl: buildApiResourceUrl(
    configuredApiOrigin,
    apiPathByKey.chatApiUrl,
    process.env.NEXT_PUBLIC_CHAT_API_URL,
    'NEXT_PUBLIC_CHAT_API_URL',
  ),
  uploadApiUrl: buildApiResourceUrl(
    configuredApiOrigin,
    apiPathByKey.uploadApiUrl,
    process.env.NEXT_PUBLIC_UPLOAD_API_URL,
    'NEXT_PUBLIC_UPLOAD_API_URL',
  ),
  documentsApiUrl: buildApiResourceUrl(
    configuredApiOrigin,
    apiPathByKey.documentsApiUrl,
    process.env.NEXT_PUBLIC_DOCUMENTS_API_URL,
    'NEXT_PUBLIC_DOCUMENTS_API_URL',
  ),
  companiesApiUrl: buildApiResourceUrl(
    configuredApiOrigin,
    apiPathByKey.companiesApiUrl,
    process.env.NEXT_PUBLIC_COMPANIES_API_URL,
    'NEXT_PUBLIC_COMPANIES_API_URL',
  ),
  invitesApiUrl: buildApiResourceUrl(
    configuredApiOrigin,
    apiPathByKey.invitesApiUrl,
    process.env.NEXT_PUBLIC_INVITES_API_URL,
    'NEXT_PUBLIC_INVITES_API_URL',
  ),
  preferencesApiUrl: buildApiResourceUrl(
    configuredApiOrigin,
    apiPathByKey.preferencesApiUrl,
    process.env.NEXT_PUBLIC_PREFERENCES_API_URL,
    'NEXT_PUBLIC_PREFERENCES_API_URL',
  ),
  profileApiUrl: buildApiResourceUrl(
    configuredApiOrigin,
    apiPathByKey.profileApiUrl,
    process.env.NEXT_PUBLIC_PROFILE_API_URL,
    'NEXT_PUBLIC_PROFILE_API_URL',
  ),
  eventsApiBaseUrl: buildApiResourceUrl(
    configuredApiOrigin,
    apiPathByKey.eventsApiBaseUrl,
    process.env.NEXT_PUBLIC_EVENTS_API_BASE_URL,
    'NEXT_PUBLIC_EVENTS_API_BASE_URL',
  ),
  adminCompaniesApiUrl: buildApiResourceUrl(
    configuredApiOrigin,
    apiPathByKey.adminCompaniesApiUrl,
    process.env.NEXT_PUBLIC_ADMIN_COMPANIES_API_URL,
    'NEXT_PUBLIC_ADMIN_COMPANIES_API_URL',
  ),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  maxChatHistoryMessages: resolvePositiveInteger(
    process.env.NEXT_PUBLIC_CHAT_MAX_HISTORY_MESSAGES,
    10,
  ),
};
