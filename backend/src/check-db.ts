import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('get_tables'); // This might not exist
  // Instead, let's just try to query user_documents which we know exists
  const { data: d2, error: e2 } = await supabase.from('user_documents').select('id').limit(1);
  console.log('user_documents access:', { data: d2, error: e2 });
}

check();
