
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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Lỗi: Thiếu biến môi trường NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deepFixCategories() {
  console.log('--- Bắt đầu chiến dịch quy hoạch Slug danh mục (Phần 2) ---');
  
  const { data: categories, error } = await supabase.from('categories').select('*');
  if (error) return console.error(error);

  let updatedCount = 0;

  for (const cat of categories) {
    if (cat.parent_id) {
      const parent = categories.find(p => p.id === cat.parent_id);
      if (parent) {
        // 1. Lấy phần cuối cùng của slug hiện tại (bỏ dấu xuyệt nếu có)
        let childPart = cat.slug.includes('/') ? cat.slug.split('/').pop() : cat.slug;
        
        // 2. Nếu phần cuối này đã có tên cha ở đầu thì bỏ đi để tránh bị lặp (may-lanh-may-lanh-treo-tuong)
        if (childPart.startsWith(parent.slug + '-')) {
          childPart = childPart.replace(parent.slug + '-', '');
        }
        
        const newSlug = `${parent.slug}-${childPart}`;
        
        if (cat.slug !== newSlug) {
          console.log(`Cập nhật: ${cat.name} (${cat.slug} -> ${newSlug})`);
          await supabase.from('categories').update({ slug: newSlug }).eq('id', cat.id);
          updatedCount++;
        }
      }
    }
  }

  console.log(`--- Đã chuẩn hóa thêm ${updatedCount} danh mục con. ---`);
}

deepFixCategories();
