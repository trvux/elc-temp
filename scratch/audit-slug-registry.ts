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

  console.log('All Categories & Groups:');
  const catGroups = registry?.filter(r => ['category', 'categories', 'group'].includes(r.entity_type)) || [];
  catGroups.forEach(cg => console.log(`- Slug: ${cg.slug}, Type: ${cg.entity_type}`));
  
  console.log('\nSearch for treo-tuong:');
  const searchResults = registry?.filter(r => r.slug.includes('treo-tuong')) || [];
  searchResults.forEach(r => console.log(`- Slug: ${r.slug}, Type: ${r.entity_type}`));
}

run();
