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
    .ilike('name', '%NEW5.350%')
    .single();

  if (error) {
    console.error(error);
    return;
  }

  console.log(`\nProduct: ${data.name}`);
  console.log('Specs:', JSON.stringify(data.specs, null, 2));
}

checkProductSpecs();
