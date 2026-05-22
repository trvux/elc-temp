require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function test() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  // Create a fake admin user or use an existing one to get a token.
  // Actually, we can't easily sign in without a password.
  // Let's just create a custom JWT using jsonwebtoken and the SUPABASE_JWT_SECRET
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + (60 * 60),
    sub: '12345678-1234-1234-1234-123456789012',
    role: 'authenticated'
  }, process.env.SUPABASE_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long');
  
  const authSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  
  const { data, error } = await authSupabase.from('group_categories').update({ deleted_at: new Date().toISOString() }).eq('slug', 'may-lanh-dan-dung');
  console.log('Update as authenticated:', error);
}
test();
