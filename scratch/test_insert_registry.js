const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const insertData = {
    slug: 'test-unique-service-group-slug',
    entity_type: 'service_group',
    entity_id: '6bb9825f-a671-4f93-97d1-ad4cc52f08ba' // existing service group ID
  };

  // Try inserting directly to slug_registry
  const { data, error } = await supabase
    .from('slug_registry')
    .insert(insertData)
    .select();

  if (error) {
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
  } else {
    console.log('Success inserting into slug_registry!', data);
    
    // Clean up
    const { error: delError } = await supabase
      .from('slug_registry')
      .delete()
      .eq('slug', 'test-unique-service-group-slug');
    if (delError) console.error('Error cleaning up:', delError);
    else console.log('Cleaned up test record successfully.');
  }
}

run();
