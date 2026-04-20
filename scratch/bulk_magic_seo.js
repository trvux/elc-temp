const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

function generateProductSmartDescription(p) {
  const brand = p.brands?.name || 'ELC';
  const name = p.name || '';
  const sku = p.sku || '';
  
  // Trích xuất thông số
  const specs = Array.isArray(p.specs) ? p.specs : [];
  const findSpec = (q) => {
    for (const s of specs) {
      if (s.label?.toLowerCase().includes(q.toLowerCase())) return s.value || s.items?.[0]?.value;
    }
    return null;
  };

  const congSuat = findSpec('Công suất') || findSpec('HP') || '';
  const tietKiemDien = specs.some(s => s.label?.toLowerCase().includes('inverter') || s.value?.toLowerCase().includes('inverter')) ? 'Inverter tiết kiệm điện' : '';
  const gas = findSpec('Gas') || findSpec('Môi chất');
  const cspf = findSpec('CSPF');

  const templates = [
    `Giải pháp điều hòa không khí ${brand} thế hệ mới.`,
    `${tietKiemDien} vận hành êm ái, bền bỉ.`,
    `Công nghệ lọc khí hiện đại bảo vệ sức khỏe.`,
    gas ? `Sử dụng môi chất ${gas} thân thiện môi trường.` : '',
    cspf ? `Hiệu suất năng lượng CSPF ${cspf} tối ưu.` : '',
    'Cam kết hàng chính hãng, bảo hành dài hạn.',
    'Giá tốt nhất tại ELC.'
  ];

  let result = `${name}${sku ? ` (${sku})` : ''}. `;
  for (const part of templates) {
    if (!part) continue;
    if ((result + " " + part).trim().length <= 160) {
      result = (result + " " + part).trim();
    } else {
      break;
    }
  }
  return result.trim();
}

async function bulkUpdateSEO() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  console.log('Đang lấy danh sách sản phẩm...');
  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku, specs, brands(name)')
    .eq('is_published', true);

  if (!products) {
    console.error('Lỗi lấy dữ liệu. Check RLS.');
    return;
  }

  console.log('Đang bắt đầu gen SEO cho ' + products.length + ' sản phẩm...');
  let count = 0;

  for (const p of products) {
    const smartDescription = generateProductSmartDescription(p);
    
    const { error } = await supabase.from('products').update({
      short_description: smartDescription,
      meta_description: smartDescription
    }).eq('id', p.id);
    
    if (!error) {
      count++;
      if (count % 20 === 0) console.log(`Đã xong: ${count}/${products.length} máy...`);
    } else {
      console.error(`Lỗi máy ${p.name}:`, error);
    }
  }
  
  console.log('CHÚCH MỪNG! Đã cập nhật SEO thông minh cho toàn bộ ' + count + ' máy thành công.');
}

bulkUpdateSEO();
