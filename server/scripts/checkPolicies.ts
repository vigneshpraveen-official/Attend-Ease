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

const checkPolicies = async () => {
  console.log("Checking RLS Policies...");

  // We can't query pg_policies via the JS client directly easily unless we use RPC or just check if RLS is enabled via a test query.
  // Instead, let's try to fetch the profile AS A USER (simulating RLS)

  const email = 'admin@ems.com';
  const password = 'admin123';

  console.log(`Simulating login for: ${email}`);

  // 1. Sign in to get a JWT
  const { data: { session }, error: loginError } = await adminClient.auth.signInWithPassword({
    email,
    password
  });

  if (loginError) {
    console.error("Login failed:", loginError.message);
    return;
  }

  const token = session?.access_token;
  const userId = session?.user?.id;
  console.log(`Logged in. User ID: ${userId}`);

  // 2. Create a client ACTING AS THE USER (with RLS)
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "YOUR_ANON_KEY_HERE";
  
  // Need to load root .env too since VITE_ vars are there
  const rootEnvPath = path.resolve(__dirname, '../../.env');
  dotenv.config({ path: rootEnvPath });
  const realAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!realAnonKey) {
      console.error("Missing VITE_SUPABASE_PUBLISHABLE_KEY in root .env");
      return;
  }

  const userClient = createClient(supabaseUrl, realAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${session?.access_token}` }
    }
  });

  // 3. Try to fetch own profile
  console.log("Attempting to fetch own profile via RLS client...");
  const { data, error } = await userClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error("RLS Fetch Error:", error);
    console.log("Likely cause: RLS policy is blocking access or table is empty for this ID.");
  } else {
    console.log("RLS Fetch Success:", data);
  }
};

checkPolicies();
