
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Đọc file .env.local thủ công
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Lỗi: Thiếu biến môi trường NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCategorySlugs() {
  console.log('--- Bắt đầu cập nhật Slug danh mục ---');
  
  // 1. Lấy tất cả danh mục
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*');

  if (error) {
    console.error('Lỗi khi lấy dữ liệu:', error);
    return;
  }

  console.log(`Tìm thấy ${categories.length} danh mục.`);

  let updatedCount = 0;

  for (const cat of categories) {
    // Nếu slug có chứa dấu "/" thì mới xử lý
    if (cat.slug && cat.slug.includes('/')) {
      const newSlug = cat.slug.replace(/\//g, '-');
      console.log(`Đang sửa: ${cat.slug} -> ${newSlug}`);

      const { error: updateError } = await supabase
        .from('categories')
        .update({ slug: newSlug })
        .eq('id', cat.id);

      if (updateError) {
        console.error(`Lỗi khi cập nhật ${cat.name}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`--- Hoàn tất! Đã cập nhật ${updatedCount} danh mục. ---`);
}

fixCategorySlugs();
