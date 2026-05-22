require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.rpc('exec_sql', { query: "SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name='slug_registry';" });
  console.log(data || error);
}
test();
