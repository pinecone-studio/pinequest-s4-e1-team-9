import { createClient } from '@supabase/supabase-js';
import { getSupabaseVectorConfig } from '../config/env.js';

async function check() {
  const { supabaseUrl, supabaseKey } = getSupabaseVectorConfig();
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from('user_documents')
    .select('id')
    .limit(1);

  console.log('user_documents access:', { data, error });
}

if (import.meta.main) {
  check().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
