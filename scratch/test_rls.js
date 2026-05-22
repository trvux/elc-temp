require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  // We simulate the admin user by logging in or acting as them
  // But we can just see if the trigger causes it
  const { error } = await supabase.from('group_categories').update({ deleted_at: new Date().toISOString() }).eq('slug', 'may-lanh');
  console.log('Update as service role:', error);
}
test();
