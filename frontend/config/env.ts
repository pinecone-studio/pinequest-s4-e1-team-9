const fallbackApiOrigin =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:4000'
    : 'https://pinequest-s4-e1-team-9.onrender.com';

export const clientEnv = {
  chatApiUrl:
    process.env.NEXT_PUBLIC_CHAT_API_URL || `${fallbackApiOrigin}/chat`,
  uploadApiUrl:
    process.env.NEXT_PUBLIC_UPLOAD_API_URL || `${fallbackApiOrigin}/upload`,
};
