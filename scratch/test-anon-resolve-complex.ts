import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Ensure service role key is NOT present in the environment for this test
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create pure anonymous client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAnonResolveComplex() {
  console.log('Testing complex query with ANONYMOUS key only...');

  const testSlug = "lap-dat-he-thong-gio-tuoi-cho-can-ho-cao-cap-landmark-mr-son-quan-binh-thanh";
  
  // 1. Query slug_registry
  const { data: registryItem, error: regError } = await supabase
    .from('slug_registry')
    .select('entity_type, entity_id')
    .eq('slug', testSlug)
    .is('deleted_at', null)
    .maybeSingle();

  if (regError || !registryItem) {
    console.error('Failed to query slug_registry:', regError?.message || 'Not found');
    return;
  }

  console.log('Slug registry item found:', registryItem);

  // 2. Query projects complex select
  const { data: projectRow, error: projectError } = await supabase
    .from('projects')
    .select(`
      *,
      serviceType:service_type(id, name),
      project_category(
        categoryNew:categories(
          *,
          group_categories(*)
        )
      )
    `)
    .eq('id', registryItem.entity_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (projectError) {
    console.error('Failed complex projects query (anon):', projectError.message);
  } else if (!projectRow) {
    console.log('Project row is NULL (anon)');
  } else {
    console.log('Project row successfully fetched (anon):', !!projectRow);
    console.log('Service type:', (projectRow as any).serviceType);
    console.log('Project categories count:', (projectRow as any).project_category?.length);
  }
}

testAnonResolveComplex();
