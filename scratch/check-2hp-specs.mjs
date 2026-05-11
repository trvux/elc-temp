import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductSpecs() {
  const { data, error } = await supabase
    .from('products')
    .select('name, specs')
    .ilike('name', '%2HP%')
    .limit(5);

  if (error) {
    console.error(error);
    return;
  }

  data.forEach(p => {
    console.log(`\nProduct: ${p.name}`);
    console.log('Specs:', JSON.stringify(p.specs, null, 2));
  });
}

checkProductSpecs();
