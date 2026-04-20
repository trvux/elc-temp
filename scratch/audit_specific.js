const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function audit() {
  console.log("ĐANG SOI CHI TIẾT 2 MÁY TRONG ẢNH...");
  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, short_description, meta_description, description')
    .ilike('name', '%Daikin %HP%');

  if (error) {
    console.error(error);
    return;
  }

  data.forEach(p => {
    console.log(`\n--- PHÂN TÍCH: ${p.name} ---`);
    console.log(`ID: ${p.id}`);
    console.log(`SKU: ${p.sku}`);
    console.log(`Short Desc (DB): "${p.short_description}"`);
    console.log(`Meta Desc (DB): "${p.meta_description}"`);
    console.log(`First 100 chars of Description (Long HTML): "${p.description?.substring(0, 100)}..."`);
  });
}

audit();
