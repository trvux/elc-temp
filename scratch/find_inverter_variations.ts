import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findInverterVariations() {
  const { data: products, error } = await supabase
    .from('products')
    .select('specs')
    .limit(100);

  const variations = new Set();
  const labelVariations = new Set();

  products.forEach(p => {
    if (p.specs && Array.isArray(p.specs)) {
      p.specs.forEach((s: any) => {
        const label = s.label?.toLowerCase() || '';
        if (label.includes('inverter') || label.includes('loại máy') || label.includes('công nghệ')) {
          labelVariations.add(s.label);
          if (Array.isArray(s.value)) {
            s.value.forEach((v: any) => variations.add(v.value));
          } else if (s.value) {
            variations.add(s.value);
          }
        }
      });
    }
  });

  console.log('Labels related to technology:');
  Array.from(labelVariations).forEach(l => console.log(`- ${l}`));
  console.log('\nValues found:');
  Array.from(variations).forEach(v => console.log(`- ${v}`));
}

findInverterVariations();
