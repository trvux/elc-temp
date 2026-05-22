import { createClient } from '@supabase/supabase-js';
import { resolveProjectPath } from '../modules/project/application/resolveProjectPath';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAllResolves() {
  console.log('Testing resolution for all projects...');

  // Fetch all active projects
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, title, slug')
    .is('deleted_at', null)
    .eq('is_published', true);

  if (error) {
    console.error('Error fetching projects:', error.message);
    return;
  }

  console.log(`Fetched ${projects?.length || 0} active projects. Resolving one by one...`);

  let successCount = 0;
  let failCount = 0;

  for (const proj of projects) {
    try {
      const result = await resolveProjectPath(proj.slug);
      if (result && result.type === 'project') {
        console.log(`[SUCCESS] Resolved "${proj.title}" (slug: "${proj.slug}")`);
        successCount++;
      } else {
        console.warn(`[FAILED] Could not resolve "${proj.title}" (slug: "${proj.slug}") - returned:`, result);
        failCount++;
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[ERROR] Exception resolving "${proj.title}" (slug: "${proj.slug}"):`, errMsg);
      failCount++;
    }
  }

  console.log(`\nResolution Summary: Success: ${successCount}, Fail: ${failCount}`);
}

testAllResolves();
