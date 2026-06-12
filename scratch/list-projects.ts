import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  console.log('=== AUDITING PROJECT ROUTING PATTERNS ===');

  // Fetch all active projects
  const { data: projects, error: projError } = await supabase
    .from('projects')
    .select('slug, title, is_published, deleted_at, project_type_id')
    .eq('is_published', true)
    .is('deleted_at', null);

  if (projError) {
    console.error('Error fetching projects:', projError);
  } else {
    console.log(`Active Published Projects: ${projects.length}`);
    console.log('Sample Projects (first 5):');
    console.log(projects.slice(0, 5));
  }

  // Fetch all active project types
  const { data: projectTypes, error: ptError } = await supabase
    .from('project_type')
    .select('slug, name, deleted_at')
    .is('deleted_at', null);

  if (ptError) {
    console.error('Error fetching project types:', ptError);
  } else {
    console.log(`\nActive Project Types: ${projectTypes.length}`);
    console.log('List of Project Types:');
    console.log(projectTypes);
  }

  // Check for any overlap between project slugs and project type slugs
  const projectSlugs = new Set((projects || []).map(p => p.slug));
  const typeSlugs = (projectTypes || []).map(pt => pt.slug);
  const overlap = typeSlugs.filter(slug => projectSlugs.has(slug));
  console.log(`\nOverlap between project slugs and project type slugs:`, overlap);
}

run();
