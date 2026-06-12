import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: registry, error } = await supabase
    .from('slug_registry')
    .select('slug, entity_type, entity_id')
    .is('deleted_at', null);

  if (error) {
    console.error('Error fetching registry:', error);
    return;
  }

  console.log(`Registry count: ${registry?.length || 0}`);
  
  // Group by entity_type
  const groups: Record<string, number> = {};
  for (const item of registry || []) {
    groups[item.entity_type] = (groups[item.entity_type] || 0) + 1;
  }
  console.log('Registry breakdown by entity_type:', groups);

  // Check some samples
  console.log('\nSamples:');
  console.log('Product sample:', registry?.filter(r => r.entity_type === 'product').slice(0, 3));
  console.log('Category sample:', registry?.filter(r => r.entity_type === 'category' || r.entity_type === 'categories').slice(0, 3));
  console.log('Brand sample:', registry?.filter(r => r.entity_type === 'brand').slice(0, 3));
  console.log('Group sample:', registry?.filter(r => r.entity_type === 'group').slice(0, 3));
}

run();
