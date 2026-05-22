require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('group_categories')
    .update({ deleted_at: new Date().toISOString() })
    .not('deleted_at', 'is', 'null')
    .select('id')
    .limit(1);
    
  if (data && data.length === 0) {
    // If no deleted ones, just fetch any group to test
    const { data: active } = await supabase.from('group_categories').select('id').limit(1);
    if (active.length > 0) {
      console.log('Testing delete on ID:', active[0].id);
      const res = await supabase.from('group_categories').update({ deleted_at: new Date().toISOString() }).eq('id', active[0].id);
      console.log('Update result:', res);
      // Restore it back
      await supabase.from('group_categories').update({ deleted_at: null }).eq('id', active[0].id);
    }
  } else {
     console.log('Found already deleted:', data);
  }
}

test();
