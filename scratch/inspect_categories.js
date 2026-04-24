
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load .env.local
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, type, parent_id');

  if (error) {
    console.error('Lỗi khi lấy dữ liệu:', error);
    return;
  }

  console.log('--- DANH SÁCH CATEGORIES ---');
  data.forEach((c) => {
    console.log(`- [${c.type}] ${c.name} (slug: ${c.slug}, parent: ${c.parent_id})`);
  });
}

inspectCategories();
