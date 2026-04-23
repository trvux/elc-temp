
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanProductSlugs() {
  console.log('--- Bắt đầu chiến dịch làm sạch Slug sản phẩm ---');
  
  const { data: products, error } = await supabase.from('products').select('id, name, slug');
  if (error) return console.error(error);

  let updatedCount = 0;

  for (const p of products) {
    if (p.slug) {
      // 1. Triệt tiêu nhiều dấu gạch ngang liên tiếp (--- -> -)
      // 2. Xóa gạch ngang ở đầu và cuối slug
      const newSlug = p.slug.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
      
      if (p.slug !== newSlug) {
        console.log(`Làm sạch: ${p.slug} -> ${newSlug}`);
        await supabase.from('products').update({ slug: newSlug }).eq('id', p.id);
        updatedCount++;
      }
    }
  }

  console.log(`--- Hoàn tất! Đã làm sạch ${updatedCount} slug sản phẩm. ---`);
}

cleanProductSlugs();
