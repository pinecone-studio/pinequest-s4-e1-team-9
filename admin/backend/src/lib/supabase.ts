import { createClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleConfig } from '../config/env.js';

let supabaseServiceRoleClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseServiceRoleClient() {
  if (!supabaseServiceRoleClient) {
    const { supabaseUrl, supabaseServiceRoleKey } =
      getSupabaseServiceRoleConfig();
    supabaseServiceRoleClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }

  return supabaseServiceRoleClient;
}
