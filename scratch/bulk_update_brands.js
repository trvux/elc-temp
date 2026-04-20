
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load .env.local
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const BRANDS_LIST = [
  'Carrier', 'Daikin', 'Gree', 'LG', 'Menred', 'Midea', 
  'Mitsubishi', 'Panasonic', 'Samsung', 'Toshiba', 'NET'
];

function generateSlug(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function bulkUpdate() {
  console.log('--- BẮT ĐẦU CẬP NHẬT DỮ LIỆU ---');

  // 1. Lấy tất cả sản phẩm
  const { data: products, error: pError } = await supabase
    .from('products')
    .select('id, name, sku');

  if (pError) {
    console.error('Lỗi lấy SP:', pError);
    return;
  }

  console.log(`Đã tìm thấy ${products.length} sản phẩm.`);

  // 2. Tạo Map để lưu Brand ID cho nhanh
  const brandMap = new Map();

  for (const p of products) {
    let matchedBrand = null;
    
    // Tìm brand trong tên
    for (const b of BRANDS_LIST) {
      if (p.name.toLowerCase().includes(b.toLowerCase()) || p.sku.toLowerCase().includes(b.toLowerCase())) {
        matchedBrand = b;
        break;
      }
    }

    if (matchedBrand) {
      // Kiểm tra/Tạo brand trong DB
      let brandId;
      if (brandMap.has(matchedBrand)) {
        brandId = brandMap.get(matchedBrand);
      } else {
        const { data: bData, error: bError } = await supabase
          .from('brands')
          .select('id')
          .eq('name', matchedBrand)
          .single();

        if (bData) {
          brandId = bData.id;
        } else {
          const { data: newB, error: iError } = await supabase
            .from('brands')
            .insert({ 
              name: matchedBrand, 
              slug: generateSlug(matchedBrand),
              description: `Thương hiệu ${matchedBrand} chính hãng, giải pháp điện lạnh hàng đầu.`
            })
            .select()
            .single();
          
          if (iError) {
            console.error(`Lỗi tạo brand ${matchedBrand}:`, iError);
            continue;
          }
          brandId = newB.id;
        }
        brandMap.set(matchedBrand, brandId);
      }

      // Tạo Short Description chuẩn SEO mẫu
      const shortDesc = `${p.name} là giải pháp điều hòa không khí chính hãng ${matchedBrand}. Sản phẩm có thiết kế hiện đại, vận hành bền bỉ và tiết kiệm điện năng tối ưu cho công trình.`;

      // Cập nhật sản phẩm
      const { error: uError } = await supabase
        .from('products')
        .update({ 
          brand_id: brandId,
          short_description: shortDesc
        })
        .eq('id', p.id);

      if (uError) {
        console.error(`Lỗi update SP ${p.name}:`, uError);
      } else {
        console.log(`[OK] Đã gán brand ${matchedBrand} cho: ${p.name}`);
      }
    } else {
      // Nếu không có brand, vẫn tạo Short Description chung
      const shortDesc = `${p.name} chính hãng tại ELC Holdings. Giải pháp điện lạnh và không khí sạch tiêu chuẩn cao, bảo hành uy tín.`;
      await supabase
        .from('products')
        .update({ short_description: shortDesc })
        .eq('id', p.id);
      
      console.log(`[SKIP] Không tìm thấy brand cho: ${p.name} (Chỉ cập nhật mô tả ngắn)`);
    }
  }

  console.log('--- HOÀN TẤT ---');
}

bulkUpdate();
