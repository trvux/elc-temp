import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role for database manipulation
const supabase = createClient(supabaseUrl, supabaseKey);

async function runVerification() {
  console.log('--- STARTING TRIGGER VERIFICATION ---');

  const testGroupSlug = `test-group-slug-${Date.now()}`;
  const testCatSlug = `test-cat-slug-${Date.now()}`;

  // 1. Test group_categories trigger
  console.log(`\nTesting group_categories trigger with slug: ${testGroupSlug}...`);
  const { data: groupData, error: groupInsertError } = await supabase
    .from('group_categories')
    .insert({
      name: 'Test Group Category Trigger',
      slug: testGroupSlug,
      order_index: 9999
    })
    .select()
    .single();

  if (groupInsertError) {
    console.error('Failed to insert test group:', groupInsertError.message);
  } else {
    console.log(`Inserted test group with ID: ${groupData.id}`);
    
    // Check if slug_registry has it
    const { data: regGroup, error: regGroupError } = await supabase
      .from('slug_registry')
      .select('*')
      .eq('slug', testGroupSlug)
      .maybeSingle();

    if (regGroupError) {
      console.error('Error querying slug_registry for group:', regGroupError.message);
    } else if (regGroup) {
      console.log('Success! Group slug synchronized to slug_registry:', regGroup);
    } else {
      console.warn('WARNING: Group slug NOT found in slug_registry. The trigger might be inactive or bound to the wrong table.');
    }

    // Clean up group
    console.log('Hard-deleting test group...');
    await supabase.from('group_categories').delete().eq('id', groupData.id);
  }

  // 2. Test categories trigger
  console.log(`\nTesting categories trigger with slug: ${testCatSlug}...`);
  const { data: catData, error: catInsertError } = await supabase
    .from('categories')
    .insert({
      name: 'Test Category Trigger',
      slug: testCatSlug,
      order_index: 9999
    })
    .select()
    .single();

  if (catInsertError) {
    console.error('Failed to insert test category:', catInsertError.message);
  } else {
    console.log(`Inserted test category with ID: ${catData.id}`);

    // Check if slug_registry has it
    const { data: regCat, error: regCatError } = await supabase
      .from('slug_registry')
      .select('*')
      .eq('slug', testCatSlug)
      .maybeSingle();

    if (regCatError) {
      console.error('Error querying slug_registry for category:', regCatError.message);
    } else if (regCat) {
      console.log('Success! Category slug synchronized to slug_registry:', regCat);
    } else {
      console.warn('WARNING: Category slug NOT found in slug_registry. The trigger might be inactive or bound to the wrong table.');
    }

    // Clean up category
    console.log('Hard-deleting test category...');
    await supabase.from('categories').delete().eq('id', catData.id);
  }

  console.log('\n--- TRIGGER VERIFICATION COMPLETE ---');
}

runVerification();
