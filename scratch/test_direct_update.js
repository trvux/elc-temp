require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

async function test() {
  const token = jwt.sign({
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + (60 * 60),
    sub: '12345678-1234-1234-1234-123456789012',
    role: 'authenticated'
  }, process.env.SUPABASE_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long');
  
  const authSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  
  const { data: group } = await authSupabase.from('group_categories').select('id').limit(1);
  if (group && group.length > 0) {
    const { data, error } = await authSupabase.from('group_categories').update({ deleted_at: new Date().toISOString() }).eq('id', group[0].id);
    console.log('Update as authenticated:', error);
  } else {
    console.log("No group found");
  }
}
test();
