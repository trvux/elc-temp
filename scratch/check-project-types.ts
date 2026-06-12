import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  console.log('Fetching all project types from DB...');
  const { data: projectTypes, error: ptError } = await supabase
    .from('project_type')
    .select('id, name, slug, meta_title, meta_description')
    .order('name');

  if (ptError) {
    console.error('Error fetching project types:', ptError);
  } else {
    console.log(JSON.stringify(projectTypes, null, 2));
  }
}

run();
