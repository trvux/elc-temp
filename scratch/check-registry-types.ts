import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRegistryTypes() {
  const { data, error } = await supabase
    .from('slug_registry')
    .select('entity_type');

  if (error) {
    console.error('Error fetching registry types:', error);
    return;
  }

  const counts: Record<string, number> = {};
  data.forEach((row: any) => {
    const type = row.entity_type;
    counts[type] = (counts[type] || 0) + 1;
  });

  console.log('Distinct entity_types in slug_registry:');
  Object.entries(counts).forEach(([type, count]) => {
    console.log(`- Type: "${type}" | Count: ${count}`);
  });
}

checkRegistryTypes();
