import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  console.log('Fetching sample projects from DB...');
  const { data: projects, error: pError } = await supabase
    .from('projects')
    .select('title, slug, meta_title, meta_description')
    .limit(5);

  if (pError) {
    console.error('Error fetching projects:', pError);
  } else {
    console.log('Projects (first 5):', projects);
  }

  console.log('\nFetching sample project types from DB...');
  const { data: projectTypes, error: ptError } = await supabase
    .from('project_type')
    .select('name, slug, meta_title, meta_description')
    .limit(5);

  if (ptError) {
    console.error('Error fetching project types:', ptError);
  } else {
    console.log('Project Types (first 5):', projectTypes);
  }
}

run();
