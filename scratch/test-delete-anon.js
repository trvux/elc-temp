require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: active } = await supabase.from('group_categories').select('id').limit(1);
  if (active && active.length > 0) {
    console.log('Testing delete on ID:', active[0].id);
    const res = await supabase.from('group_categories').update({ deleted_at: new Date().toISOString() }).eq('id', active[0].id);
    console.log('Update result with ANON key:', JSON.stringify(res, null, 2));
  }
}

test();
