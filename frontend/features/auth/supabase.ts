'use client';

import { createClient } from '@supabase/supabase-js';
import { clientEnv } from '@/config/env';

let supabaseClient: ReturnType<typeof createClient> | null = null;

export function hasSupabaseBrowserConfig() {
  return Boolean(clientEnv.supabaseUrl && clientEnv.supabaseAnonKey);
}

export function getSupabaseBrowserClient() {
  if (!hasSupabaseBrowserConfig()) {
    throw new Error('Supabase browser auth is not configured.');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(
      clientEnv.supabaseUrl,
      clientEnv.supabaseAnonKey,
    );
  }

  return supabaseClient;
}

export async function getAuthHeaders() {
  const { data, error } = await getSupabaseBrowserClient().auth.getSession();
  const accessToken = data.session?.access_token;

  if (error || !accessToken) {
    throw new Error('Please sign in before sending requests.');
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}
