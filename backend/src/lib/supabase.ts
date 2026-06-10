import { createClient } from '@supabase/supabase-js';
import {
  getSupabaseAuthConfig,
  getSupabaseServiceRoleConfig,
} from '../config/env.js';

let authClient: ReturnType<typeof createClient> | null = null;
let serviceRoleClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAuthClient() {
  if (!authClient) {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseAuthConfig();

    authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return authClient;
}

export function getSupabaseServiceRoleClient() {
  if (!serviceRoleClient) {
    const { supabaseUrl, supabaseServiceRoleKey } =
      getSupabaseServiceRoleConfig();

    serviceRoleClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return serviceRoleClient;
}
