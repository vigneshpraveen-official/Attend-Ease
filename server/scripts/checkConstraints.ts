import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env vars
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceKey);

const check = async () => {
  console.log("Checking Foreign Keys for 'employees' table...");
  
  // We can't query information_schema directly via Supabase JS client easily (it exposes 'public' schema by default).
  // But we can use RPC if we had one, or just try to deduce it by testing queries.
  // Actually, simpler: Let's just assume the standard naming convention or try the most likely fix.
  // Standard Postgres naming: explicit 'employees_id_fkey'
  
  // Let's test a query with the standard join syntax to see the specific error or if it works.
  
  const { data, error } = await adminClient
    .from('employees')
    .select('*, profiles(email)')
    .limit(1);

  if (error) {
      console.log("Standard 'profiles(email)' failed:", error.message);
  } else {
      console.log("Standard 'profiles(email)' WORKED!");
  }

  // Test with explicit column mapping
  const { data: data2, error: error2 } = await adminClient
    .from('employees')
    .select('*, profiles:id(email)')
    .limit(1);

    if (error2) {
        console.log("Explicit 'profiles:id(email)' failed:", error2.message);
    } else {
        console.log("Explicit 'profiles:id(email)' WORKED!");
    }
};

check();
