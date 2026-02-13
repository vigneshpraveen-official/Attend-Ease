import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Now import the DB config which uses process.env
// We use require() here because ES6 imports are hoisted to the top
const { supabase } = require('../src/config/db');

const seedAdmin = async () => {
  const email = 'admin@ems.com';
  const password = 'admin123';

  console.log('Seeding admin user...');

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if admin already exists
    const { data: existing } = await supabase.from('users').select('*').eq('email', email).single();
    if(existing) {
        console.log("User already exists");
        return;
    }

    const { data, error } = await supabase
      .from('users')
      .insert([
        { email, password_hash: hashedPassword, role: 'admin' }
      ])
      .select()
      .single();

    if (error) {
        console.error('Error creating user:', error);
        return;
    }

    // Create employee profile for admin
    const { error: empError } = await supabase.from('employees').insert([
        { id: data.id, first_name: 'Admin', last_name: 'User', department: 'IT', designation: 'System Admin' }
    ]);

    if (empError) {
        console.error('Error creating employee profile:', empError);
    } else {
        console.log('Admin created successfully');
        console.log('Email:', email);
        console.log('Password:', password);
    }

  } catch (err: any) {
    console.error('Unexpected error:', err.message);
  }
};

seedAdmin();
