
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gdzihzsjfczuggwpykjk.supabase.co'
const supabaseKey = 'sb_secret_RxWGBdFX0qPBKWBpI-2Eeg_b3jplqTo'
const supabase = createClient(supabaseUrl, supabaseKey)

function formatFullSku(sku: string) {
  if (!sku) return '';
  // Chuyển / , + và khoảng trắng thành dấu gạch ngang, sau đó làm sạch
  return sku
    .toLowerCase()
    .replace(/[\/\+\s]+/g, '-') // Thay / + và space thành -
    .replace(/-+/g, '-')        // Thay -- thành -
    .replace(/^-+|-+$/g, '')    // Xóa - ở đầu và cuối
    .trim();
}

async function fixAllSlugsFull() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, sku')

  if (error) {
    console.error('Lỗi fetch:', error);
    return;
  }

  console.log(`Đang chuẩn hóa Full SKU cho ${products.length} sản phẩm...`);
  
  for (const p of products) {
    const fullSku = formatFullSku(p.sku);
    if (!fullSku) continue;

    // Logic: Nếu slug hiện tại chưa chứa FULL SKU, hoặc chỉ chứa một phần, hãy cập nhật lại
    if (!p.slug.toLowerCase().endsWith(fullSku)) {
      // 1. Tìm phần gốc của slug (bỏ cái SKU cũ nếu có)
      // Giả sử slug cũ có dạng: ten-may-ma-cu
      // Chúng ta sẽ lấy lại phần "ten-may" dựa trên DB hoặc logic
      
      // Cách an toàn nhất: Lấy slug hiện tại, nếu nó đã có SKU cũ thì phải gỡ ra trước
      // Nhưng để đơn giản và hiệu quả nhất, ta sẽ tạo lại slug từ tên máy nếu cần, 
      // hoặc nối tiếp nếu slug hiện tại chưa có SKU.
      
      // Ở đây tôi sẽ dùng logic: Lấy slug hiện tại, xóa phần SKU cũ (nếu có) và gắn Full SKU vào.
      const baseSlug = p.slug.split('-f')[0]; // Thường mã máy bắt đầu bằng f hoặc i... 
      // Tuy nhiên, cách tốt nhất là dùng hàm slugify từ tên máy để làm gốc
      const slugBase = p.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/([^0-9a-z-\s])/g, '')
        .replace(/(\s+)/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

      const newFullSlug = `${slugBase}-${fullSku}`.replace(/-+/g, '-');
      
      if (p.slug !== newFullSlug) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ slug: newFullSlug })
          .eq('id', p.id);

        if (updateError) {
          console.error(`Lỗi cập nhật ID ${p.id}:`, updateError.message);
        } else {
          console.log(`✅ Đã khớp: ${p.slug} -> ${newFullSlug}`);
        }
      }
    }
  }
  console.log('--- HOÀN TẤT CHUẨN HÓA FULL SKU ---');
}

fixAllSlugsFull()
