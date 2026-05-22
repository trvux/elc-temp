require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.rpc('exec_sql', { query: "SELECT polname, polpermissive, polroles, polcmd, polqual, polwithcheck FROM pg_policy WHERE polrelid = 'group_categories'::regclass;" });
  if (error) {
    // try direct postgrest query if exec_sql doesn't exist
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pg_policy`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    console.log(await res.text());
  } else {
    console.log(data);
  }
}
test();
