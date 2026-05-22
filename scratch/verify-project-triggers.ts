import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runProjectVerification() {
  console.log('--- STARTING SERVICE TYPE & PROJECT TRIGGER VERIFICATION ---');

  const testServiceSlug = `test-service-slug-${Date.now()}`;
  const testProjectSlug = `test-project-slug-${Date.now()}`;

  // 1. Test service_type trigger
  console.log(`\nTesting service_type trigger with slug: ${testServiceSlug}...`);
  const { data: serviceData, error: serviceInsertError } = await supabase
    .from('service_type')
    .insert({
      name: 'Test Service Type Trigger',
      slug: testServiceSlug,
      order_index: 9999
    })
    .select()
    .single();

  if (serviceInsertError) {
    console.error('Failed to insert test service type:', serviceInsertError.message);
  } else {
    console.log(`Inserted test service type with ID: ${serviceData.id}`);
    
    // Check if slug_registry has it
    const { data: regService, error: regServiceError } = await supabase
      .from('slug_registry')
      .select('*')
      .eq('slug', testServiceSlug)
      .maybeSingle();

    if (regServiceError) {
      console.error('Error querying slug_registry for service type:', regServiceError.message);
    } else if (regService) {
      console.log('Success! Service Type slug synchronized to slug_registry:', regService);
    } else {
      console.warn('WARNING: Service Type slug NOT found in slug_registry.');
    }

    // Clean up service type
    console.log('Hard-deleting test service type...');
    await supabase.from('service_type').delete().eq('id', serviceData.id);
  }

  // 2. Test projects trigger
  console.log(`\nTesting projects trigger with slug: ${testProjectSlug}...`);
  
  // First, fetch an existing category id to link
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id')
    .limit(1);

  if (catError || !categories || categories.length === 0) {
    console.error('No categories found to link the test project to.');
    return;
  }

  const categoryId = categories[0].id;

  const { data: projectData, error: projectInsertError } = await supabase
    .from('projects')
    .insert({
      title: 'Test Project Trigger',
      slug: testProjectSlug,
      category_id: categoryId,
      images: [],
      order_index: 9999
    })
    .select()
    .single();

  if (projectInsertError) {
    console.error('Failed to insert test project:', projectInsertError.message);
  } else {
    console.log(`Inserted test project with ID: ${projectData.id}`);

    // Check if slug_registry has it
    const { data: regProject, error: regProjectError } = await supabase
      .from('slug_registry')
      .select('*')
      .eq('slug', testProjectSlug)
      .maybeSingle();

    if (regProjectError) {
      console.error('Error querying slug_registry for project:', regProjectError.message);
    } else if (regProject) {
      console.log('Success! Project slug synchronized to slug_registry:', regProject);
    } else {
      console.warn('WARNING: Project slug NOT found in slug_registry.');
    }

    // Clean up project
    console.log('Hard-deleting test project...');
    await supabase.from('projects').delete().eq('id', projectData.id);
  }

  console.log('\n--- SERVICE TYPE & PROJECT TRIGGER VERIFICATION COMPLETE ---');
}

runProjectVerification();
