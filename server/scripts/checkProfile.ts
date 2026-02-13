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
  const email = 'admin@ems.com';
  console.log(`Checking profile for: ${email}`);

  // 1. Get User ID
  const { data: { users }, error: userError } = await adminClient.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.error("User not found in Auth!");
    return;
  }
  console.log(`User ID: ${user.id}`);

  // 2. Check Profile
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error("Profile Error:", profileError);
  } else {
    console.log("Profile Data:", profile);
  }
};

check();
