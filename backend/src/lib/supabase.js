/**
 * Supabase Client Configuration
 * Initializes and exports the Supabase client for database and storage operations
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABSE_SERVICE_ROLE;

if (!supabaseUrl) {
  console.error('❌ Missing SUPABASE_URL. Please check your .env file.');
}

// Use service role key for backend operations (bypasses RLS)
// This is safe because it's server-side only
const supabaseKey = supabaseServiceKey?.trim() || supabaseAnonKey;

if (!supabaseKey) {
  console.error('❌ Missing Supabase key. Please check your .env file.');
  console.error('Required: SUPABASE_KEY or SUPABSE_SERVICE_ROLE');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Export both clients for different use cases
module.exports = supabase;
