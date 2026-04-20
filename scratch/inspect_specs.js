const { createClient } = require('@supabase/supabase-client');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function inspectFirstProduct() {
  const { data, error } = await supabase
    .from('products')
    .select('name, specs, description')
    .limit(1)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  console.log('--- Sample Product ---');
  console.log('Name:', data.name);
  console.log('Specs:', JSON.stringify(data.specs, null, 2));
  console.log('Description Length:', data.description?.length);
}

inspectFirstProduct();
