
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load .env.local
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('name, sku')
    .limit(15);

  if (error) {
    console.error('Lỗi khi lấy dữ liệu:', error);
    return;
  }

  console.log('--- DANH SÁCH 15 SẢN PHẨM MẪU ---');
  data.forEach((p, i) => {
    console.log(`${i + 1}. [${p.sku}] ${p.name}`);
  });
}

inspectProducts();
