/**
 * Script to create a test user in Supabase
 * Run with: node scripts/create-test-user.mjs
 * 
 * This requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('You need the service role key to create users. Get it from Supabase dashboard.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const testUser = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  user_metadata: {
    full_name: 'Test User',
  },
};

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      user_metadata: testUser.user_metadata,
      email_confirm: true, // Auto-confirm email
    });

    if (error) {
      console.error('Error creating user:', error.message);
      process.exit(1);
    }

    console.log('✓ Test user created successfully!');
    console.log('Email:', testUser.email);
    console.log('Password:', testUser.password);
    console.log('User ID:', data.user.id);
    console.log('\nYou can now login at http://localhost:3000/auth');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

createTestUser();
