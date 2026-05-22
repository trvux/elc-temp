import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listProjects() {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, title, slug, deleted_at, is_published')
    .is('deleted_at', null);

  if (error) {
    console.error('Error fetching projects:', error.message);
    return;
  }

  console.log('List of Active Projects:');
  projects.forEach((proj) => {
    console.log(`- Title: "${proj.title}"`);
    console.log(`  Slug:  "${proj.slug}"`);
    console.log(`  Path:  "/du-an/${proj.slug}"`);
    console.log(`  Published: ${proj.is_published}`);
  });
}

listProjects();
