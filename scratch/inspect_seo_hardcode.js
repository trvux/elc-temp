const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function inspect() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, short_description, meta_description')
    .limit(114);

  if (error) {
    console.error(error);
    return;
  }

  console.log("DANH SÁCH SEO HIỆN TẠI:");
  data.forEach(p => {
    if (p.short_description || p.meta_description) {
      console.log(`- [${p.name}]:`);
      console.log(`  + Short: ${p.short_description}`);
      console.log(`  + Meta: ${p.meta_description}`);
    }
  });
}

inspect();
