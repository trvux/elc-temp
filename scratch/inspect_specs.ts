import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSpecs() {
  const { data: products, error } = await supabase
    .from('products')
    .select('name, specs')
    .is('deleted_at', null);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const allLabels = new Set();
  products.forEach(p => {
    if (p.specs && Array.isArray(p.specs)) {
      p.specs.forEach((s: any) => {
        if (s.label) allLabels.add(s.label);
      });
    }
  });

  console.log('Available spec labels in DB:');
  Array.from(allLabels).sort().forEach(l => console.log(`- ${l}`));
}

inspectSpecs();
