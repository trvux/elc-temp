
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFinalData() {
  const { data, error } = await supabase
    .from('products')
    .select('name, brand_id, short_description')
    .limit(5);

  if (error) {
    console.error('Lỗi:', error);
    return;
  }

  console.log('--- KIỂM TRA DỮ LIỆU SAU KHI UPDATE ---');
  data.forEach((p, i) => {
    console.log(`${i+1}. Tên: ${p.name}`);
    console.log(`   Brand ID: ${p.brand_id || 'NULL'}`);
    console.log(`   Short Desc: ${p.short_description ? p.short_description.substring(0, 50) + '...' : 'NULL'}`);
  });
}

checkFinalData();
