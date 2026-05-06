import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBrands() {
  const { data: products, error } = await supabase
    .from('products')
    .select('brand_id, brands(name)')
    .is('deleted_at', null);

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  const brandMap = new Map();
  products.forEach(p => {
    if (p.brand_id && p.brands) {
      brandMap.set(p.brand_id, p.brands.name);
    }
  });

  console.log(`Total unique brands used in products: ${brandMap.size}`);
  console.log('List of brands:');
  Array.from(brandMap.values()).sort().forEach(name => console.log(`- ${name}`));
}

checkBrands();
