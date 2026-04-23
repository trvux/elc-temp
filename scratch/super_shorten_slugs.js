
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

async function superShortenProductSlugs() {
  console.log('--- Bắt đầu chiến dịch SIÊU NGẮN HÓA URL sản phẩm ---');
  
  // 1. Lấy sản phẩm kèm slug danh mục
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, category_id, categories(slug)');

  if (error) return console.error(error);

  console.log(`Kiểm tra ${products.length} sản phẩm.`);

  let updatedCount = 0;

  for (const p of products) {
    if (p.slug && p.categories && p.categories.slug) {
      const catSlug = p.categories.slug;
      let newSlug = p.slug;

      // Nếu slug sản phẩm bắt đầu bằng slug danh mục + gạch ngang
      // Ví dụ: "may-lanh-treo-tuong-daikin..." bắt đầu bằng "may-lanh-treo-tuong"
      if (newSlug.startsWith(catSlug + '-')) {
        newSlug = newSlug.replace(catSlug + '-', '');
      }

      // Làm sạch thêm: bóp gạch ngang lặp lại, trim gạch ngang thừa
      newSlug = newSlug.replace(/-+/g, '-').replace(/^-+|-+$/g, '');

      if (p.slug !== newSlug) {
        console.log(`Rút gọn: ${p.slug} -> ${newSlug}`);
        const { error: updateError } = await supabase
          .from('products')
          .update({ slug: newSlug })
          .eq('id', p.id);
        
        if (updateError) {
          console.error(`Lỗi cập nhật sản phẩm ${p.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }
  }

  console.log(`--- Hoàn tất! Đã rút gọn ${updatedCount} slug sản phẩm. ---`);
}

superShortenProductSlugs();
