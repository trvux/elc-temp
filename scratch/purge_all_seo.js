const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function purge() {
  console.log("Đang tiến hành xóa trắng SEO cho 114 sản phẩm...");
  
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id');

  if (fetchError) {
    console.error("Lỗi lấy danh sách:", fetchError);
    return;
  }

  const ids = products.map(p => p.id);
  console.log(`Tìm thấy ${ids.length} sản phẩm.`);

  const { error: updateError } = await supabase
    .from('products')
    .update({ 
      short_description: null, 
      meta_description: null 
    })
    .in('id', ids);

  if (updateError) {
    console.error("Lỗi xóa trắng:", updateError);
  } else {
    console.log("✅ ĐÃ XÓA TRẮNG THÀNH CÔNG! Database hiện tại đã sạch bóng quân thù.");
  }
}

purge();
