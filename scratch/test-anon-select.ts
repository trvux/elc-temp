import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAnonSelect() {
  console.log('Testing select queries using ANONYMOUS key...');

  // 1. Query projects
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, title, slug')
    .limit(3);

  if (projectsError) {
    console.error('Error fetching projects (anon):', projectsError.message);
  } else {
    console.log(`Projects fetched (anon): ${projects?.length || 0} rows`, projects);
  }

  // 2. Query service_type
  const { data: serviceTypes, error: serviceTypesError } = await supabase
    .from('service_type')
    .select('id, name, slug')
    .limit(3);

  if (serviceTypesError) {
    console.error('Error fetching service_type (anon):', serviceTypesError.message);
  } else {
    console.log(`Service types fetched (anon): ${serviceTypes?.length || 0} rows`, serviceTypes);
  }

  // 3. Query slug_registry
  const { data: registry, error: registryError } = await supabase
    .from('slug_registry')
    .select('slug, entity_type, entity_id')
    .limit(3);

  if (registryError) {
    console.error('Error fetching slug_registry (anon):', registryError.message);
  } else {
    console.log(`Slug registry fetched (anon): ${registry?.length || 0} rows`, registry);
  }
}

testAnonSelect();
