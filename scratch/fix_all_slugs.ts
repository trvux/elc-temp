
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gdzihzsjfczuggwpykjk.supabase.co'
const supabaseKey = 'sb_secret_RxWGBdFX0qPBKWBpI-2Eeg_b3jplqTo'
const supabase = createClient(supabaseUrl, supabaseKey)

function cleanSku(sku: string) {
  if (!sku) return '';
  // Lấy phần trước dấu / hoặc + hoặc khoảng trắng
  return sku.split('/')[0].split('+')[0].replace(/\s+/g, '').toLowerCase().trim();
}

async function fixAllSlugs() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, sku')

  if (error) {
    console.error('Lỗi fetch:', error);
    return;
  }

  console.log(`Đang xử lý ${products.length} sản phẩm...`);
  
  for (const p of products) {
    const skuCode = cleanSku(p.sku);
    if (!skuCode) continue;

    // Nếu slug hiện tại chưa chứa SKU, tiến hành cập nhật
    if (!p.slug.toLowerCase().includes(skuCode)) {
      const newSlug = `${p.slug}-${skuCode}`.replace(/-+/g, '-');
      
      const { error: updateError } = await supabase
        .from('products')
        .update({ slug: newSlug })
        .eq('id', p.id);

      if (updateError) {
        console.error(`Lỗi cập nhật ID ${p.id}:`, updateError.message);
      } else {
        console.log(`✅ Đã sửa: ${p.slug} -> ${newSlug}`);
      }
    }
  }
  console.log('--- HOÀN TẤT CHUẨN HÓA SLUG ---');
}

fixAllSlugs()
