
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

async function superShortenProjectSlugs() {
  console.log('--- Bắt đầu chiến dịch SIÊU NGẮN HÓA URL Dự án ---');
  
  // 1. Lấy dự án kèm slug danh mục
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, title, slug, categories(slug)');

  if (error) return console.error(error);

  console.log(`Kiểm tra ${projects.length} dự án.`);

  let updatedCount = 0;

  for (const p of projects) {
    if (p.slug && p.categories && p.categories.slug) {
      const catSlug = p.categories.slug;
      let newSlug = p.slug;

      // 1. Triệt tiêu dấu gạch ngang lặp lại (--- -> -)
      newSlug = newSlug.replace(/-+/g, '-');

      // 2. Nếu slug dự án bắt đầu bằng slug danh mục
      // Ví dụ: "thi-cong-may-lanh-lap-dat..." bắt đầu bằng "thi-cong-may-lanh"
      if (newSlug.startsWith(catSlug + '-')) {
        newSlug = newSlug.replace(catSlug + '-', '');
      }

      // Làm sạch nốt gạch ngang thừa ở đầu/cuối
      newSlug = newSlug.replace(/^-+|-+$/g, '');

      if (p.slug !== newSlug) {
        console.log(`Rút gọn: ${p.slug} -> ${newSlug}`);
        const { error: updateError } = await supabase
          .from('projects')
          .update({ slug: newSlug })
          .eq('id', p.id);
        
        if (updateError) {
          console.error(`Lỗi cập nhật dự án ${p.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }
  }

  console.log(`--- Hoàn tất! Đã rút gọn ${updatedCount} slug dự án. ---`);
}

superShortenProjectSlugs();
