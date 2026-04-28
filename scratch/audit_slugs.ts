
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gdzihzsjfczuggwpykjk.supabase.co'
const supabaseKey = 'sb_secret_RxWGBdFX0qPBKWBpI-2Eeg_b3jplqTo'
const supabase = createClient(supabaseUrl, supabaseKey)

async function auditSlugs() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, sku')
    .eq('is_published', true)

  if (error) {
    console.error('Lỗi:', error)
    return
  }

  const results = products.map(p => {
    const hasSkuInSlug = p.slug.toLowerCase().includes(p.sku.toLowerCase())
    return {
      name: p.name.substring(0, 30) + '...',
      sku: p.sku,
      slug: p.slug,
      status: hasSkuInSlug ? '✅ OK' : '❌ THIẾU SKU'
    }
  })

  const issues = results.filter(r => r.status === '❌ THIẾU SKU')
  
  console.log(`--- TỔNG KẾT AUDIT ---`)
  console.log(`Tổng sản phẩm: ${results.length}`)
  console.log(`Số sản phẩm bị thiếu SKU trong Slug: ${issues.length}`)
  
  if (issues.length > 0) {
    console.log(`\n--- DANH SÁCH LỖI (TOP 20) ---`)
    console.table(issues.slice(0, 20))
  }
}

auditSlugs()
