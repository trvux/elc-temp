require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data: group } = await supabase.from('group_categories').select('*').ilike('name', '%máy lạnh dân dụng%').single();
  if (group) {
    console.log('Group found:', group.id);
    const { data, error } = await supabase.from('group_categories').update({ deleted_at: new Date().toISOString() }).eq('id', group.id);
    console.log('Error:', error);
  } else {
    console.log('Group not found');
  }
}
test();
