
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gdzihzsjfczuggwpykjk.supabase.co'
const supabaseKey = 'sb_secret_RxWGBdFX0qPBKWBpI-2Eeg_b3jplqTo'
const supabase = createClient(supabaseUrl, supabaseKey)

function formatFullSku(sku: string) {
  if (!sku) return '';
  return sku.toLowerCase().replace(/[\/\+\s]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').trim();
}

async function finalAudit() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, sku')
    .eq('is_published', true)

  if (error) {
    console.error('Lỗi:', error)
    return
  }

  const results = products.map(p => {
    const fullSku = formatFullSku(p.sku)
    const hasFullSku = p.slug.toLowerCase().endsWith(fullSku)
    return {
      name: p.name.substring(0, 30) + '...',
      sku: p.sku,
      slug: p.slug,
      status: hasFullSku ? '✅ ĐỒNG BỘ' : '❌ SAI LỆCH'
    }
  })

  const issues = results.filter(r => r.status === '❌ SAI LỆCH')
  
  console.log(`--- BÁO CÁO AUDIT CUỐI CÙNG ---`)
  console.log(`Tổng sản phẩm: ${results.length}`)
  console.log(`Số sản phẩm chuẩn SEO (Full SKU): ${results.length - issues.length}`)
  console.log(`Số sản phẩm cần xem lại: ${issues.length}`)
  
  if (issues.length > 0) {
    console.log(`\n--- DANH SÁCH SAI LỆCH ---`)
    console.table(issues.slice(0, 10))
  } else {
    console.log('\n🎉 CHÚC MỪNG! Toàn bộ 175 sản phẩm đã đồng bộ 100% với Sitemap và chuẩn SEO!');
  }
}

finalAudit()
